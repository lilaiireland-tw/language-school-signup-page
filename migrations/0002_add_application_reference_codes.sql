ALTER TABLE applications ADD COLUMN reference_code TEXT;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS sequence_number
  FROM applications
)
UPDATE applications
SET reference_code = (
  SELECT printf('ST-%06d', ranked.sequence_number)
  FROM ranked
  WHERE ranked.id = applications.id
);

CREATE UNIQUE INDEX applications_reference_code_idx ON applications (reference_code);

CREATE TABLE application_reference_sequence (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  next_value INTEGER NOT NULL CHECK (next_value > 0)
);

INSERT INTO application_reference_sequence (singleton, next_value)
VALUES (1, (SELECT COUNT(*) + 1 FROM applications));

CREATE TRIGGER applications_assign_reference_code
AFTER INSERT ON applications
WHEN NEW.reference_code IS NULL
BEGIN
  UPDATE application_reference_sequence
  SET next_value = next_value + 1
  WHERE singleton = 1;

  UPDATE applications
  SET reference_code = printf(
    'ST-%06d',
    (SELECT next_value - 1 FROM application_reference_sequence WHERE singleton = 1)
  )
  WHERE id = NEW.id;
END;
