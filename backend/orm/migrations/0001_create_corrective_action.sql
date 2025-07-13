-- 개선조치(재발방지대책) ActionItem 테이블 생성
-- investigation_report.accident_id와 1:N 관계
CREATE TABLE IF NOT EXISTS corrective_action (
    id SERIAL PRIMARY KEY, -- PK: 자동 증가
    investigation_id VARCHAR(50) NOT NULL, -- 조사보고서 accident_id 참조
    action_type VARCHAR(20), -- 기술적/교육적/관리적
    title VARCHAR(255), -- 개선계획 명칭(제목)
    improvement_plan TEXT, -- 개선 계획(상세 내용)
    progress_status VARCHAR(20), -- 대기/진행/완료/지연 등
    scheduled_date VARCHAR(20), -- 완료 예정일(YYYY-MM-DD)
    responsible_person VARCHAR(100), -- 담당자
    completion_date VARCHAR(20), -- 완료일(YYYY-MM-DD)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_investigation_id FOREIGN KEY (investigation_id) REFERENCES investigation_report(accident_id) ON DELETE CASCADE
);
-- 인덱스 추가(조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_corrective_action_investigation_id ON corrective_action(investigation_id); 