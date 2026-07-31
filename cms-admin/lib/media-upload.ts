import type { Media } from '@/lib/graphql/media';

/**
 * Subir una foto, con progreso.
 *
 * Va por `XMLHttpRequest` y no por `fetch` a propósito: `fetch` no informa el
 * progreso de **subida**, y aquí lo que tarda es justamente subir (una moto
 * lleva 16–18 fotos tomadas con el teléfono, muchas veces desde el patio con
 * datos móviles). Sin barra, la pantalla parece colgada.
 */

export const ACEPTA_IMAGENES = 'image/*';

export interface SubidaEnCurso {
  promesa: Promise<Media>;
  cancelar: () => void;
}

interface RespuestaOk {
  status: true;
  data: Media;
}

interface RespuestaError {
  status: false;
  errors?: string[];
}

function mensajeDeRespuesta(texto: string, estado: number): string {
  try {
    const cuerpo = JSON.parse(texto) as RespuestaError;
    const primero = cuerpo.errors?.[0];
    if (primero) return primero;
  } catch {
    /* El backend puede devolver HTML si algo se rompió antes de la ruta. */
  }
  if (estado === 401) return 'La sesión venció. Vuelve a entrar al panel.';
  if (estado === 413) return 'La imagen es demasiado grande para subirla.';
  return `No se pudo subir la imagen (error ${estado}).`;
}

export function subirImagen(
  file: File,
  onProgress?: (porcentaje: number) => void
): SubidaEnCurso {
  const xhr = new XMLHttpRequest();

  const promesa = new Promise<Media>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', '/api/media/upload');

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      /* Se corta en 99: el 100 % se muestra cuando el servidor respondió, no
         cuando terminó de recibir — todavía falta procesar la imagen. */
      onProgress?.(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const cuerpo = JSON.parse(xhr.responseText) as RespuestaOk;
          onProgress?.(100);
          resolve(cuerpo.data);
          return;
        } catch {
          reject(new Error('El servidor respondió algo que no se entiende.'));
          return;
        }
      }
      reject(new Error(mensajeDeRespuesta(xhr.responseText, xhr.status)));
    });

    xhr.addEventListener('error', () =>
      reject(new Error('Se cortó la conexión mientras se subía la imagen.'))
    );
    xhr.addEventListener('abort', () => reject(new Error('Subida cancelada.')));

    xhr.send(formData);
  });

  return { promesa, cancelar: () => xhr.abort() };
}

/** `144706` → `"141 KB"`. Los tamaños se leen de un vistazo, no al detalle. */
export function formatBytes(bytes?: number | null): string {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** `1600 × 1067`. */
export function formatDimensiones(width?: number | null, height?: number | null): string {
  if (!width || !height) return '—';
  return `${width} × ${height}`;
}

/** Solo se aceptan imágenes; en el teléfono esto abre cámara o galería. */
export function esImagen(file: File): boolean {
  return file.type.startsWith('image/');
}
