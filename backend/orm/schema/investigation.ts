/**
 * @file orm/schema/investigation.ts
 * @description
 *  - Drizzle ORM을 통해 `investigation_report` 테이블 스키마를 정의합니다.
 *  - `occurrence_report.accident_id`를 참조하여 1:1 관계를 맺습니다.
 *  - 실제 데이터베이스 구조와 동일하게 정의 (introspect 결과 기반)
 */

import { pgTable, varchar, timestamp, integer, text, serial } from "drizzle-orm/pg-core";
import { occurrenceReport } from "./occurrence";

export const investigationReport = pgTable("investigation_report", {
	accident_id: varchar("accident_id", { length: 50 }).primaryKey().notNull().references(() => occurrenceReport.accident_id),
	investigation_start_time: timestamp("investigation_start_time", { mode: 'string' }),
	investigation_end_time: timestamp("investigation_end_time", { mode: 'string' }),
	investigation_team_lead: varchar("investigation_team_lead", { length: 100 }),
	investigation_team_members: text("investigation_team_members"),
	investigation_location: varchar("investigation_location", { length: 255 }),
	original_global_accident_no: varchar("original_global_accident_no", { length: 50 }),
	investigation_global_accident_no: varchar("investigation_global_accident_no", { length: 50 }),
	original_accident_id: varchar("original_accident_id", { length: 50 }),
	investigation_accident_id: varchar("investigation_accident_id", { length: 50 }),
	original_acci_time: timestamp("original_acci_time", { mode: 'string' }),
	investigation_acci_time: timestamp("investigation_acci_time", { mode: 'string' }),
	original_weather: varchar("original_weather", { length: 20 }),
	investigation_weather: varchar("investigation_weather", { length: 20 }),
	original_temperature: integer("original_temperature"),
	investigation_temperature: integer("investigation_temperature"),
	original_humidity: integer("original_humidity"),
	investigation_humidity: integer("investigation_humidity"),
	original_wind_speed: integer("original_wind_speed"),
	investigation_wind_speed: integer("investigation_wind_speed"),
	original_weather_special: varchar("original_weather_special", { length: 255 }),
	investigation_weather_special: varchar("investigation_weather_special", { length: 255 }),
	original_acci_location: varchar("original_acci_location", { length: 255 }),
	investigation_acci_location: varchar("investigation_acci_location", { length: 255 }),
	original_accident_type_level1: varchar("original_accident_type_level1", { length: 20 }),
	investigation_accident_type_level1: varchar("investigation_accident_type_level1", { length: 20 }),
	original_accident_type_level2: varchar("original_accident_type_level2", { length: 50 }),
	investigation_accident_type_level2: varchar("investigation_accident_type_level2", { length: 50 }),
	original_accident_name: varchar("original_accident_name", { length: 255 }),
	investigation_accident_name: varchar("investigation_accident_name", { length: 255 }),
	original_acci_summary: text("original_acci_summary"),
	investigation_acci_summary: text("investigation_acci_summary"),
	original_acci_detail: text("original_acci_detail"),
	investigation_acci_detail: text("investigation_acci_detail"),
	original_victim_count: integer("original_victim_count"),
	investigation_victim_count: integer("investigation_victim_count"),
	investigation_victims_json: text("investigation_victims_json"),
	
	// 피해 정보
	damage_cost: integer("damage_cost"),
	
	// 원인 분석
	direct_cause: text("direct_cause"),
	root_cause: text("root_cause"),
	
	// 대책 정보
	corrective_actions: text("corrective_actions"),
	action_schedule: varchar("action_schedule", { length: 255 }),
	action_verifier: varchar("action_verifier", { length: 100 }),
	
	// 조사 결론
	investigation_conclusion: text("investigation_conclusion"),
	investigation_status: varchar("investigation_status", { length: 50 }),
	investigation_summary: text("investigation_summary"),
	investigator_signature: varchar("investigator_signature", { length: 100 }),
	report_written_date: timestamp("report_written_date", { mode: 'string' }),
	
	// 구조적 원인분석 및 재발방지대책 필드 추가
	cause_analysis: text("cause_analysis"),
	prevention_actions: text("prevention_actions"),
	
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow(),
});

/**
 * 개선조치(재발방지대책) ActionItem 테이블 스키마 정의
 * - investigation_report.accident_id와 1:N 관계
 * - 각 개선조치별로 개별 row로 저장 (상태, 담당자, 기한, 명칭 등 관리)
 */
export const correctiveAction = pgTable("corrective_action", {
  id: serial("id").primaryKey(), // PK: 자동 증가
  investigation_id: varchar("investigation_id", { length: 50 }).notNull(), // 조사보고서 accident_id 참조
  action_type: varchar("action_type", { length: 20 }), // 기술적/교육적/관리적
  title: varchar("title", { length: 255 }), // 개선계획 명칭(제목)
  improvement_plan: text("improvement_plan"), // 개선 계획(상세 내용)
  progress_status: varchar("progress_status", { length: 20 }), // 대기/진행/완료/지연 등
  scheduled_date: varchar("scheduled_date", { length: 20 }), // 완료 예정일(YYYY-MM-DD)
  responsible_person: varchar("responsible_person", { length: 100 }), // 담당자
  completion_date: varchar("completion_date", { length: 20 }), // 완료일(YYYY-MM-DD)
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
