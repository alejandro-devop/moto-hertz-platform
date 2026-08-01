/**
 * Estado de un banner en el sitio, derivado de `active`, `startsAt` y
 * `endsAt` — el backend no guarda un campo `status` (mismo criterio que
 * `lib/motorcycle-status.ts` y `lib/news-status.ts`). La regla es la misma
 * que aplica `banner.service.ts` del backend para la vista pública: activo,
 * y dentro de vigencia.
 */

export type BannerStatus = 'visible' | 'inactivo' | 'programado' | 'vencido';

export const ETIQUETAS_ESTADO_BANNER: Record<BannerStatus, string> = {
  visible: 'Visible en el sitio',
  inactivo: 'Inactivo',
  programado: 'Programado',
  vencido: 'Vencido',
};

export function getBannerStatus(
  banner: { active: boolean; startsAt?: string | null; endsAt?: string | null },
  ahora: number = Date.now()
): BannerStatus {
  if (!banner.active) return 'inactivo';
  if (banner.startsAt && new Date(banner.startsAt).getTime() > ahora) return 'programado';
  if (banner.endsAt && new Date(banner.endsAt).getTime() < ahora) return 'vencido';
  return 'visible';
}

export function bannerStatusTone(status: BannerStatus): 'ok' | 'warn' | 'muted' {
  if (status === 'visible') return 'ok';
  if (status === 'programado') return 'warn';
  return 'muted';
}
