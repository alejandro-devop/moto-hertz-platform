'use client';

import { Star } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { StatusPill } from '@/components/admin/status-pill';
import { cn } from '@/lib/utils';
import { iconoDeServicio } from '@/lib/service-icons';
import { formatPrecio } from '@/lib/service-pricing';
import type { Service } from '@/lib/graphql/services';
import type { SeccionId } from './form-sections';
import { ServiceActions } from './service-actions';

interface Props {
  servicio: Service;
  onEdit: (servicio: Service, seccion?: SeccionId) => void;
}

/**
 * El icono elegido, en la misma casilla donde en motos va la foto. Aquí la
 * identidad visual es el icono, no la imagen: la imagen es de la página
 * pública y muchas veces no está, mientras que el icono siempre tiene uno.
 */
function IconoServicio({ servicio, className }: { servicio: Service; className?: string }) {
  const Icon = iconoDeServicio(servicio.icon);
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground',
        className
      )}
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  );
}

/** El precio en una línea, con su nota debajo si la hay. */
function Precio({ servicio }: { servicio: Service }) {
  const nota = servicio.pricing?.note?.trim();
  return (
    <span className="flex flex-col items-end gap-0.5">
      <span className="font-mono whitespace-nowrap tabular-nums">
        {formatPrecio(servicio.pricing)}
      </span>
      {nota ? <span className="text-[11px] text-muted-foreground">{nota}</span> : null}
    </span>
  );
}

/** Lo que impide que la tarjeta del sitio se vea bien, dicho sin rodeos. */
function Estado({ servicio }: { servicio: Service }) {
  if (servicio.deletedAt) return <StatusPill tone="muted">En papelera</StatusPill>;

  return (
    <span className="flex flex-wrap items-center gap-1">
      {servicio.featured ? (
        <StatusPill tone="ok" dot={false}>
          <Star className="size-3" />
          Destacado
        </StatusPill>
      ) : null}
      {!servicio.shortDescription?.trim() ? (
        <StatusPill tone="warn">Sin descripción</StatusPill>
      ) : null}
      {!servicio.featured && servicio.shortDescription?.trim() ? (
        <span className="text-muted-foreground">En el sitio</span>
      ) : null}
    </span>
  );
}

export function ServiceTableRow({ servicio, onEdit }: Props) {
  return (
    <TableRow>
      <TableCell>
        <button
          type="button"
          onClick={() => onEdit(servicio)}
          className="flex items-start gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <IconoServicio servicio={servicio} className="mt-0.5" />
          <span className="min-w-0">
            <span className="block font-semibold">{servicio.name}</span>
            <span className="block max-w-[38ch] truncate text-[12px] text-muted-foreground">
              {servicio.shortDescription?.trim() || 'Sin descripción corta'}
            </span>
          </span>
        </button>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {servicio.category?.trim() || <span className="text-muted-foreground">Sin categoría</span>}
      </TableCell>
      <TableCell className="text-right">
        <Precio servicio={servicio} />
      </TableCell>
      <TableCell className="text-muted-foreground whitespace-nowrap">
        {servicio.duration?.trim() || '—'}
      </TableCell>
      <TableCell>
        <Estado servicio={servicio} />
      </TableCell>
      <TableCell className="text-right">
        <ServiceActions servicio={servicio} onEdit={onEdit} />
      </TableCell>
    </TableRow>
  );
}

/** La misma fila, en tarjeta, para el teléfono: nada de menos, solo repartido. */
export function ServiceCard({ servicio, onEdit }: Props) {
  const nota = servicio.pricing?.note?.trim();

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <button
        type="button"
        onClick={() => onEdit(servicio)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <IconoServicio servicio={servicio} className="size-10" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-[13px] leading-tight font-semibold">{servicio.name}</span>
          <span className="font-mono text-[13px] font-medium tabular-nums">
            {formatPrecio(servicio.pricing)}
            {nota ? (
              <span className="ml-1.5 font-sans text-[11px] font-normal text-muted-foreground">
                {nota}
              </span>
            ) : null}
          </span>
          <span className="flex flex-wrap items-center gap-1">
            {servicio.deletedAt ? (
              <StatusPill tone="muted">En papelera</StatusPill>
            ) : (
              <>
                {servicio.featured ? (
                  <StatusPill tone="ok" dot={false}>
                    <Star className="size-3" />
                    Destacado
                  </StatusPill>
                ) : null}
                {!servicio.shortDescription?.trim() ? (
                  <StatusPill tone="warn">Sin descripción</StatusPill>
                ) : null}
              </>
            )}
          </span>
          <span className="text-[12px] text-muted-foreground">
            {[servicio.category?.trim() || 'Sin categoría', servicio.duration?.trim()]
              .filter(Boolean)
              .join(' · ')}
          </span>
          {servicio.shortDescription?.trim() ? (
            <span className="line-clamp-2 text-[11px] text-muted-foreground">
              {servicio.shortDescription}
            </span>
          ) : null}
        </span>
      </button>
      <ServiceActions servicio={servicio} onEdit={onEdit} />
    </li>
  );
}
