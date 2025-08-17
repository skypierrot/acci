import { pgTable, serial, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { investigationReport } from "./investigation";

/**
 * 조사보고서용 재해자 정보 테이블
 * - investigation_report와 1:N 관계
 */
export const investigationVictims = pgTable("investigation_victims", {
  victim_id: serial("victim_id").primaryKey(), // PK
  accident_id: varchar("accident_id", { length: 50 })
    .notNull()
    .references(() => investigationReport.accident_id, { onDelete: "cascade" }), // 조사보고서 ID
  name: varchar("name", { length: 50 }),
  age: integer("age"),
  belong: varchar("belong", { length: 100 }),
  duty: varchar("duty", { length: 100 }),
  injury_type: varchar("injury_type", { length: 100 }),
  ppe_worn: varchar("ppe_worn", { length: 50 }),
  first_aid: varchar("first_aid", { length: 50 }),
  birth_date: varchar("birth_date", { length: 20 }),
  absence_start_date: varchar("absence_start_date", { length: 20 }),
  return_expected_date: varchar("return_expected_date", { length: 20 }),
  job_experience_duration: integer("job_experience_duration"),
  job_experience_unit: varchar("job_experience_unit", { length: 20 }),
  injury_location: varchar("injury_location", { length: 100 }),
  medical_opinion: text("medical_opinion"),
  training_completed: varchar("training_completed", { length: 20 }),
  etc_notes: text("etc_notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}); 