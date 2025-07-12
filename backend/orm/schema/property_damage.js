"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyDamage = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const occurrence_1 = require("./occurrence");
exports.propertyDamage = (0, pg_core_1.pgTable)("property_damage", {
    damage_id: (0, pg_core_1.serial)("damage_id").primaryKey(),
    accident_id: (0, pg_core_1.varchar)("accident_id", { length: 50 })
        .notNull()
        .references(() => occurrence_1.occurrenceReport.accident_id, { onDelete: "cascade" }),
    damage_target: (0, pg_core_1.varchar)("damage_target", { length: 255 }),
    damage_type: (0, pg_core_1.varchar)("damage_type", { length: 255 }),
    estimated_cost: (0, pg_core_1.integer)("estimated_cost"),
    damage_content: (0, pg_core_1.text)("damage_content"),
    shutdown_start_date: (0, pg_core_1.timestamp)("shutdown_start_date"),
    recovery_expected_date: (0, pg_core_1.timestamp)("recovery_expected_date"),
    recovery_plan: (0, pg_core_1.text)("recovery_plan"),
    etc_notes: (0, pg_core_1.text)("etc_notes"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
