"use strict";
/**
 * @file orm/schema/company.ts
 * @description
 *  - Drizzle ORM을 통해 `company`와 `site` 테이블 스키마를 정의합니다.
 *  - 회사와 사업장 정보를 저장하는 테이블 구조입니다.
 *  - company와 site는 1:N 관계를 가집니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.site = exports.company = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const cuid2_1 = require("@paralleldrive/cuid2");
// 회사 테이블
exports.company = (0, pg_core_1.pgTable)("company", {
    // 회사 ID (Primary Key)
    id: (0, pg_core_1.varchar)("id", { length: 128 }).primaryKey().$defaultFn(() => (0, cuid2_1.createId)()),
    // 회사명
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(),
    // 회사 코드 (고유값)
    code: (0, pg_core_1.varchar)("code", { length: 20 }).notNull().unique(),
    // 설명 (선택사항)
    description: (0, pg_core_1.text)("description"),
    // 주소 (선택사항)
    address: (0, pg_core_1.varchar)("address", { length: 255 }),
    // 연락처 (선택사항)
    contact: (0, pg_core_1.varchar)("contact", { length: 50 }),
});
// 사업장 테이블
exports.site = (0, pg_core_1.pgTable)("site", {
    // 사업장 ID (Primary Key)
    id: (0, pg_core_1.varchar)("id", { length: 128 }).primaryKey().$defaultFn(() => (0, cuid2_1.createId)()),
    // 소속 회사 ID (Foreign Key)
    companyId: (0, pg_core_1.varchar)("company_id", { length: 128 }).notNull().references(() => exports.company.id, { onDelete: 'cascade' }),
    // 사업장명
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(),
    // 사업장 코드 (고유값)
    code: (0, pg_core_1.varchar)("code", { length: 20 }).notNull().unique(),
    // 설명 (선택사항)
    description: (0, pg_core_1.text)("description"),
    // 주소 (선택사항)
    address: (0, pg_core_1.varchar)("address", { length: 255 }),
    // 연락처 (선택사항)
    contact: (0, pg_core_1.varchar)("contact", { length: 50 }),
});
