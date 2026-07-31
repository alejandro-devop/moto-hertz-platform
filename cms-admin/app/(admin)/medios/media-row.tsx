'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { StatusPill } from '@/components/admin/status-pill';
import { Thumb } from '@/components/admin/thumb';
import { formatDate } from '@/lib/format';
import { formatBytes, formatDimensiones } from '@/lib/media-upload';
import type { Media } from '@/lib/graphql/media';
import { MediaActions, nombreDeMedia } from './media-actions';

/**
 * En una biblioteca de imágenes lo que identifica el archivo es la imagen, así
 * que la miniatura es más grande que en el resto de las listas y la fila entera
 * está construida alrededor de ella.
 */
export function MediaTableRow({ item }: { item: Media }) {
  return (
    <TableRow>
      <TableCell>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Thumb src={item.url} alt={nombreDeMedia(item)} className="size-14" />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{nombreDeMedia(item)}</span>
            <span className="block truncate font-mono text-[11px] text-muted-foreground">
              {item.key}
            </span>
          </span>
        </a>
      </TableCell>
      <TableCell className="font-mono whitespace-nowrap text-muted-foreground tabular-nums">
        {formatDimensiones(item.width, item.height)}
      </TableCell>
      <TableCell className="font-mono whitespace-nowrap text-muted-foreground tabular-nums">
        {formatBytes(item.sizeBytes)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatDate(item.createdAt) ?? '—'}
      </TableCell>
      <TableCell>
        {item.deletedAt ? (
          <StatusPill tone="muted">En papelera</StatusPill>
        ) : (
          <StatusPill tone="ok" dot={false}>
            {item.mimeType.replace('image/', '').toUpperCase()}
          </StatusPill>
        )}
      </TableCell>
      <TableCell className="text-right">
        <MediaActions item={item} />
      </TableCell>
    </TableRow>
  );
}

/** La misma información en tarjeta, con la imagen más grande, para el teléfono. */
export function MediaCard({ item }: { item: Media }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Thumb src={item.url} alt={nombreDeMedia(item)} className="size-16" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate text-[13px] leading-tight font-semibold">
            {nombreDeMedia(item)}
          </span>
          <span className="flex flex-wrap items-center gap-1">
            {item.deletedAt ? (
              <StatusPill tone="muted">En papelera</StatusPill>
            ) : (
              <StatusPill tone="ok" dot={false}>
                {item.mimeType.replace('image/', '').toUpperCase()}
              </StatusPill>
            )}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {formatDimensiones(item.width, item.height)} · {formatBytes(item.sizeBytes)} ·{' '}
            {formatDate(item.createdAt) ?? '—'}
          </span>
        </span>
      </a>
      <MediaActions item={item} />
    </li>
  );
}
