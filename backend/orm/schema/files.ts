/**
 * @file orm/schema/files.ts
 * @description
 *  - 파일 업로드 및 관리를 위한 테이블 스키마
 *  - 보고서와 파일 간의 연결 관계 정의
 */

import { pgTable, varchar, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

// 파일 정보 테이블
export const files = pgTable("files", {
  // 파일 ID (기본키, UUID)
  file_id: varchar("file_id", { length: 50 }).primaryKey(),
  
  // 원본 파일명
  original_name: varchar("original_name", { length: 255 }).notNull(),
  
  // 저장된 파일명 (서버에 실제 저장된 파일명)
  stored_name: varchar("stored_name", { length: 255 }).notNull(),
  
  // 파일 경로 (상대 경로)
  file_path: varchar("file_path", { length: 500 }).notNull(),
  
  // 파일 크기 (바이트)
  file_size: integer("file_size").notNull(),
  
  // MIME 타입
  mime_type: varchar("mime_type", { length: 100 }).notNull(),
  
  // 파일 확장자
  file_extension: varchar("file_extension", { length: 10 }),
  
  // 파일 카테고리 (scene_photos, cctv_video, statement_docs, etc_documents)
  category: varchar("category", { length: 50 }),
  
  // 업로드한 사용자 ID (추후 사용자 관리 시스템 연동)
  uploaded_by: varchar("uploaded_by", { length: 50 }),
  
  // 파일 상태 (uploaded: 업로드됨, attached: 보고서에 첨부됨, orphaned: 고아파일, deleted: 삭제됨)
  status: varchar("status", { length: 20 }).default("uploaded"),
  
  // 파일이 첨부된 보고서 ID (null이면 아직 보고서에 첨부되지 않음)
  report_id: varchar("report_id", { length: 50 }),
  
  // 보고서 타입 (occurrence, investigation)
  report_type: varchar("report_type", { length: 20 }),
  
  // 파일 설명 (선택사항)
  description: text("description"),
  
  // 메타데이터 (이미지 크기, 동영상 길이 등 JSON 형태)
  metadata: jsonb("metadata"),
  
  // 생성 시간
  created_at: timestamp("created_at").defaultNow(),
  
  // 수정 시간
  updated_at: timestamp("updated_at").defaultNow(),
  
  // 삭제 예정 시간 (고아 파일 정리용)
  scheduled_delete_at: timestamp("scheduled_delete_at"),
});

// 파일 접근 로그 테이블 (선택사항 - 보안 감사용)
export const fileAccessLogs = pgTable("file_access_logs", {
  // 로그 ID
  log_id: varchar("log_id", { length: 50 }).primaryKey(),
  
  // 파일 ID
  file_id: varchar("file_id", { length: 50 }).notNull(),
  
  // 접근 유형 (upload, download, view, delete)
  access_type: varchar("access_type", { length: 20 }).notNull(),
  
  // 접근한 사용자 ID
  user_id: varchar("user_id", { length: 50 }),
  
  // 접근 IP 주소
  ip_address: varchar("ip_address", { length: 45 }),
  
  // 사용자 에이전트
  user_agent: text("user_agent"),
  
  // 접근 시간
  accessed_at: timestamp("accessed_at").defaultNow(),
});

// 임시 파일 세션 테이블 (보고서 작성 중 업로드된 파일 추적)
export const tempFileSessions = pgTable("temp_file_sessions", {
  // 세션 ID
  session_id: varchar("session_id", { length: 50 }).primaryKey(),
  
  // 파일 ID들 (JSON 배열)
  file_ids: jsonb("file_ids").notNull(),
  
  // 세션 생성 시간
  created_at: timestamp("created_at").defaultNow(),
  
  // 세션 만료 시간 (기본 24시간)
  expires_at: timestamp("expires_at").notNull(),
  
  // 세션 상태 (active, completed, expired)
  status: varchar("status", { length: 50 }).default("active"),
  
  // 관련 보고서 타입
  report_type: varchar("report_type", { length: 20 }),
}); 