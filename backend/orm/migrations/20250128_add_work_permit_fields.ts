/**
 * @file migrations/20250128_add_work_permit_fields.ts
 * @description
 *  - occurrence_report 테이블에 작업허가대상 관련 필드(work_permit_required, work_permit_number, work_permit_status)를 추가하는 마이그레이션
 */

import { sql } from "drizzle-orm";

export const addWorkPermitFields = sql`
  -- 작업허가대상 여부 필드 추가
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'occurrence_report' AND column_name = 'work_permit_required'
    ) THEN
      ALTER TABLE "occurrence_report" ADD COLUMN "work_permit_required" VARCHAR(20);
    END IF;
  END $$;

  -- 작업허가번호 필드 추가
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'occurrence_report' AND column_name = 'work_permit_number'
    ) THEN
      ALTER TABLE "occurrence_report" ADD COLUMN "work_permit_number" VARCHAR(50);
    END IF;
  END $$;

  -- 작업허가상태 필드 추가
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'occurrence_report' AND column_name = 'work_permit_status'
    ) THEN
      ALTER TABLE "occurrence_report" ADD COLUMN "work_permit_status" VARCHAR(20);
    END IF;
  END $$;
`; 