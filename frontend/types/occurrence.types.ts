// 재해자 정보 인터페이스
export interface VictimInfo {
  name: string;                   // 재해자 이름
  age: number;                    // 재해자 나이
  belong: string;                 // 재해자 소속
  duty: string;                   // 재해자 직무
  injury_type: string;            // 상해 정도
  ppe_worn: string;               // 보호구 착용 여부
  first_aid: string;              // 응급조치 내역
}

// 발생보고서 데이터 인터페이스
export interface OccurrenceFormData {
  // 기본 정보
  global_accident_no: string;     // 전체사고코드
  accident_id: string;            // 사고 ID (자동 생성)
  company_name: string;           // 회사명
  company_code: string;           // 회사 코드
  site_name: string;              // 사업장명
  site_code: string;              // 사업장 코드
  acci_time: string;              // 사고 발생 일시 (표시용)
  _raw_acci_time?: string;        // 사고 발생 일시 원본 (내부 처리용)
  acci_location: string;          // 사고 발생 위치
  report_channel_no: string;      // 사고 코드
  
  // 사고 분류 정보
  accident_type_level1: string;   // 재해발생 형태 (인적, 물적, 복합)
  accident_type_level2: string;   // 사고 유형 (기계, 전기 등)
  acci_summary: string;           // 사고 개요
  acci_detail: string;            // 사고 상세 내용
  victim_count: number;           // 재해자 수
  
  // 기본 재해자 정보 (하위 호환성 유지)
  victim_name: string;            // 재해자 이름
  victim_age: number;             // 재해자 나이
  victim_belong: string;          // 재해자 소속
  victim_duty: string;            // 재해자 직무
  injury_type: string;            // 상해 정도
  ppe_worn: string;               // 보호구 착용 여부
  first_aid: string;              // 응급조치 내역
  
  // 확장된 재해자 정보 (1:N 관계)
  victims: VictimInfo[];          // 재해자 정보 배열
  
  // 협력업체 관련
  is_contractor: boolean;         // 협력업체 직원 관련 사고 여부
  contractor_name: string;        // 협력업체명
  
  // 파일 첨부
  scene_photos: string[];         // 사고 현장 사진
  cctv_video: string[];           // CCTV 영상
  statement_docs: string[];       // 관계자 진술서
  etc_documents: string[];        // 기타 문서
  
  // 보고자 정보
  reporter_name: string;          // 보고자 이름
  reporter_position: string;      // 보고자 직책
  reporter_belong: string;        // 보고자 소속
  report_channel: string;         // 보고 경로
  first_report_time: string;      // 최초 보고 시간
  _raw_first_report_time: string; // 최초 보고 시간 원본 (내부 처리용)
}

// 스텝 정의
export interface FormStep {
  id: string;
  title: string;
  group: string;
}

// 사고 통계 정보
export interface AccidentStats {
  companyAccidentCount: number;   // 회사 전체 사고 건수
  siteAccidentCount: number;      // 사업장 사고 건수
  companyYearlyCount: number;     // 회사 연도별 사고 건수
  siteYearlyCount: number;        // 사업장 연도별 사고 건수
}

// 폼 섹션 공통 Props
export interface FormSectionProps {
  formData: OccurrenceFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onVictimChange?: (index: number, field: string, value: string | number) => void;
  onFileChange?: (fieldName: string, fileIds: string[]) => void;
  onAddVictim?: () => void;
  onRemoveVictim?: (index: number) => void;
  isFieldVisible: (fieldName: string) => boolean;
  isFieldRequired: (fieldName: string) => boolean;
  getFieldLabel: (fieldName: string, defaultLabel: string) => string;
  getFieldsInGroup: (groupName: string) => any[];
  isMobile?: boolean;
  currentStep?: number;
}

// 회사 선택 관련 Props
export interface CompanySelectionProps {
  companies: any[];
  selectedCompany: any;
  companySearchTerm: string;
  showCompanyDropdown: boolean;
  siteSearchTerm: string;
  showSiteDropdown: boolean;
  onCompanySelect: (company: any) => void;
  onSiteSelect: (site: any) => void;
  onCompanySearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSiteSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowCompanyDropdown: (show: boolean) => void;
  setShowSiteDropdown: (show: boolean) => void;
} 