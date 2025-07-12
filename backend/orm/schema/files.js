"use strict";
/**
 * @file orm/schema/files.ts
 * @description
 *  - 파일 업로드 및 관리를 위한 테이블 스키마
 *  - 보고서와 파일 간의 연결 관계 정의
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tempFileSessions = exports.fileAccessLogs = exports.files = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// 파일 정보 테이블
exports.files = (0, pg_core_1.pgTable)("files", {
    // 파일 ID (기본키, UUID)
    file_id: (0, pg_core_1.varchar)("file_id", { length: 50 }).primaryKey(),
    // 원본 파일명
    original_name: (0, pg_core_1.varchar)("original_name", { length: 255 }).notNull(),
    // 저장된 파일명 (서버에 실제 저장된 파일명)
    stored_name: (0, pg_core_1.varchar)("stored_name", { length: 255 }).notNull(),
    // 파일 경로 (상대 경로)
    file_path: (0, pg_core_1.varchar)("file_path", { length: 500 }).notNull(),
    // 파일 크기 (바이트)
    file_size: (0, pg_core_1.integer)("file_size").notNull(),
    // MIME 타입
    mime_type: (0, pg_core_1.varchar)("mime_type", { length: 100 }).notNull(),
    // 파일 확장자
    file_extension: (0, pg_core_1.varchar)("file_extension", { length: 10 }),
    // 파일 카테고리 (scene_photos, cctv_video, statement_docs, etc_documents)
    category: (0, pg_core_1.varchar)("category", { length: 50 }),
    // 업로드한 사용자 ID (추후 사용자 관리 시스템 연동)
    uploaded_by: (0, pg_core_1.varchar)("uploaded_by", { length: 50 }),
    // 파일 상태 (uploaded: 업로드됨, attached: 보고서에 첨부됨, orphaned: 고아파일, deleted: 삭제됨)
    status: (0, pg_core_1.varchar)("status", { length: 20 }).default("uploaded"),
    // 파일이 첨부된 보고서 ID (null이면 아직 보고서에 첨부되지 않음)
    report_id: (0, pg_core_1.varchar)("report_id", { length: 50 }),
    // 보고서 타입 (occurrence, investigation)
    report_type: (0, pg_core_1.varchar)("report_type", { length: 20 }),
    // 파일 설명 (선택사항)
    description: (0, pg_core_1.text)("description"),
    // 메타데이터 (이미지 크기, 동영상 길이 등 JSON 형태)
    metadata: (0, pg_core_1.jsonb)("metadata"),
    // 생성 시간
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    // 수정 시간
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
    // 삭제 예정 시간 (고아 파일 정리용)
    scheduled_delete_at: (0, pg_core_1.timestamp)("scheduled_delete_at"),
});
// 파일 접근 로그 테이블 (선택사항 - 보안 감사용)
exports.fileAccessLogs = (0, pg_core_1.pgTable)("file_access_logs", {
    // 로그 ID
    log_id: (0, pg_core_1.varchar)("log_id", { length: 50 }).primaryKey(),
    // 파일 ID
    file_id: (0, pg_core_1.varchar)("file_id", { length: 50 }).notNull(),
    // 접근 유형 (upload, download, view, delete)
    access_type: (0, pg_core_1.varchar)("access_type", { length: 20 }).notNull(),
    // 접근한 사용자 ID
    user_id: (0, pg_core_1.varchar)("user_id", { length: 50 }),
    // 접근 IP 주소
    ip_address: (0, pg_core_1.varchar)("ip_address", { length: 45 }),
    // 사용자 에이전트
    user_agent: (0, pg_core_1.text)("user_agent"),
    // 접근 시간
    accessed_at: (0, pg_core_1.timestamp)("accessed_at").defaultNow(),
});
// 임시 파일 세션 테이블 (보고서 작성 중 업로드된 파일 추적)
exports.tempFileSessions = (0, pg_core_1.pgTable)("temp_file_sessions", {
    // 세션 ID
    session_id: (0, pg_core_1.varchar)("session_id", { length: 50 }).primaryKey(),
    // 파일 ID들 (JSON 배열)
    file_ids: (0, pg_core_1.jsonb)("file_ids").notNull(),
    // 세션 생성 시간
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    // 세션 만료 시간 (기본 24시간)
    expires_at: (0, pg_core_1.timestamp)("expires_at").notNull(),
    // 세션 상태 (active, completed, expired)
    status: (0, pg_core_1.varchar)("status", { length: 50 }).default("active"),
    // 관련 보고서 타입
    report_type: (0, pg_core_1.varchar)("report_type", { length: 20 }),
});
