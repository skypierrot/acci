-- 004_create_file_tables.sql
-- 파일 관리를 위한 테이블 생성

-- 파일 정보 테이블
CREATE TABLE IF NOT EXISTS files (
    file_id VARCHAR(50) PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_extension VARCHAR(10),
    category VARCHAR(50),
    uploaded_by VARCHAR(50),
    status VARCHAR(20) DEFAULT 'uploaded',
    report_id VARCHAR(50),
    report_type VARCHAR(20),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_delete_at TIMESTAMP
);

-- 파일 접근 로그 테이블
CREATE TABLE IF NOT EXISTS file_access_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    file_id VARCHAR(50) NOT NULL,
    access_type VARCHAR(20) NOT NULL,
    user_id VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 임시 파일 세션 테이블
CREATE TABLE IF NOT EXISTS temp_file_sessions (
    session_id VARCHAR(50) PRIMARY KEY,
    file_ids JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    report_type VARCHAR(20)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_files_report ON files(report_id, report_type);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_scheduled_delete ON files(scheduled_delete_at) WHERE scheduled_delete_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_accessed_at ON file_access_logs(accessed_at);

CREATE INDEX IF NOT EXISTS idx_temp_file_sessions_expires_at ON temp_file_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_file_sessions_status ON temp_file_sessions(status);

-- 외래 키 제약 조건 (선택사항 - 파일 테이블과 로그 테이블 간)
ALTER TABLE file_access_logs 
ADD CONSTRAINT fk_file_access_logs_file_id 
FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE;

-- 트리거 - updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE files IS '업로드된 파일 정보를 저장하는 테이블';
COMMENT ON COLUMN files.status IS 'uploaded: 업로드됨, attached: 보고서에 첨부됨, orphaned: 고아파일, deleted: 삭제됨';
COMMENT ON COLUMN files.category IS 'scene_photos: 현장사진, cctv_video: CCTV영상, statement_docs: 진술서, etc_documents: 기타문서';

COMMENT ON TABLE file_access_logs IS '파일 접근 로그를 저장하는 테이블 (보안 감사용)';
COMMENT ON COLUMN file_access_logs.access_type IS 'upload: 업로드, download: 다운로드, view: 조회, delete: 삭제, attach: 첨부';

COMMENT ON TABLE temp_file_sessions IS '보고서 작성 중 업로드된 임시 파일 세션을 추적하는 테이블';
COMMENT ON COLUMN temp_file_sessions.status IS 'active: 활성, completed: 완료, expired: 만료';

-- 샘플 데이터 (개발용)
-- INSERT INTO files (file_id, original_name, stored_name, file_path, file_size, mime_type, file_extension, category, status) 
-- VALUES 
--     ('sample-001', 'accident_scene.jpg', 'uuid-001.jpg', 'temp/uuid-001.jpg', 1024000, 'image/jpeg', '.jpg', 'scene_photos', 'uploaded'),
--     ('sample-002', 'cctv_footage.mp4', 'uuid-002.mp4', 'temp/uuid-002.mp4', 5120000, 'video/mp4', '.mp4', 'cctv_video', 'uploaded'); 