-- UP
-- Fase 0 del plan de tours (docs/tours-plan/PLAN.md): dónde queda registrado
-- que un usuario ya vio el recorrido guiado de una sección del panel. Una fila
-- = «este usuario ya vio este tour». Sin fila = no lo ha visto.
--
-- SOBRE `user_id`: hoy el panel no tiene tabla de usuarios — el admin vive en
-- variables de entorno (`ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`) y su id es la
-- constante '1' que emite `auth.service.ts` en el `sub` del JWT. Esta columna
-- guarda ese `sub` como texto, sin llave foránea, justamente porque todavía no
-- hay tabla a la cual apuntar. El día que exista `users`, se agrega la FK y no
-- hay que migrar ni un dato: el `sub` ya era el id.
--
-- SOBRE `version`: es lo que evita que el sistema se pudra. Cuando una sección
-- cambie de interfaz, su tour cambia de pasos y se le sube la versión EN EL
-- CÓDIGO; el recorrido vuelve a salir para todos sin borrarle el historial a
-- nadie. La regla de decisión vive en el panel: mostrar si no hay fila, o si
-- la fila guardada tiene una versión menor que la del código.
--
-- SOBRE `status`: 'completed' es llegar al último paso; 'skipped' es cerrarlo
-- antes. Los dos cuentan como visto (no se insiste), pero la diferencia es la
-- única señal que vamos a tener de si un tour ayuda o estorba.
--
-- Sin siembra inicial: la tabla nace vacía y eso significa exactamente lo que
-- parece — nadie ha visto ningún recorrido todavía.

CREATE TABLE tour_progress (
  id UUID PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  tour_key VARCHAR(100) NOT NULL,
  version SMALLINT NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tour_progress_status_check CHECK (status IN ('completed', 'skipped'))
);

-- Único por (usuario, tour): marcar visto dos veces no es un error, es un
-- `update`. De aquí sale el upsert del service.
CREATE UNIQUE INDEX idx_tour_progress_user_tour ON tour_progress(user_id, tour_key);

-- La consulta que corre en cada carga del panel es «todo el progreso de este
-- usuario», y el índice único de arriba ya la sirve por su primera columna.

-- DOWN
DROP INDEX IF EXISTS idx_tour_progress_user_tour;
DROP TABLE IF EXISTS tour_progress;
