/**
 * @file orm/schema/history.ts
 * @description
 *  - Drizzle ORM을 통해 `accident_history` 뷰(또는 테이블) 스키마를 정의합니다.
 *  - 발생보고/조사보고 데이터를 조인하여 한눈에 조회할 수 있는 Denormalized View용 테이블입니다.
 */

import { pgTable, varchar, timestamp, boolean, integer, text } from "drizzle-orm/pg-core";

export const accidentHistory = pgTable("accident_history", {
  // 사고 ID (Primary Key, 발생보고 accident_id와 동일)
  accident_id: varchar("accident_id", { length: 50 }).primaryKey(),

  // 회사명 (발생보고서 기준)
  company_name: varchar("company_name", { length: 100 }),

  // 사업장명 (발생보고서 기준)
  site_name: varchar("site_name", { length: 100 }),

  // 사고 발생 일시 (발생보고서 기준)
  acci_time: timestamp("acci_time"),

  // 사고 발생 장소 (발생보고서 기준)
  acci_location: varchar("acci_location", { length: 255 }),

  // 협력업체 여부 (발생보고서 기준)
  is_contractor: boolean("is_contractor"),

  // 재해자 소속 (발생보고서 기준, 첫 번째 재해자 기준)
  victim_belong: varchar("victim_belong", { length: 100 }),

  // 재해발생의 형태 (발생보고서 기준)
  accident_type_level1: varchar("accident_type_level1", { length: 20 }),

  // 사고 유형 (발생보고서 기준)
  accident_type_level2: varchar("accident_type_level2", { length: 50 }),

  // 사망자 수 (조사보고서 기준)
  death_count: integer("death_count"),

  // 부상자 수 (조사보고서 기준)
  injured_count: integer("injured_count"),

  // 피해금액 (조사보고서 기준)
  damage_cost: integer("damage_cost"),

  // 피해의 정도 (조사보고서 기준)
  damage_severity: varchar("damage_severity", { length: 20 }),

  // 기타 분류 (발생보고서 기준)
  misc_classification: varchar("misc_classification", { length: 50 }),

  // 사고 개요 (발생보고서 기준)
  acci_summary: text("acci_summary"),

  // 직접 원인 (조사보고서 기준)
  direct_cause: text("direct_cause"),

  // 근본 원인 (조사보고서 기준)
  root_cause: text("root_cause"),

  // 부상부위 상세 (조사보고서 기준)
  injury_location_detail: varchar("injury_location_detail", { length: 100 }),

  // 재발방지대책 요약 (조사보고서 기준)
  corrective_actions: text("corrective_actions"),

  // 재해자 복귀일 (조사보고서 기준)
  victim_return_date: timestamp("victim_return_date"),

  // 조사 진행상태 (조사보고서 기준)
  investigation_status: varchar("investigation_status", { length: 20 }),

  // 조사 착수 일시 (조사보고서 기준)
  investigation_start_time: timestamp("investigation_start_time"),

  // 조사 완료 일시 (조사보고서 기준)
  investigation_end_time: timestamp("investigation_end_time"),

  // 조사자 서명 (조사보고서 기준)
  investigator_signature: varchar("investigator_signature", { length: 100 }),

  // 법적 보고 여부 (조사보고서 기준)
  legal_report_flag: varchar("legal_report_flag", { length: 20 }),
});
