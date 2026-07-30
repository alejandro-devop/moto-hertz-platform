/**
 * Enlaces al sitio público, para poder ver una ficha como la ve un comprador.
 * En desarrollo el sitio corre en :3000 y el panel en :3001.
 */
export const SITIO_PUBLICO = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '');

/** La ruta pública de una moto es `/motos/<slug>` (ver `web/src/app/motos/[slug]`). */
export function urlPublicaDeMoto(slug: string): string {
  return `${SITIO_PUBLICO}/motos/${slug}`;
}
