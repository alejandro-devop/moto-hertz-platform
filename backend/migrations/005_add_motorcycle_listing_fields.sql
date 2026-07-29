-- UP
-- Campos necesarios para replicar el PDP del sitio actual (motoshotwheels.com),
-- donde toda esta información vive como texto libre dentro de la descripción.
ALTER TABLE motorcycles
  ADD COLUMN brand VARCHAR(100),
  ADD COLUMN condition VARCHAR(10) NOT NULL DEFAULT 'NEW',
  ADD COLUMN mileage_km INTEGER,
  ADD COLUMN paperwork JSONB,
  ADD COLUMN commercial JSONB,
  ADD COLUMN location JSONB;

ALTER TABLE motorcycles
  ADD CONSTRAINT motorcycles_condition_check CHECK (condition IN ('NEW', 'USED'));

ALTER TABLE motorcycles
  ADD CONSTRAINT motorcycles_mileage_km_check CHECK (mileage_km IS NULL OR mileage_km >= 0);

CREATE INDEX idx_motorcycles_brand ON motorcycles(brand);
CREATE INDEX idx_motorcycles_condition ON motorcycles(condition);

-- DOWN
DROP INDEX IF EXISTS idx_motorcycles_condition;
DROP INDEX IF EXISTS idx_motorcycles_brand;

ALTER TABLE motorcycles
  DROP CONSTRAINT IF EXISTS motorcycles_mileage_km_check;

ALTER TABLE motorcycles
  DROP CONSTRAINT IF EXISTS motorcycles_condition_check;

ALTER TABLE motorcycles
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS commercial,
  DROP COLUMN IF EXISTS paperwork,
  DROP COLUMN IF EXISTS mileage_km,
  DROP COLUMN IF EXISTS condition,
  DROP COLUMN IF EXISTS brand;
