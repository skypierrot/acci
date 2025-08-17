"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HistoryTable from '../components/history/HistoryTable';
import { ExpandedRowDetails } from './history/client';
import { getAccidentTypeDisplay, getCompletionRateColor } from '../utils/statusUtils';

/**
 * @file app/page.tsx
 * @description
 *  - 메인 페이지 (대시보드)
 *  - 사고 통계 및 최근 사고 목록 표시
 *  - lagging 페이지의 데이터를 활용하여 현재 년도 메인 지표만 표시
 *  - 성능 최적화: useCallback, useMemo 적용, API 호출 최적화
 */

interface AccidentStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

interface RecentAccident {
  id: string;
  date: string;
  company: string;
  location: string;
  type: string;
  status: string;
}

// 대시보드용 사고지표 인터페이스
interface DashboardIndicators {
  accidentCount: number;
  employeeAccidentCount: number;
  contractorAccidentCount: number;
  victimCount: number;
  employeeVictimCount: number;
  contractorVictimCount: number;
  directDamageAmount: number;
  indirectDamageAmount: number;
  ltir: number;
  trir: number;
  severityRate: number;
  totalLossDays: number;
}

export default function Dashboard() {
  const router = useRouter();
  // 실제 사고 이력 데이터 상태
  const [reports, setReports] = useState<any[]>([]);
  const [investigationMap, setInvestigationMap] = useState(new Map());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // 사고지표 데이터 상태 (lagging 페이지와 동일한 구조)
  const [indicators, setIndicators] = useState<DashboardIndicators>({
    accidentCount: 0,
    employeeAccidentCount: 0,
    contractorAccidentCount: 0,
    victimCount: 0,
    employeeVictimCount: 0,
    contractorVictimCount: 0,
    directDamageAmount: 0,
    indirectDamageAmount: 0,
    ltir: 0,
    trir: 0,
    severityRate: 0,
    totalLossDays: 0
  });
  const [indicatorsLoading, setIndicatorsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [recentAccidents, setRecentAccidents] = useState<RecentAccident[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  // 모바일에서 카드 그룹 순환 상태 (0: 1-3번, 1: 4-6번)
  const [currentCardGroup, setCurrentCardGroup] = useState(0);

  // 성능 최적화: useCallback으로 함수 메모이제이션
  const getDisplayStatus = useCallback((report: any) => {
    const investigation = investigationMap.get(report.accident_id);
    if (!investigation) return '발생';
    if (investigation.investigation_status === '대기') return '조사 대기';
    const rawStatus = investigation.investigation_status;
    if (rawStatus === '조사 진행') return '조사 진행';
    if (rawStatus === '조사 완료') return '조사 완료';
    if (rawStatus === '대책 이행') return '대책 이행';
    if (rawStatus === '조치완료') return '종결';
    return rawStatus;
  }, [investigationMap]);
  
  const getStatusBadgeClass = useCallback((status: string) => {
    switch (status) {
      case '발생': return 'bg-red-100 text-red-800';
      case '조사 대기': return 'bg-slate-100 text-slate-800';
      case '조사 진행': return 'bg-yellow-100 text-yellow-800';
      case '조사 완료': return 'bg-blue-100 text-blue-800';
      case '대책 이행': return 'bg-purple-100 text-purple-800';
      case '종결': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);
  
  const getAccidentTypeDisplay = useCallback((report: any) => {
    const accidentType = report.final_accident_type_level1 || report.accident_type_level1;
    const hasVictims = report.victims_info && report.victims_info.length > 0;
    const hasPropertyDamages = report.property_damages_info && report.property_damages_info.length > 0;
    if (hasVictims && hasPropertyDamages) return { type: '복합', displayType: 'both' };
    if (hasVictims) return { type: '인적', displayType: 'human' };
    if (hasPropertyDamages) return { type: '물적', displayType: 'property' };
    return { type: accidentType, displayType: 'unknown' };
  }, []);

  const toggleRowExpansion = useCallback((accidentId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accidentId)) {
        newSet.delete(accidentId);
      } else {
        newSet.add(accidentId);
      }
      return newSet;
    });
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ko-KR');
    } catch {
      return dateStr;
    }
  }, []);

  // 성능 최적화: API 호출 함수 메모이제이션
  const fetchSiteInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/sites');
      if (response.ok) {
        const data = await response.json();
        return data.sites || [];
      }
    } catch (error) {
      console.error('사업장 정보 조회 오류:', error);
    }
    return [];
  }, []);

  // 연간 근로시간 조회 (lagging 페이지와 동일한 로직)
  const fetchAnnualWorkingHours = useCallback(async (year: number) => {
    try {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('회사 정보 조회 실패');
      const companies = await response.json();
      
      if (companies.length === 0) {
        console.log('[대시보드] 회사 정보가 없습니다.');
        return { total: 0, employee: 0, contractor: 0 };
      }

      const companyId = companies[0].id;
      const hoursResponse = await fetch(`/api/settings/annual-working-hours?company_id=${companyId}&year=${year}`);
      if (!hoursResponse.ok) throw new Error('연간 근로시간 조회 실패');
      const hoursData = await hoursResponse.json();

      // 전사-종합 데이터 찾기 (site_id가 null인 경우)
      const totalData = hoursData.find((item: any) => !item.site_id);
      if (!totalData) {
        console.log('[대시보드] 전사-종합 근로시간 데이터가 없습니다.');
        return { total: 0, employee: 0, contractor: 0 };
      }

      console.log('[대시보드] 연간 근로시간 데이터:', totalData);
      
      return {
        total: totalData.total_hours || 0,
        employee: totalData.employee_hours || 0,
        contractor: (totalData.partner_on_hours || 0) + (totalData.partner_off_hours || 0)
      };
    } catch (error) {
      console.error('[대시보드] 연간 근로시간 조회 오류:', error);
      return { total: 0, employee: 0, contractor: 0 };
    }
  }, []);

  // 성능 최적화: 배치 API 호출로 조사보고서 데이터 조회
  const fetchInvestigationDataBatch = useCallback(async (accidentIds: string[]) => {
    try {
      // 1. 존재 여부 확인 (병렬 처리)
      const existsPromises = accidentIds.map(id => 
        fetch(`/api/investigation/${id}/exists`)
          .then(res => res.json())
          .catch(() => ({ exists: false }))
      );
      const existsResults = await Promise.all(existsPromises);
      
      // 2. 존재하는 조사보고서만 상세 조회 (병렬 처리)
      const existingIds = accidentIds.filter((_, index) => existsResults[index].exists);
      const detailPromises = existingIds.map(id => 
        fetch(`/api/investigation/${id}`)
          .then(res => res.json())
          .catch(() => null)
      );
      const detailResults = await Promise.all(detailPromises);
      
      // 3. 결과 맵 구성
      const investigationDataMap = new Map();
      existingIds.forEach((id, index) => {
        const data = detailResults[index];
        if (data) {
          const investigationData = data.data || data;
          investigationDataMap.set(id, investigationData);
        }
      });
      
      return investigationDataMap;
    } catch (error) {
      console.error('배치 조사보고서 데이터 조회 오류:', error);
      return new Map();
    }
  }, []);

  // LTIR용 기준이상 사고 건수 계산 (lagging 페이지와 동일한 로직)
  const calculateLTIRAccidentCounts = useCallback(async (year: number) => {
    try {
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 인적 또는 복합 사고만 필터링
      const humanAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
      );

      console.log(`[대시보드 LTIR] 전체 사고: ${reports.length}건, 인적/복합 사고: ${humanAccidents.length}건`);

      let totalSevereAccidents = 0;
      let employeeSevereAccidents = 0;
      let contractorSevereAccidents = 0;

      for (const report of humanAccidents) {
        let hasSevereInjury = false;
        
        // 재해자 정보 확인 (조사보고서 우선, 없으면 발생보고서)
        let victims: any[] = [];
        
        // 조사보고서 확인
        try {
          const invResponse = await fetch(`/api/investigation/${report.accident_id}/exists`);
          if (invResponse.ok) {
            const existsData = await invResponse.json();
            if (existsData.exists) {
              const invDataResponse = await fetch(`/api/investigation/${report.accident_id}`);
              if (invDataResponse.ok) {
                const invData = await invDataResponse.json();
                const investigationData = invData.data || invData;
                victims = investigationData.investigation_victims || investigationData.victims || [];
              }
            }
          }
        } catch (e) {
          console.log(`[대시보드 LTIR] 조사보고서 확인 실패: ${report.accident_id}`);
        }

        // 조사보고서에 재해자 정보가 없으면 발생보고서에서 확인
        if (victims.length === 0) {
          if (report.victims && Array.isArray(report.victims)) {
            victims = report.victims;
          } else if (report.victims_json) {
            try {
              const arr = JSON.parse(report.victims_json);
              if (Array.isArray(arr)) victims = arr;
            } catch (e) {}
          }
        }

        // 중상, 사망, 기타 상해정도가 있는지 확인
        victims.forEach((victim: any) => {
          let injuryType = victim.injury_type || '';
          injuryType = injuryType.replace(/\([^)]*\)/g, '').trim();
          if (['중상', '사망', '기타'].includes(injuryType)) {
            hasSevereInjury = true;
          }
        });

        if (hasSevereInjury) {
          totalSevereAccidents++;
          if (report.is_contractor) {
            contractorSevereAccidents++;
          } else {
            employeeSevereAccidents++;
          }
        }
      }

      console.log(`[대시보드 LTIR] 기준이상 사고 건수 - 전체: ${totalSevereAccidents}, 임직원: ${employeeSevereAccidents}, 협력업체: ${contractorSevereAccidents}`);
      
      return {
        total: totalSevereAccidents,
        employee: employeeSevereAccidents,
        contractor: contractorSevereAccidents
      };
    } catch (error) {
      console.error('[대시보드 LTIR] 기준이상 사고 건수 계산 오류:', error);
      return { total: 0, employee: 0, contractor: 0 };
    }
  }, []);

  // TRIR용 기준이상 사고 건수 계산 (lagging 페이지와 동일한 로직)
  const calculateTRIRAccidentCounts = useCallback(async (year: number) => {
    try {
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 인적 또는 복합 사고만 필터링
      const humanAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
      );

      console.log(`[대시보드 TRIR] 전체 사고: ${reports.length}건, 인적/복합 사고: ${humanAccidents.length}건`);

      let totalSevereAccidents = 0;
      let employeeSevereAccidents = 0;
      let contractorSevereAccidents = 0;

      for (const report of humanAccidents) {
        let hasSevereInjury = false;
        
        // 재해자 정보 확인 (조사보고서 우선, 없으면 발생보고서)
        let victims: any[] = [];
        
        // 조사보고서 확인
        try {
          const invResponse = await fetch(`/api/investigation/${report.accident_id}/exists`);
          if (invResponse.ok) {
            const existsData = await invResponse.json();
            if (existsData.exists) {
              const invDataResponse = await fetch(`/api/investigation/${report.accident_id}`);
              if (invDataResponse.ok) {
                const invData = await invDataResponse.json();
                const investigationData = invData.data || invData;
                victims = investigationData.investigation_victims || investigationData.victims || [];
              }
            }
          }
        } catch (e) {
          console.log(`[대시보드 TRIR] 조사보고서 확인 실패: ${report.accident_id}`);
        }

        // 조사보고서에 재해자 정보가 없으면 발생보고서에서 확인
        if (victims.length === 0) {
          if (report.victims && Array.isArray(report.victims)) {
            victims = report.victims;
          } else if (report.victims_json) {
            try {
              const arr = JSON.parse(report.victims_json);
              if (Array.isArray(arr)) victims = arr;
            } catch (e) {}
          }
        }

        // 중상, 사망, 기타, 경상, 병원치료 상해정도가 있는지 확인
        victims.forEach((victim: any) => {
          let injuryType = victim.injury_type || '';
          injuryType = injuryType.replace(/\([^)]*\)/g, '').trim();
          if (['중상', '사망', '기타', '경상', '병원치료'].includes(injuryType)) {
            hasSevereInjury = true;
          }
        });

        if (hasSevereInjury) {
          totalSevereAccidents++;
          if (report.is_contractor) {
            contractorSevereAccidents++;
          } else {
            employeeSevereAccidents++;
          }
        }
      }

      console.log(`[대시보드 TRIR] 기준이상 사고 건수 - 전체: ${totalSevereAccidents}, 임직원: ${employeeSevereAccidents}, 협력업체: ${contractorSevereAccidents}`);
      
      return {
        total: totalSevereAccidents,
        employee: employeeSevereAccidents,
        contractor: contractorSevereAccidents
      };
    } catch (error) {
      console.error('[대시보드 TRIR] 기준이상 사고 건수 계산 오류:', error);
      return { total: 0, employee: 0, contractor: 0 };
    }
  }, []);

  // 강도율용 근로손실일수 계산 (lagging 페이지와 동일한 로직)
  const calculateSeverityRateLossDays = useCallback(async (year: number) => {
    try {
      const response = await fetch(`/api/occurrence/all?year=${year}`);
      if (!response.ok) throw new Error('사고 목록 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];

      // 인적 또는 복합 사고만 필터링
      const humanAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
      );
      
      console.log(`[대시보드 강도율] 전체 사고: ${reports.length}건, 인적/복합 사고: ${humanAccidents.length}건`);

      let totalLossDays = 0;
      let employeeLossDays = 0;
      let contractorLossDays = 0;

      for (const report of humanAccidents) {
        // 재해자 정보 확인 (조사보고서 우선, 없으면 발생보고서)
        let victims: any[] = [];
        
        // 조사보고서 확인
        try {
          const invResponse = await fetch(`/api/investigation/${report.accident_id}/exists`);
          if (invResponse.ok) {
            const existsData = await invResponse.json();
            if (existsData.exists) {
              const invDataResponse = await fetch(`/api/investigation/${report.accident_id}`);
              if (invDataResponse.ok) {
                const invData = await invDataResponse.json();
                const investigationData = invData.data || invData;
                victims = investigationData.investigation_victims || investigationData.victims || [];
              }
            }
          }
        } catch (e) {
          console.log(`[대시보드 강도율] 조사보고서 확인 실패: ${report.accident_id}`);
        }

        // 조사보고서에 재해자 정보가 없으면 발생보고서에서 확인
        if (victims.length === 0) {
          if (report.victims && Array.isArray(report.victims)) {
            victims = report.victims;
          } else if (report.victims_json) {
            try {
              const arr = JSON.parse(report.victims_json);
              if (Array.isArray(arr)) victims = arr;
            } catch (e) {}
          }
        }

        // 각 재해자의 근로손실일수 계산
        victims.forEach((victim: any) => {
          let lossDays = 0;
          
          // absence_loss_days가 있으면 사용
          if (victim.absence_loss_days && !isNaN(victim.absence_loss_days)) {
            lossDays = Number(victim.absence_loss_days);
          } else {
            // absence_start_date와 return_expected_date로 계산
            if (victim.absence_start_date && victim.return_expected_date) {
              const startDate = new Date(victim.absence_start_date);
              const returnDate = new Date(victim.return_expected_date);
              const diffTime = returnDate.getTime() - startDate.getTime();
              lossDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
          }

          if (lossDays > 0) {
            totalLossDays += lossDays;
            if (report.is_contractor) {
              contractorLossDays += lossDays;
            } else {
              employeeLossDays += lossDays;
            }
            console.log(`[대시보드 강도율] 재해자 ${victim.name || '이름없음'}: ${lossDays}일 손실`);
          }
        });
      }

      console.log(`[대시보드 강도율] 근로손실일수 - 전체: ${totalLossDays}일, 임직원: ${employeeLossDays}일, 협력업체: ${contractorLossDays}일`);
      
      return {
        total: totalLossDays,
        employee: employeeLossDays,
        contractor: contractorLossDays
      };
    } catch (error) {
      console.error('[대시보드 강도율] 근로손실일수 계산 오류:', error);
      return { total: 0, employee: 0, contractor: 0 };
    }
  }, []);

  // 성능 최적화: 대시보드 지표 계산 함수 메모이제이션 (lagging 페이지와 동일한 로직)
  const calculateDashboardIndicators = useCallback(async () => {
    try {
      setIndicatorsLoading(true);
      const currentYear = new Date().getFullYear();
      
      // 1. 사고 데이터 조회
      const response = await fetch(`/api/occurrence/all?year=${currentYear}`);
      if (!response.ok) throw new Error('사고 데이터 조회 실패');
      const data = await response.json();
      const reports = data.reports || [];
      
      // 2. 연간 근로시간 조회
      const workingHours = await fetchAnnualWorkingHours(currentYear);
      
      // 3. 사고 건수 계산
      const employeeAccidents = reports.filter((r: any) => !r.is_contractor);
      const contractorAccidents = reports.filter((r: any) => r.is_contractor);
      
      // 4. 재해자 수 및 상해정도별 계산
      const humanAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '인적' || r.accident_type_level1 === '복합'
      );
      
      // 성능 최적화: 배치 API 호출로 조사보고서 데이터 조회
      const accidentIds = humanAccidents.map(r => r.accident_id);
      const investigationDataMap = await fetchInvestigationDataBatch(accidentIds);
      
      let totalVictims = 0;
      let employeeVictims = 0;
      let contractorVictims = 0;
      
      for (const report of humanAccidents) {
        let victims: any[] = [];
        
        // 조사보고서에서 재해자 정보 확인 (배치 조회 결과 사용)
        const investigationData = investigationDataMap.get(report.accident_id);
        if (investigationData) {
          victims = investigationData.investigation_victims || investigationData.victims || [];
        }
        
        // 조사보고서에 재해자 정보가 없으면 발생보고서에서 확인
        if (victims.length === 0) {
          if (report.victims && Array.isArray(report.victims)) {
            victims = report.victims;
          } else if (report.victims_json) {
            try {
              const arr = JSON.parse(report.victims_json);
              if (Array.isArray(arr)) victims = arr;
            } catch (e) {}
          }
        }
        
        // 재해자 수 집계
        totalVictims += victims.length;
        if (report.is_contractor) {
          contractorVictims += victims.length;
        } else {
          employeeVictims += victims.length;
        }
      }
      
      // 5. 물적피해금액 계산
      const propertyAccidents = reports.filter((r: any) =>
        r.accident_type_level1 === '물적' || r.accident_type_level1 === '복합'
      );
      
      let totalDamageAmount = 0;
      for (const report of propertyAccidents) {
        if (report.property_damages && Array.isArray(report.property_damages)) {
          report.property_damages.forEach((damage: any) => {
            if (damage.estimated_cost && !isNaN(damage.estimated_cost)) {
              totalDamageAmount += Number(damage.estimated_cost);
            }
          });
        }
      }
      
      // 6. 지표 계산 (lagging 페이지와 동일한 로직)
      const ltirBase = 200000;
      
      // LTIR 계산
      const ltirAccidentCounts = await calculateLTIRAccidentCounts(currentYear);
      const totalLtir = workingHours.total > 0 ? (ltirAccidentCounts.total / workingHours.total) * ltirBase : 0;
      
      // TRIR 계산
      const trirAccidentCounts = await calculateTRIRAccidentCounts(currentYear);
      const totalTrir = workingHours.total > 0 ? (trirAccidentCounts.total / workingHours.total) * ltirBase : 0;
      
      // 강도율 계산
      const lossDays = await calculateSeverityRateLossDays(currentYear);
      const totalSeverityRate = workingHours.total > 0 ? (lossDays.total / workingHours.total) * 1000 : 0;
      
      // 7. 결과 설정
      setIndicators({
        accidentCount: reports.length,
        employeeAccidentCount: employeeAccidents.length,
        contractorAccidentCount: contractorAccidents.length,
        victimCount: totalVictims,
        employeeVictimCount: employeeVictims,
        contractorVictimCount: contractorVictims,
        directDamageAmount: totalDamageAmount,
        indirectDamageAmount: totalDamageAmount * 4, // 간접피해는 직접피해의 4배 (lagging 페이지와 동일)
        ltir: totalLtir,
        trir: totalTrir,
        severityRate: totalSeverityRate,
        totalLossDays: lossDays.total
      });
      
    } catch (error) {
      console.error('대시보드 사고지표 계산 오류:', error);
    } finally {
      setIndicatorsLoading(false);
    }
  }, [fetchInvestigationDataBatch, fetchAnnualWorkingHours, calculateLTIRAccidentCounts, calculateTRIRAccidentCounts, calculateSeverityRateLossDays]);

  // 사고지표 데이터 로드
  useEffect(() => {
    calculateDashboardIndicators();
  }, [calculateDashboardIndicators]);

  // 성능 최적화: 사고 이력 데이터 로드 함수 메모이제이션
  const loadHistoryData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyData, investigationData] = await Promise.all([
        fetch('/api/history?size=5&page=1').then(res => res.json()),
        fetch('/api/investigation?offset=0&limit=10000').then(res => res.json())
      ]);
      
      const reportsData = historyData.reports || [];
      setReports(reportsData);
      
      const map = new Map();
      (investigationData.reports || []).forEach((inv: any) => {
        if (inv.accident_id) map.set(inv.accident_id, inv);
      });
      setInvestigationMap(map);
    } catch (error) {
      console.error('사고 이력 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 사고 이력 데이터 로드
  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData]);

  // 성능 최적화: HistoryTable props 메모이제이션
  const historyTableProps = useMemo(() => ({
    reports,
    investigationMap,
    getDisplayStatus,
    getStatusBadgeClass,
    getAccidentTypeDisplay,
    expandedRows,
    toggleRowExpansion,
    router,
    ExpandedRowDetails,
    formatDate
  }), [
    reports,
    investigationMap,
    getDisplayStatus,
    getStatusBadgeClass,
    getAccidentTypeDisplay,
    expandedRows,
    toggleRowExpansion,
    router,
    formatDate
  ]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {new Date().getFullYear()}년 현재 지표
          </div>
          <Link 
            href="/lagging" 
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            상세 사고지표 보기
          </Link>
        </div>
      </div>
      
      {/* 사고 지표 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* 그룹 0: 전체 사고건, 재해자수, 물적피해금액 */}
        <div className={`lg:block ${currentCardGroup === 0 ? 'block' : 'hidden sm:block'}`}>
          {/* 전체 사고건 - 클릭 가능한 카드 */}
          <div 
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 cursor-pointer transition-all duration-300 hover:shadow-lg sm:cursor-default`}
            onClick={() => {
              // 모바일에서만 클릭 가능
              if (window.innerWidth < 640) {
                setCurrentCardGroup((prev) => (prev + 1) % 2);
              }
            }}
          >
            <div>
              <p className="text-sm font-medium text-gray-600">전체 사고건</p>
              {indicatorsLoading ? (
                <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-gray-900">{indicators.accidentCount.toLocaleString()}</p>
                  {(indicators.employeeAccidentCount > 0 || indicators.contractorAccidentCount > 0) && (
                    <p className="text-sm text-gray-600 mt-1">
                      임직원 {indicators.employeeAccidentCount}, 협력업체 {indicators.contractorAccidentCount}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={`lg:block ${currentCardGroup === 0 ? 'block' : 'hidden sm:block'}`}>
          {/* 재해자수 - 클릭 가능한 카드 */}
          <div 
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 cursor-pointer transition-all duration-300 hover:shadow-lg sm:cursor-default`}
            onClick={() => {
              // 모바일에서만 클릭 가능
              if (window.innerWidth < 640) {
                setCurrentCardGroup((prev) => (prev + 1) % 2);
              }
            }}
          >
            <div>
              <p className="text-sm font-medium text-gray-600">재해자수</p>
              {indicatorsLoading ? (
                <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-gray-900">{indicators.victimCount.toLocaleString()}</p>
                  {(indicators.employeeVictimCount > 0 || indicators.contractorVictimCount > 0) && (
                    <p className="text-sm text-gray-600 mt-1">
                      임직원 {indicators.employeeVictimCount}, 협력업체 {indicators.contractorVictimCount}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={`lg:block ${currentCardGroup === 0 ? 'block' : 'hidden sm:block'}`}>
          {/* 물적피해금액 - 클릭 가능한 카드 */}
          <div 
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500 cursor-pointer transition-all duration-300 hover:shadow-lg sm:cursor-default`}
            onClick={() => {
              // 모바일에서만 클릭 가능
              if (window.innerWidth < 640) {
                setCurrentCardGroup((prev) => (prev + 1) % 2);
              }
            }}
          >
            <div>
              <p className="text-sm font-medium text-gray-600">물적피해금액(천원)</p>
              {indicatorsLoading ? (
                <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-gray-900">{indicators.directDamageAmount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">간접피해: {indicators.indirectDamageAmount.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 그룹 1: LTIR, TRIR, 강도율 */}
        <div className={`lg:block ${currentCardGroup === 1 ? 'block' : 'hidden sm:block'}`}>
          {/* LTIR - 클릭 가능한 카드 */}
          <div 
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500 cursor-pointer transition-all duration-300 hover:shadow-lg sm:cursor-default`}
            onClick={() => {
              // 모바일에서만 클릭 가능
              if (window.innerWidth < 640) {
                setCurrentCardGroup((prev) => (prev + 1) % 2);
              }
            }}
          >
            <div>
              <p className="text-sm font-medium text-gray-600">LTIR(20만시)</p>
              {indicatorsLoading ? (
                <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-gray-900">{indicators.ltir.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-1">100만시: {(indicators.ltir * 5).toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={`lg:block ${currentCardGroup === 1 ? 'block' : 'hidden sm:block'}`}>
          {/* TRIR - 클릭 가능한 카드 */}
          <div 
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 cursor-pointer transition-all duration-300 hover:shadow-lg sm:cursor-default`}
            onClick={() => {
              // 모바일에서만 클릭 가능
              if (window.innerWidth < 640) {
                setCurrentCardGroup((prev) => (prev + 1) % 2);
              }
            }}
          >
            <div>
              <p className="text-sm font-medium text-gray-600">TRIR(20만시)</p>
              {indicatorsLoading ? (
                <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-gray-900">{indicators.trir.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-1">100만시: {(indicators.trir * 5).toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={`lg:block ${currentCardGroup === 1 ? 'block' : 'hidden sm:block'}`}>
          {/* 강도율 - 클릭 가능한 카드 */}
          <div 
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 cursor-pointer transition-all duration-300 hover:shadow-lg sm:cursor-default`}
            onClick={() => {
              // 모바일에서만 클릭 가능
              if (window.innerWidth < 640) {
                setCurrentCardGroup((prev) => (prev + 1) % 2);
              }
            }}
          >
            <div>
              <p className="text-sm font-medium text-gray-600">강도율</p>
              {indicatorsLoading ? (
                <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-gray-900">{indicators.severityRate.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">근로손실일수: {indicators.totalLossDays}일</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일에서 카드 순환 안내 */}
      <div className="flex justify-center mt-4 sm:hidden">
        <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
          카드를 터치하여 다음 지표를 확인하세요 ({currentCardGroup + 1}/2)
        </div>
      </div>

      {/* 최근 사고 목록 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">최근 사고 발생</h2>
          <Link 
            href="/history" 
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            모두 보기
          </Link>
        </div>
        <HistoryTable {...historyTableProps} />
      </div>
    </div>
  );
} 