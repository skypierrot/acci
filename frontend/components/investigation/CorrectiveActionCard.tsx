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
  original_global_accident_no?: string;
  action_type?: string; // 대책유형 (기술적/교육적/관리적)
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

// 상태 한글 변환 및 색상 Tailwind 클래스 지정
const getStatusBadge = (status: string) => {
  let label = '대기';
  let badgeClass = 'bg-gray-200 text-gray-700';
  if (status === 'completed' || status === '완료') {
    label = '완료';
    badgeClass = 'bg-emerald-100 text-emerald-700';
  } else if (status === 'in_progress' || status === '진행' || status === '진행중') {
    label = '진행';
    badgeClass = 'bg-blue-100 text-blue-700';
  } else if (status === 'delayed' || status === '지연') {
    label = '지연';
    badgeClass = 'bg-red-100 text-red-700';
  } else if (status === 'pending' || status === '대기') {
    label = '대기';
    badgeClass = 'bg-gray-200 text-gray-700';
  }
  return { label, badgeClass };
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

// 지연 여부 확인 (완료된 경우 지연으로 처리하지 않음, 당일도 지연으로 처리하지 않음)
const isOverdue = (dueDate?: string, status?: string) => {
  // 완료된 경우 지연이 아님
  if (status === 'completed') return false;
  
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  
  // 시간을 제거하고 날짜만 비교
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  
  // 예정일이 오늘보다 과거인 경우만 지연으로 판정
  return dueDateOnly < todayDate;
};

export default function CorrectiveActionCard({ action }: CorrectiveActionCardProps) {
  const isDelayed = isOverdue(action.due_date, action.status);

  // 디버깅: 개선조치 데이터 확인 (React Strict Mode 중복 방지)
  if (process.env.NODE_ENV === 'development') {
    if (!window.__actionLogs) window.__actionLogs = new Set();
    const logKey = `action-${action.id}-${action.title}`;
    if (!window.__actionLogs.has(logKey)) {
      window.__actionLogs.add(logKey);
      console.log('[CorrectiveActionCard] action data:', {
        id: action.id,
        title: action.title,
        description: action.description,
        action_type: action.action_type,
        manager: action.manager,
        status: action.status
      });
      setTimeout(() => window.__actionLogs.delete(logKey), 1000);
    }
  }

  return (
    <div className={`rounded-lg shadow-md hover:shadow-lg transition-shadow border ${
      isDelayed 
        ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' // 지연 상태: 붉은색 그라데이션 배경
        : 'bg-white border-gray-200' // 일반 상태: 흰색 배경
    }`}>
      {/* 헤더 */}
      <div className={`p-4 border-b ${
        isDelayed ? 'border-red-200' : 'border-gray-200' // 지연 상태: 붉은색 테두리
      }`}>
        <div className="flex justify-between items-start mb-2">
          <Link 
            href={`/investigation/${action.investigation_id}`}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 hover:underline"
          >
            {(() => {
              // 전체사고코드와 대책유형을 조합한 표시 형식
              const globalAccidentNo = action.original_global_accident_no || action.investigation_global_accident_no;
              const actionType = action.action_type;
              
              if (globalAccidentNo && actionType) {
                // 대책유형 한글 변환
                const actionTypeLabel = actionType === 'technical' ? '기술적대책' : 
                                      actionType === 'educational' ? '교육적대책' : 
                                      actionType === 'managerial' ? '관리적대책' : 
                                      actionType;
                
                return `${globalAccidentNo}-${actionTypeLabel}`;
              } else if (globalAccidentNo) {
                return globalAccidentNo;
              } else {
                return `조사-${action.investigation_id}`;
              }
            })()}
          </Link>
          {/* 상태 뱃지: 지연이면 빨간색, 아니면 기존 상태 */}
          {isDelayed ? (
            // 지연 상태 뱃지 (빨간색)
            <span className="px-2 py-1 text-xs font-semibold rounded-full text-red-700 bg-red-100 border border-red-200">
              지연
            </span>
          ) : (
            // 기존 상태 뱃지
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(action.status).badgeClass}`}>
              {getStatusBadge(action.status).label}
            </span>
          )}
        </div>
        {action.investigation_accident_name && (
          <h3 className="text-sm text-gray-900 font-medium mb-2">
            {action.investigation_accident_name}
          </h3>
        )}
      </div>

      {/* 개선계획명 */}
      <div className={`p-4 border-b ${
        isDelayed ? 'border-red-100' : 'border-gray-100' // 지연 상태: 연한 붉은색 테두리
      }`}>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">개선계획명</h4>
        <p className="text-sm text-gray-800 font-medium leading-relaxed">
          {(() => {
            // title이 비어있거나 description과 동일한 경우 자동 생성
            if (!action.title || action.title === action.description) {
              const actionType = action.action_type;
              const actionTypeLabel = actionType === 'technical' ? '기술적대책' : 
                                    actionType === 'educational' ? '교육적대책' : 
                                    actionType === 'managerial' ? '관리적대책' : 
                                    '개선대책';
              
              // ID를 기반으로 번호 생성 (없으면 기본값)
              const actionNumber = action.id ? action.id % 100 : 1;
              return `${actionTypeLabel} ${actionNumber}`;
            }
            
            // title이 있고 description과 다른 경우 원본 title 사용
            return action.title;
          })()}
        </p>
      </div>

      {/* 개선계획 */}
      <div className={`p-4 border-b ${
        isDelayed ? 'border-red-100' : 'border-gray-100' // 지연 상태: 연한 붉은색 테두리
      }`}>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">개선계획</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {action.description}
        </p>
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
          className={`w-full mt-3 py-2 px-4 rounded-lg text-sm text-center transition-colors ${
            isDelayed 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' // 지연 상태: 붉은색 버튼
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200' // 일반 상태: 회색 버튼
          }`}
        >
          조사보고서 보기 →
        </Link>
      </div>
    </div>
  );
} 