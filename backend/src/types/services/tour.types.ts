/**
 * Progreso de los recorridos guiados del panel. Fase 0 del plan de tours —
 * ver `docs/tours-plan/PLAN.md`.
 *
 * No es un dominio de contenido del sitio: no lo consume `web`, no tiene
 * papelera y no se lista con filtros. Es un registro por usuario y por tour.
 */

/** Cómo terminó el recorrido. Los dos cuentan como visto. */
export type TourStatus = 'completed' | 'skipped';

export interface TourProgress {
  id: string;
  /** El `sub` del JWT. Hoy siempre '1' (admin único), ver la migración `015`. */
  userId: string;
  /** La clave del recorrido en el código del panel: `motos.lista`, `panel.bienvenida`… */
  tourKey: string;
  /** La versión del tour que vio. Si el código sube la versión, vuelve a salir. */
  version: number;
  status: TourStatus;
  seenAt: Date;
}

export interface MarkTourSeenInput {
  userId: string;
  tourKey: string;
  version: number;
  status: TourStatus;
}

export interface ResetTourInput {
  userId: string;
  /** Sin clave, se borra el progreso de **todos** los recorridos del usuario. */
  tourKey?: string;
}
