/**
 * @file orm/schema/investigation.ts
 * @description
 *  - Drizzle ORM을 통해 `investigation_report` 테이블 스키마를 정의합니다.
 *  - `occurrence_report.accident_id`를 참조하여 1:1 관계를 맺습니다.
 */

import { pgTable, varchar, timestamp, integer, text, boolean } from "drizzle-orm/pg-core";
import { occurrenceReport } from "./occurrence";

export const investigationReport = pgTable("investigation_report", {
  // 사고 발생보고의 accident_id를 FK로 참조하여 1:1 관계를 설정
  accident_id: varchar("accident_id", { length: 50 })
    .primaryKey()
    .references(() => occurrenceReport.accident_id),

  // 조사 착수 일시 (실제 조사 시작일시)
  investigation_start_time: timestamp("investigation_start_time"),

  // 조사 완료 일시 (조사 종료 시점)
  investigation_end_time: timestamp("investigation_end_time"),

  // 조사 팀장 이름
  investigation_team_lead: varchar("investigation_team_lead", { length: 100 }),

  // 조사 팀원(콤마 구분 문자열)
  investigation_team_members: text("investigation_team_members"),

  // 조사 장소 (예: 현장 사무실, 본사 회의실 등)
  investigation_location: varchar("investigation_location", { length: 255 }),

  // 원본 전체 사고 코드 (읽기용)
  original_global_accident_no: varchar("original_global_accident_no", { length: 50 }),

  // 수정 또는 보완된 전체 사고 코드 (조사 단계에서 변경 시 사용)
  investigation_global_accident_no: varchar("investigation_global_accident_no", { length: 50 }),

  // 원본 사고 ID (읽기용)
  original_accident_id: varchar("original_accident_id", { length: 50 }),

  // 수정 또는 보완된 사고 ID
  investigation_accident_id: varchar("investigation_accident_id", { length: 50 }),

  // 원본 사고 발생 일시 (읽기용)
  original_acci_time: timestamp("original_acci_time"),

  // 수정 또는 보완된 사고 발생 일시
  investigation_acci_time: timestamp("investigation_acci_time"),

  // 원본 사고 발생 위치 (읽기용)
  original_acci_location: varchar("original_acci_location", { length: 255 }),

  // 수정 또는 보완된 사고 발생 위치
  investigation_acci_location: varchar("investigation_acci_location", { length: 255 }),

  // 원본 재해발생의 형태 (읽기용)
  original_accident_type_level1: varchar("original_accident_type_level1", { length: 20 }),

  // 수정 또는 보완된 재해발생의 형태
  investigation_accident_type_level1: varchar("investigation_accident_type_level1", { length: 20 }),

  // 원본 사고 유형 (읽기용)
  original_accident_type_level2: varchar("original_accident_type_level2", { length: 50 }),

  // 수정 또는 보완된 사고 유형
  investigation_accident_type_level2: varchar("investigation_accident_type_level2", { length: 50 }),

  // 원본 사고 개요 (읽기용)
  original_acci_summary: text("original_acci_summary"),

  // 수정 또는 보완된 사고 개요
  investigation_acci_summary: text("investigation_acci_summary"),

  // 원본 사고 상세 (읽기용)
  original_acci_detail: text("original_acci_detail"),

  // 수정 또는 보완된 사고 상세
  investigation_acci_detail: text("investigation_acci_detail"),

  // 원본 재해자 수 (읽기용)
  original_victim_count: integer("original_victim_count"),

  // 수정 또는 보완된 재해자 수
  investigation_victim_count: integer("investigation_victim_count"),

  // 원본 재해자1 이름 (읽기용)
  original_victim_name_1: varchar("original_victim_name_1", { length: 100 }),

  // 수정 또는 보완된 재해자1 이름
  investigation_victim_name_1: varchar("investigation_victim_name_1", { length: 100 }),

  // 원본 재해자1 나이 (읽기용)
  original_victim_age_1: integer("original_victim_age_1"),

  // 수정 또는 보완된 재해자1 나이
  investigation_victim_age_1: integer("investigation_victim_age_1"),

  // 원본 재해자1 소속 (읽기용)
  original_victim_belong_1: varchar("original_victim_belong_1", { length: 100 }),

  // 수정 또는 보완된 재해자1 소속
  investigation_victim_belong_1: varchar("investigation_victim_belong_1", { length: 100 }),

  // 원본 재해자1 협력업체 여부 (읽기용)
  original_is_contractor_1: varchar("original_is_contractor_1", { length: 10 }),

  // 수정 또는 보완된 재해자1 협력업체 여부
  investigation_is_contractor_1: varchar("investigation_is_contractor_1", { length: 10 }),

  // 원본 재해자1 협력업체명 (읽기용)
  original_contractor_name_1: varchar("original_contractor_name_1", { length: 100 }),

  // 수정 또는 보완된 재해자1 협력업체명
  investigation_contractor_name_1: varchar("investigation_contractor_name_1", { length: 100 }),

  // 원본 재해자1 직무 (읽기용)
  original_victim_duty_1: varchar("original_victim_duty_1", { length: 100 }),

  // 수정 또는 보완된 재해자1 직무
  investigation_victim_duty_1: varchar("investigation_victim_duty_1", { length: 100 }),

  // 원본 재해자1 부상 유형 (읽기용)
  original_injury_type_1: varchar("original_injury_type_1", { length: 50 }),

  // 수정 또는 보완된 재해자1 부상 유형
  investigation_injury_type_1: varchar("investigation_injury_type_1", { length: 50 }),

  // 원본 재해자1 보호구 착용 여부 (읽기용)
  original_ppe_worn_1: varchar("original_ppe_worn_1", { length: 50 }),

  // 수정 또는 보완된 재해자1 보호구 착용 여부
  investigation_ppe_worn_1: varchar("investigation_ppe_worn_1", { length: 50 }),

  // 원본 재해자1 응급조치 내역 (읽기용)
  original_first_aid_1: text("original_first_aid_1"),

  // 수정 또는 보완된 재해자1 응급조치 내역
  investigation_first_aid_1: text("investigation_first_aid_1"),

  // 조사 단계에서 추가로 찍은 현장 사진 파일 ID 목록
  investigation_scene_photos: text("investigation_scene_photos"),

  // 조사 단계에서 추가로 받은 관계자 진술서 파일 ID 목록
  investigation_statement_docs: text("investigation_statement_docs"),

  // 조사 단계에서 추가로 받은 기타 문서 파일 ID 목록
  investigation_etc_documents: text("investigation_etc_documents"),

  // 조사보고서 최초 보고 일시
  investigation_first_report_time: timestamp("investigation_first_report_time"),

  // 조사보고서 보고 경로 (현재 수정된 값)
  investigation_report_channel: varchar("investigation_report_channel", { length: 50 }),

  // 조사 단계에서 수정된 업무성 사고 분류
  investigation_work_related_type: varchar("investigation_work_related_type", { length: 20 }),

  // 피해의 정도 (사망/중상/경상 등)
  damage_severity: varchar("damage_severity", { length: 20 }),

  // 사망자 수 (조사 단계에서 집계)
  death_count: integer("death_count"),

  // 부상자 수 (조사 단계에서 집계)
  injured_count: integer("injured_count"),

  // 피해금액 (설비 수리비, 생산 손실 등)
  damage_cost: integer("damage_cost"),

  // 부상 부위 상세 (예: 좌측 손목 골절)
  injury_location_detail: varchar("injury_location_detail", { length: 100 }),

  // 재해자 복귀일 (예정 또는 실제)
  victim_return_date: timestamp("victim_return_date"),

  // 직접 원인 (조사자가 입력)
  direct_cause: text("direct_cause"),

  // 근본 원인 (조사자가 입력)
  root_cause: text("root_cause"),

  // 재발방지대책 요약 (조사자가 입력)
  corrective_actions: text("corrective_actions"),

  // 대책 실행 일정 (날짜/시간 형식 문자열)
  action_schedule: varchar("action_schedule", { length: 100 }),

  // 대책 이행 확인자 (조치 완료 시 서명 또는 이름)
  action_verifier: varchar("action_verifier", { length: 100 }),

  // 조사보고서용 추가 현장 사진 파일 ID 목록
  investigation_photos: text("investigation_photos"),

  // 조사보고서용 장비·설비 점검 결과 문서
  equipment_inspection_report: text("equipment_inspection_report"),

  // 조사보고서용 추가 관계자 진술서 파일 ID 목록
  witness_statements: text("witness_statements"),

  // 사고 재구성 도면/흐름도 파일 ID
  incident_flow_diagram: text("incident_flow_diagram"),

  // 조사 종합 결론 (장문)
  investigation_conclusion: text("investigation_conclusion"),

  // 조사자 서명 (이미지 ID 또는 텍스트)
  investigator_signature: varchar("investigator_signature", { length: 100 }),

  // 조사보고서 작성일
  report_written_date: timestamp("report_written_date"),

  // 조사 진행상태 (예: 조사 미착수/진행 중/대책 이행 중/완료)
  investigation_status: varchar("investigation_status", { length: 20 }),

  // 조사 결과 요약 (간략)
  investigation_summary: text("investigation_summary"),

  // 조사보고서 링크(PDF 등) 또는 첨부 파일 ID
  investigation_report_link: varchar("investigation_report_link", { length: 255 }),

  // 법적 보고 여부 (예: Y/N)
  legal_report_flag: varchar("legal_report_flag", { length: 20 }),

  // 위험성 평가서 번호(RA)
  ra_number: varchar("ra_number", { length: 50 }),

  // 보험 처리 현황 (예: 진행 중/완료)
  insurance_status: varchar("insurance_status", { length: 50 }),

  // 사고 관련 교육 또는 조치 이력 (콤마 구분 문자열)
  training_action_history: varchar("training_action_history", { length: 255 }),
});
