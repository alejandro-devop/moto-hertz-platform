'use client';

import { useState } from 'react';
import { Bike, ImageOff, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Miniatura de un registro con foto. Es lo primero que se mira para
 * identificarlo, así que cuando falta —o la URL está rota— lo dice en vez de
 * dejar un hueco. Nació para `motos` (de ahí que el icono por defecto sea una
 * moto); `noticias` la reusa pasando el suyo (`icon`, Fase 4).
 */
export function Thumb({
  src,
  alt,
  className,
  icon: Icon = Bike,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  /** El icono cuando no hay foto. Por defecto, la moto original. */
  icon?: LucideIcon;
}) {
  const [roto, setRoto] = useState(false);
  const base = cn(
    'grid size-11 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-muted',
    className
  );

  if (!src || roto) {
    return (
      <span
        className={base}
        title={src ? 'La imagen no cargó' : 'Sin imagen'}
        aria-label={src ? 'La imagen no cargó' : 'Sin imagen'}
        role="img"
      >
        {src ? (
          <ImageOff className="size-4 text-muted-foreground" />
        ) : (
          <Icon className="size-4 text-muted-foreground" strokeWidth={1.7} />
        )}
      </span>
    );
  }

  return (
    <span className={base}>
      {/* Las URLs de las fotos son de texto libre, así que no pasan por next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setRoto(true)}
        className="size-full object-cover"
      />
    </span>
  );
}
