import { sql } from 'drizzle-orm';

export async function up(db: any) {
  await db.execute(sql`UPDATE report_form_settings SET field_group = '조직정보' WHERE field_group = '기본정보'`);
}

export async function down(db: any) {
  await db.execute(sql`UPDATE report_form_settings SET field_group = '기본정보' WHERE field_group = '조직정보'`);
} 