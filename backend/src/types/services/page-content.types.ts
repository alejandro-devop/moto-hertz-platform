/**
 * Contenido editorial suelto de una página del sitio (heading, caption,
 * etc.). Tabla genérica `page` + `field` + `value` — ver la nota de la
 * migración `012` y `docs/cms-plan/MEJORAS.md`.
 */
export interface PageContentField {
  page: string;
  field: string;
  value: string | null;
  updatedAt: Date;
}

export interface SetPageContentFieldInput {
  field: string;
  value: string;
}
