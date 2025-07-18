import React, { useState, useEffect } from 'react';
import { correctiveActionService, CorrectiveAction, CorrectiveActionStatus, StatusStats } from '../../services/corrective_action.service';

/**
 * @file CorrectiveActionsDashboard.tsx
 * @description
 *  - 개선조치(재발방지대책) 진행현황 대시보드 컴포넌트
 *  - 연도별 전체/상태별(대기, 진행, 지연, 완료) 건수 표시
 *  - 상태별 필터링 및 개선조치 목록 표시
 *  - 개선조치 테이블 기반 데이터 연동
 */

// 상태별 색상 정의
const statusColors: Record<string, string> = {
  pending: 'bg-neutral-200 text-neutral-700',
  in_progress: 'bg-primary-100 text-primary-700',
  delayed: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

// 상태별 한글 표시
const statusLabels: Record<CorrectiveActionStatus, string> = {
  pending: '대기',
  in_progress: '진행',
  delayed: '지연',
  completed: '완료',
};

// 상태별 key/label/color 매핑
const statusMap = [
  { key: 'pending', label: '대기', color: 'text-neutral-400 bg-neutral-100' },
  { key: 'in_progress', label: '진행', color: 'text-primary-400 bg-primary-100' },
  { key: 'delayed', label: '지연', color: 'text-red-400 bg-red-100' },
  { key: 'completed', label: '완료', color: 'text-green-400 bg-green-100' },
];

// 백엔드에서 이미 영문 key로 응답하므로 매핑 불필요
// function mapStatsKeys(stats: any) {
//   return {
//     total: stats.total ?? 0,
//     pending: stats['대기'] ?? 0,
//     in_progress: stats['진행'] ?? 0,
//     delayed: stats['지연'] ?? 0,
//     completed: stats['완료'] ?? 0,
//   };
// }

interface CorrectiveActionsDashboardProps {
  investigationId?: number; // 조사보고서 ID (선택사항)
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  showList?: boolean; // 개선조치 목록 표시 여부
  onActionClick?: (action: CorrectiveAction) => void; // 개선조치 클릭 핸들러
}

/**
 * 개선조치 진행현황 대시보드
 * @param investigationId 조사보고서 ID (선택사항)
 * @param years 연도 목록
 * @param selectedYear 선택된 연도
 * @param onYearChange 연도 변경 핸들러
 * @param showList 개선조치 목록 표시 여부
 * @param onActionClick 개선조치 클릭 핸들러
 */
const CorrectiveActionsDashboard: React.FC<CorrectiveActionsDashboardProps> = ({
  investigationId,
  years,
  selectedYear,
  onYearChange,
  showList = false,
  onActionClick,
}) => {
  // 상태 관리
  const [stats, setStats] = useState<StatusStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    delayed: 0,
    completed: 0,
  });
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<CorrectiveActionStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  // 통계 데이터 로드
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const statsData = await correctiveActionService.getStatusStats(investigationId);
      setStats(statsData); // 백엔드에서 이미 영문 key로 응답하므로 직접 사용
    } catch (err) {
      console.error('개선조치 통계 로드 중 오류:', err);
      setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 개선조치 목록 로드
  const loadActions = async () => {
    if (!showList) return;
    
    try {
      setLoading(true);
      setError(null);
      let actionsData: CorrectiveAction[] = [];
      
      if (selectedStatus === 'all') {
        // 전체 조회
        if (investigationId) {
          actionsData = await correctiveActionService.getCorrectiveActions(investigationId);
        } else {
          // 전체 조사보고서의 개선조치 조회 (백엔드 API 구현 필요)
          // 임시로 빈 배열 반환
          actionsData = [];
        }
      } else {
        // 상태별 필터링
        actionsData = await correctiveActionService.getCorrectiveActionsByStatus(selectedStatus, investigationId);
      }
      
      setActions(actionsData);
    } catch (err) {
      console.error('개선조치 목록 로드 중 오류:', err);
      setError('개선조치 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 연도 변경 시 데이터 재로드
  useEffect(() => {
    loadStats();
  }, [selectedYear, investigationId]);

  // 상태 필터 변경 시 목록 재로드
  useEffect(() => {
    loadActions();
  }, [selectedStatus, showList, investigationId]);

  // 개선조치 클릭 핸들러
  const handleActionClick = (action: CorrectiveAction) => {
    if (onActionClick) {
      onActionClick(action);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <div className="w-full bg-white shadow rounded-lg p-4 mb-8">
      {/* 헤더 및 통계 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-green-700">개선조치 진행현황</span>
          <select
            className="ml-2 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-green-400"
            value={selectedYear}
            onChange={e => onYearChange(Number(e.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">전체</span>
          <span className="text-2xl font-bold text-green-700">
            {loading ? '...' : `${stats.total ?? 0}건`}
          </span>
        </div>
      </div>

      {/* 상태별 통계 및 필터 버튼 */}
      <div className="flex flex-wrap gap-2 justify-between md:justify-start mt-2 mb-4">
        {statusMap.map(({ key, label, color }) => (
          <button
            key={key}
            type="button"
            className={`px-4 py-2 rounded font-semibold text-sm flex items-center gap-1 border transition-all
              ${color}
              ${selectedStatus === key ? 'border-2 border-primary-500 bg-white text-primary-700 shadow' : 'border-transparent'}
            `}
            onClick={() => {
              setSelectedStatus(key as CorrectiveActionStatus | 'all');
            }}
            style={{ minWidth: 70 }}
          >
            {label} <span className="font-bold">{loading ? '...' : stats[key as CorrectiveActionStatus] ?? 0}</span>건
          </button>
        ))}
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* 개선조치 목록 (showList가 true일 때만 표시) */}
      {showList && (
        <div className="mt-6">
          {/* 필터 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">상태별 필터:</span>
              <select
                className="px-3 py-1 border rounded text-sm focus:ring-2 focus:ring-green-400"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value as CorrectiveActionStatus | 'all')}
              >
                <option value="all">전체</option>
                {statusMap.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 목록 */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">개선조치를 불러오는 중...</p>
              </div>
            ) : actions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {selectedStatus === 'all' ? '등록된 개선조치가 없습니다.' : `${statusLabels[selectedStatus as CorrectiveActionStatus]} 상태의 개선조치가 없습니다.`}
              </div>
            ) : (
              actions.map(action => (
                <div
                  key={action.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    onActionClick ? 'hover:shadow-md' : ''
                  }`}
                  onClick={() => handleActionClick(action)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{action.title}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[action.status]}`}>
                          {statusLabels[action.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>담당자: {action.manager}</span>
                        <span>완료예정일: {formatDate(action.due_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrectiveActionsDashboard; 