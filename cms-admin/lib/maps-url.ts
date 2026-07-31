/**
 * Coordenadas de un enlace de Google Maps, **solo para avisar en la ficha**
 * mientras se escribe: «este enlace trae coordenadas / este no».
 *
 * Quien manda es el backend (`backend/src/shared/geo/maps-url.ts`): él vuelve a
 * extraerlas al guardar y lo que quede en la base sale de ahí. Está duplicado a
 * propósito —son doce líneas de expresión regular— porque la alternativa es
 * pedirle al servidor que valide cada tecla o dejar al usuario pegando un
 * enlace sin saber si sirve hasta después de guardar.
 */
export interface Coordenadas {
  lat: number;
  lng: number;
}

const PATRONES: RegExp[] = [
  /!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
  /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
  /[?&#](?:q|query|ll|sll|daddr|center)=(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)\s*(-?\d{1,3}(?:\.\d+)?)/i,
];

export function coordenadasDeMapsUrl(url?: string | null): Coordenadas | null {
  if (!url) return null;
  const texto = url.trim();
  if (!/^https?:\/\//i.test(texto)) return null;

  for (const patron of PATRONES) {
    const encontrado = texto.match(patron);
    if (!encontrado) continue;
    const lat = Number(encontrado[1]);
    const lng = Number(encontrado[2]);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      return { lat, lng };
    }
  }

  return null;
}

/** `6.245` → `"6,245000"` no: las coordenadas se leen con punto, siempre. */
export function formatCoordenadas({ lat, lng }: Coordenadas): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
