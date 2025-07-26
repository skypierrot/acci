"use client";

import { useEffect, useState } from 'react';
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

  // 상태 표기 함수 등은 /history에서 복사
  const getDisplayStatus = (report: any) => {
    const investigation = investigationMap.get(report.accident_id);
    if (!investigation) return '발생';
    if (investigation.investigation_status === '대기') return '조사 대기';
    const rawStatus = investigation.investigation_status;
    if (rawStatus === '조사 진행') return '조사 진행';
    if (rawStatus === '조사 완료') return '조사 완료';
    if (rawStatus === '대책 이행') return '대책 이행';
    if (rawStatus === '조치완료') return '종결';
    return rawStatus;
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case '발생': return 'bg-red-100 text-red-800';
      case '조사 대기': return 'bg-slate-100 text-slate-800';
      case '조사 진행': return 'bg-yellow-100 text-yellow-800';
      case '조사 완료': return 'bg-blue-100 text-blue-800';
      case '대책 이행': return 'bg-purple-100 text-purple-800';
      case '종결': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getAccidentTypeDisplay = (report: any) => {
    const accidentType = report.final_accident_type_level1 || report.accident_type_level1;
    const hasVictims = report.victims_info && report.victims_info.length > 0;
    const hasPropertyDamages = report.property_damages_info && report.property_damages_info.length > 0;
    if (hasVictims && hasPropertyDamages) return { type: '복합', displayType: 'both' };
    if (hasVictims) return { type: '인적', displayType: 'human' };
    if (hasPropertyDamages) return { type: '물적', displayType: 'property' };
    return { type: accidentType, displayType: 'unknown' };
  };
  
  const toggleRowExpansion = (accidentId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accidentId)) newSet.delete(accidentId);
      else newSet.add(accidentId);
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ko-KR');
    } catch {
      return dateStr;
    }
  };

  // 사업장 정보를 가져오는 함수 (lagging 페이지와 동일)
  const fetchSiteInfo = async () => {
    try {
      const response = await fetch('/api/companies');
      if (!response.ok) throw new Error('사업장 정보 조회 실패');
      const companies = await response.json();
      
      // 사업장 코드와 이름을 매핑하는 객체 생성
      const siteCodeToName: Record<string, string> = {};
      companies.forEach((company: any) => {
        if (company.sites && Array.isArray(company.sites)) {
          company.sites.forEach((site: any) => {
            siteCodeToName[site.code] = site.name;
          });
        }
      });
      
      return siteCodeToName;
    } catch (error) {
      console.error('사업장 정보 조회 오류:', error);
      // 기본 매핑 반환
      return {
        'A': '가상사업장',
        'B': '나상사업장',
        'C': '다상사업장',
        'D': '라상사업장',
        'E': '마상사업장'
      };
    }
  };

  // 연간 근로시간 정보를 가져오는 함수 (lagging 페이지와 동일)
  const fetchAnnualWorkingHours = async (year: number) => {
    try {
      // 첫 번째 회사 ID를 사용 (실제로는 선택된 회사나 기본 회사 사용)
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
  };

  // 대시보드용 사고지표 계산 함수 (lagging 페이지 로직 활용)
  const calculateDashboardIndicators = async () => {
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
      
      let totalVictims = 0;
      let employeeVictims = 0;
      let contractorVictims = 0;
      let ltirSevereAccidents = 0;
      let trirSevereAccidents = 0;
      let totalLossDays = 0;
      
      for (const report of humanAccidents) {
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
          // ignore
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
        
        let hasLtirSevereInjury = false;
        let hasTrirSevereInjury = false;
        
        victims.forEach((victim: any) => {
          let injuryType = victim.injury_type || '';
          injuryType = injuryType.replace(/\([^)]*\)/g, '').trim();
          
          // LTIR: 중상, 사망, 기타
          if (['중상', '사망', '기타'].includes(injuryType)) {
            hasLtirSevereInjury = true;
          }
          
          // TRIR: 중상, 사망, 기타, 경상, 병원치료
          if (['중상', '사망', '기타', '경상', '병원치료'].includes(injuryType)) {
            hasTrirSevereInjury = true;
          }
          
          // 근로손실일수 계산
          let lossDays = 0;
          if (victim.absence_loss_days && !isNaN(victim.absence_loss_days)) {
            lossDays = Number(victim.absence_loss_days);
          } else if (victim.absence_start_date && victim.return_expected_date) {
            const startDate = new Date(victim.absence_start_date);
            const returnDate = new Date(victim.return_expected_date);
            const diffTime = returnDate.getTime() - startDate.getTime();
            lossDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
          
          if (lossDays > 0) {
            totalLossDays += lossDays;
          }
        });
        
        if (hasLtirSevereInjury) {
          ltirSevereAccidents++;
        }
        if (hasTrirSevereInjury) {
          trirSevereAccidents++;
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
      const totalLtir = workingHours.total > 0 ? (ltirSevereAccidents / workingHours.total) * ltirBase : 0;
      const totalTrir = workingHours.total > 0 ? (trirSevereAccidents / workingHours.total) * ltirBase : 0;
      const totalSeverityRate = workingHours.total > 0 ? (totalLossDays / workingHours.total) * 1000 : 0;
      
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
        totalLossDays: totalLossDays
      });
      
    } catch (error) {
      console.error('대시보드 사고지표 계산 오류:', error);
    } finally {
      setIndicatorsLoading(false);
    }
  };

  // 사고지표 데이터 로드
  useEffect(() => {
    calculateDashboardIndicators();
  }, []);

  // 사고 이력 데이터 로드
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/history?size=5&page=1').then(res => res.json()),
      fetch('/api/investigation?offset=0&limit=10000').then(res => res.json())
    ]).then(([historyData, investigationData]) => {
      const reportsData = historyData.reports || [];
      setReports(reportsData);
      
      const map = new Map();
      (investigationData.reports || []).forEach((inv: any) => {
        if (inv.accident_id) map.set(inv.accident_id, inv);
      });
      setInvestigationMap(map);
    }).finally(() => setLoading(false));
  }, []);

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
        <div className="text-sm text-gray-500">
          {new Date().getFullYear()}년 현재 지표
        </div>
      </div>
      
      {/* 사고 지표 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* 전체 사고건 */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
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
        
        {/* 재해자수 */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
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
        
        {/* 물적피해금액 */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
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
        
        {/* LTIR */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
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
        
        {/* TRIR */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
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
        
        {/* 강도율 */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
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
      
      {/* 상세 지표 보기 링크 */}
      <div className="flex justify-end">
        <Link 
          href="/lagging" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          상세 사고지표 보기
        </Link>
      </div>
      
      {/* 최근 사고 목록 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">최근 사고 발생</h2>
          <Link href="/history" className="text-emerald-600 hover:underline">
            모두 보기
          </Link>
        </div>
        <HistoryTable
          reports={reports}
          investigationMap={investigationMap}
          getDisplayStatus={getDisplayStatus}
          getStatusBadgeClass={getStatusBadgeClass}
          getAccidentTypeDisplay={getAccidentTypeDisplay}
          expandedRows={expandedRows}
          toggleRowExpansion={toggleRowExpansion}
          router={router}
          ExpandedRowDetails={ExpandedRowDetails}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
} 