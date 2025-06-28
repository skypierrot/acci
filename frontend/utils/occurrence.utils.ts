import { FormStep, OccurrenceFormData } from '../types/occurrence.types';

// 날짜 시간 변환 함수
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // 문자열을 Date 객체로 변환
    const date = new Date(dateString);
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // YYYY-MM-DDTHH:MM 형식으로 변환 (datetime-local 입력에 필요한 형식)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    console.error('날짜 변환 오류:', e);
    return '';
  }
};

// 스텝 정의 함수
export const getSteps = (accidentType: string): FormStep[] => {
  const baseSteps: FormStep[] = [
    { id: 'basic', title: '기본정보', group: '기본정보' },
    { id: 'accident', title: '사고정보', group: '사고정보' },
    { id: 'victim', title: '재해자정보', group: '재해자정보' },
    { id: 'attachment', title: '첨부파일', group: '첨부파일' },
    { id: 'reporter', title: '보고자정보', group: '보고자정보' }
  ];
  
  // 물적 사고인 경우 재해자 정보 단계 제외
  if (accidentType === "물적") {
    return baseSteps.filter(step => step.id !== 'victim');
  }
  
  return baseSteps;
};

// 동적 그리드 클래스 생성
export const getDynamicGridClass = (groupName: string, formSettings: any[]): string => {
  // 해당 그룹의 첫 번째 필드에서 group_cols 값 가져오기
  const groupField = formSettings.find(setting => setting.field_group === groupName);
  const cols = groupField?.group_cols || 2;
  
  // 열 수에 따른 그리드 클래스 반환
  switch (cols) {
    case 1:
      return 'grid grid-cols-1 gap-4';
    case 2:
      return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    case 3:
      return 'grid grid-cols-1 md:grid-cols-3 gap-4';
    case 4:
      return 'grid grid-cols-1 md:grid-cols-4 gap-4';
    default:
      return 'grid grid-cols-1 md:grid-cols-2 gap-4';
  }
};

// 현재 스텝 유효성 검증
export const validateCurrentStep = (
  stepIndex: number, 
  formData: OccurrenceFormData,
  isFieldRequired: (fieldName: string) => boolean
): boolean => {
  const steps = getSteps(formData.accident_type_level1);
  const currentStep = steps[stepIndex];
  
  if (!currentStep) return true;
  
  switch (currentStep.id) {
    case 'basic':
      return (
        (!isFieldRequired("company_name") || formData.company_name.trim() !== "") &&
        (!isFieldRequired("site_name") || formData.site_name.trim() !== "") &&
        (!isFieldRequired("global_accident_no") || formData.global_accident_no.trim() !== "")
      );
      
    case 'accident':
      return (
        (!isFieldRequired("acci_time") || formData.acci_time.trim() !== "") &&
        (!isFieldRequired("acci_location") || formData.acci_location.trim() !== "") &&
        (!isFieldRequired("accident_type_level1") || formData.accident_type_level1.trim() !== "") &&
        (!isFieldRequired("acci_summary") || formData.acci_summary.trim() !== "")
      );
      
    case 'victim':
      if (formData.accident_type_level1 === "인적" || formData.accident_type_level1 === "복합") {
        return (
          formData.victim_count > 0 &&
          formData.victims.length >= formData.victim_count &&
          formData.victims.every(victim => 
            (!isFieldRequired("victim_name") || victim.name.trim() !== "") &&
            (!isFieldRequired("victim_age") || victim.age > 0)
          )
        );
      }
      return true;
      
    case 'reporter':
      return (
        (!isFieldRequired("reporter_name") || formData.reporter_name.trim() !== "") &&
        (!isFieldRequired("first_report_time") || formData.first_report_time.trim() !== "")
      );
      
    default:
      return true;
  }
};

// 스텝 완료 여부 확인
export const isStepCompleted = (
  stepIndex: number, 
  formData: OccurrenceFormData,
  isFieldRequired: (fieldName: string) => boolean
): boolean => {
  return validateCurrentStep(stepIndex, formData, isFieldRequired);
};

// 사고 유형에 따른 스텝 조정
export const adjustStepForAccidentType = (
  newAccidentType: string, 
  currentStep: number
): number => {
  const steps = getSteps(newAccidentType);
  
  // 물적 사고로 변경되고 현재 재해자 정보 스텝에 있다면 다음 스텝으로 이동
  if (newAccidentType === "물적" && currentStep === 2) {
    return Math.min(currentStep, steps.length - 1);
  }
  
  // 인적/복합 사고로 변경되었다면 현재 스텝 유지
  return Math.min(currentStep, steps.length - 1);
};

// 초기 폼 데이터 생성
export const createInitialFormData = (): OccurrenceFormData => {
  return {
    global_accident_no: "",
    accident_id: "",
    company_name: "",
    company_code: "",
    site_name: "",
    site_code: "",
    acci_time: "",
    acci_location: "",
    report_channel_no: "",
    accident_type_level1: "",
    accident_type_level2: "",
    acci_summary: "",
    acci_detail: "",
    victim_count: 0,
    victim_name: "",
    victim_age: 0,
    victim_belong: "",
    victim_duty: "",
    injury_type: "",
    ppe_worn: "",
    first_aid: "",
    victims: [],
    is_contractor: false,
    contractor_name: "",
    scene_photos: [],
    cctv_video: [],
    statement_docs: [],
    etc_documents: [],
    reporter_name: "",
    reporter_position: "",
    reporter_belong: "",
    report_channel: "",
    first_report_time: new Date().toISOString().slice(0, 16),
    _raw_first_report_time: new Date().toISOString().slice(0, 16)
  };
};

// 재해자 정보 초기값 생성
export const createInitialVictim = () => ({
  name: '',
  age: 0,
  belong: '',
  duty: '',
  injury_type: '',
  ppe_worn: '',
  first_aid: ''
}); 