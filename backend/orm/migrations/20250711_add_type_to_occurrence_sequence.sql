-- type 컬럼 추가, site_code nullable, UNIQUE 제약조건 변경
ALTER TABLE occurrence_sequence
  ALTER COLUMN site_code DROP NOT NULL;

ALTER TABLE occurrence_sequence
  ADD COLUMN type VARCHAR(10) NOT NULL DEFAULT 'site';

-- 기존 UNIQUE 제약조건 삭제 후 새로 추가
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'UNIQUE'
      AND table_name = 'occurrence_sequence'
      AND constraint_name = 'occurrence_sequence_company_code_site_code_year_key'
  ) THEN
    ALTER TABLE occurrence_sequence DROP CONSTRAINT occurrence_sequence_company_code_site_code_year_key;
  END IF;
END$$;

ALTER TABLE occurrence_sequence
  ADD CONSTRAINT occurrence_sequence_unique_type UNIQUE (company_code, year, type, site_code); 