"use strict";
/**
 * @file orm/schema/investigation.ts
 * @description
 *  - Drizzle ORM을 통해 `investigation_report` 테이블 스키마를 정의합니다.
 *  - `occurrence_report.accident_id`를 참조하여 1:1 관계를 맺습니다.
 *  - 실제 데이터베이스 구조와 동일하게 정의 (introspect 결과 기반)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.investigationReport = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const occurrence_1 = require("./occurrence");
exports.investigationReport = (0, pg_core_1.pgTable)("investigation_report", {
    accident_id: (0, pg_core_1.varchar)("accident_id", { length: 50 }).primaryKey().notNull().references(() => occurrence_1.occurrenceReport.accident_id),
    investigation_start_time: (0, pg_core_1.timestamp)("investigation_start_time", { mode: 'string' }),
    investigation_end_time: (0, pg_core_1.timestamp)("investigation_end_time", { mode: 'string' }),
    investigation_team_lead: (0, pg_core_1.varchar)("investigation_team_lead", { length: 100 }),
    investigation_team_members: (0, pg_core_1.text)("investigation_team_members"),
    investigation_location: (0, pg_core_1.varchar)("investigation_location", { length: 255 }),
    original_global_accident_no: (0, pg_core_1.varchar)("original_global_accident_no", { length: 50 }),
    investigation_global_accident_no: (0, pg_core_1.varchar)("investigation_global_accident_no", { length: 50 }),
    original_accident_id: (0, pg_core_1.varchar)("original_accident_id", { length: 50 }),
    investigation_accident_id: (0, pg_core_1.varchar)("investigation_accident_id", { length: 50 }),
    original_acci_time: (0, pg_core_1.timestamp)("original_acci_time", { mode: 'string' }),
    investigation_acci_time: (0, pg_core_1.timestamp)("investigation_acci_time", { mode: 'string' }),
    original_weather: (0, pg_core_1.varchar)("original_weather", { length: 20 }),
    investigation_weather: (0, pg_core_1.varchar)("investigation_weather", { length: 20 }),
    original_temperature: (0, pg_core_1.integer)("original_temperature"),
    investigation_temperature: (0, pg_core_1.integer)("investigation_temperature"),
    original_humidity: (0, pg_core_1.integer)("original_humidity"),
    investigation_humidity: (0, pg_core_1.integer)("investigation_humidity"),
    original_wind_speed: (0, pg_core_1.integer)("original_wind_speed"),
    investigation_wind_speed: (0, pg_core_1.integer)("investigation_wind_speed"),
    original_weather_special: (0, pg_core_1.varchar)("original_weather_special", { length: 255 }),
    investigation_weather_special: (0, pg_core_1.varchar)("investigation_weather_special", { length: 255 }),
    original_acci_location: (0, pg_core_1.varchar)("original_acci_location", { length: 255 }),
    investigation_acci_location: (0, pg_core_1.varchar)("investigation_acci_location", { length: 255 }),
    original_accident_type_level1: (0, pg_core_1.varchar)("original_accident_type_level1", { length: 20 }),
    investigation_accident_type_level1: (0, pg_core_1.varchar)("investigation_accident_type_level1", { length: 20 }),
    original_accident_type_level2: (0, pg_core_1.varchar)("original_accident_type_level2", { length: 50 }),
    investigation_accident_type_level2: (0, pg_core_1.varchar)("investigation_accident_type_level2", { length: 50 }),
    original_acci_summary: (0, pg_core_1.text)("original_acci_summary"),
    investigation_acci_summary: (0, pg_core_1.text)("investigation_acci_summary"),
    original_acci_detail: (0, pg_core_1.text)("original_acci_detail"),
    investigation_acci_detail: (0, pg_core_1.text)("investigation_acci_detail"),
    original_victim_count: (0, pg_core_1.integer)("original_victim_count"),
    investigation_victim_count: (0, pg_core_1.integer)("investigation_victim_count"),
    investigation_victims_json: (0, pg_core_1.text)("investigation_victims_json"),
    // 피해 정보
    damage_cost: (0, pg_core_1.integer)("damage_cost"),
    // 원인 분석
    direct_cause: (0, pg_core_1.text)("direct_cause"),
    root_cause: (0, pg_core_1.text)("root_cause"),
    // 대책 정보
    corrective_actions: (0, pg_core_1.text)("corrective_actions"),
    action_schedule: (0, pg_core_1.varchar)("action_schedule", { length: 255 }),
    action_verifier: (0, pg_core_1.varchar)("action_verifier", { length: 100 }),
    // 조사 결론
    investigation_conclusion: (0, pg_core_1.text)("investigation_conclusion"),
    investigation_status: (0, pg_core_1.varchar)("investigation_status", { length: 50 }),
    investigation_summary: (0, pg_core_1.text)("investigation_summary"),
    investigator_signature: (0, pg_core_1.varchar)("investigator_signature", { length: 100 }),
    report_written_date: (0, pg_core_1.timestamp)("report_written_date", { mode: 'string' }),
    // 구조적 원인분석 및 재발방지대책 필드 추가
    cause_analysis: (0, pg_core_1.text)("cause_analysis"),
    prevention_actions: (0, pg_core_1.text)("prevention_actions"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
