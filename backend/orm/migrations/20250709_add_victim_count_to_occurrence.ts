/**
 * @file migrations/20250709_add_victim_count_to_occurrence.ts
 * @description occurrence_report 테이블에 victim_count 필드를 추가하는 마이그레이션
 */

import { sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

// 마이그레이션 실행 (UP)
export const up = async (db: NodePgDatabase<any>) => {
  await db.execute(sql`
    -- victim_count 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'occurrence_report' AND column_name = 'victim_count'
      ) THEN
        ALTER TABLE "occurrence_report" ADD COLUMN "victim_count" INTEGER DEFAULT 0;
      END IF;
    END $$;
  `);
};

// 마이그레이션 롤백 (DOWN)
export const down = async (db: NodePgDatabase<any>) => {
  await db.execute(sql`
    -- victim_count 필드 삭제 (존재하는 경우)
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'occurrence_report' AND column_name = 'victim_count'
      ) THEN
        ALTER TABLE "occurrence_report" DROP COLUMN "victim_count";
      END IF;
    END $$;
  `);
}; 