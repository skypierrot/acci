/**
 * @file orm/schema/company.ts
 * @description
 *  - Drizzle ORM을 통해 `company`와 `site` 테이블 스키마를 정의합니다.
 *  - 회사와 사업장 정보를 저장하는 테이블 구조입니다.
 *  - company와 site는 1:N 관계를 가집니다.
 */

import { pgTable, varchar, uuid, text, pgEnum } from "drizzle-orm/pg-core";
import { createId } from '@paralleldrive/cuid2';

// 회사 테이블
export const company = pgTable("company", {
  // 회사 ID (Primary Key)
  id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  
  // 회사명
  name: varchar("name", { length: 100 }).notNull(),
  
  // 회사 코드 (고유값)
  code: varchar("code", { length: 20 }).notNull().unique(),
  
  // 설명 (선택사항)
  description: text("description"),
  
  // 주소 (선택사항)
  address: varchar("address", { length: 255 }),
  
  // 연락처 (선택사항)
  contact: varchar("contact", { length: 50 }),
});

// 사업장 테이블
export const site = pgTable("site", {
  // 사업장 ID (Primary Key)
  id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  
  // 소속 회사 ID (Foreign Key)
  companyId: varchar("company_id", { length: 128 }).notNull().references(() => company.id, { onDelete: 'cascade' }),
  
  // 사업장명
  name: varchar("name", { length: 100 }).notNull(),
  
  // 사업장 코드 (고유값)
  code: varchar("code", { length: 20 }).notNull().unique(),
  
  // 설명 (선택사항)
  description: text("description"),
  
  // 주소 (선택사항)
  address: varchar("address", { length: 255 }),
  
  // 연락처 (선택사항)
  contact: varchar("contact", { length: 50 }),
}); 