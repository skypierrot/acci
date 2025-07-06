/**
 * @file migrations/20250128_add_victim_fields.ts
 * @description
 *  - 재해자 정보 테이블(victims)에 상해부위, 의사소견, 기타 필드를 추가하는 마이그레이션
 */

import { sql } from "drizzle-orm";

// 재해자 테이블에 새로운 필드 추가 쿼리
export const addVictimFields = sql`
  -- 상해부위 필드 추가 (존재하지 않는 경우)
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

  -- 의사소견 필드 추가 (존재하지 않는 경우)
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

  -- 교육 이수여부 필드 추가 (존재하지 않는 경우)
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

  -- 기타 필드 추가 (존재하지 않는 경우)
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
`; 