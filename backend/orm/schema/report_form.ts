/**
 * @file orm/schema/report_form.ts
 * @description
 *  - 보고서 양식 설정을 저장하는 테이블 스키마
 *  - 발생보고서와 조사보고서의 필드 표시 여부, 필수 여부, 순서 등을 저장
 */

import { pgTable, varchar, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

// 보고서 양식 필드 설정 테이블
export const reportFormSettings = pgTable("report_form_settings", {
  // 설정 ID (기본키)
  id: varchar("id", { length: 50 }).primaryKey(),
  
  // 보고서 유형 (occurrence: 발생보고서, investigation: 조사보고서)
  report_type: varchar("report_type", { length: 20 }).notNull(),
  
  // 필드 이름 (예: accident_id, acci_time 등)
  field_name: varchar("field_name", { length: 100 }).notNull(),
  
  // 필드 표시 여부 (true: 표시, false: 숨김)
  is_visible: boolean("is_visible").default(true),
  
  // 필수 입력 여부 (true: 필수, false: 선택)
  is_required: boolean("is_required").default(false),
  
  // 필드 순서 (정수: 낮을수록 상위에 표시)
  display_order: integer("display_order").default(0),
  
  // 필드 그룹 (예: 기본정보, 사고정보, 재해자정보 등)
  field_group: varchar("field_group", { length: 50 }),
  
  // 필드 표시 이름 (UI에 표시할 레이블)
  display_name: varchar("display_name", { length: 100 }),
  
  // 필드 설명
  description: text("description"),
  
  // 그리드 레이아웃 정보 (x, y: 위치, w, h: 크기)
  grid_layout: jsonb("grid_layout").default({ x: 0, y: 0, w: 1, h: 1 }),
  
  // 레이아웃 템플릿 정보
  layout_template: varchar("layout_template", { length: 50 }).default("compact"),
  
  // 그룹별 열 수 설정
  group_cols: integer("group_cols").default(2),
  
  // 생성 시간
  created_at: timestamp("created_at").defaultNow(),
  
  // 수정 시간
  updated_at: timestamp("updated_at").defaultNow(),
});

// 기본 발생보고서 필드 정의 (서버 초기화 시 사용)
export const defaultOccurrenceFormFields = [
  // -------------------- 조직정보 그룹 --------------------
  { field_name: "global_accident_no", display_name: "전체사고코드", field_group: "조직정보", is_visible: true, is_required: true, display_order: 1, grid_layout: { x: 0, y: 0, w: 1, h: 1 } },
  { field_name: "accident_id", display_name: "사업장사고코드", field_group: "조직정보", is_visible: true, is_required: true, display_order: 2, grid_layout: { x: 1, y: 0, w: 1, h: 1 } },
  { field_name: "company_name", display_name: "회사명", field_group: "조직정보", is_visible: true, is_required: true, display_order: 3, grid_layout: { x: 0, y: 1, w: 1, h: 1 } },
  { field_name: "site_name", display_name: "사업장명", field_group: "조직정보", is_visible: true, is_required: true, display_order: 4, grid_layout: { x: 1, y: 1, w: 1, h: 1 } },
  { field_name: "is_contractor", display_name: "협력업체 여부", field_group: "조직정보", is_visible: true, is_required: true, display_order: 5, grid_layout: { x: 0, y: 2, w: 1, h: 1 } },
  { field_name: "contractor_name", display_name: "협력업체명", field_group: "조직정보", is_visible: true, is_required: false, display_order: 6, grid_layout: { x: 1, y: 2, w: 1, h: 1 } },
  // 숨김 처리된 필드들
  { field_name: "report_channel_no", display_name: "보고 경로 번호", field_group: "조직정보", is_visible: false, is_required: false, display_order: 7, grid_layout: { x: 0, y: 3, w: 1, h: 1 } },
  { field_name: "company_code", display_name: "회사 코드", field_group: "조직정보", is_visible: false, is_required: true, display_order: 8, grid_layout: { x: 1, y: 3, w: 1, h: 1 } },
  { field_name: "site_code", display_name: "사업장 코드", field_group: "조직정보", is_visible: false, is_required: true, display_order: 9, grid_layout: { x: 2, y: 3, w: 1, h: 1 } },
  
  // -------------------- 사고정보 그룹 --------------------
  { field_name: "accident_name", display_name: "사고명", field_group: "사고정보", is_visible: true, is_required: true, display_order: 10, grid_layout: { x: 0, y: 0, w: 2, h: 1 } },
  { field_name: "acci_time", display_name: "사고 발생 일시", field_group: "사고정보", is_visible: true, is_required: true, display_order: 11, grid_layout: { x: 0, y: 1, w: 1, h: 1 } },
  { field_name: "acci_location", display_name: "사고 발생 위치", field_group: "사고정보", is_visible: true, is_required: true, display_order: 12, grid_layout: { x: 1, y: 1, w: 1, h: 1 } },
  { field_name: "accident_type_level1", display_name: "재해발생 형태", field_group: "사고정보", is_visible: true, is_required: true, display_order: 13, grid_layout: { x: 0, y: 2, w: 1, h: 1 } },
  { field_name: "accident_type_level2", display_name: "사고 유형", field_group: "사고정보", is_visible: true, is_required: true, display_order: 14, grid_layout: { x: 1, y: 2, w: 1, h: 1 } },
  { field_name: "acci_summary", display_name: "사고 개요", field_group: "사고정보", is_visible: true, is_required: true, display_order: 15, grid_layout: { x: 0, y: 3, w: 2, h: 2 } },
  { field_name: "acci_detail", display_name: "사고 상세 내용", field_group: "사고정보", is_visible: true, is_required: false, display_order: 16, grid_layout: { x: 0, y: 5, w: 2, h: 2 } },
  // 작업허가 필드 수정
  { field_name: "work_permit_required", display_name: "작업허가대상", field_group: "사고정보", is_visible: true, is_required: true, display_order: 17, grid_layout: { x: 0, y: 7, w: 1, h: 1 } },
  { field_name: "work_permit_number", display_name: "작업허가서 번호", field_group: "사고정보", is_visible: true, is_required: false, display_order: 18, grid_layout: { x: 1, y: 7, w: 1, h: 1 } },
  { field_name: "work_permit_status", display_name: "작업허가서 상태", field_group: "사고정보", is_visible: true, is_required: false, display_order: 19, grid_layout: { x: 0, y: 8, w: 1, h: 1 } },

  // -------------------- 재해자정보 그룹 --------------------
  { field_name: "victim_name", display_name: "재해자 이름", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 20, grid_layout: { x: 0, y: 0, w: 1, h: 1 } },
  { field_name: "victim_age", display_name: "재해자 나이", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 21, grid_layout: { x: 1, y: 0, w: 1, h: 1 } },
  { field_name: "victim_belong", display_name: "재해자 소속", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 22, grid_layout: { x: 0, y: 1, w: 1, h: 1 } },
  { field_name: "victim_duty", display_name: "재해자 직무", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 23, grid_layout: { x: 1, y: 1, w: 1, h: 1 } },
  { field_name: "injury_type", display_name: "상해 정도", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 24, grid_layout: { x: 0, y: 2, w: 1, h: 1 } },
  { field_name: "ppe_worn", display_name: "보호구 착용 여부", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 25, grid_layout: { x: 1, y: 2, w: 1, h: 1 } },
  { field_name: "first_aid", display_name: "응급조치 내역", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 26, grid_layout: { x: 0, y: 3, w: 2, h: 1 } },

  // -------------------- 물적피해정보 그룹 --------------------
  { field_name: "damage_target", display_name: "피해대상물", field_group: "물적피해정보", is_visible: true, is_required: false, display_order: 27, grid_layout: { x: 0, y: 0, w: 1, h: 1 } },
  { field_name: "estimated_cost", display_name: "피해금액(예상)", field_group: "물적피해정보", is_visible: true, is_required: false, display_order: 28, grid_layout: { x: 1, y: 0, w: 1, h: 1 } },
  { field_name: "damage_content", display_name: "피해 내용", field_group: "물적피해정보", is_visible: true, is_required: false, display_order: 29, grid_layout: { x: 0, y: 1, w: 2, h: 1 } },

  // -------------------- 보고자정보 그룹 --------------------
  { field_name: "first_report_time", display_name: "최초 보고 시간", field_group: "보고자정보", is_visible: true, is_required: true, display_order: 30, grid_layout: { x: 0, y: 0, w: 2, h: 1 } },
  { field_name: "reporter_name", display_name: "보고자 이름", field_group: "보고자정보", is_visible: true, is_required: true, display_order: 31, grid_layout: { x: 0, y: 1, w: 1, h: 1 } },
  { field_name: "reporter_position", display_name: "보고자 직책", field_group: "보고자정보", is_visible: true, is_required: false, display_order: 32, grid_layout: { x: 1, y: 1, w: 1, h: 1 } },
  { field_name: "reporter_belong", display_name: "보고자 소속", field_group: "보고자정보", is_visible: true, is_required: false, display_order: 33, grid_layout: { x: 0, y: 2, w: 1, h: 1 } },
  { field_name: "report_channel", display_name: "보고 경로", field_group: "보고자정보", is_visible: true, is_required: false, display_order: 34, grid_layout: { x: 1, y: 2, w: 1, h: 1 } },
  
  // -------------------- 첨부파일 그룹 --------------------
  { field_name: "attachments", display_name: "첨부 파일", field_group: "첨부파일", is_visible: true, is_required: false, display_order: 35, grid_layout: { x: 0, y: 0, w: 2, h: 1 } },
];

// 기본 조사보고서 필드 정의 (서버 초기화 시 사용)
export const defaultInvestigationFormFields = [
  // 조사정보 그룹
  { field_name: "accident_id", display_name: "사고 ID", field_group: "조사정보", is_visible: true, is_required: true, display_order: 1, grid_layout: { x: 0, y: 0, w: 2, h: 1 } },
  { field_name: "investigation_start_time", display_name: "조사 착수 일시", field_group: "조사정보", is_visible: true, is_required: true, display_order: 2, grid_layout: { x: 0, y: 1, w: 1, h: 1 } },
  { field_name: "investigation_end_time", display_name: "조사 완료 일시", field_group: "조사정보", is_visible: true, is_required: false, display_order: 3, grid_layout: { x: 1, y: 1, w: 1, h: 1 } },
  { field_name: "investigation_team_lead", display_name: "조사 팀장", field_group: "조사정보", is_visible: true, is_required: true, display_order: 4, grid_layout: { x: 0, y: 2, w: 1, h: 1 } },
  { field_name: "investigation_team_members", display_name: "조사 팀원", field_group: "조사정보", is_visible: true, is_required: false, display_order: 5, grid_layout: { x: 1, y: 2, w: 2, h: 1 } },
  { field_name: "investigation_location", display_name: "조사 장소", field_group: "조사정보", is_visible: true, is_required: false, display_order: 6, grid_layout: { x: 0, y: 3, w: 3, h: 1 } },

  // 원본정보 그룹 (읽기전용)
  { field_name: "original_global_accident_no", display_name: "원본 전체사고코드", field_group: "원본정보", is_visible: true, is_required: false, display_order: 7, grid_layout: { x: 0, y: 4, w: 1, h: 1 } },
  { field_name: "original_accident_id", display_name: "원본 사고ID", field_group: "원본정보", is_visible: true, is_required: false, display_order: 8, grid_layout: { x: 1, y: 4, w: 1, h: 1 } },
  { field_name: "original_acci_time", display_name: "원본 사고발생일시", field_group: "원본정보", is_visible: true, is_required: false, display_order: 9, grid_layout: { x: 0, y: 5, w: 2, h: 1 } },
  { field_name: "original_acci_location", display_name: "원본 사고위치", field_group: "원본정보", is_visible: true, is_required: false, display_order: 10, grid_layout: { x: 0, y: 6, w: 3, h: 1 } },
  { field_name: "original_company_name", display_name: "원본 회사명", field_group: "원본정보", is_visible: true, is_required: false, display_order: 11, grid_layout: { x: 0, y: 7, w: 1, h: 1 } },
  { field_name: "original_site_name", display_name: "원본 사업장명", field_group: "원본정보", is_visible: true, is_required: false, display_order: 12, grid_layout: { x: 1, y: 7, w: 1, h: 1 } },

  // 수정정보 그룹
  { field_name: "investigation_global_accident_no", display_name: "수정 전체사고코드", field_group: "수정정보", is_visible: true, is_required: false, display_order: 13, grid_layout: { x: 0, y: 8, w: 1, h: 1 } },
  { field_name: "investigation_accident_id", display_name: "수정 사고ID", field_group: "수정정보", is_visible: true, is_required: false, display_order: 14, grid_layout: { x: 1, y: 8, w: 1, h: 1 } },
  { field_name: "investigation_acci_time", display_name: "수정 사고발생일시", field_group: "수정정보", is_visible: true, is_required: false, display_order: 15, grid_layout: { x: 0, y: 9, w: 2, h: 1 } },
  { field_name: "investigation_acci_location", display_name: "수정 사고위치", field_group: "수정정보", is_visible: true, is_required: false, display_order: 16, grid_layout: { x: 0, y: 10, w: 3, h: 1 } },
  { field_name: "investigation_company_name", display_name: "수정 회사명", field_group: "수정정보", is_visible: true, is_required: false, display_order: 17, grid_layout: { x: 0, y: 11, w: 1, h: 1 } },
  { field_name: "investigation_site_name", display_name: "수정 사업장명", field_group: "수정정보", is_visible: true, is_required: false, display_order: 18, grid_layout: { x: 1, y: 11, w: 1, h: 1 } },

  // 피해정보 그룹
  { field_name: "damage_severity", display_name: "피해 정도", field_group: "피해정보", is_visible: true, is_required: true, display_order: 19, grid_layout: { x: 0, y: 12, w: 1, h: 1 } },
  { field_name: "death_count", display_name: "사망자 수", field_group: "피해정보", is_visible: true, is_required: false, display_order: 20, grid_layout: { x: 1, y: 12, w: 1, h: 1 } },
  { field_name: "injured_count", display_name: "부상자 수", field_group: "피해정보", is_visible: true, is_required: false, display_order: 21, grid_layout: { x: 2, y: 12, w: 1, h: 1 } },
  { field_name: "damage_cost", display_name: "피해금액", field_group: "피해정보", is_visible: true, is_required: false, display_order: 22, grid_layout: { x: 0, y: 13, w: 1, h: 1 } },
  { field_name: "injury_location_detail", display_name: "부상 부위", field_group: "피해정보", is_visible: true, is_required: false, display_order: 23, grid_layout: { x: 1, y: 13, w: 2, h: 1 } },
  { field_name: "victim_return_date", display_name: "재해자 복귀일", field_group: "피해정보", is_visible: true, is_required: false, display_order: 24, grid_layout: { x: 0, y: 14, w: 2, h: 1 } },

  // 원인분석 그룹
  { field_name: "direct_cause", display_name: "직접 원인", field_group: "원인분석", is_visible: true, is_required: true, display_order: 25, grid_layout: { x: 0, y: 15, w: 3, h: 2 } },
  { field_name: "root_cause", display_name: "근본 원인", field_group: "원인분석", is_visible: true, is_required: true, display_order: 26, grid_layout: { x: 0, y: 17, w: 3, h: 2 } },

  // 대책정보 그룹
  { field_name: "corrective_actions", display_name: "재발방지대책", field_group: "대책정보", is_visible: true, is_required: true, display_order: 27, grid_layout: { x: 0, y: 19, w: 3, h: 2 } },
  { field_name: "action_schedule", display_name: "대책 실행 일정", field_group: "대책정보", is_visible: true, is_required: false, display_order: 28, grid_layout: { x: 0, y: 21, w: 2, h: 1 } },
  { field_name: "action_verifier", display_name: "대책 이행 확인자", field_group: "대책정보", is_visible: true, is_required: false, display_order: 29, grid_layout: { x: 2, y: 21, w: 1, h: 1 } },

  // 조사첨부파일 그룹
  { field_name: "investigation_photos", display_name: "조사 현장 사진", field_group: "조사첨부파일", is_visible: true, is_required: false, display_order: 30, grid_layout: { x: 0, y: 22, w: 1, h: 1 } },
  { field_name: "equipment_inspection_report", display_name: "장비 점검 결과", field_group: "조사첨부파일", is_visible: true, is_required: false, display_order: 31, grid_layout: { x: 1, y: 22, w: 1, h: 1 } },
  { field_name: "witness_statements", display_name: "증인 진술서", field_group: "조사첨부파일", is_visible: true, is_required: false, display_order: 32, grid_layout: { x: 2, y: 22, w: 1, h: 1 } },
  { field_name: "incident_flow_diagram", display_name: "사고 재구성 도면", field_group: "조사첨부파일", is_visible: true, is_required: false, display_order: 33, grid_layout: { x: 0, y: 23, w: 3, h: 1 } },

  // 결론정보 그룹
  { field_name: "investigation_conclusion", display_name: "조사 결론", field_group: "결론정보", is_visible: true, is_required: true, display_order: 34, grid_layout: { x: 0, y: 24, w: 3, h: 3 } },
  { field_name: "investigation_summary", display_name: "조사 요약", field_group: "결론정보", is_visible: true, is_required: false, display_order: 35, grid_layout: { x: 0, y: 27, w: 3, h: 2 } },
  { field_name: "investigator_signature", display_name: "조사자 서명", field_group: "결론정보", is_visible: true, is_required: true, display_order: 36, grid_layout: { x: 0, y: 29, w: 1, h: 1 } },
  { field_name: "report_written_date", display_name: "보고서 작성일", field_group: "결론정보", is_visible: true, is_required: true, display_order: 37, grid_layout: { x: 1, y: 29, w: 2, h: 1 } },

  // 상태정보 그룹
  { field_name: "investigation_status", display_name: "조사 상태", field_group: "상태정보", is_visible: true, is_required: true, display_order: 38, grid_layout: { x: 0, y: 30, w: 1, h: 1 } },
  { field_name: "legal_report_flag", display_name: "법적 보고 여부", field_group: "상태정보", is_visible: true, is_required: false, display_order: 39, grid_layout: { x: 1, y: 30, w: 1, h: 1 } },
  { field_name: "insurance_status", display_name: "보험 처리 현황", field_group: "상태정보", is_visible: true, is_required: false, display_order: 40, grid_layout: { x: 2, y: 30, w: 1, h: 1 } },
  { field_name: "ra_number", display_name: "위험성평가서 번호", field_group: "상태정보", is_visible: true, is_required: false, display_order: 41, grid_layout: { x: 0, y: 31, w: 2, h: 1 } },
  { field_name: "training_action_history", display_name: "교육/조치 이력", field_group: "상태정보", is_visible: true, is_required: false, display_order: 42, grid_layout: { x: 0, y: 32, w: 3, h: 1 } },
]; 