// 조사보고서 스텝 정의 (MobileNavigation과 동일하게 유지)
export const getInvestigationSteps = () => [
  { id: 'basic', title: '조사기본정보', requiredFields: ['investigation_team_lead', 'investigation_start_time'] },
  { id: 'content', title: '사고내용', requiredFields: ['investigation_acci_time', 'investigation_acci_location'] },
  { id: 'damage', title: '피해정보', requiredFields: ['investigation_victim_count'] },
  { id: 'analysis', title: '원인분석', requiredFields: ['direct_cause', 'root_cause'] },
  { id: 'action', title: '대책정보', requiredFields: ['corrective_actions', 'action_schedule'] },
  { id: 'conclusion', title: '조사결론', requiredFields: ['investigation_conclusion'] }
];

// 각 스텝의 필수값이 모두 입력되었는지 검증
export function validateCurrentStep(currentStep: number, formData: any): boolean {
  const steps = getInvestigationSteps();
  const requiredFields = steps[currentStep]?.requiredFields || [];
  return requiredFields.every(field => {
    const value = formData[field];
    return value !== undefined && value !== null && value !== '';
  });
}

// 해당 스텝이 완료되었는지(모든 필수값 입력)
export function isStepCompleted(stepIndex: number, formData: any): boolean {
  const steps = getInvestigationSteps();
  const requiredFields = steps[stepIndex]?.requiredFields || [];
  return requiredFields.every(field => {
    const value = formData[field];
    return value !== undefined && value !== null && value !== '';
  });
} 