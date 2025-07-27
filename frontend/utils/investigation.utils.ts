import { CauseAnalysis, PreventionActions, ActionItem } from '../types/investigation.types';

// 조사보고서 스텝 정의 (MobileNavigation과 동일하게 유지)
export const getInvestigationSteps = () => [
  { id: 'basic', title: '조사기본정보', requiredFields: ['investigation_team_lead', 'investigation_start_time'] },
  { id: 'content', title: '사고내용', requiredFields: ['investigation_acci_time', 'investigation_acci_location'] },
  { id: 'damage', title: '피해정보', requiredFields: ['investigation_victim_count'] },
  { id: 'analysis', title: '원인분석', requiredFields: ['direct_cause', 'root_cause'] },
  { id: 'action', title: '대책정보', requiredFields: ['corrective_actions', 'action_schedule'] },
  { id: 'conclusion', title: '조사결론', requiredFields: ['investigation_conclusion'] }
];

/**
 * 기존 텍스트 형태의 원인 분석을 새로운 분류 형태로 변환
 * @param directCause 기존 직접원인 텍스트
 * @param rootCause 기존 근본원인 텍스트
 * @returns CauseAnalysis 형태의 분류된 원인 분석
 */
export const convertLegacyCauseAnalysis = (directCause?: string, rootCause?: string): CauseAnalysis => {
  return {
    direct_cause: {
      unsafe_condition: directCause ? [directCause] : [],
      unsafe_act: []
    },
    root_cause: {
      human_factor: rootCause ? [rootCause] : [],
      system_factor: []
    }
  };
};

/**
 * 새로운 분류 형태의 원인 분석을 기존 텍스트 형태로 변환 (백엔드 호환성)
 * @param causeAnalysis 분류된 원인 분석
 * @returns 기존 텍스트 형태의 직접원인과 근본원인
 */
export const convertCauseAnalysisToLegacy = (causeAnalysis: CauseAnalysis): { directCause: string; rootCause: string } => {
  // 직접원인: 불안전한 상태와 불안전한 행동을 합쳐서 반환
  const directCauseItems = [
    ...causeAnalysis.direct_cause.unsafe_condition.filter(item => item.trim()),
    ...causeAnalysis.direct_cause.unsafe_act.filter(item => item.trim())
  ];
  
  // 근본원인: 인적요인과 시스템적 요인을 합쳐서 반환
  const rootCauseItems = [
    ...causeAnalysis.root_cause.human_factor.filter(item => item.trim()),
    ...causeAnalysis.root_cause.system_factor.filter(item => item.trim())
  ];
  
  return {
    directCause: directCauseItems.join('\n\n'),
    rootCause: rootCauseItems.join('\n\n')
  };
};

/**
 * 원인 분석 데이터가 비어있는지 확인
 * @param causeAnalysis 원인 분석 데이터
 * @returns 비어있으면 true, 아니면 false
 */
export const isCauseAnalysisEmpty = (causeAnalysis: CauseAnalysis): boolean => {
  const hasDirectCause = causeAnalysis.direct_cause.unsafe_condition.some(item => item.trim()) ||
                        causeAnalysis.direct_cause.unsafe_act.some(item => item.trim());
  
  const hasRootCause = causeAnalysis.root_cause.human_factor.some(item => item.trim()) ||
                      causeAnalysis.root_cause.system_factor.some(item => item.trim());
  
  return !hasDirectCause && !hasRootCause;
};

/**
 * 원인 분석 데이터 유효성 검사
 * @param causeAnalysis 원인 분석 데이터
 * @returns 유효성 검사 결과와 에러 메시지
 */
