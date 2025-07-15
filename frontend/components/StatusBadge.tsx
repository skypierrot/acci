import React from 'react';

/**
 * @file StatusBadge.tsx
 * @description
 *  - 프로젝트 전반에서 재사용 가능한 공통 상태 배지 컴포넌트
 *  - 상태별 색상/크기/아이콘 지원
 *  - 새로운 색상 팔레트 적용 (Slate/Emerald 계열)
 *  - tailwind 기반, 한글 주석 포함
 */

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

// 새로운 색상 팔레트 기반 상태별 스타일
const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  '대기': { bg: 'bg-status-pending-100', text: 'text-status-pending-700', border: 'border-status-pending-300' },
  '미착수': { bg: 'bg-status-pending-100', text: 'text-status-pending-700', border: 'border-status-pending-300' },
  '진행': { bg: 'bg-status-progress-100', text: 'text-status-progress-700', border: 'border-status-progress-300' },
  '조사착수': { bg: 'bg-status-progress-100', text: 'text-status-progress-700', border: 'border-status-progress-300' },
  '조사진행': { bg: 'bg-status-info-100', text: 'text-status-info-700', border: 'border-status-info-300' },
  '대책이행중': { bg: 'bg-primary-100', text: 'text-primary-700', border: 'border-primary-300' },
  '지연': { bg: 'bg-status-error-100', text: 'text-status-error-700', border: 'border-status-error-300' },
  '완료': { bg: 'bg-status-success-100', text: 'text-status-success-700', border: 'border-status-success-300' },
  '기타': { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-300' },
};

const SIZE_STYLE = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

/**
 * 공통 StatusBadge 컴포넌트
 * @param status - 상태명(한글)
 * @param size - 크기(sm, md, lg)
 * @param icon - 상태별 아이콘
 * @param className - 추가 클래스
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  icon,
  className = '',
}) => {
  const style = STATUS_STYLE[status] || STATUS_STYLE['기타'];
  const sizeClass = SIZE_STYLE[size] || SIZE_STYLE.md;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${style.bg} ${style.text} ${style.border} ${sizeClass} ${className}`}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {status}
    </span>
  );
};

export default StatusBadge; 