/**
 * @file orm/index.ts
 * @description
 *  - PostgreSQL에 연결하기 위해 Drizzle ORM을 초기화합니다.
 *  - 연결된 drizzle 인스턴스와 각 테이블 스키마를 내보냅니다.
 */

import { Pool } from "pg";                    // PostgreSQL 클라이언트
import { drizzle } from "drizzle-orm/node-postgres"; // Drizzle ORM (PostgreSQL 지원)
import { occurrenceReport, occurrenceSequence } from "./schema/occurrence";
import { investigationReport } from "./schema/investigation";
import { accidentHistory } from "./schema/history";
import { company, site } from "./schema/company";
import { reportFormSettings, defaultOccurrenceFormFields } from "./schema/report_form";
import { files } from "./schema/files";
import { victims } from "./schema/victims";
import { propertyDamage } from "./schema/property_damage";

// drizzle 인스턴스를 저장할 변수 (초기화 전엔 undefined)
let dbInstance: ReturnType<typeof drizzle>;

/**
 * @function connectDB
 * @description
 *  - 환경변수 DATABASE_URL을 사용하여 PostgreSQL에 연결하고, Drizzle ORM을 초기화합니다.
 *  - 반드시 서버가 시작되기 전에 한 번 호출되어야 합니다.
 */
export function connectDB() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // postgres 접속 문자열
  });
  dbInstance = drizzle(pool); // Drizzle ORM 초기화
}

/**
 * @function db
 * @description
 *  - 초기화된 drizzle 인스턴스를 반환합니다.
 *  - connectDB()가 호출되지 않은 상태라면 에러를 발생시킵니다.
 */
export function db() {
  if (!dbInstance) throw new Error("DB가 초기화되지 않았습니다. connectDB()를 먼저 호출하세요.");
  return dbInstance;
}

/**
 * @constant tables
 * @description
 *  - Drizzle ORM으로 정의된 각 테이블(또는 뷰) 스키마를 모아놓은 객체입니다.
 *  - 다른 코드(Repository 등)에서 import하여 사용합니다.
 */
export const tables = {
  occurrenceReport,
  occurrenceSequence,
  investigationReport,
  accidentHistory,
  company,
  site,
  reportFormSettings,
  files,
  victims,
  propertyDamage,
};

export { reportFormSettings, defaultOccurrenceFormFields, files };
