/**
 * @file migrations/20240605_create_investigation_table.ts
 * @description
 *  - 사고 조사보고서(investigation_report) 테이블을 생성하는 마이그레이션 파일
 */

import { sql } from "drizzle-orm";

// 사고 조사보고서 테이블 생성 쿼리
export const createInvestigationReportTable = sql`
  CREATE TABLE IF NOT EXISTS "investigation_report" (
    "accident_id" VARCHAR(50) PRIMARY KEY,
    "investigation_start_time" TIMESTAMP,
    "investigation_end_time" TIMESTAMP,
    "investigation_team_lead" VARCHAR(100),
    "investigation_team_members" TEXT,
    "investigation_location" VARCHAR(255),
    "original_global_accident_no" VARCHAR(50),
    "investigation_global_accident_no" VARCHAR(50),
    "original_accident_id" VARCHAR(50),
    "investigation_accident_id" VARCHAR(50),
    "original_acci_time" TIMESTAMP,
    "investigation_acci_time" TIMESTAMP,
    "original_acci_location" VARCHAR(255),
    "investigation_acci_location" VARCHAR(255),
    "original_company_name" VARCHAR(100),
    "investigation_company_name" VARCHAR(100),
    "original_site_name" VARCHAR(100),
    "investigation_site_name" VARCHAR(100),
    "original_is_contractor" BOOLEAN,
    "investigation_is_contractor" BOOLEAN,
    "original_victim_count" INTEGER,
    "investigation_victim_count" INTEGER,
    "original_accident_type_level1" VARCHAR(20),
    "investigation_accident_type_level1" VARCHAR(20),
    "original_accident_type_level2" VARCHAR(50),
    "investigation_accident_type_level2" VARCHAR(50),
    "original_acci_summary" TEXT,
    "investigation_acci_summary" TEXT,
    "original_acci_detail" TEXT,
    "investigation_acci_detail" TEXT,
    "original_scene_photos" TEXT,
    "investigation_scene_photos" TEXT,
    "original_cctv_video" TEXT,
    "investigation_cctv_video" TEXT,
    "original_statement_docs" TEXT,
    "investigation_statement_docs" TEXT,
    "original_etc_documents" TEXT,
    "investigation_etc_documents" TEXT,
    "investigation_first_report_time" TIMESTAMP,
    "investigation_report_channel" VARCHAR(50),
    "investigation_work_related_type" VARCHAR(20),
    "damage_severity" VARCHAR(20),
    "death_count" INTEGER,
    "injured_count" INTEGER,
    "damage_cost" INTEGER,
    "injury_location_detail" VARCHAR(100),
    "victim_return_date" TIMESTAMP,
    "direct_cause" TEXT,
    "root_cause" TEXT,
    "corrective_actions" TEXT,
    "action_schedule" VARCHAR(100),
    "action_verifier" VARCHAR(100),
    "investigation_photos" TEXT,
    "equipment_inspection_report" TEXT,
    "witness_statements" TEXT,
    "incident_flow_diagram" TEXT,
    "investigation_conclusion" TEXT,
    "investigator_signature" VARCHAR(100),
    "report_written_date" TIMESTAMP,
    "investigation_status" VARCHAR(20),
    "investigation_summary" TEXT,
    "investigation_report_link" VARCHAR(255),
    "legal_report_flag" VARCHAR(20),
    "ra_number" VARCHAR(50),
    "insurance_status" VARCHAR(50),
    "training_action_history" VARCHAR(255),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("accident_id") REFERENCES "occurrence_report" ("accident_id") ON DELETE CASCADE
  );
`;

// 실행 함수
export async function up(db: any) {
  console.log("조사보고서 테이블 마이그레이션 시작...");
  await db.execute(createInvestigationReportTable);
  console.log("조사보고서 테이블 마이그레이션 완료");
}

// 롤백 함수
export async function down(db: any) {
  await db.execute(sql`DROP TABLE IF EXISTS "investigation_report";`);
} 