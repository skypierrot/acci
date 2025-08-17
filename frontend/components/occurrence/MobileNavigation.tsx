import React from 'react';
import { getSteps, validateCurrentStep, isStepCompleted } from '../../utils/occurrence.utils';
import { OccurrenceFormData } from '../../types/occurrence.types';
import { 
  UnifiedMobileStepNavigation, 
  UnifiedMobileStepButtons,
  UnifiedStep 
} from '../UnifiedMobileNavigation';
import { getUnifiedSteps } from '../../utils/occurrence.utils';

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

/**
 * 기존 호환성을 위한 래퍼 컴포넌트
 * 통일된 모바일 네비게이션을 사용하도록 수정
 */
export const MobileStepNavigation: React.FC<MobileNavigationProps> = ({
  formData,
  currentStep,
  isFieldRequired,
  goToStep
}) => {
  const unifiedSteps = getUnifiedSteps(formData.accident_type_level1);

  return (
    <UnifiedMobileStepNavigation
      steps={unifiedSteps}
      currentStep={currentStep}
      goToStep={goToStep}
      isStepCompleted={(stepIndex) => isStepCompleted(stepIndex, formData, isFieldRequired)}
    />
  );
};

/**
 * 기존 호환성을 위한 래퍼 컴포넌트
 * 통일된 모바일 버튼을 사용하도록 수정
 */
export const MobileStepButtons: React.FC<MobileNavigationProps> = ({
  formData,
  currentStep,
  isFieldRequired,
  goToNextStep,
  goToPrevStep,
  onSubmit,
  isSubmitting
}) => {
  const unifiedSteps = getUnifiedSteps(formData.accident_type_level1);

  return (
    <UnifiedMobileStepButtons
      currentStep={currentStep}
      totalSteps={unifiedSteps.length}
      onPrev={goToPrevStep}
      onNext={goToNextStep}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitText="제출"
    />
  );
};

// 기존 함수들을 새로운 유틸리티 함수로 대체
export { getUnifiedSteps as getSteps, isStepCompleted }; 