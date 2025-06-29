/**
 * @file migrations/20240610_create_file_tables.ts
 * @description
 *  - 파일 관리를 위한 테이블들을 생성하는 마이그레이션 파일
 *  - files, file_access_logs, temp_file_sessions 테이블 생성
 */

import { sql } from "drizzle-orm";

// 파일 정보 테이블 생성 쿼리
export const createFilesTable = sql`
  CREATE TABLE IF NOT EXISTS "files" (
    "file_id" VARCHAR(50) PRIMARY KEY,
    "original_name" VARCHAR(255) NOT NULL,
    "stored_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_extension" VARCHAR(10),
    "category" VARCHAR(50),
    "uploaded_by" VARCHAR(50),
    "status" VARCHAR(20) DEFAULT 'uploaded',
    "report_id" VARCHAR(50),
    "report_type" VARCHAR(20),
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "scheduled_delete_at" TIMESTAMP
  );
`;

// 파일 접근 로그 테이블 생성 쿼리
export const createFileAccessLogsTable = sql`
  CREATE TABLE IF NOT EXISTS "file_access_logs" (
    "log_id" VARCHAR(50) PRIMARY KEY,
    "file_id" VARCHAR(50) NOT NULL,
    "access_type" VARCHAR(20) NOT NULL,
    "user_id" VARCHAR(50),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "accessed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// 임시 파일 세션 테이블 생성 쿼리
export const createTempFileSessionsTable = sql`
  CREATE TABLE IF NOT EXISTS "temp_file_sessions" (
    "session_id" VARCHAR(50) PRIMARY KEY,
    "file_ids" JSONB NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP NOT NULL,
    "status" VARCHAR(20) DEFAULT 'active',
    "report_type" VARCHAR(20)
  );
`;

// 인덱스 생성 쿼리
export const createFileIndexes = sql`
  -- 파일 테이블 인덱스
  CREATE INDEX IF NOT EXISTS "idx_files_report" ON "files"("report_id", "report_type");
  CREATE INDEX IF NOT EXISTS "idx_files_status" ON "files"("status");
  CREATE INDEX IF NOT EXISTS "idx_files_created_at" ON "files"("created_at");
  CREATE INDEX IF NOT EXISTS "idx_files_scheduled_delete" ON "files"("scheduled_delete_at") WHERE "scheduled_delete_at" IS NOT NULL;

  -- 파일 접근 로그 테이블 인덱스
  CREATE INDEX IF NOT EXISTS "idx_file_access_logs_file_id" ON "file_access_logs"("file_id");
  CREATE INDEX IF NOT EXISTS "idx_file_access_logs_accessed_at" ON "file_access_logs"("accessed_at");

  -- 임시 파일 세션 테이블 인덱스
  CREATE INDEX IF NOT EXISTS "idx_temp_file_sessions_expires_at" ON "temp_file_sessions"("expires_at");
  CREATE INDEX IF NOT EXISTS "idx_temp_file_sessions_status" ON "temp_file_sessions"("status");
`;

// 외래 키 제약 조건 추가 쿼리
export const createFileConstraints = sql`
  -- 파일 접근 로그와 파일 테이블 간의 외래 키 제약 조건
  ALTER TABLE "file_access_logs" 
  ADD CONSTRAINT "fk_file_access_logs_file_id" 
  FOREIGN KEY ("file_id") REFERENCES "files"("file_id") ON DELETE CASCADE;
`;

// updated_at 자동 업데이트 트리거 생성
export const createFileUpdateTrigger = sql`
  -- updated_at 자동 업데이트 함수
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- 파일 테이블에 트리거 적용
  CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON "files"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// 실행 함수
export async function up(db: any) {
  console.log('파일 테이블 마이그레이션 시작...');
  
  // 테이블 생성
  await db.execute(createFilesTable);
  await db.execute(createFileAccessLogsTable);
  await db.execute(createTempFileSessionsTable);
  
  // 인덱스 생성
  await db.execute(createFileIndexes);
  
  // 외래 키 제약 조건 추가 (에러 무시)
  try {
    await db.execute(createFileConstraints);
  } catch (error: any) {
    console.warn('외래 키 제약 조건 추가 실패 (이미 존재할 수 있음):', error.message);
  }
  
  // 트리거 생성
  await db.execute(createFileUpdateTrigger);
  
  console.log('파일 테이블 마이그레이션 완료');
} 