/**
 * @file migrations/index.ts
 * @description
 *  - 모든 마이그레이션 파일을 가져와서 순차적으로 실행하는 진입점
 *  - 애플리케이션 시작 시 `runMigrations()` 함수를 호출하여 DB 스키마 동기화
 */

import { db } from '../index';
import { sql } from 'drizzle-orm';

// 마이그레이션 파일 임포트
import * as createCompanyTables from './20240515_create_company_tables';
import * as createOccurrenceTable from './20240604_create_occurrence_table';
import * as createInvestigationTable from './20240605_create_investigation_table';
import * as createHistoryTable from './20240606_create_history_table';
import * as addTimestampsToOccurrenceTable from './20240607_add_timestamps_to_occurrence_table';
import * as createVictimsTable from './20240608_create_victims_table';
import * as createReportFormSettingsTable from './20240609_create_report_form_settings_table';
import * as createFileTables from './20240610_create_file_tables';
import * as addMissingFieldsToOccurrence from './20250131_add_missing_fields_to_occurrence';
import * as addMissingFieldsToVictims from './20250131_add_missing_fields_to_victims';
import * as addVictimCountToOccurrence from './20250709_add_victim_count_to_occurrence';

// 마이그레이션 이력 테이블 생성 쿼리
const createMigrationHistoryTable = sql`
  CREATE TABLE IF NOT EXISTS "migration_history" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "applied_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// 마이그레이션 실행 여부 확인 쿼리
const getMigrationStatus = async (name: string) => {
  const result = await db().execute(
    sql`SELECT * FROM "migration_history" WHERE "name" = ${name}`
  );
  return result.rows.length > 0;
};

// 마이그레이션 완료 후 이력 기록 쿼리
const recordMigration = async (name: string) => {
  await db().execute(
    sql`INSERT INTO "migration_history" ("name") VALUES (${name})`
  );
};

// 모든 마이그레이션 파일과 이름 매핑
const migrations = [
  { name: '20240515_create_company_tables', module: createCompanyTables },
  { name: '20240604_create_occurrence_table', module: createOccurrenceTable },
  { name: '20240605_create_investigation_table', module: createInvestigationTable },
  { name: '20240606_create_history_table', module: createHistoryTable },
  { name: '20240607_add_timestamps_to_occurrence_table', module: addTimestampsToOccurrenceTable },
  { name: '20240608_create_victims_table', module: createVictimsTable },
  { name: '20240609_create_report_form_settings_table', module: createReportFormSettingsTable },
  { name: '20240610_create_file_tables', module: createFileTables },
  { name: '20250131_add_missing_fields_to_occurrence', module: addMissingFieldsToOccurrence },
  { name: '20250131_add_missing_fields_to_victims', module: addMissingFieldsToVictims },
  { name: '20250709_add_victim_count_to_occurrence', module: addVictimCountToOccurrence },
];

// 마이그레이션 실행 함수
export const runMigrations = async () => {
  console.log('마이그레이션 시작...');

  try {
    // 마이그레이션 이력 테이블 생성
    await db().execute(createMigrationHistoryTable);

    // 각 마이그레이션 파일 순차 실행
    for (const migration of migrations) {
      const isApplied = await getMigrationStatus(migration.name);
      
      if (!isApplied) {
        console.log(`마이그레이션 실행 중: ${migration.name}`);
        await migration.module.up(db());
        await recordMigration(migration.name);
        console.log(`마이그레이션 완료: ${migration.name}`);
      } else {
        console.log(`마이그레이션 이미 적용됨: ${migration.name}`);
      }
    }

    console.log('마이그레이션 완료!');
  } catch (error) {
    console.error('마이그레이션 오류:', error);
    throw error;
  }
};

/**
 * 마이그레이션 롤백 함수
 */
export async function rollbackMigrations() {
  try {
    console.log("마이그레이션 롤백 시작...");
    
    // 보고서 양식 설정 테이블 삭제
    await createReportFormSettingsTable.down(db());
    
    // 사고 이력 테이블 삭제
    await createHistoryTable.down(db());
    
    // 사고 조사보고서 테이블 삭제
    await createInvestigationTable.down(db());
    
    // 사고 발생보고서 테이블 삭제
    await createOccurrenceTable.down(db());
    
    // 회사 및 사업장 테이블 삭제 (역순으로 실행)
    await createCompanyTables.down(db());
    
    console.log("마이그레이션 롤백 완료!");
  } catch (error) {
    console.error("마이그레이션 롤백 중 오류:", error);
    throw error;
  }
} 