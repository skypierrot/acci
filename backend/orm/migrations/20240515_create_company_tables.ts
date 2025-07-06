/**
 * @file migrations/20240515_create_company_tables.ts
 * @description
 *  - 회사(company)와 사업장(site) 테이블을 생성하는 마이그레이션 파일
 *  - drizzle-kit을 통해 마이그레이션을 실행합니다.
 */

import { sql } from "drizzle-orm";
import { pgTable, varchar, text } from "drizzle-orm/pg-core";

// 회사 테이블 생성 쿼리
export const createCompanyTable = sql`
  CREATE TABLE IF NOT EXISTS "company" (
    "id" VARCHAR(128) PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL UNIQUE,
    "description" TEXT,
    "address" VARCHAR(255),
    "contact" VARCHAR(50)
  );
`;

// 사업장 테이블 생성 쿼리
export const createSiteTable = sql`
  CREATE TABLE IF NOT EXISTS "site" (
    "id" VARCHAR(128) PRIMARY KEY,
    "company_id" VARCHAR(128) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL UNIQUE,
    "description" TEXT,
    "address" VARCHAR(255),
    "contact" VARCHAR(50),
    FOREIGN KEY ("company_id") REFERENCES "company" ("id") ON DELETE CASCADE
  );
`;

// 실행 함수
export async function up(db: any) {
  await db.execute(createCompanyTable);
  await db.execute(createSiteTable);
}

// 롤백 함수
export async function down(db: any) {
  await db.execute(sql`DROP TABLE IF EXISTS "site";`);
  await db.execute(sql`DROP TABLE IF EXISTS "company";`);
} 