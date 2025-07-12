import { pgTable, serial, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { investigationReport } from "./investigation";

/**
 * 조사보고서용 물적피해 정보 테이블
 * - investigation_report와 1:N 관계
 */
export const investigationPropertyDamage = pgTable("investigation_property_damage", {
  damage_id: serial("damage_id").primaryKey(), // PK
  accident_id: varchar("accident_id", { length: 50 })
    .notNull()
    .references(() => investigationReport.accident_id, { onDelete: "cascade" }), // 조사보고서 ID
  damage_target: varchar("damage_target", { length: 255 }),
  estimated_cost: integer("estimated_cost"),
  damage_content: text("damage_content"),
  shutdown_start_date: timestamp("shutdown_start_date"),
  recovery_expected_date: timestamp("recovery_expected_date"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}); 