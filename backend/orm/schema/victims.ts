/**
 * @file orm/schema/victims.ts
 * @description
 *  - Drizzle ORM의 pgTable 함수를 사용하여
 *    `victims` 테이블 스키마를 정의합니다.
 *  - 사고 발생보고서와 1:N 관계를 가집니다.
 */

import { pgTable, varchar, timestamp, integer, text, serial, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { occurrenceReport } from "./occurrence";

// 재해자 정보 테이블 정의
export const victims = pgTable("victims", {
  // 재해자 ID (PK)
  victim_id: serial("victim_id").primaryKey(),
  
  // 사고 ID (FK, occurrence_report 테이블 참조)
  accident_id: varchar("accident_id", { length: 50 })
    .notNull()
    .references(() => occurrenceReport.accident_id, { onDelete: "cascade" }),
  
  // 재해자 이름
  name: varchar("name", { length: 100 }),
  
  // 재해자 나이
  age: integer("age"),
  
  // 재해자 소속
  belong: varchar("belong", { length: 100 }),
  
  // 재해자 직무
  duty: varchar("duty", { length: 100 }),
  
  // 부상 유형
  injury_type: varchar("injury_type", { length: 100 }),
  
  // 보호구 착용 여부
  ppe_worn: varchar("ppe_worn", { length: 100 }),
  
  // 응급조치 내역
  first_aid: text("first_aid"),
  
  // 생년월일
  birth_date: timestamp("birth_date"),
  
  // 생성 시간
  created_at: timestamp("created_at").defaultNow(),
  
  // 수정 시간
  updated_at: timestamp("updated_at").defaultNow(),
});

// 관계 정의
export const victimsRelations = relations(victims, ({ one }) => ({
  occurrence: one(occurrenceReport, {
    fields: [victims.accident_id],
    references: [occurrenceReport.accident_id],
  }),
}));

// 반대 방향 관계 정의 (occurrenceReport -> victims)
export const occurrenceReportRelations = relations(occurrenceReport, ({ many }) => ({
  victims: many(victims),
})); 