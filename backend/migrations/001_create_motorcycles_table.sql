-- UP
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS motorcycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  year INTEGER,
  price DECIMAL(15, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'COP',
  description TEXT,
  full_description TEXT,
  engine JSONB,
  features JSONB NOT NULL DEFAULT '[]',
  colors JSONB NOT NULL DEFAULT '[]',
  images JSONB,
  specs JSONB,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_motorcycles_slug ON motorcycles(slug);
CREATE INDEX idx_motorcycles_category ON motorcycles(category);
CREATE INDEX idx_motorcycles_featured ON motorcycles(featured);

-- DOWN
DROP TABLE IF EXISTS motorcycles;
