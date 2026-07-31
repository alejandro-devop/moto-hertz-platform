/**
 * La costura del almacenamiento de archivos.
 *
 * Todo lo que sube al panel pasa por aquí y por ningún otro lado: ni los
 * services ni los resolvers saben si detrás hay un disco, un bucket de S3 o
 * uno de GCS. Cambiar de sitio de almacenamiento es escribir un archivo nuevo
 * en esta carpeta y mover una variable de entorno — ver `README.md` de esta
 * misma carpeta.
 */
export interface StorageDriver {
  /** Nombre corto del driver, el mismo valor que toma `STORAGE_DRIVER`. */
  readonly name: string;

  /**
   * Guarda (o reemplaza) el contenido bajo `key`. La clave es una ruta
   * relativa con `/` como separador: `2026/07/ab12cd34.webp`.
   */
  put(key: string, body: Buffer, contentType: string): Promise<void>;

  /** Borra el archivo. No falla si ya no está: borrar dos veces es lo mismo. */
  delete(key: string): Promise<void>;

  /** La URL pública con la que el sitio y el panel muestran el archivo. */
  url(key: string): string;

  /** Para diagnósticos y para el borrado definitivo. */
  exists(key: string): Promise<boolean>;
}
