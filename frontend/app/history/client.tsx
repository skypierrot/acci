"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DateRangePicker from "../../components/DateRangePicker";
import { getInvestigationStatus, convertStatusForHistory, getAccidentTypeDisplay, getCompletionRateColor } from '../../utils/statusUtils';
import HistoryTable from '../../components/history/HistoryTable';

// 재해자 정보 인터페이스
interface VictimInfo {
  name: string;
  injury_type: string;
  absence_days?: number; // 휴업손실일 (조사보고서에서만)
  belong: string; // 소속 정보
}

// 물적피해 정보 인터페이스
interface PropertyDamageInfo {
  damage_target: string;
  estimated_cost: number;
}

// 재발방지대책 통계 인터페이스
interface PreventionStats {
  total_actions: number;
  completed_actions: number;
  completion_rate: number;
}

// 발생보고서 인터페이스 (고도화)
interface OccurrenceReport {
  accident_id: string;
  global_accident_no: string;
  company_name: string;
  site_name: string;
  accident_name?: string;
  acci_time: string;
  acci_location: string;
  accident_type_level1: string;
  accident_type_level2: string;
  victim_count: number;
  is_contractor: boolean;
  contractor_name?: string;
  created_at: string;
  updated_at: string;
  status: string;  // 사고 상태 (발생, 조사중, 완료)
  
  // 고도화된 정보 (조사보고서 우선)
  final_accident_name?: string;  // 최종 사고명
  final_acci_time?: string;      // 최종 사고발생일시
  final_accident_type_level1?: string; // 최종 재해발생형태
  original_accident_id?: string; // 원본 사고 ID (조사보고서에서 참조)
  
  // 재해자 정보
  victims_info: VictimInfo[];
  victims_summary: string;
  
  // 물적피해 정보
  property_damages_info: PropertyDamageInfo[];
  property_damages_summary: string;
  
  // 원인 정보 (조사보고서에서만)
  causes_summary?: string;
  
  // 재발방지대책 정보 (조사보고서에서만)
  prevention_stats?: PreventionStats;
  prevention_actions?: { title: string; progress_status: string }[]; // 추가된 필드
}

// 페이징 정보 인터페이스
interface PaginationInfo {
  total: number;
  page: number;
  size: number;
  pages: number;
}

// 필터 상태 인터페이스
interface FilterState {
  company: string;
  site: string;  // 이제 site_code를 저장
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}

// 사업장 정보 인터페이스 추가
interface SiteInfo {
  code: string;   // 사업장 코드 (site_code)
  name: string;   // 사업장명 (site_name)
}

