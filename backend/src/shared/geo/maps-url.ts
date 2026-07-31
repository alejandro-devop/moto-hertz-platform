/**
 * Coordenadas a partir de un enlace de Google Maps.
 *
 * La ubicación de un punto de atención se captura pegando el enlace, no
 * escribiendo latitud y longitud: nadie las tiene a mano. Cuando el enlace las
 * lleva dentro, se extraen para que el sitio pueda pintar un mapa incrustado;
 * cuando no, se guarda solo la URL y el sitio ofrece «Cómo llegar».
 *
 * Formatos que trae Google, en el orden en que se buscan:
 *
 * | Forma | Ejemplo |
 * | --- | --- |
 * | `!3d…!4d…` | `…/data=!3m1!4b1!4m5!3d6.0629124!4d-75.5026782` (el pin exacto) |
 * | `@lat,lng` | `…/@6.0629124,-75.5026782,17z` (el centro del mapa) |
 * | `q=` / `query=` / `ll=` / `daddr=` | `…/maps?q=6.0629124,-75.5026782` |
 *
 * `!3d…!4d…` gana sobre `@…` porque el primero es el lugar y el segundo es
 * donde quedó encuadrada la cámara, que puede estar corrida.
 *
 * Lo que **no** se resuelve: los acortados `maps.app.goo.gl` / `goo.gl/maps`.
 * Resolverlos exigiría una petición HTTP de salida desde el backend al guardar;
 * no vale ese riesgo por una comodidad. Se guardan tal cual y el punto queda
 * sin mapa incrustado (el enlace sigue funcionando para el visitante).
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

function enRango({ lat, lng }: Coordenadas): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Las coordenadas del enlace, o `null` si no las trae (o si el texto no es una
 * URL de Google Maps).
 */
export function coordenadasDeMapsUrl(url?: string | null): Coordenadas | null {
  if (!url) return null;
  const texto = url.trim();
  if (!/^https?:\/\//i.test(texto)) return null;

  for (const patron of PATRONES) {
    const encontrado = texto.match(patron);
    if (!encontrado) continue;
    const coords = { lat: Number(encontrado[1]), lng: Number(encontrado[2]) };
    if (Number.isFinite(coords.lat) && Number.isFinite(coords.lng) && enRango(coords)) {
      return coords;
    }
  }

  return null;
}
