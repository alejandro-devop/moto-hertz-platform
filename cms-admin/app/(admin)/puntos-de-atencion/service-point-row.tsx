'use client';

import { MapPin } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { StatusPill } from '@/components/admin/status-pill';
import { diasAbiertos, resumenHorario } from '@/lib/service-point-hours';
import type { ServicePoint } from '@/lib/graphql/service-points';
import { direccionCompleta, ETIQUETA_DE_TIPO } from './filters';
import type { SeccionId } from './form-sections';
import { ServicePointActions } from './service-point-actions';

interface Props {
  punto: ServicePoint;
  onEdit: (punto: ServicePoint, seccion?: SeccionId) => void;
}

/** Ciudad y barrio: lo que ubica el punto sin leer la dirección entera. */
function subtitulo(punto: ServicePoint): string {
  const partes = [punto.address?.neighborhood, punto.address?.city].filter(Boolean);
  return partes.length > 0 ? partes.join(' · ') : 'Sin ciudad';
}

/** Un punto sin teléfono ni WhatsApp no sirve de nada: se ve de inmediato. */
function Contacto({ punto }: { punto: ServicePoint }) {
  if (!punto.phone && !punto.whatsapp) {
    return <span className="text-muted-foreground">Sin contacto</span>;
  }
  return (
    <span className="flex flex-col gap-0.5 font-mono text-[11px] whitespace-nowrap">
      {punto.phone ? <span>{punto.phone}</span> : null}
      {punto.whatsapp ? (
        <span className="text-muted-foreground">WhatsApp {punto.whatsapp}</span>
      ) : null}
    </span>
  );
}

function Horario({ punto }: { punto: ServicePoint }) {
  const abiertos = diasAbiertos(punto.hours).length;
  if (abiertos === 0) return <StatusPill tone="warn">Sin horario</StatusPill>;
  return <span className="text-[12px] text-muted-foreground">{resumenHorario(punto.hours)}</span>;
}

export function ServicePointTableRow({ punto, onEdit }: Props) {
  const direccion = direccionCompleta(punto);

  return (
    <TableRow>
      <TableCell>
        <button
          type="button"
          onClick={() => onEdit(punto)}
          className="flex items-start gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <MapPin className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold">{punto.name}</span>
            <span className="block font-mono text-[11px] text-muted-foreground">
              {subtitulo(punto)}
            </span>
          </span>
        </button>
      </TableCell>
      <TableCell>
        {punto.deletedAt ? (
          <StatusPill tone="muted">En papelera</StatusPill>
        ) : (
          <span className="text-muted-foreground">{ETIQUETA_DE_TIPO[punto.type]}</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {direccion || <span className="text-muted-foreground">Sin dirección</span>}
      </TableCell>
      <TableCell>
        <Contacto punto={punto} />
      </TableCell>
      <TableCell>
        <Horario punto={punto} />
      </TableCell>
      <TableCell className="text-right">
        <ServicePointActions punto={punto} onEdit={onEdit} />
      </TableCell>
    </TableRow>
  );
}

/** La misma fila, en tarjeta, para el teléfono: nada de menos, solo repartido. */
export function ServicePointCard({ punto, onEdit }: Props) {
  const direccion = direccionCompleta(punto);

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <button
        type="button"
        onClick={() => onEdit(punto)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <MapPin className="size-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-[13px] leading-tight font-semibold">{punto.name}</span>
          <span className="flex flex-wrap items-center gap-1">
            {punto.deletedAt ? (
              <StatusPill tone="muted">En papelera</StatusPill>
            ) : (
              <StatusPill tone="muted" dot={false}>
                {ETIQUETA_DE_TIPO[punto.type]}
              </StatusPill>
            )}
            {diasAbiertos(punto.hours).length === 0 ? (
              <StatusPill tone="warn">Sin horario</StatusPill>
            ) : null}
          </span>
          <span className="text-[12px] text-muted-foreground">
            {direccion || 'Sin dirección'}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {punto.phone || punto.whatsapp || 'Sin contacto'}
          </span>
          {/* Si no hay horario ya lo dijo la píldora de arriba: no se repite. */}
          {diasAbiertos(punto.hours).length > 0 ? (
            <span className="text-[11px] text-muted-foreground">{resumenHorario(punto.hours)}</span>
          ) : null}
        </span>
      </button>
      <ServicePointActions punto={punto} onEdit={onEdit} />
    </li>
  );
}
