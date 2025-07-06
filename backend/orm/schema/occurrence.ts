/**
 * @file orm/schema/occurrence.ts
 * @description
 *  - Drizzle ORM의 pgTable 함수를 사용하여
 *    `occurrence_report` 테이블 스키마를 정의합니다.
 *  - 각 컬럼의 타입, 길이, 제약조건 등을 설정합니다.
 */

import { pgTable, varchar, timestamp, boolean, integer, text } from "drizzle-orm/pg-core";

export const occurrenceReport = pgTable("occurrence_report", {
  // 사고 ID (예: AC-20250604-001)
  // → varchar(50) 타입, PK(primary key) 지정
  accident_id: varchar("accident_id", { length: 50 }).primaryKey(),

  // 전체 사고 코드 (예: Global-2025-001)
  global_accident_no: varchar("global_accident_no", { length: 50 }),

  // 사고 발생 일시 (YYYY-MM-DD HH:MM)
  acci_time: timestamp("acci_time"),

  // 사고가 발생한 회사명
  company_name: varchar("company_name", { length: 100 }),

  // 사고가 발생한 사업장명
  site_name: varchar("site_name", { length: 100 }),

  // 사고 발생 위치 (예: 제어반 앞)
  acci_location: varchar("acci_location", { length: 255 }),

  // 협력업체 여부 (true: 협력업체 직원, false: 자사 직원)
  is_contractor: boolean("is_contractor"),

  // 재해자 수 (해당 사고로 피해를 받은 인원 수)
  victim_count: integer("victim_count"),

  // 재해발생의 형태 (예: 인적 / 물적)
  accident_type_level1: varchar("accident_type_level1", { length: 20 }),

  // 사고 유형 (예: 기계, 추락, 감전 등)
  accident_type_level2: varchar("accident_type_level2", { length: 50 }),

  // 사고 개요 (짧은 설명)
  acci_summary: text("acci_summary"),

  // 사고 상세 내용 (템플릿 기반 서술)
  acci_detail: text("acci_detail"),

  // 사고 현장 사진 파일 목록 (파일 ID 리스트(JSON 문자열로 저장 가능)
  scene_photos: text("scene_photos"),

  // CCTV 영상 파일 목록 (파일 ID 리스트)
  cctv_video: text("cctv_video"),

  // 관계자 진술서 파일 목록 (여러 건)
  statement_docs: text("statement_docs"),

  // 기타 문서(보고서, 점검 표 등) 파일 목록
  etc_documents: text("etc_documents"),

  // 최초 보고 일시 (사고가 처음 보고된 시간)
  first_report_time: timestamp("first_report_time"),

  // 보고 경로 (예: 사내전화 → 팀장 → 안전팀 → 시스템)
  report_channel: varchar("report_channel", { length: 50 }),

  // 보고 경로 번호 (사고 ID와 동일하게 설정)
  report_channel_no: varchar("report_channel_no", { length: 50 }),

  // 회사 코드 (내부 연동용, 관리자만 관리)
  company_code: varchar("company_code", { length: 20 }),

  // 사업장 코드 (내부 연동용, 관리자만 관리)
  site_code: varchar("site_code", { length: 20 }),

  // 업무성 사고 분류 (예: 업무중, 통근중, 기타)
  work_related_type: varchar("work_related_type", { length: 20 }),

  // 기타 분류 (예: 보안사고, 화재사고 등 관리자 지정)
  misc_classification: varchar("misc_classification", { length: 50 }),

  // 재해자 정보 JSON (재해자 정보 배열 저장)
  victims_json: text("victims_json"),
  
  // 협력업체명
  contractor_name: varchar("contractor_name", { length: 100 }),
  
  // 기본 재해자 정보 (첫 번째 재해자 정보)
  victim_name: varchar("victim_name", { length: 100 }),
  victim_age: integer("victim_age"),
  victim_belong: varchar("victim_belong", { length: 100 }),
  victim_duty: varchar("victim_duty", { length: 100 }),
  injury_type: varchar("injury_type", { length: 100 }),
  ppe_worn: varchar("ppe_worn", { length: 100 }),
  first_aid: text("first_aid"),
  
  // 보고자 이름
  reporter_name: varchar("reporter_name", { length: 100 }),
  
  // 보고자 직책
  reporter_position: varchar("reporter_position", { length: 100 }),
  
  // 보고자 소속
  reporter_belong: varchar("reporter_belong", { length: 100 }),

  // 생성 시간 
  created_at: timestamp("created_at").defaultNow(),

  // 수정 시간
  updated_at: timestamp("updated_at").defaultNow(),

  // 첨부파일 통합 필드 (사진, 동영상, 문서 등 모두 이 배열에 저장, 앞으로는 이 필드만 사용)
  attachments: text("attachments"), // JSON 문자열로 저장 (PostgreSQL JSONB 타입과 호환)
});
