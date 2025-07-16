'use client';

import React, { useState, useEffect, useCallback, createContext, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import InvestigationDashboard from '@/components/investigation/InvestigationHeader';
import CorrectiveActionsDashboard from '@/components/investigation/CorrectiveActionsDashboard';
import UnifiedDashboard from '@/components/investigation/UnifiedDashboard';
import CorrectiveActionCard from '@/components/investigation/CorrectiveActionCard';
import { OccurrenceReportData } from '@/services/occurrence/occurrence.service';
import { InvestigationReport } from '../../types/investigation.types';
import { useServerTime } from '@/hooks/useServerTime';

// API 베이스 URL: Next.js 리라이트 사용 (프록시를 통해 백엔드 호출). 이는 CORS 문제를 방지하고, 환경에 독립적입니다.
const API_BASE_URL = '/api';

// 날짜 포맷팅 유틸리티 함수
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (e) {
    return 'Invalid Date';
  }
};

// [색상 일관성 작업] 파란색 계열 → slate/emerald/neutral 계열로 교체
// 진행률에 따른 색상 반환 (emerald/slate/rose 계열로 변경)
const getProgressColor = (rate: number) => {
  if (rate >= 80) return 'text-emerald-600 bg-emerald-100'; // 80% 이상: 에메랄드
  if (rate >= 50) return 'text-slate-600 bg-slate-100';     // 50% 이상: 슬레이트
  return 'text-rose-600 bg-rose-100';                       // 50% 미만: rose(경고)
};

// 상태에 따른 색상 반환 (슬레이트/에메랄드 계열로 변경)
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'completed':
      return 'text-emerald-700 bg-emerald-100'; // 완료: 에메랄드
    case 'in_progress':
      return 'text-slate-700 bg-slate-100';     // 진행중: 슬레이트
    case 'draft':
      return 'text-gray-700 bg-gray-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
};

// 완료 예정일 경고 체크
const getScheduledDateWarning = (scheduledDates: string[]) => {
  if (!scheduledDates.length) return null;
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const overdueDates = scheduledDates.filter(date => date < todayStr);
  const upcomingDates = scheduledDates.filter(date => date >= todayStr && date <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  
  return {
    overdue: overdueDates.length,
    upcoming: upcomingDates.length
  };
};

async function getInvestigationList(page: number, searchTerm: string = ''): Promise<{ investigations: InvestigationReport[], totalPages: number, currentPage: number }> {
  try {
    // page를 offset으로 변환 (백엔드에서 offset 사용)
    const limit = 10;
    const offset = (page - 1) * limit;
    const response = await fetch(`${API_BASE_URL}/investigation?offset=${offset}&limit=${limit}&searchTerm=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Server error response:', errorBody);
      throw new Error(`조사보고서 목록을 불러오는 데 실패했습니다: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      investigations: data.reports || [], // 백엔드 응답 형식에 맞춤
      totalPages: data.totalPages || 1,
      currentPage: data.currentPage || page,
    };
  } catch (error) {
    console.error(error);
    return { investigations: [], totalPages: 1, currentPage: 1 };
  }
}

// 연도별 조사보고서 목록 조회 함수 추가
async function getInvestigationListByYear(year: number): Promise<InvestigationReport[]> {
  try {
    // 연도별 조사보고서를 가져오기 위해 occurrence 데이터를 기반으로 필터링
    const response = await fetch(`/api/occurrence/all?year=${year}`);
    if (!response.ok) {
      throw new Error(`연도별 발생보고서를 불러오는 데 실패했습니다: ${response.statusText}`);
    }
    const data = await response.json();
    const occurrences = data.reports || [];
    
    // 해당 연도의 occurrence에 연결된 조사보고서만 필터링
    const investigationIds = occurrences.map((o: any) => o.accident_id);
    
    // 조사보고서 목록을 가져와서 필터링
    const investigationResponse = await fetch(`${API_BASE_URL}/investigation?offset=0&limit=1000`);
    if (!investigationResponse.ok) {
      throw new Error(`조사보고서 목록을 불러오는 데 실패했습니다: ${investigationResponse.statusText}`);
    }
    const investigationData = await investigationResponse.json();
    const allInvestigations = investigationData.reports || [];
    
    // 해당 연도의 occurrence에 연결된 조사보고서만 반환
    const filteredInvestigations = allInvestigations.filter((inv: InvestigationReport) => 
      investigationIds.includes(inv.accident_id)
    );
    
    return filteredInvestigations;
  } catch (error) {
    console.error('연도별 조사보고서 조회 중 오류:', error);
    return [];
  }
}

// 아코디언 토글 훅
function useAccordion(defaultOpen = false) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => setOpen((v) => !v);
  return { open, toggle };
}

