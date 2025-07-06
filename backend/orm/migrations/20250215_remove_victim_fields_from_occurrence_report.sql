-- 발생보고서 테이블에서 재해자 관련 컬럼 제거
ALTER TABLE occurrence_report
  DROP COLUMN IF EXISTS victim_name,
  DROP COLUMN IF EXISTS victim_age,
  DROP COLUMN IF EXISTS victim_belong,
  DROP COLUMN IF EXISTS victim_duty,
  DROP COLUMN IF EXISTS injury_type,
  DROP COLUMN IF EXISTS ppe_worn,
  DROP COLUMN IF EXISTS first_aid; 