/**
 * @file migrations/20240608_create_victims_table.ts
 * @description
 *  - 재해자 정보 테이블(victims)을 생성하는 마이그레이션
 *  - 사고 발생보고서 테이블에 보고자 정보 필드 추가
 */

import { sql } from "drizzle-orm";

// 재해자 테이블 생성 쿼리
export const createVictimsTable = sql`
  CREATE TABLE IF NOT EXISTS "victims" (
    "victim_id" SERIAL PRIMARY KEY,
    "accident_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100),
    "age" INTEGER,
    "belong" VARCHAR(100),
    "duty" VARCHAR(100),
    "injury_type" VARCHAR(100),
    "ppe_worn" VARCHAR(100),
    "first_aid" TEXT,
    "birth_date" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("accident_id") REFERENCES "occurrence_report"("accident_id") ON DELETE CASCADE
  );
  
  -- 인덱스 생성
  CREATE INDEX IF NOT EXISTS "idx_victims_accident_id" ON "victims"("accident_id");
`;

// 보고자 정보 필드 추가 쿼리
export const addReporterFieldsToOccurrenceReport = sql`
  -- 협력업체명 필드 추가 (존재하지 않는 경우)
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'occurrence_report' AND column_name = 'contractor_name'
    ) THEN
      ALTER TABLE "occurrence_report" ADD COLUMN "contractor_name" VARCHAR(100);
    END IF;
  END $$;

  -- 보고자 이름 필드 추가 (존재하지 않는 경우)
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'occurrence_report' AND column_name = 'reporter_name'
    ) THEN
      ALTER TABLE "occurrence_report" ADD COLUMN "reporter_name" VARCHAR(100);
    END IF;
  END $$;

  -- 보고자 직책 필드 추가 (존재하지 않는 경우)
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'occurrence_report' AND column_name = 'reporter_position'
    ) THEN
      ALTER TABLE "occurrence_report" ADD COLUMN "reporter_position" VARCHAR(100);
    END IF;
  END $$;

  -- 보고자 소속 필드 추가 (존재하지 않는 경우)
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'occurrence_report' AND column_name = 'reporter_belong'
    ) THEN
      ALTER TABLE "occurrence_report" ADD COLUMN "reporter_belong" VARCHAR(100);
    END IF;
  END $$;
`;

// 실행 함수
export async function up(db: any) {
  console.log("마이그레이션 시작: 재해자 테이블 생성 및 보고자 필드 추가");
  
  // 재해자 테이블 생성
  await db.execute(createVictimsTable);
  console.log("재해자 테이블 생성 완료");
  
  // 보고자 정보 필드 추가
  await db.execute(addReporterFieldsToOccurrenceReport);
  console.log("보고자 정보 필드 추가 완료");
  
  console.log("마이그레이션 완료: 재해자 테이블 생성 및 보고자 필드 추가");
}

// 롤백 함수
export async function down(db: any) {
  // 추가된 보고자 필드 제거
  await db.execute(sql`
    ALTER TABLE "occurrence_report" 
    DROP COLUMN IF EXISTS "reporter_name",
    DROP COLUMN IF EXISTS "reporter_position",
    DROP COLUMN IF EXISTS "reporter_belong",
    DROP COLUMN IF EXISTS "contractor_name";
  `);
  
  // 재해자 테이블 삭제
  await db.execute(sql`DROP TABLE IF EXISTS "victims";`);
  
  console.log("롤백 완료: 재해자 테이블 삭제 및 보고자 필드 제거");
} 