"use strict";
/**
 * @file orm/schema/history.ts
 * @description
 *  - Drizzle ORM을 통해 `accident_history` 뷰(또는 테이블) 스키마를 정의합니다.
 *  - 발생보고/조사보고 데이터를 조인하여 한눈에 조회할 수 있는 Denormalized View용 테이블입니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.accidentHistory = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.accidentHistory = (0, pg_core_1.pgTable)("accident_history", {
    // 사고 ID (Primary Key, 발생보고 accident_id와 동일)
    accident_id: (0, pg_core_1.varchar)("accident_id", { length: 50 }).primaryKey(),
    // 회사명 (발생보고서 기준)
    company_name: (0, pg_core_1.varchar)("company_name", { length: 100 }),
    // 사업장명 (발생보고서 기준)
    site_name: (0, pg_core_1.varchar)("site_name", { length: 100 }),
    // 사고 발생 일시 (발생보고서 기준)
    acci_time: (0, pg_core_1.timestamp)("acci_time"),
    // 사고 발생 장소 (발생보고서 기준)
    acci_location: (0, pg_core_1.varchar)("acci_location", { length: 255 }),
    // 협력업체 여부 (발생보고서 기준)
    is_contractor: (0, pg_core_1.boolean)("is_contractor"),
    // 재해자 소속 (발생보고서 기준, 첫 번째 재해자 기준)
    victim_belong: (0, pg_core_1.varchar)("victim_belong", { length: 100 }),
    // 재해발생의 형태 (발생보고서 기준)
    accident_type_level1: (0, pg_core_1.varchar)("accident_type_level1", { length: 20 }),
    // 사고 유형 (발생보고서 기준)
    accident_type_level2: (0, pg_core_1.varchar)("accident_type_level2", { length: 50 }),
    // 사망자 수 (조사보고서 기준)
    death_count: (0, pg_core_1.integer)("death_count"),
    // 부상자 수 (조사보고서 기준)
    injured_count: (0, pg_core_1.integer)("injured_count"),
    // 피해금액 (조사보고서 기준)
    damage_cost: (0, pg_core_1.integer)("damage_cost"),
    // 피해의 정도 (조사보고서 기준)
    damage_severity: (0, pg_core_1.varchar)("damage_severity", { length: 20 }),
    // 기타 분류 (발생보고서 기준)
    misc_classification: (0, pg_core_1.varchar)("misc_classification", { length: 50 }),
    // 사고 개요 (발생보고서 기준)
    acci_summary: (0, pg_core_1.text)("acci_summary"),
    // 직접 원인 (조사보고서 기준)
    direct_cause: (0, pg_core_1.text)("direct_cause"),
    // 근본 원인 (조사보고서 기준)
    root_cause: (0, pg_core_1.text)("root_cause"),
    // 부상부위 상세 (조사보고서 기준)
    injury_location_detail: (0, pg_core_1.varchar)("injury_location_detail", { length: 100 }),
    // 재발방지대책 요약 (조사보고서 기준)
    corrective_actions: (0, pg_core_1.text)("corrective_actions"),
    // 재해자 복귀일 (조사보고서 기준)
    victim_return_date: (0, pg_core_1.timestamp)("victim_return_date"),
    // 조사 진행상태 (조사보고서 기준)
    investigation_status: (0, pg_core_1.varchar)("investigation_status", { length: 20 }),
    // 조사 착수 일시 (조사보고서 기준)
    investigation_start_time: (0, pg_core_1.timestamp)("investigation_start_time"),
    // 조사 완료 일시 (조사보고서 기준)
    investigation_end_time: (0, pg_core_1.timestamp)("investigation_end_time"),
    // 조사자 서명 (조사보고서 기준)
    investigator_signature: (0, pg_core_1.varchar)("investigator_signature", { length: 100 }),
    // 법적 보고 여부 (조사보고서 기준)
    legal_report_flag: (0, pg_core_1.varchar)("legal_report_flag", { length: 20 }),
});
