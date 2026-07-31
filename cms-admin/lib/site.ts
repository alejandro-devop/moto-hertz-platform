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

/**
 * Los puntos de atención **no tienen página propia** en el sitio: viven todos
 * en `/puntos-atencion`, y cada tarjeta lleva el `id` de su slug para poder
 * enlazar directo al que se está editando.
 */
export function urlPublicaDePunto(slug?: string): string {
  return slug ? `${SITIO_PUBLICO}/puntos-atencion#${slug}` : `${SITIO_PUBLICO}/puntos-atencion`;
}

/** El enlace de chat que arma el sitio con un número de WhatsApp. */
export function urlWhatsApp(numero?: string | null): string | null {
  const digitos = (numero ?? '').replace(/\D/g, '');
  return digitos.length >= 7 ? `https://wa.me/${digitos}` : null;
}
