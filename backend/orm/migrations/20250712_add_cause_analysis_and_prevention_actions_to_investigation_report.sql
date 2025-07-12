-- 조사보고서 테이블에 구조적 원인분석 및 재발방지대책 필드 추가
ALTER TABLE investigation_report
ADD COLUMN IF NOT EXISTS cause_analysis TEXT,
ADD COLUMN IF NOT EXISTS prevention_actions TEXT; 