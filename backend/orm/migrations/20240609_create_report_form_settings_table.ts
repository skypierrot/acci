import { sql } from "drizzle-orm";

export async function up(db) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS report_form_settings (
      id VARCHAR(50) PRIMARY KEY,
      report_type VARCHAR(20) NOT NULL,
      field_name VARCHAR(100) NOT NULL,
      is_visible BOOLEAN DEFAULT true,
      is_required BOOLEAN DEFAULT false,
      display_order INTEGER DEFAULT 0,
      field_group VARCHAR(50),
      display_name VARCHAR(100),
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export async function down(db) {
  await db.execute(sql`DROP TABLE IF EXISTS report_form_settings;`);
} 