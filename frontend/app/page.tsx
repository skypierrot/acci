"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HistoryTable from '../components/history/HistoryTable';
import { ExpandedRowDetails } from './history/client';
import { getAccidentTypeDisplay, getCompletionRateColor } from '../utils/statusUtils';
import { getKoreanYear } from '../utils/koreanTime';

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

// 대시보드용 사고지표 인터페이스 (lagging API 응답과 동일)
interface DashboardIndicators {
  year: number;
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
  
  // 사고지표 데이터 상태 (lagging API 사용)
  const [indicators, setIndicators] = useState<DashboardIndicators>({
    year: getKoreanYear(),
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
  const [currentYear, setCurrentYear] = useState(getKoreanYear());
  const [recentAccidents, setRecentAccidents] = useState<RecentAccident[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  // 모바일에서 카드 그룹 순환 상태 (0: 1-3번, 1: 4-6번)
  const [currentCardGroup, setCurrentCardGroup] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

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

  // 대시보드 사고지표 데이터 조회 (lagging API 활용)
  const fetchDashboardIndicators = useCallback(async (year: number) => {
    try {
      setIndicatorsLoading(true);
      console.log(`[대시보드] ${year}년도 지표 조회 시작`);
      
      const response = await fetch(`/api/lagging/dashboard/${year}`);
      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[대시보드] ${year}년도 지표 조회 완료:`, data);
      
      setIndicators(data);
    } catch (error) {
      console.error('[대시보드] 지표 조회 오류:', error);
      // 오류 시 기본값 유지
    } finally {
      setIndicatorsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 사고지표 데이터 로드
  useEffect(() => {
    fetchDashboardIndicators(currentYear);
  }, [fetchDashboardIndicators, currentYear]);



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
            {getKoreanYear()}년 현재 지표
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
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 cursor-pointer transition-all duration-300 hover:shadow-lg sm:cursor-default touch-manipulation`}
            onClick={() => {
              // 모바일에서만 클릭 가능 (마운트된 후에만 체크)
              if (isMounted && window.innerWidth < 640) {
                setCurrentCardGroup((prev) => (prev + 1) % 2);
              }
            }}
            onTouchStart={() => {}}
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
              // 모바일에서만 클릭 가능 (마운트된 후에만 체크)
              if (isMounted && window.innerWidth < 640) {
                setCurrentCardGroup((prev) => (prev + 1) % 2);
              }
            }}
            onTouchStart={() => {}}
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
              // 모바일에서만 클릭 가능 (마운트된 후에만 체크)
              if (isMounted && window.innerWidth < 640) {
                setCurrentCardGroup((prev) => (prev + 1) % 2);
              }
            }}
            onTouchStart={() => {}}
          >
            <div>
              <p className="text-sm font-medium text-gray-600">물적피해금액(천원)</p>
              {indicatorsLoading ? (
                <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-gray-900">{Math.round(indicators.directDamageAmount + indicators.indirectDamageAmount).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">직접피해: {Math.round(indicators.directDamageAmount).toLocaleString()}천원</p>
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
              // 모바일에서만 클릭 가능 (마운트된 후에만 체크)
              if (isMounted && window.innerWidth < 640) {
                setCurrentCardGroup((prev) => (prev + 1) % 2);
              }
            }}
            onTouchStart={() => {}}
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
              // 모바일에서만 클릭 가능 (마운트된 후에만 체크)
              if (isMounted && window.innerWidth < 640) {
                setCurrentCardGroup((prev) => (prev + 1) % 2);
              }
            }}
            onTouchStart={() => {}}
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
              // 모바일에서만 클릭 가능 (마운트된 후에만 체크)
              if (isMounted && window.innerWidth < 640) {
                setCurrentCardGroup((prev) => (prev + 1) % 2);
              }
            }}
            onTouchStart={() => {}}
          >
            <div>
              <p className="text-sm font-medium text-gray-600">강도율</p>
              {indicatorsLoading ? (
                <div className="mt-2 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div>
                  <p className="text-3xl font-bold text-gray-900">{indicators.severityRate.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-1">손실일수: {indicators.totalLossDays.toLocaleString()}일</p>
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