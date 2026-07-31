'use client';

import { Newspaper, Star } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { StatusPill } from '@/components/admin/status-pill';
import { Thumb } from '@/components/admin/thumb';
import { formatDate } from '@/lib/format';
import { ETIQUETAS_ESTADO_NOTICIA, getNewsStatus, newsStatusTone } from '@/lib/news-status';
import type { News } from '@/lib/graphql/news';
import type { SeccionId } from './form-sections';
import { NewsActions } from './news-actions';

interface Props {
  noticia: News;
  onEdit: (noticia: News, seccion?: SeccionId) => void;
}

function Estado({ noticia }: { noticia: News }) {
  if (noticia.deletedAt) return <StatusPill tone="muted">En papelera</StatusPill>;

  const estado = getNewsStatus(noticia.publishedAt);
  return (
    <span className="flex flex-wrap items-center gap-1">
      <StatusPill tone={newsStatusTone(estado)}>{ETIQUETAS_ESTADO_NOTICIA[estado]}</StatusPill>
      {noticia.featured ? (
        <StatusPill tone="ok" dot={false}>
          <Star className="size-3" />
          Destacada
        </StatusPill>
      ) : null}
    </span>
  );
}

export function NewsTableRow({ noticia, onEdit }: Props) {
  return (
    <TableRow>
      <TableCell>
        <button
          type="button"
          onClick={() => onEdit(noticia)}
          className="flex items-start gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Thumb src={noticia.image} alt={noticia.title} icon={Newspaper} />
          <span className="min-w-0">
            <span className="block max-w-[42ch] truncate font-semibold">{noticia.title}</span>
            <span className="block max-w-[42ch] truncate text-[12px] text-muted-foreground">
              {noticia.excerpt?.trim() || 'Sin resumen'}
            </span>
          </span>
        </button>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {noticia.author?.trim() || <span className="text-muted-foreground">Sin autor</span>}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {noticia.category?.trim() || <span className="text-muted-foreground">Sin categoría</span>}
      </TableCell>
      <TableCell className="font-mono text-[12px] whitespace-nowrap text-muted-foreground">
        {formatDate(noticia.publishedAt) ?? '—'}
      </TableCell>
      <TableCell>
        <Estado noticia={noticia} />
      </TableCell>
      <TableCell className="text-right">
        <NewsActions noticia={noticia} onEdit={onEdit} />
      </TableCell>
    </TableRow>
  );
}

/** La misma fila, en tarjeta, para el teléfono: nada de menos, solo repartido. */
export function NewsCard({ noticia, onEdit }: Props) {
  const estado = getNewsStatus(noticia.publishedAt);

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <button
        type="button"
        onClick={() => onEdit(noticia)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Thumb src={noticia.image} alt={noticia.title} icon={Newspaper} className="size-10" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="line-clamp-2 text-[13px] leading-tight font-semibold">
            {noticia.title}
          </span>
          <span className="flex flex-wrap items-center gap-1">
            {noticia.deletedAt ? (
              <StatusPill tone="muted">En papelera</StatusPill>
            ) : (
              <>
                <StatusPill tone={newsStatusTone(estado)}>
                  {ETIQUETAS_ESTADO_NOTICIA[estado]}
                </StatusPill>
                {noticia.featured ? (
                  <StatusPill tone="ok" dot={false}>
                    <Star className="size-3" />
                    Destacada
                  </StatusPill>
                ) : null}
              </>
            )}
          </span>
          <span className="text-[12px] text-muted-foreground">
            {[
              noticia.author?.trim() || 'Sin autor',
              noticia.category?.trim(),
              formatDate(noticia.publishedAt),
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
      </button>
      <NewsActions noticia={noticia} onEdit={onEdit} />
    </li>
  );
}
