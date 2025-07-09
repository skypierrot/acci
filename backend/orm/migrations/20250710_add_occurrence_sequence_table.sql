-- 회사/사업장/연도별 사고 시퀀스 관리 테이블
CREATE TABLE IF NOT EXISTS occurrence_sequence (
    id SERIAL PRIMARY KEY,
    company_code VARCHAR(20) NOT NULL,
    site_code VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    current_seq INT NOT NULL DEFAULT 0,
    UNIQUE (company_code, site_code, year)
); 