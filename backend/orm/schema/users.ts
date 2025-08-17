/**
 * @file orm/schema/users.ts
 * @description
 *  - Drizzle ORM을 통해 `users` 테이블 스키마를 정의합니다.
 *  - 시스템 사용자 정보를 저장하는 테이블 구조입니다.
 *  - 사용자 권한과 상태를 관리합니다.
 */

import { pgTable, varchar, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from '@paralleldrive/cuid2';

// 사용자 권한 enum
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "user"]);

// 사용자 상태 enum
export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "suspended"]);

// 사용자 테이블
export const users = pgTable("users", {
  // 사용자 ID (Primary Key)
  id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => createId()),
  
  // 사용자명 (로그인 ID)
  username: varchar("username", { length: 50 }).notNull().unique(),
  
  // 이메일
  email: varchar("email", { length: 100 }).notNull().unique(),
  
  // 비밀번호 (해시된 값)
  password: varchar("password", { length: 255 }).notNull(),
  
  // 실명
  fullName: varchar("full_name", { length: 100 }).notNull(),
  
  // 부서
  department: varchar("department", { length: 100 }),
  
  // 직급
  position: varchar("position", { length: 50 }),
  
  // 연락처
  phone: varchar("phone", { length: 20 }),
  
  // 사용자 권한
  role: userRoleEnum("role").notNull().default("user"),
  
  // 사용자 상태
  status: userStatusEnum("status").notNull().default("active"),
  
  // 마지막 로그인 시간
  lastLoginAt: timestamp("last_login_at"),
  
  // 계정 생성 시간
  createdAt: timestamp("created_at").notNull().defaultNow(),
  
  // 계정 수정 시간
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // 비고
  notes: text("notes"),
}); 