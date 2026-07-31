'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { StatusPill, paperTone, publicationTone } from '@/components/admin/status-pill';
import { Thumb } from '@/components/admin/thumb';
import { formatCop, formatMiles } from '@/lib/format';
import { getPaperwork, getPublication } from '@/lib/motorcycle-status';
import type { Motorcycle } from '@/lib/graphql/motorcycles';
import { MotorcycleActions } from './motorcycle-actions';
import type { SeccionId } from './form-sections';

interface Props {
  motorcycle: Motorcycle;
  onEdit: (motorcycle: Motorcycle, seccion?: SeccionId) => void;
}

/** Marca · año · kilometraje · fotos: lo que identifica la moto sin leer el nombre. */
function subtitulo(motorcycle: Motorcycle): string {
  const fotos = (motorcycle.images?.gallery?.length ?? 0) + (motorcycle.images?.main ? 1 : 0);
  const partes = [
    motorcycle.brand,
    motorcycle.year?.toString(),
    motorcycle.condition === 'USED' && motorcycle.mileageKm !== null
      ? `${formatMiles(motorcycle.mileageKm)} km`
      : null,
    fotos > 0 ? `${fotos} ${fotos === 1 ? 'foto' : 'fotos'}` : 'sin fotos',
  ].filter(Boolean);
  return partes.join(' · ');
}

function Publicacion({ motorcycle }: { motorcycle: Motorcycle }) {
  const publicacion = getPublication(motorcycle);

  /* En la papelera el estado de publicación no dice nada: la moto no está en
     el sitio pase lo que pase. */
  if (motorcycle.deletedAt) {
    return <StatusPill tone="muted">En papelera</StatusPill>;
  }

  return (
    <span className="flex flex-col items-start gap-1">
      <span className="flex flex-wrap items-center gap-1">
        <StatusPill tone={publicationTone(publicacion.level)}>{publicacion.label}</StatusPill>
        {motorcycle.featured ? (
          <StatusPill tone="muted" dot={false}>
            Destacada
          </StatusPill>
        ) : null}
      </span>
      {publicacion.missing.length > 0 ? (
        <span className="text-[11px] text-muted-foreground">
          Falta {publicacion.missing.join(', ')}
        </span>
      ) : null}
    </span>
  );
}

export function MotorcycleTableRow({ motorcycle, onEdit }: Props) {
  const papeles = getPaperwork(motorcycle);
  const precio = formatCop(motorcycle.price);

  return (
    <TableRow>
      <TableCell>
        <button
          type="button"
          onClick={() => onEdit(motorcycle)}
          className="flex items-center gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Thumb src={motorcycle.images?.main} alt={motorcycle.name} />
          <span className="min-w-0">
            <span className="block font-semibold">{motorcycle.name}</span>
            <span className="block font-mono text-[11px] text-muted-foreground">
              {subtitulo(motorcycle)}
            </span>
          </span>
        </button>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {motorcycle.condition === 'USED' ? 'Usada' : 'Nueva'}
      </TableCell>
      <TableCell>
        {papeles.worst.level === 'no-aplica' ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <StatusPill tone={paperTone(papeles.worst.level)}>{papeles.worst.label}</StatusPill>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{motorcycle.location?.name || '—'}</TableCell>
      <TableCell className="text-right font-mono whitespace-nowrap">
        {precio ?? <span className="text-muted-foreground">Sin precio</span>}
      </TableCell>
      <TableCell>
        <Publicacion motorcycle={motorcycle} />
      </TableCell>
      <TableCell className="text-right">
        <MotorcycleActions motorcycle={motorcycle} onEdit={onEdit} />
      </TableCell>
    </TableRow>
  );
}

/** La misma fila, en tarjeta, para el teléfono. */
export function MotorcycleCard({ motorcycle, onEdit }: Props) {
  const papeles = getPaperwork(motorcycle);
  const publicacion = getPublication(motorcycle);
  const precio = formatCop(motorcycle.price);

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <button
        type="button"
        onClick={() => onEdit(motorcycle)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Thumb src={motorcycle.images?.main} alt={motorcycle.name} className="size-14" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-[13px] leading-tight font-semibold">{motorcycle.name}</span>
          <span className="font-mono text-[13px] font-medium">
            {precio ?? <span className="text-muted-foreground">Sin precio</span>}
          </span>
          <span className="flex flex-wrap items-center gap-1">
            {motorcycle.deletedAt ? (
              <StatusPill tone="muted">En papelera</StatusPill>
            ) : (
              <StatusPill tone={publicationTone(publicacion.level)}>{publicacion.label}</StatusPill>
            )}
            {papeles.needsAttention && !motorcycle.deletedAt ? (
              <StatusPill tone={paperTone(papeles.worst.level)}>{papeles.worst.label}</StatusPill>
            ) : null}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {subtitulo(motorcycle)}
          </span>
        </span>
      </button>
      <MotorcycleActions motorcycle={motorcycle} onEdit={onEdit} />
    </li>
  );
}
