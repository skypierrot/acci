import { pgTable, varchar, integer, boolean, timestamp, serial } from 'drizzle-orm/pg-core';

// 연간 근로시간 테이블 스키마 정의
// 회사 또는 사업장 단위로 연도별 근로시간을 관리
export const annualWorkingHours = pgTable('annual_working_hours', {
  // PK: id (자동 증가)
  id: serial('id').primaryKey(),

  // 회사 ID (company.id 참조, 사업장 단위 입력 시에도 반드시 회사ID 필요)
  company_id: varchar('company_id', { length: 128 }).notNull(),

  // 사업장 ID (site.id 참조, 회사 단위 입력 시 null)
  site_id: varchar('site_id', { length: 128 }),

  // 연도 (예: 2024)
  year: integer('year').notNull(),

  // 임직원 근로시간(시간 단위)
  employee_hours: integer('employee_hours').notNull().default(0),

  // 협력업체(상주) 근로시간(시간 단위)
  partner_on_hours: integer('partner_on_hours').notNull().default(0),

  // 협력업체(비상주) 근로시간(시간 단위)
  partner_off_hours: integer('partner_off_hours').notNull().default(0),

  // 종합 근로시간(자동계산, employee + partner_on + partner_off)
  total_hours: integer('total_hours').notNull().default(0),

  // 마감 여부 (true: 마감, false: 입력/수정 가능)
  is_closed: boolean('is_closed').notNull().default(false),

  // 마감 일시 (마감 시각, nullable)
  closed_at: timestamp('closed_at'),

  // 생성 일시
  created_at: timestamp('created_at').defaultNow(),

  // 수정 일시
  updated_at: timestamp('updated_at').defaultNow(),
}); 