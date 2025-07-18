/**
 * @file orm/migrate.ts
 * @description
 *  - Drizzle-Kit이 생성한 마이그레이션 파일을 데이터베이스에 적용합니다.
 *  - 이 스크립트는 새로운 테이블을 생성하거나 기존 테이블을 수정하는 SQL을 실행합니다.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  console.log('마이그레이션을 시작합니다...');

  try {
    await migrate(db, { migrationsFolder: 'orm/migrations' });
    console.log('마이그레이션이 성공적으로 완료되었습니다.');
  } catch (error) {
    console.error('마이그레이션 중 오류가 발생했습니다:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations(); 