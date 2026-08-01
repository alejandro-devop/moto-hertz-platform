'use client';

import { ArrowDown, ArrowUp, GalleryHorizontal } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/admin/status-pill';
import { Thumb } from '@/components/admin/thumb';
import { formatDate } from '@/lib/format';
import { bannerStatusTone, ETIQUETAS_ESTADO_BANNER, getBannerStatus } from '@/lib/banner-status';
import type { Banner } from '@/lib/graphql/banners';
import type { SeccionId } from './form-sections';
import { BannerActions } from './banner-actions';

interface Props {
  banner: Banner;
  onEdit: (banner: Banner, seccion?: SeccionId) => void;
  /**
   * Subir/bajar en el orden real (no en la lista filtrada). `undefined`
   * cuando no se puede reordenar ahora mismo (hay una búsqueda activa, o el
   * banner está en la papelera): en ese caso los botones se deshabilitan.
   */
  onMover?: (delta: 1 | -1) => void;
  puedeSubir: boolean;
  puedeBajar: boolean;
}

function Vigencia({ banner }: { banner: Banner }) {
  const desde = formatDate(banner.startsAt);
  const hasta = formatDate(banner.endsAt);
  if (!desde && !hasta) return <span className="text-muted-foreground">Siempre</span>;
  return (
    <span className="flex flex-col text-[12px]">
      <span>{desde ? `Desde ${desde}` : 'Ya vigente'}</span>
      <span className="text-muted-foreground">{hasta ? `Hasta ${hasta}` : 'No vence'}</span>
    </span>
  );
}

function Estado({ banner }: { banner: Banner }) {
  if (banner.deletedAt) return <StatusPill tone="muted">En papelera</StatusPill>;
  const estado = getBannerStatus(banner);
  return <StatusPill tone={bannerStatusTone(estado)}>{ETIQUETAS_ESTADO_BANNER[estado]}</StatusPill>;
}

/** Subir/bajar: 44 px en móvil, más chico en escritorio — mismo criterio que `ListaEditable`. */
function BotonesOrden({
  onMover,
  puedeSubir,
  puedeBajar,
  titulo,
}: {
  onMover?: (delta: 1 | -1) => void;
  puedeSubir: boolean;
  puedeBajar: boolean;
  titulo: string;
}) {
  return (
    <div className="flex shrink-0 flex-col">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 md:size-8"
        disabled={!onMover || !puedeSubir}
        onClick={() => onMover?.(-1)}
        aria-label={`Subir "${titulo}"`}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 md:size-8"
        disabled={!onMover || !puedeBajar}
        onClick={() => onMover?.(1)}
        aria-label={`Bajar "${titulo}"`}
      >
        <ArrowDown />
      </Button>
    </div>
  );
}

export function BannerTableRow({ banner, onEdit, onMover, puedeSubir, puedeBajar }: Props) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <BotonesOrden
            onMover={onMover}
            puedeSubir={puedeSubir}
            puedeBajar={puedeBajar}
            titulo={banner.title}
          />
          <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
            {banner.position + 1}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <button
          type="button"
          onClick={() => onEdit(banner)}
          className="flex items-start gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Thumb src={banner.image} alt={banner.title} icon={GalleryHorizontal} />
          <span className="min-w-0">
            <span className="block max-w-[38ch] truncate font-semibold">{banner.title}</span>
            <span className="block max-w-[38ch] truncate text-[12px] text-muted-foreground">
              {banner.subtitle?.trim() || 'Sin subtítulo'}
            </span>
          </span>
        </button>
      </TableCell>
      <TableCell className="text-muted-foreground">
        <Vigencia banner={banner} />
      </TableCell>
      <TableCell>
        <Estado banner={banner} />
      </TableCell>
      <TableCell className="text-right">
        <BannerActions banner={banner} onEdit={onEdit} />
      </TableCell>
    </TableRow>
  );
}

/** La misma fila, en tarjeta, para el teléfono: nada de menos, solo repartido. */
export function BannerCard({ banner, onEdit, onMover, puedeSubir, puedeBajar }: Props) {
  return (
    <li className="flex items-start gap-2 rounded-xl border border-border bg-card p-3">
      <BotonesOrden
        onMover={onMover}
        puedeSubir={puedeSubir}
        puedeBajar={puedeBajar}
        titulo={banner.title}
      />
      <button
        type="button"
        onClick={() => onEdit(banner)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Thumb src={banner.image} alt={banner.title} icon={GalleryHorizontal} className="size-10" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-[13px] leading-tight font-semibold">{banner.title}</span>
          <Estado banner={banner} />
          <span className="text-[12px] text-muted-foreground">
            <Vigencia banner={banner} />
          </span>
        </span>
      </button>
      <BannerActions banner={banner} onEdit={onEdit} />
    </li>
  );
}
