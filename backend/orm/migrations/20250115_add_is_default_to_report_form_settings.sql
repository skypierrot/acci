-- 기본설정 여부 컬럼 추가
ALTER TABLE "report_form_settings" ADD COLUMN "is_default" boolean DEFAULT false; 