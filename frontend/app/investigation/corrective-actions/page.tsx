'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CorrectiveActionsDashboard from '../../../components/investigation/CorrectiveActionsDashboard';
import { correctiveActionService, CorrectiveAction, CorrectiveActionStatus } from '../../../services/corrective_action.service';

/**
 * @file page.tsx
 * @description 개선조치 목록 페이지
 * - 전체 개선조치 목록 표시
 * - 상태별, 담당자별, 연도별 필터링
 * - 개선조치 상세 정보 표시
 * - 개선조치 테이블 기반 데이터 연동
 */

export default function CorrectiveActionsPage() {
  const router = useRouter();
  
  // 상태 관리
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState<CorrectiveActionStatus | 'all'>('all');
  const [selectedManager, setSelectedManager] = useState<string>('all');
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [managers, setManagers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showList, setShowList] = useState(true);

  // 연도 목록 생성 (2020년부터 현재까지)
  const years = Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => 2020 + i).reverse();

  // 담당자 목록 로드
  const loadManagers = async () => {
    try {
      const managerStats = await correctiveActionService.getManagerStats();
      const managerList = managerStats.map(stat => stat.manager);
      setManagers(managerList);
    } catch (err) {
      console.error('담당자 목록 로드 중 오류:', err);
    }
  };

  // 개선조치 목록 로드
  const loadActions = async () => {
    try {
      setLoading(true);
      setError(null);
      let actionsData: CorrectiveAction[] = [];

      if (selectedStatus === 'all' && selectedManager === 'all') {
        // 전체 조회 (백엔드 API 구현 필요)
        // 임시로 빈 배열 반환
        actionsData = [];
      } else if (selectedStatus !== 'all' && selectedManager === 'all') {
        // 상태별 필터링
        actionsData = await correctiveActionService.getCorrectiveActionsByStatus(selectedStatus);
      } else if (selectedStatus === 'all' && selectedManager !== 'all') {
        // 담당자별 필터링
        actionsData = await correctiveActionService.getCorrectiveActionsByManager(selectedManager);
      } else {
        // 상태 + 담당자 필터링 (백엔드 API 구현 필요)
        // 임시로 빈 배열 반환
        actionsData = [];
      }

      setActions(actionsData);
    } catch (err) {
      console.error('개선조치 목록 로드 중 오류:', err);
      setError('개선조치 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadManagers();
  }, []);

  // 필터 변경 시 목록 재로드
  useEffect(() => {
    loadActions();
  }, [selectedStatus, selectedManager, selectedYear]);

  // 개선조치 클릭 핸들러
  const handleActionClick = (action: CorrectiveAction) => {
    // 개선조치 상세 페이지로 이동 (구현 예정)
    console.log('개선조치 클릭:', action);
  };

  // 연도 변경 핸들러
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">개선조치 관리</h1>
          <p className="text-gray-600">사고조사보고서의 개선조치 진행현황을 관리합니다.</p>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">필터</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 연도 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">연도</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>

            {/* 상태 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value as CorrectiveActionStatus | 'all')}
              >
                <option value="all">전체</option>
                <option value="pending">대기</option>
                <option value="in_progress">진행</option>
                <option value="delayed">지연</option>
                <option value="completed">완료</option>
              </select>
            </div>

            {/* 담당자 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400"
                value={selectedManager}
                onChange={e => setSelectedManager(e.target.value)}
              >
                <option value="all">전체</option>
                {managers.map(manager => (
                  <option key={manager} value={manager}>{manager}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 대시보드 */}
        <CorrectiveActionsDashboard
          years={years}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
          showList={showList}
          onActionClick={handleActionClick}
        />

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* 개선조치 목록 */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">개선조치 목록</h2>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-400"
                onClick={() => setShowList(!showList)}
              >
                {showList ? '목록 숨기기' : '목록 보기'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">개선조치를 불러오는 중...</p>
            </div>
          ) : actions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {selectedStatus === 'all' && selectedManager === 'all' 
                ? '등록된 개선조치가 없습니다.' 
                : '선택한 조건에 맞는 개선조치가 없습니다.'}
            </div>
          ) : (
            <div className="space-y-4">
              {actions.map(action => (
                <div
                  key={action.id}
                  className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleActionClick(action)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          action.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                          action.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          action.status === 'delayed' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {action.status === 'pending' ? '대기' :
                           action.status === 'in_progress' ? '진행' :
                           action.status === 'delayed' ? '지연' : '완료'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{action.description}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span>담당자: {action.manager}</span>
                        <span>완료예정일: {formatDate(action.due_date)}</span>
                        {action.created_at && (
                          <span>등록일: {formatDate(action.created_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 