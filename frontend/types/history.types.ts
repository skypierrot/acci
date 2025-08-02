/**
 * @file types/history.types.ts
 * @description HistoryTable 관련 타입 정의
 */

// 사고 보고서 기본 타입
export interface AccidentReport {
  accident_id: string;
  global_accident_no: string;
  accident_name?: string;
  final_accident_name?: string;
  site_name: string;
  acci_time: string;
  final_acci_time?: string;
  status?: string;
  [key: string]: any; // 추가 속성을 위한 인덱스 시그니처
}

// 조사 보고서 타입
export interface InvestigationReport {
  accident_id: string;
  [key: string]: any;
}

// HistoryTable Props 타입
export interface HistoryTableProps {
  reports: AccidentReport[];
  investigationMap: Map<string, InvestigationReport>;
  getDisplayStatus: (report: AccidentReport) => string;
  getStatusBadgeClass: (status: string) => string;
  getAccidentTypeDisplay: (report: AccidentReport) => { type: string; [key: string]: any };
  expandedRows: Set<string>;
  toggleRowExpansion: (accidentId: string) => void;
  router: any;
  formatDate?: (dateStr: string) => string;
  getCompletionRateColor?: (rate: number) => string;
  ExpandedRowDetails?: React.FC<{ report: AccidentReport; isMobile?: boolean }>;
}

// HistoryCard Props 타입
export interface HistoryCardProps {
  report: AccidentReport;
  investigationMap: Map<string, InvestigationReport>;
  getDisplayStatus: (report: AccidentReport) => string;
  getStatusBadgeClass: (status: string) => string;
  getAccidentTypeDisplay: (report: AccidentReport) => { type: string; [key: string]: any };
  isExpanded: boolean;
  onToggleExpansion: (accidentId: string) => void;
  formatDate?: (dateStr: string) => string;
  ExpandedRowDetails?: React.FC<{ report: AccidentReport; isMobile?: boolean }>;
}

// HistoryTableRow Props 타입
export interface HistoryTableRowProps {
  report: AccidentReport;
  investigationMap: Map<string, InvestigationReport>;
  getDisplayStatus: (report: AccidentReport) => string;
  getStatusBadgeClass: (status: string) => string;
  getAccidentTypeDisplay: (report: AccidentReport) => { type: string; [key: string]: any };
  isExpanded: boolean;
  onToggleExpansion: (accidentId: string) => void;
  formatDate?: (dateStr: string) => string;
  ExpandedRowDetails?: React.FC<{ report: AccidentReport; isMobile?: boolean }>;
}

// 사고 타입 정보 타입
export interface AccidentTypeInfo {
  type: string;
  [key: string]: any;
} 