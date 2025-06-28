/**
 * @file migrations/20240607_add_timestamps_to_occurrence_table.ts
 * @description
 *  - victims_json, created_at, updated_at 필드가 없는 경우를 대비한 마이그레이션
 */

import { sql } from "drizzle-orm";

// 필드 추가 쿼리
export const addFieldsToOccurrenceTable = sql`
  -- victims_json 필드 추가 (존재하지 않는 경우)
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'occurrence_report' AND column_name = 'victims_json'
    ) THEN
      ALTER TABLE "occurrence_report" ADD COLUMN "victims_json" TEXT;
    END IF;
  END $$;

  -- global_accident_no 필드 추가 (존재하지 않는 경우)
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'occurrence_report' AND column_name = 'global_accident_no'
    ) THEN
      ALTER TABLE "occurrence_report" ADD COLUMN "global_accident_no" VARCHAR(50);
    END IF;
  END $$;

  -- created_at 필드 추가 (존재하지 않는 경우)
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'occurrence_report' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE "occurrence_report" ADD COLUMN "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
  END $$;

  -- updated_at 필드 추가 (존재하지 않는 경우)
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'occurrence_report' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE "occurrence_report" ADD COLUMN "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
  END $$;
`;

// 실행 함수
export async function up(db: any) {
  await db.execute(addFieldsToOccurrenceTable);
  console.log("마이그레이션 완료: 필드 추가됨 (victims_json, global_accident_no, created_at, updated_at)");
}

// 롤백 함수 (이 마이그레이션은 롤백하지 않음)
export async function down(db: any) {
  console.log("이 마이그레이션은 안전을 위해 롤백을 지원하지 않습니다.");
} 