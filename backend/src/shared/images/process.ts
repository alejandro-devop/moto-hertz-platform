import sharp from 'sharp';
import { BadRequestError } from '../errors';

/**
 * Todo lo que sube se guarda como un WebP de lado mayor acotado, y el original
 * se descarta. Una foto de teléfono son 4–8 MB y una moto lleva 16–18: guardar
 * los originales llenaría el disco del droplet en un par de meses sin que nadie
 * los mire nunca en ese tamaño.
 */
export const LADO_MAYOR_PX = Number(process.env.MEDIA_MAX_SIDE_PX || 1600);
export const CALIDAD_WEBP = Number(process.env.MEDIA_WEBP_QUALITY || 82);

/** Lo que el endpoint acepta recibir. El resto se rechaza antes de tocar sharp. */
export const MIMES_ACEPTADOS = [
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
];

export interface ImagenProcesada {
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: 'image/webp';
  extension: 'webp';
}

export function esMimeAceptado(mimeType: string | undefined): boolean {
  if (!mimeType) return false;
  return MIMES_ACEPTADOS.includes(mimeType.toLowerCase());
}

/**
 * Redimensiona (sin agrandar), convierte a WebP y devuelve el resultado con
 * sus dimensiones reales. `rotate()` sin argumentos aplica la orientación EXIF:
 * sin eso, las fotos verticales de iPhone salen acostadas.
 */
export async function procesarImagen(entrada: Buffer): Promise<ImagenProcesada> {
  let salida: Buffer;
  let info: sharp.OutputInfo;

  try {
    const resultado = await sharp(entrada, { animated: false })
      .rotate()
      .resize({
        width: LADO_MAYOR_PX,
        height: LADO_MAYOR_PX,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: CALIDAD_WEBP })
      .toBuffer({ resolveWithObject: true });

    salida = resultado.data;
    info = resultado.info;
  } catch (error) {
    throw new BadRequestError(
      'No se pudo leer la imagen. Puede estar dañada o en un formato que el servidor no entiende (prueba con JPG, PNG o WebP).'
    );
  }

  return {
    buffer: salida,
    width: info.width,
    height: info.height,
    mimeType: 'image/webp',
    extension: 'webp',
  };
}
