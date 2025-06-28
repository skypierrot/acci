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
  // 기본정보 그룹
  { field_name: "global_accident_no", display_name: "전체사고코드", field_group: "기본정보", is_visible: true, is_required: true, display_order: 1, grid_layout: { x: 0, y: 0, w: 1, h: 1 } },
  { field_name: "accident_id", display_name: "사업장사고코드", field_group: "기본정보", is_visible: true, is_required: true, display_order: 2, grid_layout: { x: 1, y: 0, w: 1, h: 1 } },
  { field_name: "report_channel_no", display_name: "보고 경로 번호", field_group: "기본정보", is_visible: false, is_required: false, display_order: 3, grid_layout: { x: 2, y: 0, w: 1, h: 1 } },
  { field_name: "company_name", display_name: "회사명", field_group: "기본정보", is_visible: true, is_required: true, display_order: 4, grid_layout: { x: 0, y: 1, w: 1, h: 1 } },
  { field_name: "company_code", display_name: "회사 코드", field_group: "기본정보", is_visible: false, is_required: true, display_order: 5, grid_layout: { x: 1, y: 1, w: 1, h: 1 } },
  { field_name: "site_name", display_name: "사업장명", field_group: "기본정보", is_visible: true, is_required: true, display_order: 6, grid_layout: { x: 2, y: 1, w: 1, h: 1 } },
  { field_name: "site_code", display_name: "사업장 코드", field_group: "기본정보", is_visible: false, is_required: true, display_order: 7, grid_layout: { x: 0, y: 2, w: 1, h: 1 } },
  { field_name: "is_contractor", display_name: "협력업체 여부", field_group: "기본정보", is_visible: true, is_required: true, display_order: 8, grid_layout: { x: 1, y: 2, w: 1, h: 1 } },
  { field_name: "contractor_name", display_name: "협력업체명", field_group: "기본정보", is_visible: true, is_required: false, display_order: 9, grid_layout: { x: 2, y: 2, w: 1, h: 1 } },
  { field_name: "first_report_time", display_name: "최초 보고 시간", field_group: "기본정보", is_visible: false, is_required: true, display_order: 10, grid_layout: { x: 0, y: 3, w: 1, h: 1 } },

  // 사고정보 그룹
  { field_name: "acci_time", display_name: "사고 발생 일시", field_group: "사고정보", is_visible: true, is_required: true, display_order: 11, grid_layout: { x: 0, y: 4, w: 2, h: 1 } },
  { field_name: "acci_location", display_name: "사고 발생 위치", field_group: "사고정보", is_visible: true, is_required: true, display_order: 12, grid_layout: { x: 2, y: 4, w: 1, h: 1 } },
  { field_name: "accident_type_level1", display_name: "재해발생 형태", field_group: "사고정보", is_visible: true, is_required: true, display_order: 13, grid_layout: { x: 0, y: 5, w: 1, h: 1 } },
  { field_name: "accident_type_level2", display_name: "사고 유형", field_group: "사고정보", is_visible: true, is_required: true, display_order: 14, grid_layout: { x: 1, y: 5, w: 2, h: 1 } },
  { field_name: "acci_summary", display_name: "사고 개요", field_group: "사고정보", is_visible: true, is_required: true, display_order: 15, grid_layout: { x: 0, y: 6, w: 3, h: 2 } },
  { field_name: "acci_detail", display_name: "사고 상세 내용", field_group: "사고정보", is_visible: true, is_required: false, display_order: 16, grid_layout: { x: 0, y: 8, w: 3, h: 2 } },
  { field_name: "victim_count", display_name: "재해자 수", field_group: "사고정보", is_visible: true, is_required: true, display_order: 17, grid_layout: { x: 0, y: 10, w: 1, h: 1 } },
  
  // 재해자정보 그룹
  { field_name: "victim_name", display_name: "재해자 이름", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 18, grid_layout: { x: 0, y: 11, w: 1, h: 1 } },
  { field_name: "victim_age", display_name: "재해자 나이", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 19, grid_layout: { x: 1, y: 11, w: 1, h: 1 } },
  { field_name: "victim_belong", display_name: "재해자 소속", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 20, grid_layout: { x: 2, y: 11, w: 1, h: 1 } },
  { field_name: "victim_duty", display_name: "재해자 직무", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 21, grid_layout: { x: 0, y: 12, w: 1, h: 1 } },
  { field_name: "injury_type", display_name: "부상 유형", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 22, grid_layout: { x: 1, y: 12, w: 2, h: 1 } },
  { field_name: "ppe_worn", display_name: "보호구 착용 여부", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 23, grid_layout: { x: 0, y: 13, w: 1, h: 1 } },
  { field_name: "first_aid", display_name: "응급조치 내역", field_group: "재해자정보", is_visible: true, is_required: false, display_order: 24, grid_layout: { x: 1, y: 13, w: 2, h: 1 } },

  // 첨부파일 그룹
  { field_name: "scene_photos", display_name: "사고 현장 사진", field_group: "첨부파일", is_visible: true, is_required: false, display_order: 25, grid_layout: { x: 0, y: 14, w: 1, h: 1 } },
  { field_name: "cctv_video", display_name: "CCTV 영상", field_group: "첨부파일", is_visible: true, is_required: false, display_order: 26, grid_layout: { x: 1, y: 14, w: 1, h: 1 } },
  { field_name: "statement_docs", display_name: "관계자 진술서", field_group: "첨부파일", is_visible: true, is_required: false, display_order: 27, grid_layout: { x: 2, y: 14, w: 1, h: 1 } },
  { field_name: "etc_documents", display_name: "기타 문서", field_group: "첨부파일", is_visible: true, is_required: false, display_order: 28, grid_layout: { x: 0, y: 15, w: 3, h: 1 } },

  // 보고자정보 그룹
  { field_name: "reporter_name", display_name: "보고자 이름", field_group: "보고자정보", is_visible: true, is_required: true, display_order: 29, grid_layout: { x: 0, y: 16, w: 1, h: 1 } },
  { field_name: "reporter_position", display_name: "보고자 직책", field_group: "보고자정보", is_visible: true, is_required: false, display_order: 30, grid_layout: { x: 1, y: 16, w: 1, h: 1 } },
  { field_name: "reporter_belong", display_name: "보고자 소속", field_group: "보고자정보", is_visible: true, is_required: false, display_order: 31, grid_layout: { x: 2, y: 16, w: 1, h: 1 } },
  { field_name: "report_channel", display_name: "보고 경로", field_group: "보고자정보", is_visible: true, is_required: false, display_order: 32, grid_layout: { x: 0, y: 17, w: 3, h: 1 } },
  
]; 