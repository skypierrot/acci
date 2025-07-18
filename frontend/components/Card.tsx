import React from 'react';

/**
 * @file Card.tsx
 * @description
 *  - 프로젝트 전반에서 재사용 가능한 공통 카드 컴포넌트
 *  - 상태별 색상/그림자/반응형/hover 지원 (단, 배경은 단색)
 *  - header, extra, children slot 지원
 *  - tailwind 기반, 한글 주석 포함
 */

// 단순화된 상태별 스타일 매핑
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  default: {
    bg: 'bg-white',
    border: 'border-neutral-200',
    text: 'text-neutral-900',
  },
  primary: {
    bg: 'bg-white',
    border: 'border-primary-200',
    text: 'text-primary-700',
  },
  secondary: {
    bg: 'bg-white',
    border: 'border-secondary-200',
    text: 'text-secondary-700',
  },
  pending: {
    bg: 'bg-neutral-50',
    border: 'border-status-pending-200',
    text: 'text-status-pending-700',
  },
  progress: {
    bg: 'bg-neutral-50',
    border: 'border-status-progress-200',
    text: 'text-status-progress-700',
  },
  success: {
    bg: 'bg-neutral-50',
    border: 'border-status-success-200',
    text: 'text-status-success-700',
  },
  error: {
    bg: 'bg-neutral-50',
    border: 'border-status-error-200',
    text: 'text-status-error-700',
  },
  info: {
    bg: 'bg-neutral-50',
    border: 'border-status-info-200',
    text: 'text-status-info-700',
  },
  neutral: {
    bg: 'bg-neutral-50',
    border: 'border-neutral-200',
    text: 'text-neutral-600',
  },
};

interface CardProps {
  status?: keyof typeof STATUS_COLORS;
  className?: string;
  header?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  hoverable?: boolean;
}

/**
 * 공통 Card 컴포넌트
 * @param status - 색상 테마 (primary, secondary, pending, progress, success, error, info, neutral, default)
 * @param className - 추가 클래스
 * @param header - 상단 헤더 영역
 * @param extra - 우측 상단 extra 영역
 * @param children - 본문
 * @param hoverable - hover 효과 여부
 */
const Card: React.FC<CardProps> = ({
  status = 'default',
  className = '',
  header,
  extra,
  children,
  hoverable = true,
}) => {
  const color = STATUS_COLORS[status] || STATUS_COLORS.default;
  return (
    <div
      className={`relative ${color.bg} border ${color.border} rounded-lg shadow-md transition-all duration-200 ${hoverable ? 'hover:shadow-lg hover:brightness-105' : ''} ${className}`}
    >
      {/* 헤더/엑스트라 영역 */}
      {(header || extra) && (
        <div className="flex justify-between items-center px-4 pt-3 pb-1">
          <div className={`font-semibold text-base ${color.text}`}>{header}</div>
          <div>{extra}</div>
        </div>
      )}
      {/* 본문 */}
      <div className={`px-4 pb-4 pt-2`}>{children}</div>
    </div>
  );
};

export default Card; 