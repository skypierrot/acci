import React from 'react';
import { getSteps, validateCurrentStep, isStepCompleted } from '../../utils/occurrence.utils';
import { OccurrenceFormData } from '../../types/occurrence.types';

interface MobileNavigationProps {
  formData: OccurrenceFormData;
  currentStep: number;
  isFieldRequired: (fieldName: string) => boolean;
  goToStep: (stepIndex: number) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const MobileStepNavigation: React.FC<MobileNavigationProps> = ({
  formData,
  currentStep,
  isFieldRequired,
  goToStep
}) => {
  const steps = getSteps(formData.accident_type_level1);

  return (
    <div className="bg-white border-b border-gray-200 p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">
          {steps[currentStep]?.title || '단계'}
        </h3>
        <span className="text-sm text-gray-500">
          {currentStep + 1} / {steps.length}
        </span>
      </div>
      
      {/* 진행 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-700 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      
      {/* 스텝 점들 */}
      <div className="flex justify-between mt-3">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(index)}
            className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
              index === currentStep
                ? 'bg-primary-700 text-white'
                : index < currentStep
                ? 'bg-green-500 text-white'
                : isStepCompleted(index, formData, isFieldRequired)
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export const MobileStepButtons: React.FC<MobileNavigationProps> = ({
  formData,
  currentStep,
  isFieldRequired,
  goToNextStep,
  goToPrevStep,
  onSubmit,
  isSubmitting
}) => {
  const steps = getSteps(formData.accident_type_level1);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="flex justify-between space-x-3">
        {/* 이전 버튼 */}
        <button
          type="button"
          onClick={goToPrevStep}
          disabled={currentStep === 0}
          className={`flex-1 px-4 py-3 rounded-md text-base font-medium ${
            currentStep === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          이전
        </button>

        {/* 다음/제출 버튼 */}
        {currentStep === steps.length - 1 ? (
          <button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting || !validateCurrentStep(currentStep, formData, isFieldRequired)}
            className={`flex-1 px-4 py-3 rounded-md text-base font-medium ${
              isSubmitting || !validateCurrentStep(currentStep, formData, isFieldRequired)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-700 text-white hover:bg-primary-800'
            }`}
          >
            {isSubmitting ? '제출 중...' : '제출'}
          </button>
        ) : (
          <button
            type="button"
            onClick={goToNextStep}
            disabled={!validateCurrentStep(currentStep, formData, isFieldRequired)}
            className={`flex-1 px-4 py-3 rounded-md text-base font-medium ${
              !validateCurrentStep(currentStep, formData, isFieldRequired)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-700 text-white hover:bg-primary-800'
            }`}
          >
            다음
          </button>
        )}
      </div>
    </div>
  );
};

// MobileStepNavigation과 MobileStepButtons를 개별적으로 export 