// 재해자 정보 인터페이스
export interface VictimInfo {
  victim_id?: number;
  accident_id?: string;
  name: string;
  age: number;
  belong: string;
  duty: string;
  injury_type: string;
  ppe_worn: string;
  first_aid: string;
  birth_date?: string;
  absence_start_date?: string;
  return_expected_date?: string;
  job_experience_duration?: number;
  job_experience_unit?: string;
  injury_location?: string;  // 상해부위
  medical_opinion?: string;  // 의사소견
  training_completed?: string; // 교육 이수여부
  etc_notes?: string;       // 기타
  created_at?: string;
  updated_at?: string;
}

// 물적피해 항목 인터페이스
export interface PropertyDamageItem {
  id: string;
  damage_target: string;        // 피해대상물
  estimated_cost: number;       // 피해금액(예상)
  damage_content: string;       // 피해 내용
  shutdown_start_date?: string; // 가동중단일 (조사보고서용)
  recovery_expected_date?: string; // 예상복구일 (조사보고서용)
}

// 원인 분석 관련 인터페이스
export interface CauseAnalysis {
  // 직접원인
  direct_cause: {
    unsafe_condition: string[];  // 불안전한 상태
    unsafe_act: string[];        // 불안전한 행동
  };
  // 근본원인
  root_cause: {
    human_factor: string[];      // 인적요인
    system_factor: string[];     // 업무/시스템적 요인
  };
}

// 대책 항목 인터페이스
export interface ActionItem {
  id: string;
  action_type: 'technical' | 'educational' | 'managerial';  // 기술적/교육적/관리적
  improvement_plan: string;      // 개선 계획
  progress_status: 'pending' | 'in_progress' | 'completed';  // 대기/진행/완료
  scheduled_date: string;        // 완료 예정일
  responsible_person: string;    // 담당자
  completion_date?: string;      // 완료일 (완료 시 필수)
}

// 재발방지대책 및 개선사항 인터페이스
export interface PreventionActions {
  technical_actions: ActionItem[];     // 기술적 대책 (설비/시설 보완)
  educational_actions: ActionItem[];   // 교육적 대책 (인적요인)
  managerial_actions: ActionItem[];    // 관리적 대책 (업무/시스템 보완)
}

// 조사보고서 인터페이스
export interface InvestigationReport {
  accident_id: string;
  investigation_start_time?: string;
  investigation_end_time?: string;
  investigation_team_lead?: string;
  investigation_team_members?: string;
  investigation_location?: string;
  
  // 원본 정보
  original_global_accident_no?: string;
  original_accident_id?: string;
  original_acci_time?: string;
  original_weather?: string;
  original_temperature?: number;
  original_humidity?: number;
  original_wind_speed?: number;
  original_weather_special?: string;
  original_acci_location?: string;
  original_accident_type_level1?: string;
  original_accident_type_level2?: string;
  original_accident_name?: string; // 원본 사고명 필드 추가
  original_acci_summary?: string;
  original_acci_detail?: string;
  original_victim_count?: number;
  original_victims?: VictimInfo[];
  
  // 조사 정보
  investigation_global_accident_no?: string;
  investigation_accident_id?: string;
  investigation_acci_time?: string;
  investigation_weather?: string;
  investigation_temperature?: number;
  investigation_humidity?: number;
  investigation_wind_speed?: number;
  investigation_weather_special?: string;
  investigation_acci_location?: string;
  investigation_accident_type_level1?: string;
  investigation_accident_type_level2?: string;
  investigation_accident_name?: string; // 조사 사고명 필드 추가
  investigation_acci_summary?: string;
  investigation_acci_detail?: string;
  investigation_victim_count?: number;
  investigation_victims?: VictimInfo[];
  investigation_property_damage?: PropertyDamageItem[];
  
  // 피해 정보
  damage_cost?: number;
  injury_location_detail?: string;
  victim_return_date?: string;
  property_damages?: PropertyDamageItem[];
  
  // 원인 분석 (기존 호환성을 위해 유지)
  direct_cause?: string;
  root_cause?: string;
  
  // 새로운 원인 분석 구조
  cause_analysis?: CauseAnalysis;
  
  // 대책 정보 (기존 호환성을 위해 유지)
  corrective_actions?: string;
  action_schedule?: string;
  action_verifier?: string;
  
  // 새로운 재발방지대책 및 개선사항 구조
  prevention_actions?: PreventionActions;
  
  // 조사 결론
  investigation_conclusion?: string;
  investigation_status?: string;
  investigation_summary?: string;
  investigator_signature?: string;
  report_written_date?: string;
  
  // 작업허가대상 관련 필드
  work_permit_required?: string; // 대상/비대상
  work_permit_number?: string;   // 작업허가번호
  work_permit_status?: string;   // 미발행/발행(미승인)/승인
}

// 편집 모드 관련 타입
export type OriginalDataField = 'summary' | 'detail' | 'time' | 'location' | 'type1' | 'type2' | 'victims' | 'weather' | 'property_damage' | 'accident_name';

// 컴포넌트 Props 타입
export interface InvestigationComponentProps {
  report: InvestigationReport;
  editForm: Partial<InvestigationReport>;
  editMode: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDateClick: (e: React.MouseEvent<HTMLInputElement>) => void;
}

// 재해자 관련 Props
export interface VictimSectionProps extends InvestigationComponentProps {
  onVictimChange: (index: number, field: keyof VictimInfo, value: string | number) => void;
  onAddVictim: () => void;
  onRemoveVictim: (index: number) => void;
  onVictimCountChange: (newCount: number) => void;
  onLoadOriginalData: (field: OriginalDataField) => void;
  onLoadOriginalVictim?: (victimIndex: number) => Promise<void>;
}

// 물적피해 관련 Props
export interface PropertyDamageSectionProps extends InvestigationComponentProps {
  onAddPropertyDamage: () => void;
  onRemovePropertyDamage: (id: string) => void;
  onPropertyDamageChange: (id: string, field: keyof PropertyDamageItem, value: string | number) => void;
  onLoadOriginalPropertyDamageItem?: (damageIndex: number) => Promise<void>;
}

// 액션 버튼 Props
export interface ActionButtonsProps {
  editMode: boolean;
  saving: boolean;
  onToggleEditMode: () => void;
  onSave: () => void;
}

// 알림 메시지 Props
export interface AlertMessageProps {
  type: 'error' | 'success';
  message: string;
} 