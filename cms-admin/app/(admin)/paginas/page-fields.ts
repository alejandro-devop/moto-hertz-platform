export interface PageFieldDef {
  key: string;
  label: string;
  hint?: string;
  multiline?: boolean;
  /** El mismo texto que hoy está quemado en `web`: la ficha nunca arranca vacía. */
  default: string;
}

/**
 * Qué campos tiene cada página. Agregar una página nueva es sumar una
 * entrada acá (y su propia ruta de `web`) — no pide migración: `page_content`
 * es genérica (ver `docs/cms-plan/MEJORAS.md` y la migración `012` del
 * backend).
 */
export const PAGE_FIELDS: Record<string, PageFieldDef[]> = {
  motos: [
    {
      key: 'heading',
      label: 'Encabezado',
      default: 'Nuestras Motocicletas',
    },
    {
      key: 'caption',
      label: 'Bajada',
      multiline: true,
      default:
        'Descubre la línea completa de motocicletas Yamaha. Potencia, tecnología y diseño en cada modelo.',
    },
  ],
};

export const PAGE_LABELS: Record<string, string> = {
  motos: 'Motos',
};
