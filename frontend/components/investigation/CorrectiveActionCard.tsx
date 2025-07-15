import React from 'react';
import Link from 'next/link';

/**
 * @file CorrectiveActionCard.tsx
 * @description 개선조치 아이템을 표시하는 카드 컴포넌트
 * - 개선조치의 상세 정보를 표시
 * - 진행 상태에 따른 색상 구분
 * - 담당자, 예정일, 진행률 등 표시
 */

interface CorrectiveAction {
  id?: number;
  investigation_id: string; // 문자열로 변경
  title: string;
  description: string;
  manager: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at?: string;
  updated_at?: string;
  // 조사보고서 정보 (필터링 시 추가됨)
  investigation_accident_name?: string;
  investigation_global_accident_no?: string;
}

interface CorrectiveActionCardProps {
  action: CorrectiveAction;
}

// 상태별 색상 정의
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    case 'in_progress':
      return 'text-slate-700 bg-slate-100 border-slate-200';
    case 'pending':
      return 'text-gray-700 bg-gray-100 border-gray-200';
    default:
      return 'text-gray-700 bg-gray-100 border-gray-200';
  }
};

// 상태 한글 변환
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return '완료';
    case 'in_progress':
      return '진행중';
    case 'pending':
      return '대기';
    default:
      return '대기';
  }
};

// 날짜 포맷팅
const formatDate = (dateString?: string) => {
  if (!dateString) return '미정';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (e) {
    return 'Invalid Date';
  }
};

// 지연 여부 확인
const isOverdue = (dueDate?: string) => {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  return due < today;
};

export default function CorrectiveActionCard({ action }: CorrectiveActionCardProps) {
  const isDelayed = isOverdue(action.due_date);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <Link 
            href={`/investigation/${action.investigation_id}`}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 hover:underline"
          >
            {action.investigation_global_accident_no || `조사-${action.investigation_id}`}
          </Link>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(action.status)}`}>
            {getStatusLabel(action.status)}
          </span>
        </div>
        {action.investigation_accident_name && (
          <h3 className="text-sm text-gray-900 font-medium mb-2">
            {action.investigation_accident_name}
          </h3>
        )}
      </div>

      {/* 개선계획 */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">개선계획</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {action.title || action.description}
        </p>
        {action.description && action.title !== action.description && (
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {action.description}
          </p>
        )}
      </div>

      {/* 담당자 및 예정일 */}
      <div className="p-4">
        {action.manager && (
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">담당자</h4>
            <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded">
              {action.manager}
            </span>
          </div>
        )}

        {action.due_date && (
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">완료 예정일</h4>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDelayed ? 'text-red-600' : 'text-gray-600'}`}>
                {formatDate(action.due_date)}
              </span>
              {isDelayed && (
                <span className="text-red-600 text-xs">⚠️ 지연</span>
              )}
            </div>
          </div>
        )}

        {/* 상세보기 버튼 */}
        <Link 
          href={`/investigation/${action.investigation_id}`}
          className="w-full mt-3 bg-slate-100 text-slate-700 py-2 px-4 rounded-lg text-sm text-center hover:bg-slate-200 transition-colors"
        >
          조사보고서 보기 →
        </Link>
      </div>
    </div>
  );
} 