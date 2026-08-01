-- UP
-- Fase 6 del plan CMS (docs/cms-plan/phases/06-configuracion-sitio.md): saca
-- del código de `web` los datos de contacto, redes sociales, SEO y el nombre
-- del sitio, y los deja en un registro único administrable desde el panel.
--
-- `site_settings` es la única tabla del proyecto sin `Add` ni `Remove`: el
-- `CHECK (id = 1)` fuerza que exista una sola fila, y esa fila la crea esta
-- misma migración con los valores que hoy están quemados en el código de
-- `web`, para que el sitio se vea igual al terminar la fase.
--
-- DOS EXCEPCIONES A "los valores que hoy están en el código":
--
-- (1) `phone` no hereda el `+52 55 1234 5678` de
-- `web/src/components/footer/footer-data.json` (campo `contact.phone`):
-- es un prefijo de México (+52) en un sitio colombiano, dato de prueba sin
-- limpiar. Se siembra con un prefijo de Colombia (+57) y un número de
-- PLACEHOLDER — hay que corregirlo con el teléfono real desde el panel.
--
-- (2) Los cuatro enlaces sociales (`facebook`, `instagram`, `twitter`,
-- `youtube`) hoy son anclas rotas (`#facebook`, `#instagram`, ...) en
-- `footer-data.json`, no URLs. Como el backend valida formato de URL en
-- `siteSettingsEdit` (para que el panel avise si algo no es una URL válida),
-- sembrar esas anclas haría fallar el primer guardado del panel aunque nadie
-- toque los campos sociales. Se siembran en NULL y el pie de página deja de
-- mostrar el icono de una red sin URL configurada, en vez de enlazar a un
-- "#" que no lleva a ningún lado.
--
-- `address` consolida las dos "sedes" de plantilla del footer
-- (`company.locations`: "Medellín, Colombia" / "Bogotá, Colombia", cada una
-- con su propio teléfono) en un solo campo de dirección global, tal como pide
-- el inventario de esta fase (contacto = teléfono, correo, WhatsApp y
-- dirección física global, no una lista de sedes — eso ya lo administra
-- `service_points` desde la Fase 2). Se conserva el texto de la primera
-- ("Medellín, Colombia") como valor inicial.

CREATE TABLE site_settings (
  -- Fila única: cualquier intento de insertar un id distinto de 1 falla.
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name VARCHAR(255) NOT NULL DEFAULT 'Yamaha Oriente',
  phone VARCHAR(50),
  email VARCHAR(255),
  whatsapp VARCHAR(50),
  address TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  social_youtube TEXT,
  seo_title VARCHAR(255),
  seo_description VARCHAR(500),
  seo_keywords JSONB NOT NULL DEFAULT '[]',
  seo_image TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_settings (
  id, site_name, phone, email, whatsapp, address,
  social_facebook, social_instagram, social_twitter, social_youtube,
  seo_title, seo_description, seo_keywords, seo_image
) VALUES (
  1,
  'Yamaha Oriente',
  '+57 300 000 0000', -- PLACEHOLDER: corregir con el teléfono real del sitio.
  'info@yamahaoriente.com',
  NULL,
  'Medellín, Colombia',
  NULL,
  NULL,
  NULL,
  NULL,
  'Yamaha Oriente',
  'Sitio web de Yamaha Oriente',
  '[]',
  NULL
);

-- DOWN
DROP TABLE IF EXISTS site_settings;
