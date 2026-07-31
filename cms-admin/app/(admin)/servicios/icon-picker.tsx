'use client';

import { ICONOS_SERVICIO, iconoDeServicio } from '@/lib/service-icons';
import { cn } from '@/lib/utils';

/**
 * El icono se **elige de una rejilla con vista previa**, no se escribe. Nadie
 * tiene por qué acertar de memoria que la llave inglesa se llama `wrench`.
 *
 * La rejilla va a la vista, no dentro de un desplegable: son 26 iconos, caben,
 * y verlos todos a la vez es justamente lo que ayuda a escoger. Cada botón mide
 * 44 px, que es lo que pide la regla de móvil.
 *
 * Para agregar un icono: `cms-admin/lib/service-icons.ts` (y su espejo en
 * `web/src/utils/service-icons.tsx`).
 */
export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const Actual = iconoDeServicio(value);
  const elegido = ICONOS_SERVICIO.find((icono) => icono.name === value);

  return (
    <div className="flex flex-col gap-3">
      {/* La vista previa, del tamaño y con el fondo con que sale en la lista. */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-card text-foreground">
          <Actual className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold">
            {elegido?.label ?? 'Icono por defecto'}
          </span>
          <span className="block font-mono text-[11px] text-muted-foreground">
            {value || 'wrench'}
          </span>
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Icono del servicio"
        className="grid max-h-52 grid-cols-5 gap-1.5 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-8"
      >
        {ICONOS_SERVICIO.map(({ name, label, Icon }) => {
          const activo = name === value;
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={activo}
              aria-label={label}
              title={label}
              onClick={() => onChange(name)}
              className={cn(
                'grid size-11 place-items-center rounded-md border transition-colors',
                'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                activo
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
