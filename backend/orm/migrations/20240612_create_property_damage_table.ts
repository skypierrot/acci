import { sql } from "drizzle-orm";

export const createPropertyDamageTable = sql`
  CREATE TABLE IF NOT EXISTS "property_damage" (
    "damage_id" SERIAL PRIMARY KEY,
    "accident_id" VARCHAR(50) NOT NULL REFERENCES "occurrence_report"("accident_id") ON DELETE CASCADE,
    "damage_target" VARCHAR(255),
    "estimated_cost" INTEGER,
    "damage_content" TEXT,
    "shutdown_start_date" TIMESTAMP,
    "recovery_expected_date" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS "idx_property_damage_accident_id" ON "property_damage"("accident_id");
`;

export async function up(db: any) {
  await db.execute(createPropertyDamageTable);
  console.log("property_damage 테이블 생성 완료");
}

export async function down(db: any) {
  await db.execute(sql`DROP TABLE IF EXISTS "property_damage";`);
  console.log("property_damage 테이블 삭제 완료");
} 