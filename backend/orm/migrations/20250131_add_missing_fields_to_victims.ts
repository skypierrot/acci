/**
 * @file migrations/20250131_add_missing_fields_to_victims.ts
 * @description
 *  - victims 테이블에 누락된 필드들을 추가하는 마이그레이션
 *  - injury_location, medical_opinion, training_completed, etc_notes 필드 추가
 */

import { sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

// 마이그레이션 실행 (UP)
export const up = async (db: NodePgDatabase<any>) => {
  await db.execute(sql`
    -- injury_location 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'victims' AND column_name = 'injury_location'
      ) THEN
        ALTER TABLE "victims" ADD COLUMN "injury_location" VARCHAR(200);
      END IF;
    END $$;

    -- medical_opinion 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'victims' AND column_name = 'medical_opinion'
      ) THEN
        ALTER TABLE "victims" ADD COLUMN "medical_opinion" TEXT;
      END IF;
    END $$;

    -- training_completed 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'victims' AND column_name = 'training_completed'
      ) THEN
        ALTER TABLE "victims" ADD COLUMN "training_completed" VARCHAR(50);
      END IF;
    END $$;

    -- etc_notes 필드 추가 (존재하지 않는 경우)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'victims' AND column_name = 'etc_notes'
      ) THEN
        ALTER TABLE "victims" ADD COLUMN "etc_notes" TEXT;
      END IF;
    END $$;
  `);
};

// 마이그레이션 롤백 (DOWN)
export const down = async (db: NodePgDatabase<any>) => {
  await db.execute(sql`
    -- 추가된 필드들 제거
    ALTER TABLE "victims" DROP COLUMN IF EXISTS "injury_location";
    ALTER TABLE "victims" DROP COLUMN IF EXISTS "medical_opinion";
    ALTER TABLE "victims" DROP COLUMN IF EXISTS "training_completed";
    ALTER TABLE "victims" DROP COLUMN IF EXISTS "etc_notes";
  `);
}; 