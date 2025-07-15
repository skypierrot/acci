import React from 'react';

/**
 * @file ProgressBar.tsx
 * @description
 *  - 프로젝트 전반에서 재사용 가능한 공통 진행률 바 컴포넌트
 *  - 색상별 그라데이션/애니메이션/라벨 지원
 *  - 새로운 색상 팔레트 적용 (Slate/Emerald 계열)
 *  - tailwind 기반, 한글 주석 포함
 */

interface ProgressBarProps {
  percent: number;
  color?: 'primary' | 'secondary' | 'pending' | 'progress' | 'success' | 'error' | 'info' | 'neutral';
  showLabel?: boolean;
  className?: string;
}

// 새로운 색상 팔레트 기반 그라데이션 매핑
const COLOR_GRADIENT: Record<string, string> = {
  primary: 'from-primary-400 to-primary-500',
  secondary: 'from-secondary-400 to-secondary-500',
  pending: 'from-status-pending-400 to-status-pending-500',
  progress: 'from-status-progress-400 to-status-progress-500',
  success: 'from-status-success-400 to-status-success-500',
  error: 'from-status-error-400 to-status-error-500',
  info: 'from-status-info-400 to-status-info-500',
  neutral: 'from-neutral-400 to-neutral-500',
};

/**
 * 공통 ProgressBar 컴포넌트
 * @param percent - 진행률(0~100)
 * @param color - 색상 테마
 * @param showLabel - 진행률 라벨 표시 여부
 * @param className - 추가 클래스
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  color = 'primary',
  showLabel = false,
  className = '',
}) => {
  const gradient = COLOR_GRADIENT[color] || COLOR_GRADIENT.primary;
  const safePercent = Math.max(0, Math.min(percent, 100));
  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      {/* 진행률 바 */}
      <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
          style={{ width: `${safePercent}%` }}
        ></div>
      </div>
      {/* 라벨 */}
      {showLabel && (
        <div className="text-xs text-neutral-600 text-right">{safePercent}%</div>
      )}
    </div>
  );
};

export default ProgressBar; 