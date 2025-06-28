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
    "investigation_company_name" VARCHAR(100),
    "investigation_site_name" VARCHAR(100),
    "investigation_acci_location" VARCHAR(255),
    "investigation_accident_type_level1" VARCHAR(20),
    "investigation_accident_type_level2" VARCHAR(50),
    "investigation_acci_summary" TEXT,
    "investigation_acci_detail" TEXT,
    "root_cause_analysis" TEXT,
    "preventive_measures" TEXT,
    "corrective_actions" TEXT,
    "investigation_status" VARCHAR(20),
    "approval_status" VARCHAR(20),
    "approval_comment" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("accident_id") REFERENCES "occurrence_report" ("accident_id") ON DELETE CASCADE
  );
`;

// 실행 함수
export async function up(db: any) {
  await db.execute(createInvestigationReportTable);
}

// 롤백 함수
export async function down(db: any) {
  await db.execute(sql`DROP TABLE IF EXISTS "investigation_report";`);
} 