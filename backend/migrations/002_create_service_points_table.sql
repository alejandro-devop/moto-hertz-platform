-- UP
CREATE TABLE IF NOT EXISTS service_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  address JSONB,
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  email VARCHAR(255),
  location JSONB,
  hours JSONB,
  services JSONB NOT NULL DEFAULT '[]',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_points_slug ON service_points(slug);
CREATE INDEX idx_service_points_featured ON service_points(featured);

-- DOWN
DROP TABLE IF EXISTS service_points;
