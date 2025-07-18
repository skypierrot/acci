"use strict";
/**
 * @file orm/index.ts
 * @description
 *  - PostgreSQL에 연결하기 위해 Drizzle ORM을 초기화합니다.
 *  - 연결된 drizzle 인스턴스와 각 테이블 스키마를 내보냅니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.files = exports.defaultOccurrenceFormFields = exports.reportFormSettings = exports.tables = void 0;
exports.connectDB = connectDB;
exports.db = db;
const pg_1 = require("pg"); // PostgreSQL 클라이언트
const node_postgres_1 = require("drizzle-orm/node-postgres"); // Drizzle ORM (PostgreSQL 지원)
const occurrence_1 = require("./schema/occurrence");
const investigation_1 = require("./schema/investigation");
const history_1 = require("./schema/history");
const company_1 = require("./schema/company");
const report_form_1 = require("./schema/report_form");
Object.defineProperty(exports, "reportFormSettings", { enumerable: true, get: function () { return report_form_1.reportFormSettings; } });
Object.defineProperty(exports, "defaultOccurrenceFormFields", { enumerable: true, get: function () { return report_form_1.defaultOccurrenceFormFields; } });
const files_1 = require("./schema/files");
Object.defineProperty(exports, "files", { enumerable: true, get: function () { return files_1.files; } });
const victims_1 = require("./schema/victims");
const property_damage_1 = require("./schema/property_damage");
const investigation_victims_1 = require("./schema/investigation_victims");
const investigation_property_damage_1 = require("./schema/investigation_property_damage");
// drizzle 인스턴스를 저장할 변수 (초기화 전엔 undefined)
let dbInstance;
/**
 * @function connectDB
 * @description
 *  - 환경변수 DATABASE_URL을 사용하여 PostgreSQL에 연결하고, Drizzle ORM을 초기화합니다.
 *  - 반드시 서버가 시작되기 전에 한 번 호출되어야 합니다.
 */
function connectDB() {
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL, // postgres 접속 문자열
    });
    dbInstance = (0, node_postgres_1.drizzle)(pool); // Drizzle ORM 초기화
}
/**
 * @function db
 * @description
 *  - 초기화된 drizzle 인스턴스를 반환합니다.
 *  - connectDB()가 호출되지 않은 상태라면 에러를 발생시킵니다.
 */
function db() {
    if (!dbInstance)
        throw new Error("DB가 초기화되지 않았습니다. connectDB()를 먼저 호출하세요.");
    return dbInstance;
}
/**
 * @constant tables
 * @description
 *  - Drizzle ORM으로 정의된 각 테이블(또는 뷰) 스키마를 모아놓은 객체입니다.
 *  - 다른 코드(Repository 등)에서 import하여 사용합니다.
 */
exports.tables = {
    occurrenceReport: occurrence_1.occurrenceReport,
    occurrenceSequence: occurrence_1.occurrenceSequence,
    investigationReport: investigation_1.investigationReport,
    accidentHistory: history_1.accidentHistory,
    company: company_1.company,
    site: company_1.site,
    reportFormSettings: report_form_1.reportFormSettings,
    files: files_1.files,
    victims: victims_1.victims,
    propertyDamage: property_damage_1.propertyDamage,
    investigationVictims: investigation_victims_1.investigationVictims,
    investigationPropertyDamage: investigation_property_damage_1.investigationPropertyDamage,
};