export const ExpandedRowDetails = ({ report, isMobile = false }: { report: OccurrenceReport; isMobile?: boolean }) => {
  const accidentTypeInfo = getAccidentTypeDisplay(report);
  const hasInvestigation = report.status === '조사중' || report.status === '완료';

  // 모바일용 카드 형식
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* 기본 정보 섹션 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
            📋 기본 정보
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span className="text-gray-500 min-w-[80px]">사고 위치:</span>
              <span className="font-medium">{report.acci_location}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span className="text-gray-500 min-w-[80px]">사고 유형:</span>
              <span className="font-medium">{report.accident_type_level2}</span>
            </div>
            {report.is_contractor && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <span className="text-gray-500 min-w-[80px]">협력업체:</span>
                <span className="font-medium">{report.contractor_name || '정보없음'}</span>
              </div>
            )}
          </div>
        </div>

        {/* 재해자 상세 정보 */}
        {(accidentTypeInfo.displayType === 'human' || accidentTypeInfo.displayType === 'both') && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              👤 재해자 상세 정보
            </h4>
            <div className="space-y-3">
              {report.victims_info.map((victim, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-blue-800">
                        {victim.name} {victim.belong && <span className="ml-1">{victim.belong}</span>} <span className="text-sm text-blue-600">({victim.injury_type})</span>
                      </div>
                    </div>
                    {victim.absence_days && (
                      <div className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
                        {victim.absence_days}일 휴업
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 물적피해 상세 정보 */}
        {(accidentTypeInfo.displayType === 'property' || accidentTypeInfo.displayType === 'both') && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              🏗️ 물적피해 상세 정보
            </h4>
            <div className="space-y-3">
              {report.property_damages_info.map((damage, index) => (
                <div key={index} className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-orange-800">
                        {damage.damage_target}
                      </div>
                    </div>
                    <div className="text-sm text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded self-start">
                      {damage.estimated_cost.toLocaleString()}천원
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 사고원인 분석 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            🔍 사고원인 분석
          </h3>
          {hasInvestigation ? (
            <div className={`p-3 rounded-lg space-y-3 ${
              report.causes_summary === '원인분석 미완료' 
                ? 'bg-yellow-50 border border-yellow-200' 
                : 'bg-gray-50'
            }`}>
              {report.causes_summary === '원인분석 미완료' ? (
                <div className="text-sm text-yellow-700 font-medium">
                  ⚠️ {report.causes_summary}
                </div>
              ) : (
                <div className="space-y-3">
                  {report.causes_summary.split(' | ').map((cause, index) => {
                    const isDirectCause = cause.startsWith('직접원인:');
                    const isRootCause = cause.startsWith('근본원인:');
                    
                    return (
                      <div key={index} className="text-sm">
                        {isDirectCause && (
                          <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
                            <div className="font-medium text-red-700 mb-1">🔥 직접원인</div>
                            <div className="text-gray-700">{cause.replace('직접원인:', '').trim()}</div>
                          </div>
                        )}
                        {isRootCause && (
                          <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                            <div className="font-medium text-blue-700 mb-1">🌱 근본원인</div>
                            <div className="text-gray-700">{cause.replace('근본원인:', '').trim()}</div>
                          </div>
                        )}
                        {!isDirectCause && !isRootCause && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-gray-700">{cause}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              📝 사고조사 진행이 필요합니다.
            </div>
          )}
        </div>

        {/* 재발방지대책 현황 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            🛡️ 재발방지대책 현황
          </h3>
          {hasInvestigation ? (
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">전체 진행률</span>
                  <span className={`text-lg font-bold ${getCompletionRateColor(report.prevention_stats.completion_rate)}`}>
                    {report.prevention_stats.completion_rate}%
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-sm">
                  <span className="text-green-700 font-semibold">
                    ✅ 완료 {report.prevention_stats.completed_actions}건
                  </span>
                  <span className="text-blue-700 font-semibold">
                    🔄 진행중 {report.prevention_stats.total_actions - report.prevention_stats.completed_actions}건
                  </span>
                </div>
              </div>
              
              {/* 진행률 바 */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    report.prevention_stats.completion_rate >= 80 ? 'bg-green-500' :
                    report.prevention_stats.completion_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${report.prevention_stats.completion_rate}%` }}
                ></div>
              </div>
              
              {/* 상세 리스트 */}
              {report.prevention_actions && report.prevention_actions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700 mb-2">상세 조치사항</h4>
                  {report.prevention_actions.map((action, idx) => {
                    let statusColor = '';
                    let statusText = '';
                    let badgeBg = '';
                    let statusIcon = '';
                    
                    switch (action.progress_status) {
                      case 'completed':
                        statusColor = 'text-green-700';
                        badgeBg = 'bg-green-100';
                        statusText = '완료';
                        statusIcon = '✅';
                        break;
                      case 'in_progress':
                        statusColor = 'text-blue-700';
                        badgeBg = 'bg-blue-100';
                        statusText = '진행중';
                        statusIcon = '🔄';
                        break;
                      case 'pending':
                        statusColor = 'text-gray-600';
                        badgeBg = 'bg-gray-100';
                        statusText = '대기';
                        statusIcon = '⏳';
                        break;
                      case 'delayed':
                        statusColor = 'text-yellow-700';
                        badgeBg = 'bg-yellow-100';
                        statusText = '지연';
                        statusIcon = '⚠️';
                        break;
                      default:
                        statusColor = 'text-gray-600';
                        badgeBg = 'bg-gray-100';
                        statusText = '미정';
                        statusIcon = '❓';
                    }
                    
                    return (
                      <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded border">
                        <span className="text-sm mt-0.5">{statusIcon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {action.title}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${badgeBg} ${statusColor} font-medium whitespace-nowrap`}>
                          {statusText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              📋 조사보고서 작성 후 재발방지대책을 확인할 수 있습니다.
            </div>
          )}
        </div>
      </div>
    );
  }

  // 데스크톱용 테이블 형식
  return (
    <tr>
      <td colSpan={8} className="border-l border-r border-b bg-gray-50 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽 컬럼 */}
          <div className="space-y-4">
            {/* 기본 정보 */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">기본 정보</h4>
              <div className="text-sm">
                <div className="flex flex-wrap gap-4">
                  <span><span className="text-gray-500">사고 위치:</span> <span className="font-medium">{report.acci_location}</span></span>
                  <span><span className="text-gray-500">사고 유형:</span> <span className="font-medium">{report.accident_type_level2}</span></span>
                  {report.is_contractor && (
                    <span><span className="text-gray-500">협력업체:</span> <span className="font-medium">{report.contractor_name || '정보없음'}</span></span>
                  )}
                </div>
              </div>
            </div>

            {/* 재해자 상세 정보 */}
            {(accidentTypeInfo.displayType === 'human' || accidentTypeInfo.displayType === 'both') && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">재해자 상세 정보</h4>
                <div className="space-y-2">
                  {report.victims_info.map((victim, index) => (
                    <div key={index} className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-blue-800">
                            {victim.name} {victim.belong && <span className="ml-1">{victim.belong}</span>} <span className="text-sm text-blue-600">({victim.injury_type})</span>
                          </div>
                        </div>
                        {victim.absence_days && (
                          <div className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
                            {victim.absence_days}일 휴업
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 물적피해 상세 정보 */}
            {(accidentTypeInfo.displayType === 'property' || accidentTypeInfo.displayType === 'both') && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">물적피해 상세 정보</h4>
                <div className="space-y-2">
                  {report.property_damages_info.map((damage, index) => (
                    <div key={index} className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-orange-800">{damage.damage_target}</div>
                        </div>
                        <div className="text-sm text-orange-600 font-medium">
                          {damage.estimated_cost.toLocaleString()}천원
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽 컬럼 */}
          <div className="space-y-4">
            {/* 사고원인 상세 */}
            {hasInvestigation ? (
              // 조사보고서가 있을 때 기존 내용 표시
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">사고원인 분석</h3>
                <div className={`p-3 rounded space-y-3 ${
                  report.causes_summary === '원인분석 미완료' 
                    ? 'bg-yellow-50 border border-yellow-200' 
                    : 'bg-gray-100'
                }`}>
                  {report.causes_summary === '원인분석 미완료' ? (
                    <div className="text-sm text-yellow-700 font-medium">
                      {report.causes_summary}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {report.causes_summary.split(' | ').map((cause, index) => {
                        const isDirectCause = cause.startsWith('직접원인:');
                        const isRootCause = cause.startsWith('근본원인:');
                        
                        return (
                          <div key={index} className="text-sm">
                            {isDirectCause && (
                              <div>
                                <span className="font-medium text-red-700">직접원인:</span>
                                <span className="text-gray-700 ml-2">{cause.replace('직접원인:', '').trim()}</span>
                              </div>
                            )}
                            {isRootCause && (
                              <div>
                                <span className="font-medium text-blue-700">근본원인:</span>
                                <span className="text-gray-700 ml-2">{cause.replace('근본원인:', '').trim()}</span>
                              </div>
                            )}
                            {!isDirectCause && !isRootCause && (
                              <div className="text-gray-700">{cause}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // 조사보고서가 없을 때 안내 메시지 표시
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-2">사고원인 분석</h3>
                <div className="text-sm text-gray-600">사고조사 진행이 필요합니다.</div>
              </div>
            )}

            {/* 재발방지대책 상세 */}
            {hasInvestigation ? (
              // 조사보고서가 있을 때 기존 내용 표시
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">재발방지대책 현황</h3>
                <div className="bg-white border rounded p-3">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <span className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">전체 진행률</span>
                      <span className={`text-lg font-bold ${getCompletionRateColor(report.prevention_stats.completion_rate)}`}>{report.prevention_stats.completion_rate}%</span>
                    </span>
                    <span className="flex items-center gap-2 text-sm ml-2">
                      <span className="text-green-700 font-semibold">완료 {report.prevention_stats.completed_actions}건</span>
                      <span className="text-blue-700 font-semibold">진행중 {report.prevention_stats.total_actions - report.prevention_stats.completed_actions}건</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        report.prevention_stats.completion_rate >= 80 ? 'bg-green-500' :
                        report.prevention_stats.completion_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${report.prevention_stats.completion_rate}%` }}
                    ></div>
                  </div>
                  {/* 상세 리스트 */}
                  {report.prevention_actions && report.prevention_actions.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {report.prevention_actions.map((action, idx) => {
                        let statusColor = '';
                        let statusText = '';
                        let badgeBg = '';
                        switch (action.progress_status) {
                          case 'completed':
                            statusColor = 'text-green-700';
                            badgeBg = 'bg-green-100';
                            statusText = '완료';
                            break;
                          case 'in_progress':
                            statusColor = 'text-blue-700';
                            badgeBg = 'bg-blue-100';
                            statusText = '진행중';
                            break;
                          case 'pending':
                            statusColor = 'text-gray-600';
                            badgeBg = 'bg-gray-100';
                            statusText = '대기';
                            break;
                          case 'delayed':
                            statusColor = 'text-yellow-700';
                            badgeBg = 'bg-yellow-100';
                            statusText = '지연';
                            break;
                          default:
                            statusColor = 'text-gray-700';
                            badgeBg = 'bg-gray-100';
                            statusText = action.progress_status || '기타';
                        }
                        return (
                          <div key={idx} className="flex items-center justify-between px-1 py-1 text-sm border-b last:border-b-0">
                            <span className="truncate mr-2">{action.title}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${statusColor} ${badgeBg}`}>{statusText}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // 조사보고서가 없을 때 안내 메시지 표시
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-2">재발방지대책 현황</h3>
                <div className="text-sm text-gray-600">사고조사 진행이 필요합니다.</div>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

const HistoryClient = () => {
  const router = useRouter();
  const [reports, setReports] = useState<OccurrenceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    size: 10, // 기본 페이지 크기를 10으로 설정
    pages: 0
  });
  
  // 필터 상태
  const [filters, setFilters] = useState<FilterState>({
    company: "",
    site: "",
    status: "",
    startDate: null,
    endDate: null
  });
  
  // 회사 목록
  const [companies, setCompanies] = useState<string[]>([]);
  // 사업장 목록 - site_code와 site_name을 모두 저장하도록 구조 변경
  const [sites, setSites] = useState<SiteInfo[]>([]);
  
  // 조사보고서 존재 여부를 저장할 상태 추가 (행별)
  const [investigationExistsMap, setInvestigationExistsMap] = useState<{ [accidentId: string]: boolean }>({});
  // 조사보고서 전체 리스트를 한 번에 fetch해서 Map(accident_id → investigation)으로 만든다
  const [investigationMap, setInvestigationMap] = useState(new Map());

  // 조사보고서 전체 fetch (최초 1회)
  useEffect(() => {
    fetch('/api/investigation?offset=0&limit=10000')
      .then(res => res.json())
      .then(data => {
        const investigations = data.reports || [];
        const map = new Map();
        investigations.forEach(inv => {
          if (inv.accident_id) map.set(inv.accident_id, inv);
        });
        setInvestigationMap(map);
      })
      .catch(() => setInvestigationMap(new Map()));
  }, []);
  
  // 확장된 행 상태 관리
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 초기 데이터 로드
  useEffect(() => {
    loadReports();
    // 회사 목록 로드
    loadCompanies();
    // 사업장 목록 로드
    loadSites();
  }, []);
  
  // 페이징 또는 필터 변경 시 데이터 재로드
  useEffect(() => {
    // 초기 렌더링이 아닌 경우에만 데이터 로드
    if (!loading) {
      loadReports();
    }
  }, [pagination.page, pagination.size, filters]);
  
  // 여러 키로 조사보고서 조회 (accident_id, global_accident_no, original_accident_id)
  async function findInvestigation(report: OccurrenceReport) {
    // 1. accident_id로 조회
    let res = await fetch(`/api/investigation/${report.accident_id}`);
    if (res.ok) {
      const data = await res.json();
      if (data && !data.error) return data;
    }
    // 2. global_accident_no로 조회 (API가 있다면)
    if (report.global_accident_no) {
      res = await fetch(`/api/investigation/by-global-no/${report.global_accident_no}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) return data;
      }
    }
    // 3. original_accident_id로 조회 (API가 있다면)
    if (report.original_accident_id) {
      res = await fetch(`/api/investigation/by-original-id/${report.original_accident_id}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) return data;
      }
    }
    // 못 찾으면 null
    return null;
  }

  // 보고서 목록이 바뀔 때마다 각 행별로 조사보고서 상태를 비동기로 가져옴 (여러 키로 조회)
  useEffect(() => {
    if (!reports || reports.length === 0) return;
    const uncheckedIds = reports.filter(r => !(r.accident_id in investigationMap)).map(r => r.accident_id);
    if (uncheckedIds.length === 0) return;
    // 여러 키로 병렬 조회
    uncheckedIds.forEach(async accidentId => {
      const report = reports.find(r => r.accident_id === accidentId);
      const investigation = investigationMap.get(accidentId);
      const status = getInvestigationStatus(report, investigation);
      // setInvestigationStatusMap(prev => ({ ...prev, [accidentId]: status })); // 이 부분은 제거됨
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);
  
  // 회사 목록 로드 함수
  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        const companyNames = data.map((company: any) => company.name);
        setCompanies(companyNames);
      }
    } catch (err) {
      console.error('회사 목록 로드 오류:', err);
    }
  };
  
  // 사업장 목록 로드 함수 - site_code와 site_name을 모두 저장하도록 수정
  const loadSites = async () => {
    try {
      const response = await fetch('/api/sites');
      if (response.ok) {
        const data = await response.json();
        // site_code와 site_name을 모두 저장하도록 변경
        const siteInfos = data.map((site: any) => ({
          code: site.code,    // 사업장 코드 (site_code)
          name: site.name     // 사업장명 (site_name)
        }));
        setSites(siteInfos);
      }
    } catch (err) {
      console.error('사업장 목록 로드 오류:', err);
    }
  };
  
  // 사고 이력 로드 함수
  const loadReports = async () => {
    try {
      setLoading(true);
      
      // 쿼리 파라미터 구성
      const queryParams = new URLSearchParams({
        page: String(pagination.page),
        size: String(pagination.size)
      });
      
      // 필터 적용
      if (filters.company) queryParams.append('company', filters.company);
      if (filters.site) queryParams.append('site', filters.site);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) {
        // YYYY-MM 형식으로 변환
        const startDateStr = `${filters.startDate.getFullYear()}-${String(filters.startDate.getMonth() + 1).padStart(2, '0')}`;
        queryParams.append('startDate', startDateStr);
      }
      if (filters.endDate) {
        // YYYY-MM 형식으로 변환
        const endDateStr = `${filters.endDate.getFullYear()}-${String(filters.endDate.getMonth() + 1).padStart(2, '0')}`;
        queryParams.append('endDate', endDateStr);
      }
      
      // API 호출 - 히스토리 API 사용
      console.log('API 호출:', `/api/history?${queryParams.toString()}`);
      const response = await fetch(`/api/history?${queryParams.toString()}`, {
        cache: 'no-store', // 캐시 방지
        next: { revalidate: 0 } // SSR 캐시 방지
      });
      
      if (!response.ok) {
        throw new Error(`API 오류 (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API 응답:', data);
      
      setReports(data.reports || []);
      
      // 페이징 정보 설정
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        page: data.page || 1,
        pages: data.totalPages || 1
      }));
      
    } catch (err: any) {
      console.error('사고 발생보고서 로드 오류:', err);
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      // 에러 발생 시에도 로딩 상태 해제
      setReports([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  
  // 필터 변경 핸들러
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // 필터 적용 핸들러
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    // 페이지를 1로 리셋하고 필터 적용
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    setFilters({
      company: "",
      site: "",
      status: "",
      startDate: null,
      endDate: null
    });
    // 페이지를 1로 리셋
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  // 행 확장/축소 토글 핸들러
  const toggleRowExpansion = (accidentId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accidentId)) {
        newSet.delete(accidentId);
      } else {
        newSet.add(accidentId);
      }
      return newSet;
    });
  };
  
  // 날짜 포맷 함수 (날짜만 반환, 시간 제외)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      // YYYY-MM-DD 형식으로 반환
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (e) {
      console.error('날짜 포맷 오류:', e);
      return dateStr;
    }
  };
  
  // 상태에 따른 배지 색상 (상태 표기 기준으로 보완)
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case '발생':
        return 'bg-red-100 text-red-800';
      case '조사 진행':
      case '조사중':
        return 'bg-yellow-100 text-yellow-800';
      case '조사 완료':
        return 'bg-blue-100 text-blue-800';
      case '대책 이행':
        return 'bg-purple-100 text-purple-800';
      case '종결':
      case '조치완료':
      case '완료':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태 표기: 조사보고서가 없으면 '발생', 조사보고서가 있고 상태가 '대기'면 '대기', 나머지는 기존 변환 적용
  const getDisplayStatus = (report: OccurrenceReport) => {
    const investigation = investigationMap.get(report.accident_id);
    if (!investigation) return '발생'; // 1. 조사보고서가 없으면 '발생'
    if (investigation.investigation_status === '대기') return '조사 대기'; // 2. 조사보고서가 있고 상태가 '대기'면 '조사 대기'
    // 3. 나머지는 기존 변환 적용
    const rawStatus = getInvestigationStatus(report, investigation);
    return convertStatusForHistory(rawStatus);
  };

  // 상태 필터링 로직 개선
  const filteredReports = reports.filter((report) => {
    const investigation = investigationMap.get(report.accident_id);
    const statusFilter = filters.status;
    if (!statusFilter || statusFilter === '') return true; // 전체
    if (statusFilter === '발생') return !investigation;
    if (statusFilter === '조사 대기') return investigation && investigation.investigation_status === '대기';
    if (statusFilter === '조사 진행') return investigation && investigation.investigation_status === '조사 진행';
    if (statusFilter === '조사 완료') return investigation && investigation.investigation_status === '조사 완료';
    if (statusFilter === '대책 이행') return investigation && investigation.investigation_status === '대책 이행';
    if (statusFilter === '종결') return investigation && investigation.investigation_status === '조치완료';
    return true;
  });

  if (loading && reports.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">데이터 로딩 중...</div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold">사고 이력</h1>
        <Link href="/occurrence/create" className="w-full sm:w-auto px-4 py-2 bg-primary-700 text-white rounded text-center font-medium hover:bg-primary-800 transition-colors">
          신규 사고 등록
        </Link>
      </div>
      
      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">오류 발생</p>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              loadReports();
            }} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            다시 시도
          </button>
        </div>
      )}
      
      {/* 필터 섹션 */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <form onSubmit={handleApplyFilters}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">회사</label>
              <select
                name="company"
                value={filters.company}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">전체</option>
                {companies.map((company, index) => (
                  <option key={index} value={company}>{company}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">사업장</label>
              <select
                name="site"
                value={filters.site}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">전체</option>
                {sites.map((site, index) => (
                  <option key={index} value={site.code}>{site.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">상태</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">전체</option>
                <option value="발생">발생</option>
                <option value="조사 대기">조사 대기</option>
                <option value="조사 진행">조사 진행</option>
                <option value="조사 완료">조사 완료</option>
                <option value="대책 이행">대책 이행</option>
                <option value="종결">종결</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">조회구간</label>
              <DateRangePicker
                startDate={filters.startDate}
                endDate={filters.endDate}
                onStartDateChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                onEndDateChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                placeholder="날짜 범위 선택"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">페이지 크기</label>
              <select
                name="pageSize"
                value={pagination.size}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value);
                  setPagination(prev => ({ ...prev, size: newSize, page: 1 }));
                }}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value={10}>10개씩</option>
                <option value={20}>20개씩</option>
                <option value={30}>30개씩</option>
                <option value={50}>50개씩</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              초기화
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-primary-700 text-white rounded-md text-sm font-medium hover:bg-primary-800"
            >
              적용
            </button>
          </div>
        </form>
      </div>
      
      {/* 테이블 */}
      <HistoryTable
        reports={filteredReports}
        investigationMap={investigationMap}
        getDisplayStatus={getDisplayStatus}
        getStatusBadgeClass={getStatusBadgeClass}
        getAccidentTypeDisplay={getAccidentTypeDisplay}
        expandedRows={expandedRows}
        toggleRowExpansion={toggleRowExpansion}
        router={router}
        formatDate={formatDate}
        getCompletionRateColor={getCompletionRateColor}
        ExpandedRowDetails={ExpandedRowDetails}
      />
      
      {/* 페이지네이션 */}
      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-3 sm:space-y-0">
          {/* 페이지 정보 */}
          <div className="text-sm text-gray-600">
            전체 {pagination.total}건 중 {((pagination.page - 1) * pagination.size) + 1}-{Math.min(pagination.page * pagination.size, pagination.total)}건 표시 (페이지당 {pagination.size}개)
          </div>
          
          {/* 페이지 네비게이션 */}
          <nav className="flex items-center">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className={`mx-1 px-2 sm:px-3 py-1 rounded text-sm ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span className="hidden sm:inline">처음</span>
              <span className="sm:hidden">‹‹</span>
            </button>
            
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`mx-1 px-2 sm:px-3 py-1 rounded text-sm ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span className="hidden sm:inline">이전</span>
              <span className="sm:hidden">‹</span>
            </button>
            
            {/* 페이지 번호 - 모바일에서는 현재 페이지만 표시 */}
            <div className="hidden sm:flex">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                // 현재 페이지를 중심으로 표시할 페이지 범위 계산
                let startPage = Math.max(1, pagination.page - 2);
                const endPage = Math.min(pagination.pages, startPage + 4);
                
                // 마지막 페이지가 최대 페이지보다 작을 경우 시작 페이지 조정
                if (endPage - startPage < 4) {
                  startPage = Math.max(1, endPage - 4);
                }
                
                const pageNum = startPage + i;
                if (pageNum > pagination.pages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`mx-1 px-3 py-1 rounded text-sm ${
                      pagination.page === pageNum
                        ? 'bg-primary-700 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            {/* 모바일에서는 현재 페이지 정보만 표시 */}
            <div className="sm:hidden mx-2 px-3 py-1 bg-primary-700 text-white rounded text-sm">
              {pagination.page} / {pagination.pages}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className={`mx-1 px-2 sm:px-3 py-1 rounded text-sm ${
                pagination.page === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span className="hidden sm:inline">다음</span>
              <span className="sm:hidden">›</span>
            </button>
            
            <button
              onClick={() => handlePageChange(pagination.pages)}
              disabled={pagination.page === pagination.pages}
              className={`mx-1 px-2 sm:px-3 py-1 rounded text-sm ${
                pagination.page === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span className="hidden sm:inline">마지막</span>
              <span className="sm:hidden">››</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default HistoryClient; 