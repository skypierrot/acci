/**
 * @file migrations/20240606_create_history_table.ts
 * @description
 *  - 사고 이력(accident_history) 테이블을 생성하는 마이그레이션 파일
 */

import { sql } from "drizzle-orm";

// 사고 이력 테이블 생성 쿼리
export const createAccidentHistoryTable = sql`
  CREATE TABLE IF NOT EXISTS "accident_history" (
    "id" SERIAL PRIMARY KEY,
    "accident_id" VARCHAR(50) NOT NULL,
    "action_type" VARCHAR(20) NOT NULL,
    "action_time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" VARCHAR(50),
    "user_name" VARCHAR(100),
    "description" TEXT,
    "data_snapshot" TEXT,
    FOREIGN KEY ("accident_id") REFERENCES "occurrence_report" ("accident_id") ON DELETE CASCADE
  );
`;

// 실행 함수
export async function up(db: any) {
  await db.execute(createAccidentHistoryTable);
}

// 롤백 함수
export async function down(db: any) {
  await db.execute(sql`DROP TABLE IF EXISTS "accident_history";`);
} 