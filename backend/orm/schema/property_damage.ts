import { pgTable, serial, varchar, integer, text, timestamp, bigint } from "drizzle-orm/pg-core";
import { occurrenceReport } from "./occurrence";

export const propertyDamage = pgTable("property_damage", {
  damage_id: serial("damage_id").primaryKey(),
  accident_id: varchar("accident_id", { length: 50 })
    .notNull()
    .references(() => occurrenceReport.accident_id, { onDelete: "cascade" }),
  damage_target: varchar("damage_target", { length: 255 }),
  damage_type: varchar("damage_type", { length: 255 }),
  estimated_cost: bigint("estimated_cost", { mode: "number" }),
  damage_content: text("damage_content"),
  recovery_plan: text("recovery_plan"),
  etc_notes: text("etc_notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}); 