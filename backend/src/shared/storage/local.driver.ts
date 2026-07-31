import { mkdir, rm, stat, writeFile } from 'fs/promises';
import { dirname, join, normalize, resolve, sep } from 'path';
import type { StorageDriver } from './types';

/**
 * Driver de disco local. Es el que se usa hoy: el backend vive en un droplet
 * y `MEDIA_ROOT` es un volumen de Docker, así que los archivos sobreviven a
 * recrear el contenedor (no a recrear el droplet — ver riesgos de la fase).
 *
 * Los archivos se sirven en `MEDIA_PUBLIC_BASE_URL` (`/media/**` del propio
 * backend, montado en `app.ts`).
 */
export class LocalStorageDriver implements StorageDriver {
  readonly name = 'local';

  constructor(
    private readonly root: string,
    private readonly baseUrl: string
  ) {}

  /**
   * Una clave nunca puede salirse de `root`. Sin esto, un `key` con `../`
   * escribiría o borraría donde quisiera.
   */
  private pathFor(key: string): string {
    const limpia = normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    const destino = resolve(this.root, limpia);
    if (destino !== this.root && !destino.startsWith(this.root + sep)) {
      throw new Error(`Clave de almacenamiento inválida: ${key}`);
    }
    return destino;
  }

  async put(key: string, body: Buffer): Promise<void> {
    const destino = this.pathFor(key);
    await mkdir(dirname(destino), { recursive: true });
    await writeFile(destino, body);
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  url(key: string): string {
    return `${this.baseUrl.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.pathFor(key));
      return true;
    } catch {
      return false;
    }
  }

  /** Solo para diagnósticos y para el arranque. */
  get rootPath(): string {
    return this.root;
  }

  static fromEnv(): LocalStorageDriver {
    const root = resolve(process.env.MEDIA_ROOT || join(process.cwd(), 'uploads'));
    const baseUrl = process.env.MEDIA_PUBLIC_BASE_URL || 'http://localhost:8080/media';
    return new LocalStorageDriver(root, baseUrl);
  }
}
