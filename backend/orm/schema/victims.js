"use strict";
/**
 * @file orm/schema/victims.ts
 * @description
 *  - Drizzle ORM의 pgTable 함수를 사용하여
 *    `victims` 테이블 스키마를 정의합니다.
 *  - 사고 발생보고서와 1:N 관계를 가집니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.occurrenceReportRelations = exports.victimsRelations = exports.victims = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const occurrence_1 = require("./occurrence");
// 재해자 정보 테이블 정의
exports.victims = (0, pg_core_1.pgTable)("victims", {
    // 재해자 ID (PK)
    victim_id: (0, pg_core_1.serial)("victim_id").primaryKey(),
    // 사고 ID (FK, occurrence_report 테이블 참조)
    accident_id: (0, pg_core_1.varchar)("accident_id", { length: 50 })
        .notNull()
        .references(() => occurrence_1.occurrenceReport.accident_id, { onDelete: "cascade" }),
    // 재해자 이름
    name: (0, pg_core_1.varchar)("name", { length: 100 }),
    // 재해자 나이
    age: (0, pg_core_1.integer)("age"),
    // 재해자 소속
    belong: (0, pg_core_1.varchar)("belong", { length: 100 }),
    // 재해자 직무
    duty: (0, pg_core_1.varchar)("duty", { length: 100 }),
    // 상해 정도
    injury_type: (0, pg_core_1.varchar)("injury_type", { length: 100 }),
    // 보호구 착용 여부
    ppe_worn: (0, pg_core_1.varchar)("ppe_worn", { length: 100 }),
    // 응급조치 내역
    first_aid: (0, pg_core_1.text)("first_aid"),
    // 생년월일
    birth_date: (0, pg_core_1.timestamp)("birth_date"),
    // 상해부위
    injury_location: (0, pg_core_1.varchar)("injury_location", { length: 200 }),
    // 의사소견
    medical_opinion: (0, pg_core_1.text)("medical_opinion"),
    // 교육 이수여부
    training_completed: (0, pg_core_1.varchar)("training_completed", { length: 50 }),
    // 기타 (특이사항, 추가 정보)
    etc_notes: (0, pg_core_1.text)("etc_notes"),
    // 생성 시간
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    // 수정 시간
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// 관계 정의
exports.victimsRelations = (0, drizzle_orm_1.relations)(exports.victims, ({ one }) => ({
    occurrence: one(occurrence_1.occurrenceReport, {
        fields: [exports.victims.accident_id],
        references: [occurrence_1.occurrenceReport.accident_id],
    }),
}));
// 반대 방향 관계 정의 (occurrenceReport -> victims)
exports.occurrenceReportRelations = (0, drizzle_orm_1.relations)(occurrence_1.occurrenceReport, ({ many }) => ({
    victims: many(exports.victims),
}));
