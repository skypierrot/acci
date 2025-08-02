import React from 'react';

// 통일된 스텝 인터페이스
export interface UnifiedStep {
  id: string;
  title: string;
  description: string;
}

// 통일된 네비게이션 Props
export interface UnifiedMobileNavigationProps {
  steps: UnifiedStep[];
  currentStep: number;
  goToStep: (stepIndex: number) => void;
  showStepDescription?: boolean;
  showProgressBar?: boolean;
  showStepDots?: boolean;
  isStepCompleted?: (stepIndex: number) => boolean;
  className?: string;
}

// 통일된 하단 버튼 Props
export interface UnifiedMobileButtonProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  editMode?: boolean;
  showButtons?: boolean;
  submitText?: string;
  nextText?: string;
  prevText?: string;
  className?: string;
}

/**
 * 통일된 모바일 스텝 네비게이션 컴포넌트
 * 사고 발생보고서와 조사보고서에서 공통으로 사용
 */
export const UnifiedMobileStepNavigation: React.FC<UnifiedMobileNavigationProps> = ({
  steps,
  currentStep,
  goToStep,
  showStepDescription = true,
  showProgressBar = true,
  showStepDots = true,
  isStepCompleted,
  className = ""
}) => {
  return (
    <div className={`bg-white border-b border-gray-200 p-4 mb-4 ${className}`}>
      {/* 제목과 진행률 */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium truncate flex-1 mr-2">
          {steps[currentStep]?.title || '단계'}
        </h3>
        <span className="text-sm text-gray-500 flex-shrink-0">
          {currentStep + 1} / {steps.length}
        </span>
      </div>
      
      {/* 설명 텍스트 */}
      {showStepDescription && (
        <p className="text-sm text-gray-600 mb-3 break-words">
          {steps[currentStep]?.description || ''}
        </p>
      )}
      
      {/* 진행 바 */}
      {showProgressBar && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            className="bg-primary-700 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      )}
      
      {/* 스텝 점들 */}
      {showStepDots && (
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const isCompleted = isStepCompleted ? isStepCompleted(index) : false;
            
            return (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                  index === currentStep
                    ? 'bg-primary-700 text-white'
                    : index < currentStep
                    ? 'bg-green-500 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
                title={`${step.title}: ${step.description}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * 통일된 모바일 하단 버튼 컴포넌트
 * 사고 발생보고서와 조사보고서에서 공통으로 사용
 */
export const UnifiedMobileStepButtons: React.FC<UnifiedMobileButtonProps> = ({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onSubmit,
  isSubmitting = false,
  editMode = false,
  showButtons = true,
  submitText = "제출",
  nextText = "다음",
  prevText = "이전",
  className = ""
}) => {
  // 편집 모드가 아니면 버튼 숨김 (조사보고서 방식 채택)
  if (!showButtons) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 ${className}`}>
      <div className="flex justify-between space-x-3 max-w-md mx-auto">
        {/* 이전 버튼 */}
        <button
          type="button"
          onClick={onPrev}
          disabled={currentStep === 0}
          className={`flex-1 px-4 py-3 rounded-md text-base font-medium transition-colors min-w-0 ${
            currentStep === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {prevText}
        </button>

        {/* 다음/제출/저장 버튼 */}
        {currentStep === totalSteps - 1 ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className={`flex-1 px-4 py-3 rounded-md text-base font-medium transition-colors min-w-0 ${
              isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-700 text-white hover:bg-primary-800'
            }`}
          >
            {isSubmitting ? '처리 중...' : (editMode ? '저장' : submitText)}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="flex-1 px-4 py-3 rounded-md text-base font-medium bg-primary-700 text-white hover:bg-primary-800 transition-colors min-w-0"
          >
            {nextText}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * 스텝 미니맵 컴포넌트 (선택적 기능)
 * 전체 맥락 파악을 위한 사이드 미니맵
 */
export const StepMinimap: React.FC<{
  steps: UnifiedStep[];
  currentStep: number;
  goToStep: (stepIndex: number) => void;
  isVisible?: boolean;
}> = ({ steps, currentStep, goToStep, isVisible = false }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 bg-white border border-gray-200 rounded-lg p-2 shadow-lg z-40">
      <div className="text-xs font-medium text-gray-600 mb-2">전체 보기</div>
      <div className="space-y-1">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(index)}
            className={`block w-full text-left px-2 py-1 rounded text-xs ${
              index === currentStep
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {index + 1}. {step.title}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * 빠른 스텝 이동 드롭다운 컴포넌트
 * 원하는 스텝으로 즉시 이동 가능
 */
export const QuickStepNavigation: React.FC<{
  steps: UnifiedStep[];
  currentStep: number;
  goToStep: (stepIndex: number) => void;
  className?: string;
}> = ({ steps, currentStep, goToStep, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <select
        value={currentStep}
        onChange={(e) => goToStep(Number(e.target.value))}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {steps.map((step, index) => (
          <option key={step.id} value={index}>
            {index + 1}. {step.title}
          </option>
        ))}
      </select>
    </div>
  );
}; 