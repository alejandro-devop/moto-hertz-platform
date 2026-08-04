'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { tourAnchor } from '@/lib/tours/anchor';
import { cn } from '@/lib/utils';

/** 44 px en móvil, 36 en escritorio: el objetivo mínimo del pulgar. */
export const ALTO_CAMPO = 'h-11 md:h-9';

/**
 * Etiqueta, control y una sola línea debajo: el error si lo hay, la ayuda si
 * no. Nunca los dos — el error es lo que hay que leer.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    /* Todo campo obligatorio lleva el ancla; el recorrido de la ficha señala
       el primero que esté visible en la sección abierta. */
    <div
      {...(required ? tourAnchor('ficha.obligatorio') : {})}
      className={cn('flex flex-col gap-1.5', className)}
    >
      <Label htmlFor={htmlFor} className="text-[13px] font-semibold text-muted-foreground">
        {label}
        {required ? (
          <span className="text-destructive" aria-label="obligatorio">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Un sí/no. Toda la fila es el objetivo, no solo el interruptor. */
export function ToggleRow({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

/** Dos columnas en pantallas anchas, una sola en el teléfono. */
export function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}
