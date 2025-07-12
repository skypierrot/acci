/**
 * @file migrations/20250713_create_property_damages_table.ts
 * @description 물적피해 정보 테이블 생성 마이그레이션
 */

import { db } from '../index';
import { sql } from 'drizzle-orm';

export const up = async (dbInstance: any) => {
  // 물적피해 정보 테이블 생성
  await dbInstance.execute(sql`
    CREATE TABLE IF NOT EXISTS "property_damages" (
      "damage_id" serial PRIMARY KEY NOT NULL,
      "accident_id" varchar(50) NOT NULL,
      "damage_target" varchar(200),
      "estimated_cost" integer,
      "damage_content" text,
      "shutdown_start_date" timestamp,
      "recovery_expected_date" timestamp,
      "recovery_plan" text,
      "etc_notes" text,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

  // 외래키 제약조건 추가
  await dbInstance.execute(sql`
    ALTER TABLE "property_damages" 
    ADD CONSTRAINT "property_damages_accident_id_investigation_report_accident_id_fk" 
    FOREIGN KEY ("accident_id") 
    REFERENCES "public"."investigation_report"("accident_id") 
    ON DELETE cascade ON UPDATE no action;
  `);

  console.log('물적피해 정보 테이블 생성 완료');
};

export const down = async (dbInstance: any) => {
  // 외래키 제약조건 삭제
  await dbInstance.execute(sql`
    ALTER TABLE "property_damages" 
    DROP CONSTRAINT IF EXISTS "property_damages_accident_id_investigation_report_accident_id_fk";
  `);

  // 테이블 삭제
  await dbInstance.execute(sql`DROP TABLE IF EXISTS "property_damages";`);

  console.log('물적피해 정보 테이블 삭제 완료');
}; 