/**
 * @file migrations/20250131_add_missing_fields_to_occurrence.ts
 * @description
 *  - occurrence_report 테이블에 누락된 필드들을 추가하는 마이그레이션
 *  - attachments, report_channel_no, victim_name, victim_age, victim_belong, victim_duty, injury_type, ppe_worn, first_aid 필드 추가
 */

import { sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

// 마이그레이션 실행 (UP)
export const up = async (db: NodePgDatabase<any>) => {
  await db.execute(sql`
    -- attachments 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'occurrence_report' AND column_name = 'attachments'
      ) THEN
        ALTER TABLE "occurrence_report" ADD COLUMN "attachments" TEXT;
      END IF;
    END $$;

    -- report_channel_no 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'occurrence_report' AND column_name = 'report_channel_no'
      ) THEN
        ALTER TABLE "occurrence_report" ADD COLUMN "report_channel_no" VARCHAR(50);
      END IF;
    END $$;

    -- victim_name 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'occurrence_report' AND column_name = 'victim_name'
      ) THEN
        ALTER TABLE "occurrence_report" ADD COLUMN "victim_name" VARCHAR(100);
      END IF;
    END $$;

    -- victim_age 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'occurrence_report' AND column_name = 'victim_age'
      ) THEN
        ALTER TABLE "occurrence_report" ADD COLUMN "victim_age" INTEGER;
      END IF;
    END $$;

    -- victim_belong 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'occurrence_report' AND column_name = 'victim_belong'
      ) THEN
        ALTER TABLE "occurrence_report" ADD COLUMN "victim_belong" VARCHAR(100);
      END IF;
    END $$;

    -- victim_duty 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'occurrence_report' AND column_name = 'victim_duty'
      ) THEN
        ALTER TABLE "occurrence_report" ADD COLUMN "victim_duty" VARCHAR(100);
      END IF;
    END $$;

    -- injury_type 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'occurrence_report' AND column_name = 'injury_type'
      ) THEN
        ALTER TABLE "occurrence_report" ADD COLUMN "injury_type" VARCHAR(100);
      END IF;
    END $$;

    -- ppe_worn 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'occurrence_report' AND column_name = 'ppe_worn'
      ) THEN
        ALTER TABLE "occurrence_report" ADD COLUMN "ppe_worn" VARCHAR(100);
      END IF;
    END $$;

    -- first_aid 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'occurrence_report' AND column_name = 'first_aid'
      ) THEN
        ALTER TABLE "occurrence_report" ADD COLUMN "first_aid" TEXT;
      END IF;
    END $$;
  `);
};

// 마이그레이션 롤백 (DOWN)
export const down = async (db: NodePgDatabase<any>) => {
  await db.execute(sql`
    -- 추가된 필드들 제거
    ALTER TABLE "occurrence_report" DROP COLUMN IF EXISTS "attachments";
    ALTER TABLE "occurrence_report" DROP COLUMN IF EXISTS "report_channel_no";
    ALTER TABLE "occurrence_report" DROP COLUMN IF EXISTS "victim_name";
    ALTER TABLE "occurrence_report" DROP COLUMN IF EXISTS "victim_age";
    ALTER TABLE "occurrence_report" DROP COLUMN IF EXISTS "victim_belong";
    ALTER TABLE "occurrence_report" DROP COLUMN IF EXISTS "victim_duty";
    ALTER TABLE "occurrence_report" DROP COLUMN IF EXISTS "injury_type";
    ALTER TABLE "occurrence_report" DROP COLUMN IF EXISTS "ppe_worn";
    ALTER TABLE "occurrence_report" DROP COLUMN IF EXISTS "first_aid";
  `);
}; 