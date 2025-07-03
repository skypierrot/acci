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
  shutdown_start_date: string;  // 가동중단일
  recovery_expected_date: string; // 예상복구일
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
  investigation_acci_summary?: string;
  investigation_acci_detail?: string;
  investigation_victim_count?: number;
  investigation_victims?: VictimInfo[];
  
  // 피해 정보
  damage_cost?: number;
  injury_location_detail?: string;
  victim_return_date?: string;
  property_damages?: PropertyDamageItem[];
  
  // 원인 분석
  direct_cause?: string;
  root_cause?: string;
  
  // 대책 정보
  corrective_actions?: string;
  action_schedule?: string;
  action_verifier?: string;
  
  // 조사 결론
  investigation_conclusion?: string;
  investigation_status?: string;
  investigation_summary?: string;
  investigator_signature?: string;
  report_written_date?: string;
}

// 편집 모드 관련 타입
export type OriginalDataField = 'summary' | 'detail' | 'time' | 'location' | 'type1' | 'type2' | 'victims' | 'weather';

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
}

// 물적피해 관련 Props
export interface PropertyDamageSectionProps extends InvestigationComponentProps {
  onAddPropertyDamage: () => void;
  onRemovePropertyDamage: (id: string) => void;
  onPropertyDamageChange: (id: string, field: keyof PropertyDamageItem, value: string | number) => void;
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