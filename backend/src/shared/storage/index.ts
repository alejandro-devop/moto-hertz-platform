import { LocalStorageDriver } from './local.driver';
import type { StorageDriver } from './types';

export type { StorageDriver } from './types';
export { LocalStorageDriver } from './local.driver';

/**
 * Drivers disponibles. Hoy solo hay uno; agregar S3 o GCS es agregar una línea
 * aquí y un archivo `<nombre>.driver.ts`. Ver `README.md` de esta carpeta.
 */
const DRIVERS: Record<string, () => StorageDriver> = {
  local: () => LocalStorageDriver.fromEnv(),
};

let cache: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (cache) return cache;

  const nombre = process.env.STORAGE_DRIVER || 'local';
  const construir = DRIVERS[nombre];
  if (!construir) {
    throw new Error(
      `STORAGE_DRIVER="${nombre}" no existe. Disponibles: ${Object.keys(DRIVERS).join(', ')}. ` +
        'Para agregar otro, ver backend/src/shared/storage/README.md.'
    );
  }

  cache = construir();
  return cache;
}

/** Solo para los tests: vuelve a leer el entorno en la próxima llamada. */
export function resetStorage(): void {
  cache = null;
}