// 사고 원인 상세 표시 컴포넌트 (아코디언 적용)
const CauseAnalysisAccordion = ({ cause_analysis }: { cause_analysis?: any }) => {
  const { open, toggle } = useAccordion(false);
  if (!cause_analysis) return null;
  let parsed;
  try {
    parsed = typeof cause_analysis === 'string' ? JSON.parse(cause_analysis) : cause_analysis;
  } catch {
    return null;
  }
  const hasDetail = (
    (parsed.direct_cause?.unsafe_condition?.length > 0) ||
    (parsed.direct_cause?.unsafe_act?.length > 0) ||
    (parsed.root_cause?.human_factor?.length > 0) ||
    (parsed.root_cause?.system_factor?.length > 0)
  );
  if (!hasDetail) return null;
  return (
    <div className="mt-2">
      <button type="button" onClick={toggle} className="text-xs text-slate-600 hover:underline focus:outline-none">
        {open ? '사고 원인 세부내용 닫기 ▲' : '사고 원인 세부내용 보기 ▼'}
      </button>
      {open && (
        <div className="text-xs text-gray-700 space-y-1 mt-2 border-l-2 border-slate-200 pl-3">
          {/* 직접원인 */}
          {parsed.direct_cause && (
            <div>
              <span className="font-semibold">직접원인</span>
              {parsed.direct_cause.unsafe_condition?.length > 0 && (
                <div className="ml-2">불안전한 상태: {parsed.direct_cause.unsafe_condition.join(', ')}</div>
              )}
              {parsed.direct_cause.unsafe_act?.length > 0 && (
                <div className="ml-2">불안전한 행동: {parsed.direct_cause.unsafe_act.join(', ')}</div>
              )}
            </div>
          )}
          {/* 근본원인 */}
          {parsed.root_cause && (
            <div>
              <span className="font-semibold">근본원인</span>
              {parsed.root_cause.human_factor?.length > 0 && (
                <div className="ml-2">인적요인: {parsed.root_cause.human_factor.join(', ')}</div>
              )}
              {parsed.root_cause.system_factor?.length > 0 && (
                <div className="ml-2">시스템요인: {parsed.root_cause.system_factor.join(', ')}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 재발방지대책 상세 표시 컴포넌트 (아코디언 적용)
const PreventionActionsAccordion = ({ prevention_actions }: { prevention_actions?: any }) => {
  const { open, toggle } = useAccordion(false);
  if (!prevention_actions) return null;
  let parsed;
  try {
    parsed = typeof prevention_actions === 'string' ? JSON.parse(prevention_actions) : prevention_actions;
  } catch {
    return null;
  }
  const hasDetail = (
    (parsed.technical_actions?.length > 0) ||
    (parsed.educational_actions?.length > 0) ||
    (parsed.managerial_actions?.length > 0)
  );
  if (!hasDetail) return null;
  const renderAction = (action: any, idx: number) => (
    <div key={idx} className="ml-2 mb-1">
      <span className="font-medium">{action.improvement_plan}</span>
      {action.responsible_person && (
        <span className="ml-2 text-slate-700">({action.responsible_person})</span>
      )}
      {action.scheduled_date && (
        <span className="ml-2 text-gray-500">예정: {action.scheduled_date}</span>
      )}
      {action.progress_status && (
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{action.progress_status === 'completed' ? '완료' : action.progress_status === 'in_progress' ? '진행중' : '대기'}</span>
      )}
    </div>
  );
  return (
    <div className="mt-2">
      <button type="button" onClick={toggle} className="text-xs text-slate-600 hover:underline focus:outline-none">
        {open ? '재발방지대책 세부내용 닫기 ▲' : '재발방지대책 세부내용 보기 ▼'}
      </button>
      {open && (
        <div className="text-xs text-gray-700 space-y-1 mt-2 border-l-2 border-slate-200 pl-3">
          {parsed.technical_actions?.length > 0 && (
            <div>
              <span className="font-semibold">기술적</span>
              {parsed.technical_actions.map(renderAction)}
            </div>
          )}
          {parsed.educational_actions?.length > 0 && (
            <div>
              <span className="font-semibold">교육적</span>
              {parsed.educational_actions.map(renderAction)}
            </div>
          )}
          {parsed.managerial_actions?.length > 0 && (
            <div>
              <span className="font-semibold">관리적</span>
              {parsed.managerial_actions.map(renderAction)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 연도 추출 함수
const getYearFromOccurrence = (o: any) => {
  if (o.global_accident_no) {
    const parts = o.global_accident_no.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[1], 10);
      if (!isNaN(year)) return year;
    }
  }
  if (o.accident_id) {
    const parts = o.accident_id.split('-');
    if (parts.length >= 3) {
      const year = parseInt(parts[2], 10);
      if (!isNaN(year)) return year;
    }
  }
  return null;
};

// 대시보드/목록 갱신용 context 생성
export const InvestigationDataContext = createContext<{
  fetchOccurrences: (year: number) => Promise<void>;
  fetchInvestigations: (page: number, term: string) => Promise<void>;
  fetchCorrectiveStats: (year: number) => Promise<void>;
  refreshDashboard: () => Promise<void>;
} | null>(null);

export default function InvestigationListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [investigations, setInvestigations] = useState<InvestigationReport[]>([]);
  const [occurrences, setOccurrences] = useState<OccurrenceReportData[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [years, setYears] = useState<number[]>([]);
  const [correctiveStats, setCorrectiveStats] = useState({ total: 0, pending: 0, in_progress: 0, delayed: 0, completed: 0 });
  const [correctiveLoading, setCorrectiveLoading] = useState(true);
  const [correctiveError, setCorrectiveError] = useState<string | null>(null);

  // 필터링 상태 추가
  const [activeInvestigationFilter, setActiveInvestigationFilter] = useState<string>('');
  const [activeCorrectiveFilter, setActiveCorrectiveFilter] = useState<string>('');
  const [filteredCorrectiveActions, setFilteredCorrectiveActions] = useState<any[]>([]);
  const [correctiveActionsLoading, setCorrectiveActionsLoading] = useState(false);
  const [yearlyInvestigations, setYearlyInvestigations] = useState<InvestigationReport[]>([]);

  // occurrence fetch 함수 (연도별)
  const fetchOccurrences = useCallback((year: number) => {
    return fetch(`/api/occurrence/all?year=${year}`)
      .then(res => res.json())
      .then(data => {
        setOccurrences(data.reports || []);
      });
  }, []);

  // 연도별 조사보고서 fetch 함수
  const fetchYearlyInvestigations = useCallback(async (year: number) => {
    try {
      const yearlyInvestigations = await getInvestigationListByYear(year);
      setYearlyInvestigations(yearlyInvestigations);
    } catch (error) {
      console.error('연도별 조사보고서 조회 중 오류:', error);
      setYearlyInvestigations([]);
    }
  }, []);

  // investigation fetch 함수 (검색/페이지)
  const fetchInvestigations = useCallback((page: number, term: string) => {
    setLoading(true);
    setError(null);
    return getInvestigationList(page, term)
      .then(data => {
        setInvestigations(data.investigations);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 한국표준시(YYYY-MM-DD) 값 가져오기
  const { getCurrentTime } = useServerTime();
  const todayKST = getCurrentTime().toISOString().split('T')[0];

  // 통합 대시보드 갱신 함수 (먼저 정의)
  const refreshDashboard = useCallback(async () => {
    if (!selectedYear) return;
    try {
      await Promise.all([
        fetchOccurrences(selectedYear),
        fetchCorrectiveStats(selectedYear)
      ]);
    } catch (error) {
      console.error('대시보드 갱신 중 오류:', error);
    }
  }, [selectedYear, fetchOccurrences]);

  // 개선조치 통계 fetch 함수 (개선조치 테이블 기반)
  const fetchCorrectiveStats = useCallback(async (year: number) => {
    setCorrectiveLoading(true);
    setCorrectiveError(null);
    try {
      // 개선조치 서비스를 사용하여 전체 리스트 조회
      const { correctiveActionService } = await import('@/services/corrective_action.service');
      
      // 대시보드 갱신 콜백 설정
      correctiveActionService.setDashboardRefreshCallback(refreshDashboard);
      
      // 전체 리스트를 받아온다 (연도별 필터 필요시 추가)
      const actions = await correctiveActionService.getAllActionsByYear?.(year) || [];
      // 상태별 카운트 집계 (동적 지연 판정)
      const stats = { total: 0, pending: 0, in_progress: 0, delayed: 0, completed: 0 };
      // [CorrectiveAction 타입 필드명 일치화]
      // progress_status → status, scheduled_date → due_date로 수정
      actions.forEach(action => {
        stats.total++;
        if (action.status === 'completed') {
          stats.completed++;
        } else if (action.due_date) {
          // 완료가 아니고 예정일이 있는 경우 지연 여부 확인
          const today = new Date();
          const due = new Date(action.due_date);
          
          // 시간을 제거하고 날짜만 비교
          const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
          
          // 예정일이 오늘보다 과거인 경우만 지연으로 판정
          if (dueDateOnly < todayDate) {
            stats.delayed++;
          } else if (action.status === 'in_progress') {
            stats.in_progress++;
          } else {
            stats.pending++;
          }
        } else if (action.status === 'in_progress') {
          stats.in_progress++;
        } else {
          stats.pending++;
        }
      });
      setCorrectiveStats(stats);
    } catch (err) {
      console.error('개선조치 통계 로드 중 오류:', err);
      setCorrectiveError('통계 데이터를 불러올 수 없습니다.');
    } finally {
      setCorrectiveLoading(false);
    }
  }, [refreshDashboard]);

  // 조사보고서 맵핑 (accident_id 기준)
  // 반드시 investigationMap을 먼저 선언한 뒤, 아래에서 사용해야 함 (TDZ 에러 방지)
  const investigationMap = useMemo(() => new Map(
    [...investigations, ...yearlyInvestigations].map(r => [r.accident_id, r])
  ), [investigations, yearlyInvestigations]);

  // 개선조치 목록 fetch 함수 (필터링용)
  const fetchCorrectiveActions = useCallback(async (year: number, status?: string) => {
    setCorrectiveActionsLoading(true);
    try {
      const { correctiveActionService } = await import('@/services/corrective_action.service');
      const actions = await correctiveActionService.getAllActionsByYear?.(year) || [];
      
      // 조사보고서 정보와 매핑 (investigation_id를 문자열로 변환하여 매핑)
      const actionsWithInvestigationInfo = actions.map(action => {
        const investigation = investigationMap.get(action.investigation_id);
        return {
          ...action,
          investigation_accident_name: investigation?.investigation_accident_name || investigation?.original_accident_name,
          investigation_global_accident_no: investigation?.investigation_global_accident_no,
        };
      });
      
      // 상태별 필터링
      let filteredActions = actionsWithInvestigationInfo;
      if (status && status !== '전체' && status !== '') {
        if (status === '지연') {
          // 지연은 완료가 아니고 예정일이 오늘보다 과거인 것 (당일 제외)
          filteredActions = actionsWithInvestigationInfo.filter(action => {
            // 완료된 경우 지연이 아님
            if (action.status === 'completed') return false;
            if (!action.due_date) return false;
            
            const today = new Date();
            const due = new Date(action.due_date);
            
            // 시간을 제거하고 날짜만 비교
            const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
            
            // 예정일이 오늘보다 과거인 경우만 지연으로 판정
            return dueDateOnly < todayDate;
          });
        } else {
          // 상태 매핑
          const statusMap: Record<string, string> = {
            '대기': 'pending',
            '진행중': 'in_progress',
            '완료': 'completed'
          };
          const mappedStatus = statusMap[status];
          if (mappedStatus) {
            filteredActions = actionsWithInvestigationInfo.filter(action => action.status === mappedStatus);
          }
        }
      }
      // status가 빈 문자열이거나 '전체'인 경우 전체 목록 반환
      setFilteredCorrectiveActions(filteredActions);
    } catch (err) {
      console.error('개선조치 목록 로드 중 오류:', err);
    } finally {
      setCorrectiveActionsLoading(false);
    }
  }, [todayKST]);

  // 조사보고서 필터링 핸들러
  const handleInvestigationFilter = useCallback((status: string) => {
    setActiveInvestigationFilter(status);
    setActiveCorrectiveFilter(''); // 다른 필터 해제
  }, []);

  // 개선조치 필터링 핸들러
  const handleCorrectiveFilter = useCallback((status: string) => {
    setActiveCorrectiveFilter(status);
    // 개선조치 필터링 시에는 조사보고서 필터를 해제하지 않음
    // (개선조치 현황에서 "전체" 클릭 시 조사보고서 필터가 해제되는 문제 해결)
    // setActiveInvestigationFilter(''); // 이 줄 제거
    // 빈 문자열이어도 fetchCorrectiveActions 호출 (전체 조회)
    fetchCorrectiveActions(selectedYear, status);
  }, [selectedYear, fetchCorrectiveActions]);

  // 연도별 전체 occurrence fetch (selectedYear 변경 시마다)
  useEffect(() => {
    if (!selectedYear) return;
    fetchOccurrences(selectedYear);
    fetchYearlyInvestigations(selectedYear); // 연도별 조사보고서도 함께 가져오기
  }, [selectedYear, fetchOccurrences, fetchYearlyInvestigations]);

  // 연도 목록 추출 (최초 1회, 기존 전체 fetch에서 추출)
  useEffect(() => {
    fetch('/api/occurrence?page=1&size=1000')
      .then(res => res.json())
      .then(data => {
        const yearSet = new Set<number>();
        (data.reports || []).forEach((o: any) => {
          if (o.global_accident_no) {
            const parts = o.global_accident_no.split('-');
            if (parts.length >= 2) {
              const year = parseInt(parts[1], 10);
              if (!isNaN(year)) yearSet.add(year);
            }
          }
        });
        const yearArr = Array.from(yearSet).sort((a, b) => b - a);
        setYears(yearArr);
        if (yearArr.length > 0 && !yearArr.includes(selectedYear)) {
          setSelectedYear(yearArr[0]);
        }
      });
  }, []);

  // 조사보고서 목록 불러오기 (기존대로)
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const term = searchParams.get('searchTerm') || '';
    fetchInvestigations(page, term);
  }, [searchParams, fetchInvestigations]);

  // 연도별 필터링 및 상태별 카운트 계산 (global_accident_no의 연도 기준)
  const filteredOccurrences = occurrences.filter(o => {
    if (!o.global_accident_no) return false;
    const parts = o.global_accident_no.split('-');
    if (parts.length < 2) return false;
    const year = parseInt(parts[1], 10);
    return year === selectedYear;
  });
  
  // 모든 가능한 조사보고서 상태를 미리 정의 (없는 상태도 0건으로 표시)
  const ALL_INVESTIGATION_STATUSES = ['대기', '조사 진행', '조사 완료', '대책 이행', '조치완료'];
  
  // 상태값별 카운트 집계 (실제 DB에 저장된 값 기준)
  const statusCounts: Record<string, number> = {};
  
  // 모든 상태를 미리 0으로 초기화
  ALL_INVESTIGATION_STATUSES.forEach(status => {
    statusCounts[status] = 0;
  });
  
  // 실제 데이터로 카운트 업데이트
  filteredOccurrences.forEach(o => {
    const inv = investigationMap.get(o.accident_id);
    // 조사보고서가 없으면 '대기'로 간주
    const status = inv?.investigation_status || '대기';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  // 전체 건수
  const total = filteredOccurrences.length;
  
  // 상태값 목록 (정의된 순서대로, 0건도 포함)
  const statusList = ALL_INVESTIGATION_STATUSES;
  
  // 기존 변수들도 0으로 초기화 후 카운트
  let waiting = 0, inProgress = 0, investigationCompleted = 0, actionInProgress = 0, completed = 0;
  filteredOccurrences.forEach(o => {
    const inv = investigationMap.get(o.accident_id);
    if (!inv) {
      // 조사보고서가 없으면 "대기"로 카운트
      waiting++;
    } else {
      const status = inv.investigation_status;
      // 상태값이 정확히 일치할 때만 해당 카운트 증가
      if (status === '대기' || status === 'draft') {
        waiting++;
      } else if (status === '조사 진행') {
        inProgress++;
      } else if (status === '조사 완료') {
        investigationCompleted++;
      } else if (status === '대책 이행') {
        actionInProgress++;
      } else if (status === '조치완료') {
        completed++;
      } // 기타 상태는 무시
    }
  });

  // 필터링된 조사보고서 목록 (사고조치현황 필터 적용)
  const filteredInvestigations = activeInvestigationFilter 
    ? filteredOccurrences
        .filter(o => {
          const inv = investigationMap.get(o.accident_id);
          const status = inv?.investigation_status || '대기';
          return status === activeInvestigationFilter;
        })
        .map(o => {
          const inv = investigationMap.get(o.accident_id);
          if (inv) {
            // 조사보고서가 있는 경우 조사보고서 정보 반환
            return inv;
          } else {
            // 조사보고서가 없는 경우 발생보고서 정보로 가상 조사보고서 생성
            return {
              accident_id: o.accident_id,
              investigation_global_accident_no: o.global_accident_no,
              investigation_accident_name: o.acci_summary || o.accident_name || '사고명 없음',
              investigation_status: '대기',
              investigation_start_time: null,
              cause_analysis_summary: null,
              prevention_actions_summary: null,
              responsible_persons: [],
              scheduled_dates: [],
              total_actions: 0,
              completed_actions: 0,
              pending_actions: 0,
              completion_rate: 0,
              // 발생보고서 정보 추가
              is_occurrence_only: true, // 발생보고서만 있는 상태임을 표시
              occurrence_data: o, // 원본 발생보고서 데이터
            } as InvestigationReport & { is_occurrence_only?: boolean; occurrence_data?: any };
          }
        })
    : // "전체" 또는 필터가 없을 때는 해당 연도의 조사보고서와 발생보고서만 있는 경우 모두 표시
      [
        ...yearlyInvestigations,
        ...filteredOccurrences
          .filter(o => !investigationMap.has(o.accident_id)) // 조사보고서가 없는 occurrence만
          .map(o => ({
            accident_id: o.accident_id,
            investigation_global_accident_no: o.global_accident_no,
            investigation_accident_name: o.acci_summary || o.accident_name || '사고명 없음',
            investigation_status: '대기',
            investigation_start_time: null,
            cause_analysis_summary: null,
            prevention_actions_summary: null,
            responsible_persons: [],
            scheduled_dates: [],
            total_actions: 0,
            completed_actions: 0,
            pending_actions: 0,
            completion_rate: 0,
            // 발생보고서 정보 추가
            is_occurrence_only: true, // 발생보고서만 있는 상태임을 표시
            occurrence_data: o, // 원본 발생보고서 데이터
          } as InvestigationReport & { is_occurrence_only?: boolean; occurrence_data?: any }))
      ];
  
  // 연도 변경 시 개선조치 통계 fetch
  useEffect(() => {
    if (selectedYear) fetchCorrectiveStats(selectedYear);
  }, [selectedYear, fetchCorrectiveStats]);

  // 디버깅용 useEffect 제거 (무한 루프 방지)
  // useEffect(() => {
  //   if (occurrences.length > 0) {
  //     // 전체 occurrence accident_id, global_accident_no, 연도 추출 결과 출력
  //     console.log('=== 발생보고서 전체 목록 ===');
  //     occurrences.forEach(o => {
  //       const globalYear = o.global_accident_no ? o.global_accident_no.split('-')[1] : '';
  //       const accYear = o.accident_id ? o.accident_id.split('-')[2] : '';
  //       console.log({
  //         accident_id: o.accident_id,
  //         global_accident_no: o.global_accident_no,
  //         globalYear,
  //         accYear,
  //         getYear: getYearFromOccurrence(o),
  //         acci_time: o.acci_time,
  //       });
  //     });
  //     // 필터링된 occurrence
  //     console.log('=== filteredOccurrences ===');
  //     filteredOccurrences.forEach(o => {
  //       console.log(o.accident_id, o.global_accident_no, getYearFromOccurrence(o));
  //     });
  //     // 전체/필터링 건수
  //     console.log('전체 occurrence 수:', occurrences.length);
  //     console.log('filteredOccurrences 수:', filteredOccurrences.length);
  //     console.log('selectedYear:', selectedYear);
  //   }
  // }, [occurrences, filteredOccurrences, selectedYear]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`/investigation?page=1&searchTerm=${encodeURIComponent(searchTerm)}`);
  };
  
  const handlePageChange = (newPage: number) => {
    router.push(`/investigation?page=${newPage}&searchTerm=${encodeURIComponent(searchTerm)}`);
  };

  if (loading) {
    console.log('Loading state:', { loading, error, investigations: investigations.length });
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }
  
  if (error) {
    console.log('Error state:', { error });
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-red-500">에러: {error}</div>
      </div>
    );
  }

  // 사고조사현황 요약/상세 props 준비 (기존 investigationSummary 대신 동적 statusCounts 사용)
  const investigationSummary = {
    total,
    statusCounts,
    statusList,
  };
  // 개선조치진행현황 요약/상세 props 준비
  const correctiveSummary = {
    total: correctiveStats.total,
    pending: correctiveStats.pending,
    in_progress: correctiveStats.in_progress,
    delayed: correctiveStats.delayed,
    completed: correctiveStats.completed,
  };

  return (
    <InvestigationDataContext.Provider value={{ fetchOccurrences, fetchInvestigations, fetchCorrectiveStats, refreshDashboard }}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* 통합 대시보드 */}
        <UnifiedDashboard
          years={years}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          investigationSummary={investigationSummary}
          correctiveSummary={correctiveSummary}
          onInvestigationFilter={handleInvestigationFilter}
          onCorrectiveFilter={handleCorrectiveFilter}
          activeInvestigationFilter={activeInvestigationFilter}
          activeCorrectiveFilter={activeCorrectiveFilter}
        />

        {/* 개선조치 필터링 결과 표시 */}
        {activeCorrectiveFilter && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">개선조치 목록 - {activeCorrectiveFilter}</h2>
              <button
                onClick={() => handleCorrectiveFilter('')}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                필터 해제
              </button>
            </div>
            
            {correctiveActionsLoading ? (
              <div className="text-center py-8">
                <div className="text-lg">로딩 중...</div>
              </div>
            ) : filteredCorrectiveActions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCorrectiveActions.map((action) => (
                  <CorrectiveActionCard key={action.id} action={action} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">해당 조건의 개선조치가 없습니다</div>
                <p className="text-gray-400">다른 조건을 선택해보세요</p>
              </div>
            )}
          </div>
        )}

        {/* 조사보고서 목록 (사고조치현황 필터링 결과 또는 기본 목록) */}
        {!activeCorrectiveFilter && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">
                {activeInvestigationFilter ? `조사보고서 목록 - ${activeInvestigationFilter}` : '조사보고서 목록'}
              </h1>
              <Link 
                href="/investigation/create"
                className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                새 조사보고서 작성
              </Link>
            </div>

            {!activeInvestigationFilter && (
              <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="사고명, 원인, 대책 등으로 검색..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button type="submit" className="bg-slate-500 text-white px-6 py-3 rounded-lg hover:bg-slate-600 transition-colors">
                  검색
                </button>
              </form>
            )}

            {/* 카드 그리드 레이아웃 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvestigations.map((report) => {
                const warning = getScheduledDateWarning(report.scheduled_dates || []);
                const isOccurrenceOnly = (report as any).is_occurrence_only;
                
                return (
                  <div key={report.accident_id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                    {/* 헤더 */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-lg font-semibold text-emerald-600">
                          {/* 전체사고코드만 표시 */}
                          {report.investigation_global_accident_no || report.accident_id}
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.investigation_status)}`}>
                          {isOccurrenceOnly ? '조사보고서 미생성' : (report.investigation_status || '작성중')}
                        </span>
                      </div>
                      <h3 className="text-gray-900 font-medium mb-2">
                        {report.investigation_accident_name || report.original_accident_name || report.investigation_acci_summary || '-'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {isOccurrenceOnly ? '발생보고서만 존재' : `조사시작: ${formatDate(report.investigation_start_time)}`}
                      </p>
                    </div>

                    {/* 원인분석 - 조사보고서가 있는 경우만 표시 */}
                    {!isOccurrenceOnly && report.cause_analysis_summary && (
                      <div className="p-4 border-b border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">사고 원인</h4>
                        <p className="text-sm text-gray-600">{report.cause_analysis_summary}</p>
                        <CauseAnalysisAccordion cause_analysis={report.cause_analysis} />
                      </div>
                    )}

                    {/* 재발방지대책 - 조사보고서가 있는 경우만 표시 */}
                    {!isOccurrenceOnly && report.prevention_actions_summary && (
                      <div className="p-4 border-b border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">재발방지대책</h4>
                        <p className="text-sm text-gray-600 mb-2">{report.prevention_actions_summary}</p>
                        <PreventionActionsAccordion prevention_actions={report.prevention_actions} />
                        {/* 진행률 표시 */}
                        {report.total_actions && report.total_actions > 0 && (
                          <div className="mb-2 mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>완료율</span>
                              <span>{report.completion_rate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getProgressColor(report.completion_rate).split(' ')[1]}`}
                                style={{ width: `${report.completion_rate}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>완료: {report.completed_actions}건</span>
                              <span>대기: {report.pending_actions}건</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 발생보고서만 있는 경우 안내 메시지 */}
                    {isOccurrenceOnly && (
                      <div className="p-4 border-b border-gray-100">
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <p className="mb-2">📋 조사보고서가 아직 생성되지 않았습니다.</p>
                          <p className="text-xs text-gray-500">사고 원인 분석 및 재발방지대책 수립을 위해 조사보고서를 작성해주세요.</p>
                        </div>
                      </div>
                    )}

                    {/* 담당자 및 예정일 - 조사보고서가 있는 경우만 표시 */}
                    {!isOccurrenceOnly && (
                      <div className="p-4">
                        {report.responsible_persons && report.responsible_persons.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">담당자</h4>
                            <div className="flex flex-wrap gap-1">
                              {report.responsible_persons.map((person, index) => (
                                <span key={index} className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded">
                                  {person}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 완료 예정일 경고 */}
                        {warning && (warning.overdue > 0 || warning.upcoming > 0) && (
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">완료 예정일</h4>
                            {warning.overdue > 0 && (
                              <div className="text-red-600 text-xs mb-1">
                                ⚠️ {warning.overdue}건 지연
                              </div>
                            )}
                            {warning.upcoming > 0 && (
                              <div className="text-yellow-600 text-xs">
                                ⏰ {warning.upcoming}건 7일 이내
                              </div>
                            )}
                          </div>
                        )}

                        {/* 상세보기 버튼 */}
                        <Link 
                          href={`/investigation/${report.accident_id}`}
                          className="w-full mt-3 bg-slate-100 text-slate-700 py-2 px-4 rounded-lg text-sm text-center hover:bg-slate-200 transition-colors"
                        >
                          상세보기 →
                        </Link>
                      </div>
                    )}

                    {/* 발생보고서만 있는 경우 조사보고서 작성 버튼 */}
                    {isOccurrenceOnly && (
                      <div className="p-4">
                        <Link 
                          href={`/investigation/create?accident_id=${report.accident_id}`}
                          className="w-full mt-3 bg-emerald-600 text-white py-2 px-4 rounded-lg text-sm text-center hover:bg-emerald-700 transition-colors"
                        >
                          조사보고서 작성 →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 빈 상태 */}
            {filteredInvestigations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">
                  {activeInvestigationFilter ? `${activeInvestigationFilter} 상태의 조사보고서가 없습니다` : '조사보고서가 없습니다'}
                </div>
                <p className="text-gray-400">
                  {activeInvestigationFilter ? '다른 조건을 선택해보세요' : '새로운 조사보고서를 작성해보세요'}
                </p>
              </div>
            )}
            
            {/* 페이지네이션 (필터링 중에는 숨김) */}
            {!activeInvestigationFilter && totalPages > 1 && (
              <div className="flex justify-center items-center mt-8">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 mx-1 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 mx-1 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </InvestigationDataContext.Provider>
  );
} 