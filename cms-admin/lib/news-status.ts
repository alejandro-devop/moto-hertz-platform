/**
 * Estado de publicación de una noticia, derivado de `publishedAt` — el
 * backend no guarda un campo `status` (mismo criterio que
 * `lib/motorcycle-status.ts`). Es la primera sección del proyecto donde el
 * panel necesita distinguir tres estados a partir de una sola fecha, y donde
 * el sitio público de verdad no ve dos de los tres (ver `backend/CLAUDE.md`,
 * sección `news`).
 */

export type NewsStatus = 'borrador' | 'programada' | 'publicada';

export const ETIQUETAS_ESTADO_NOTICIA: Record<NewsStatus, string> = {
  borrador: 'Borrador',
  programada: 'Programada',
  publicada: 'Publicada',
};

/**
 * Sin `publishedAt` = borrador. En el futuro = programada. Hoy o antes =
 * publicada. La comparación es contra el instante real (no contra el día),
 * porque es exactamente la misma regla que aplica `news.service.ts` del
 * backend (`publishedAt <= now()`) — decirlo distinto aquí solo confundiría.
 */
export function getNewsStatus(publishedAt?: string | null): NewsStatus {
  if (!publishedAt) return 'borrador';
  const fecha = new Date(publishedAt).getTime();
  if (Number.isNaN(fecha)) return 'borrador';
  return fecha > Date.now() ? 'programada' : 'publicada';
}

export function newsStatusTone(status: NewsStatus): 'ok' | 'warn' | 'muted' {
  if (status === 'publicada') return 'ok';
  if (status === 'programada') return 'warn';
  return 'muted';
}

/* -------------------------------------------------------------------------- *
 * Tiempo de lectura sugerido
 *
 * `readTime` es un campo de texto libre y editable a mano ("puede calcularse
 * del contenido y dejarse editable", pide el documento de la fase). Esto es
 * solo la sugerencia: nunca se impone.
 * -------------------------------------------------------------------------- */

const PALABRAS_POR_MINUTO = 200;

/** Cuenta palabras del HTML del editor, ignorando las etiquetas. */
function contarPalabras(html: string): number {
  const texto = html.replace(/<[^>]*>/g, ' ');
  const palabras = texto.trim().split(/\s+/).filter(Boolean);
  return palabras.length;
}

/** `"<p>...600 palabras...</p>"` → `"3 min"`. Nunca menos de un minuto. */
export function tiempoDeLecturaSugerido(contentHtml: string): string {
  const palabras = contarPalabras(contentHtml);
  if (palabras === 0) return '';
  const minutos = Math.max(1, Math.round(palabras / PALABRAS_POR_MINUTO));
  return `${minutos} min`;
}
