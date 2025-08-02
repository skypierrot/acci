import React from 'react';
import { InvestigationReport } from '../../types/investigation.types';
import { 
  getFilteredInvestigationSteps, 
  InvestigationStep,
  isValidStep 
} from '../../utils/investigation.utils';
import { 
  UnifiedMobileStepNavigation, 
  UnifiedMobileStepButtons,
  UnifiedStep 
} from '../UnifiedMobileNavigation';

interface InvestigationMobileNavigationProps {
  report: InvestigationReport;
  editMode: boolean;
  currentStep: number;
  goToStep: (stepIndex: number) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  onSave: () => void;
  saving: boolean;
  editForm?: Partial<InvestigationReport>; // 편집 폼 상태 추가
}

// 현재 스텝이 완료되었는지 확인하는 함수
const isStepCompleted = (stepIndex: number, report: InvestigationReport, filteredSteps: InvestigationStep[]) => {
  const step = filteredSteps[stepIndex];
  
  if (!step) return false;
  
  switch (step.id) {
    case 'basic':
      return !!(report.investigation_start_time && report.investigation_team_lead);
    case 'content':
      return !!(report.investigation_acci_summary && report.investigation_acci_detail);
    case 'victims':
      return !!(report.investigation_victims && report.investigation_victims.length > 0);
    case 'damage':
      return !!(report.investigation_property_damage && report.investigation_property_damage.length > 0);
    case 'analysis':
      return !!(report.cause_analysis);
    case 'action':
      return !!(report.prevention_actions);
    case 'conclusion':
      return !!(report.investigation_conclusion);
    case 'attachments':
      return !!(report.attachments && report.attachments.length > 0);
    default:
      return false;
  }
};

/**
 * 기존 호환성을 위한 래퍼 컴포넌트
 * 통일된 모바일 네비게이션을 사용하도록 수정
 */
export const InvestigationMobileStepNavigation: React.FC<InvestigationMobileNavigationProps> = ({
  report,
  editMode,
  currentStep,
  goToStep,
  editForm
}) => {
  // 편집 모드일 때는 editForm의 사고형태를 우선 사용, 아니면 report의 사고형태 사용
  const accidentType = editMode 
    ? (editForm?.investigation_accident_type_level1 || report.investigation_accident_type_level1 || report.original_accident_type_level1)
    : (report.investigation_accident_type_level1 || report.original_accident_type_level1);
  
  const filteredSteps = getFilteredInvestigationSteps(accidentType);

  // 통일된 스텝 형식으로 변환
  const unifiedSteps: UnifiedStep[] = filteredSteps.map(step => ({
    id: step.id,
    title: step.title,
    description: step.description
  }));

  return (
    <UnifiedMobileStepNavigation
      steps={unifiedSteps}
      currentStep={currentStep}
      goToStep={goToStep}
      isStepCompleted={(stepIndex) => isStepCompleted(stepIndex, report, filteredSteps)}
    />
  );
};

/**
 * 기존 호환성을 위한 래퍼 컴포넌트
 * 통일된 모바일 버튼을 사용하도록 수정
 */
export const InvestigationMobileStepButtons: React.FC<InvestigationMobileNavigationProps> = ({
  report,
  currentStep,
  goToNextStep,
  goToPrevStep,
  onSave,
  saving,
  editMode,
  editForm
}) => {
  // 편집 모드일 때는 editForm의 사고형태를 우선 사용, 아니면 report의 사고형태 사용
  const accidentType = editMode 
    ? (editForm?.investigation_accident_type_level1 || report.investigation_accident_type_level1 || report.original_accident_type_level1)
    : (report.investigation_accident_type_level1 || report.original_accident_type_level1);
  
  const filteredSteps = getFilteredInvestigationSteps(accidentType);

  // 편집 모드가 아니면 버튼 숨김 (읽기 전용에서는 네비게이션만 표시)
  if (!editMode) return null;

  return (
    <UnifiedMobileStepButtons
      currentStep={currentStep}
      totalSteps={filteredSteps.length}
      onPrev={goToPrevStep}
      onNext={goToNextStep}
      onSubmit={onSave}
      isSubmitting={saving}
      editMode={editMode}
      submitText="저장"
    />
  );
};

// 기존 함수들을 새로운 유틸리티 함수로 대체
export { getFilteredInvestigationSteps as getInvestigationSteps, isStepCompleted }; 