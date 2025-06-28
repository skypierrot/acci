/**
 * @file migrations/20240604_create_occurrence_table.ts
 * @description
 *  - 사고 발생보고서(occurrence_report) 테이블을 생성하는 마이그레이션 파일
 */

import { sql } from "drizzle-orm";

// 사고 발생보고서 테이블 생성 쿼리
export const createOccurrenceReportTable = sql`
  CREATE TABLE IF NOT EXISTS "occurrence_report" (
    "accident_id" VARCHAR(50) PRIMARY KEY,
    "acci_time" TIMESTAMP,
    "company_name" VARCHAR(100),
    "company_code" VARCHAR(20),
    "site_name" VARCHAR(100),
    "site_code" VARCHAR(20),
    "acci_location" VARCHAR(255),
    "is_contractor" BOOLEAN,
    "victim_count" INTEGER,
    "accident_type_level1" VARCHAR(20),
    "accident_type_level2" VARCHAR(50),
    "acci_summary" TEXT,
    "acci_detail" TEXT,
    "scene_photos" TEXT,
    "cctv_video" TEXT,
    "statement_docs" TEXT,
    "etc_documents" TEXT,
    "first_report_time" TIMESTAMP,
    "report_channel" VARCHAR(50),
    "work_related_type" VARCHAR(20),
    "misc_classification" VARCHAR(50),
    "victims_json" TEXT,
    "reporter_name" VARCHAR(100),
    "reporter_position" VARCHAR(100),
    "reporter_belong" VARCHAR(100),
    "global_accident_no" VARCHAR(50),
    "report_channel_no" VARCHAR(50),
    "victim_name" VARCHAR(100),
    "victim_age" INTEGER,
    "victim_belong" VARCHAR(100),
    "victim_duty" VARCHAR(100),
    "injury_type" VARCHAR(100),
    "ppe_worn" VARCHAR(100),
    "first_aid" TEXT,
    "contractor_name" VARCHAR(100),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// 실행 함수
export async function up(db: any) {
  await db.execute(createOccurrenceReportTable);
}

// 롤백 함수
export async function down(db: any) {
  await db.execute(sql`DROP TABLE IF EXISTS "occurrence_report";`);
} 