export const validateCauseAnalysis = (causeAnalysis: CauseAnalysis): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // 직접원인 검사
  const hasUnsafeCondition = causeAnalysis.direct_cause.unsafe_condition.some(item => item.trim());
  const hasUnsafeAct = causeAnalysis.direct_cause.unsafe_act.some(item => item.trim());
  
  if (!hasUnsafeCondition && !hasUnsafeAct) {
    errors.push('직접원인은 불안전한 상태 또는 불안전한 행동 중 최소 하나는 입력해야 합니다.');
  }
  
  // 근본원인 검사
  const hasHumanFactor = causeAnalysis.root_cause.human_factor.some(item => item.trim());
  const hasSystemFactor = causeAnalysis.root_cause.system_factor.some(item => item.trim());
  
  if (!hasHumanFactor && !hasSystemFactor) {
    errors.push('근본원인은 인적요인 또는 업무/시스템적 요인 중 최소 하나는 입력해야 합니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 원인 분석 데이터를 요약 형태로 변환
 * @param causeAnalysis 원인 분석 데이터
 * @returns 요약된 원인 분석 텍스트
 */
export const summarizeCauseAnalysis = (causeAnalysis: CauseAnalysis): string => {
  const summary: string[] = [];
  
  // 직접원인 요약
  if (causeAnalysis.direct_cause.unsafe_condition.length > 0) {
    const conditions = causeAnalysis.direct_cause.unsafe_condition.filter(item => item.trim());
    if (conditions.length > 0) {
      summary.push(`[불안전한 상태] ${conditions.join(', ')}`);
    }
  }
  
  if (causeAnalysis.direct_cause.unsafe_act.length > 0) {
    const acts = causeAnalysis.direct_cause.unsafe_act.filter(item => item.trim());
    if (acts.length > 0) {
      summary.push(`[불안전한 행동] ${acts.join(', ')}`);
    }
  }
  
  // 근본원인 요약
  if (causeAnalysis.root_cause.human_factor.length > 0) {
    const humanFactors = causeAnalysis.root_cause.human_factor.filter(item => item.trim());
    if (humanFactors.length > 0) {
      summary.push(`[인적요인] ${humanFactors.join(', ')}`);
    }
  }
  
  if (causeAnalysis.root_cause.system_factor.length > 0) {
    const systemFactors = causeAnalysis.root_cause.system_factor.filter(item => item.trim());
    if (systemFactors.length > 0) {
      summary.push(`[시스템적 요인] ${systemFactors.join(', ')}`);
    }
  }
  
  return summary.join('\n');
};

/**
 * 기존 텍스트 형태의 대책을 새로운 분류 형태로 변환
 * @param correctiveActions 기존 개선 대책 텍스트
 * @param actionSchedule 기존 완료 일정
 * @param actionVerifier 기존 확인자
 * @returns PreventionActions 형태의 분류된 대책
 */
export const convertLegacyPreventionActions = (
  correctiveActions?: string, 
  actionSchedule?: string, 
  actionVerifier?: string
): PreventionActions => {
  return {
    technical_actions: [],
    educational_actions: [],
    managerial_actions: correctiveActions ? [{
      id: `legacy_${Date.now()}`,
      title: '재발방지대책', // 필수 필드 추가
      action_type: 'managerial',
      improvement_plan: correctiveActions,
      progress_status: 'pending',
      scheduled_date: actionSchedule || '',
      responsible_person: actionVerifier || '',
      completion_date: undefined
    }] : []
  };
};

/**
 * 새로운 분류 형태의 대책을 기존 텍스트 형태로 변환 (백엔드 호환성)
 * @param preventionActions 분류된 대책
 * @returns 기존 텍스트 형태의 대책 정보
 */
export const convertPreventionActionsToLegacy = (preventionActions: PreventionActions): { 
  correctiveActions: string; 
  actionSchedule: string; 
  actionVerifier: string; 
} => {
  // 모든 대책을 합쳐서 반환
  const allActions = [
    ...preventionActions.technical_actions,
    ...preventionActions.educational_actions,
    ...preventionActions.managerial_actions
  ];
  
  const actionTexts = allActions
    .filter(action => action.improvement_plan.trim())
    .map(action => {
      const typeLabel = action.action_type === 'technical' ? '[기술적]' :
                       action.action_type === 'educational' ? '[교육적]' :
                       '[관리적]';
      const statusLabel = action.progress_status === 'completed' ? '[완료]' :
                         action.progress_status === 'in_progress' ? '[진행중]' :
                         '[대기]';
      
      return `${typeLabel} ${action.improvement_plan} ${statusLabel}`;
    });
  
  // 가장 빠른 예정일과 담당자들 수집
  const scheduledDates = allActions
    .filter(action => action.scheduled_date)
    .map(action => action.scheduled_date)
    .sort();
  
  const responsiblePersons = allActions
    .filter(action => action.responsible_person.trim())
    .map(action => action.responsible_person)
    .filter((person, index, arr) => arr.indexOf(person) === index); // 중복 제거
  
  return {
    correctiveActions: actionTexts.join('\n\n'),
    actionSchedule: scheduledDates.length > 0 ? scheduledDates[0] : '',
    actionVerifier: responsiblePersons.join(', ')
  };
};

/**
 * 대책 데이터가 비어있는지 확인
 * @param preventionActions 대책 데이터
 * @returns 비어있으면 true, 아니면 false
 */
export const isPreventionActionsEmpty = (preventionActions: PreventionActions): boolean => {
  const hasTechnical = preventionActions.technical_actions.some(action => action.improvement_plan.trim());
  const hasEducational = preventionActions.educational_actions.some(action => action.improvement_plan.trim());
  const hasManagerial = preventionActions.managerial_actions.some(action => action.improvement_plan.trim());
  
  return !hasTechnical && !hasEducational && !hasManagerial;
};

/**
 * 대책 데이터 유효성 검사
 * @param preventionActions 대책 데이터
 * @returns 유효성 검사 결과와 에러 메시지
 */
export const validatePreventionActions = (preventionActions: PreventionActions): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // 모든 대책 항목 수집
  const allActions = [
    ...preventionActions.technical_actions,
    ...preventionActions.educational_actions,
    ...preventionActions.managerial_actions
  ];
  
  // 최소 하나의 대책이 있는지 확인
  const hasAnyAction = allActions.some(action => action.improvement_plan.trim());
  if (!hasAnyAction) {
    errors.push('최소 하나의 재발방지대책을 입력해야 합니다.');
  }
  
  // 각 대책 항목별 유효성 검사
  allActions.forEach((action, index) => {
    if (!action.improvement_plan.trim()) {
      return; // 빈 대책은 건너뛰기
    }
    
    const actionLabel = `${index + 1}번째 대책`;
    
    // 담당자 필수 확인
    if (!action.responsible_person.trim()) {
      errors.push(`${actionLabel}: 담당자를 입력해야 합니다.`);
    }
    
    // 완료 예정일 필수 확인
    if (!action.scheduled_date) {
      errors.push(`${actionLabel}: 완료 예정일을 입력해야 합니다.`);
    }
    
    // 완료 상태일 때 완료일 필수 확인
    if (action.progress_status === 'completed' && !action.completion_date) {
      errors.push(`${actionLabel}: 완료 상태일 때 완료일을 반드시 입력해야 합니다.`);
    }
    
    // 완료일이 완료 예정일보다 이전인지 확인
    if (action.completion_date && action.scheduled_date) {
      const completionDate = new Date(action.completion_date);
      const scheduledDate = new Date(action.scheduled_date);
      
      if (completionDate < scheduledDate) {
        // 경고만 표시 (오류는 아님)
        console.warn(`${actionLabel}: 완료일이 완료 예정일보다 이릅니다.`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 대책 데이터를 요약 형태로 변환
 * @param preventionActions 대책 데이터
 * @returns 요약된 대책 텍스트
 */
export const summarizePreventionActions = (preventionActions: PreventionActions): string => {
  const summary: string[] = [];
  
  // 기술적 대책 요약
  if (preventionActions.technical_actions.length > 0) {
    const technicalActions = preventionActions.technical_actions
      .filter(action => action.improvement_plan.trim())
      .map(action => action.improvement_plan);
    if (technicalActions.length > 0) {
      summary.push(`[기술적 대책] ${technicalActions.join(', ')}`);
    }
  }
  
  // 교육적 대책 요약
  if (preventionActions.educational_actions.length > 0) {
    const educationalActions = preventionActions.educational_actions
      .filter(action => action.improvement_plan.trim())
      .map(action => action.improvement_plan);
    if (educationalActions.length > 0) {
      summary.push(`[교육적 대책] ${educationalActions.join(', ')}`);
    }
  }
  
  // 관리적 대책 요약
  if (preventionActions.managerial_actions.length > 0) {
    const managerialActions = preventionActions.managerial_actions
      .filter(action => action.improvement_plan.trim())
      .map(action => action.improvement_plan);
    if (managerialActions.length > 0) {
      summary.push(`[관리적 대책] ${managerialActions.join(', ')}`);
    }
  }
  
  return summary.join('\n');
};

/**
 * 대책 진행 상황 통계 (완료: 100%, 진행: 50%, 대기: 0%)
 * @param preventionActions 대책 데이터
 * @returns 진행 상황 통계
 *
 * - 완료(completed/완료): 100%로 산정
 * - 진행(in_progress/진행중): 50%로 산정 (지연 여부와 무관)
 * - 대기(pending/대기): 0%로 산정 (지연 포함)
 * - 전체 완료율 = (완료건수 + 0.5 * 진행중건수) / 전체건수 * 100
 */
export const getPreventionActionsStats = (preventionActions: PreventionActions): {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  completionRate: number;
} => {
  const allActions = [
    ...preventionActions.technical_actions,
    ...preventionActions.educational_actions,
    ...preventionActions.managerial_actions
  ].filter(action => action.improvement_plan.trim());

  // 상태값 한글/영문 모두 인식 (진행, 진행중, in_progress 모두 포함)
  const isPending = (status: string) => status === 'pending' || status === '대기';
  const isInProgress = (status: string) => status === 'in_progress' || status === '진행중' || status === '진행';
  const isCompleted = (status: string) => status === 'completed' || status === '완료';

  const total = allActions.length;
  const pending = allActions.filter(action => isPending(action.progress_status)).length;
  const inProgress = allActions.filter(action => isInProgress(action.progress_status)).length;
  const completed = allActions.filter(action => isCompleted(action.progress_status)).length;

  // 완료율: 완료 1, 진행 0.5, 대기 0
  const completionRate = total > 0 ? Math.round(((completed + 0.5 * inProgress) / total) * 100) : 0;

  return {
    total,
    pending,
    inProgress,
    completed,
    completionRate
  };
};

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