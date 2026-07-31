/** Un archivo de la biblioteca de medios. */
export interface Media {
  id: string;
  /** Ruta dentro del driver de almacenamiento: `2026/07/ab12cd34.webp`. */
  key: string;
  /** URL pública tal como quedó guardada en el contenido el día de la subida. */
  url: string;
  driver: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  originalName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Papelera. `null` = visible en la biblioteca. */
  deletedAt?: Date | null;
}

export interface MediaCollection {
  media: Media[];
  page: number;
  limit: number;
  total: number;
}

export interface ListMediaOptions {
  page?: number;
  limit?: number;
  /** Busca en el nombre original y en la clave. */
  q?: string;
  /** `false` (por defecto) = biblioteca; `true` = solo la papelera. */
  trashed?: boolean;
}

export interface CreateMediaInput {
  key: string;
  url: string;
  driver: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  originalName?: string;
}
