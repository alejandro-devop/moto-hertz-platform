'use client';

import { CopyCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DIAS, ETIQUETAS_DIA, formatTramo, type Dia } from '@/lib/service-point-hours';
import { cn } from '@/lib/utils';
import type { DiaForm } from './service-point-form-state';

/**
 * Los horarios, día por día. **No es un campo de JSON**: cada día tiene su
 * interruptor y sus dos horas, y el día apagado dice «Cerrado» en vez de
 * desaparecer, que es como se lee un horario pegado en una vitrina.
 *
 * El botón «Copiar a los demás días» existe porque el caso real es que los seis
 * días abiertos tienen el mismo horario y nadie quiere escribirlo seis veces.
 */
export function HoursEditor({
  hours,
  onChange,
  error,
}: {
  hours: Record<Dia, DiaForm>;
  onChange: (hours: Record<Dia, DiaForm>) => void;
  error?: string;
}) {
  function actualizar(dia: Dia, patch: Partial<DiaForm>) {
    onChange({ ...hours, [dia]: { ...hours[dia], ...patch } });
  }

  /** Copia el horario de un día a todos los que ya están abiertos. */
  function copiarADemas(origen: Dia) {
    const { open, close } = hours[origen];
    const siguiente = { ...hours };
    for (const dia of DIAS) {
      if (dia === origen || !siguiente[dia].abierto) continue;
      siguiente[dia] = { ...siguiente[dia], open, close };
    }
    onChange(siguiente);
  }

  const abiertos = DIAS.filter((dia) => hours[dia].abierto).length;

  return (
    <div className="flex flex-col gap-2">
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}

      {DIAS.map((dia) => {
        const valor = hours[dia];
        return (
          <div
            key={dia}
            className={cn(
              'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-card px-3 py-2',
              !valor.abierto && 'bg-muted/30'
            )}
          >
            <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 md:min-h-9">
              <Switch
                checked={valor.abierto}
                onCheckedChange={(checked) => actualizar(dia, { abierto: checked })}
                aria-label={`${ETIQUETAS_DIA[dia]}: abierto o cerrado`}
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold">{ETIQUETAS_DIA[dia]}</span>
                {!valor.abierto ? (
                  <span className="block text-xs text-muted-foreground">Cerrado</span>
                ) : null}
              </span>
            </label>

            {valor.abierto ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={valor.open}
                  onChange={(event) => actualizar(dia, { open: event.target.value })}
                  aria-label={`${ETIQUETAS_DIA[dia]}: hora de apertura`}
                  className="h-11 w-[7.5rem] font-mono text-sm md:h-9"
                />
                <span className="text-muted-foreground" aria-hidden>
                  –
                </span>
                <Input
                  type="time"
                  value={valor.close}
                  onChange={(event) => actualizar(dia, { close: event.target.value })}
                  aria-label={`${ETIQUETAS_DIA[dia]}: hora de cierre`}
                  className="h-11 w-[7.5rem] font-mono text-sm md:h-9"
                />
              </div>
            ) : null}

            {valor.abierto && abiertos > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => copiarADemas(dia)}
                className="h-9 shrink-0 px-2 text-[12px] text-muted-foreground"
                title={`Poner ${formatTramo(valor)} en los demás días abiertos`}
              >
                <CopyCheck className="size-3.5" />
                Copiar a los demás
              </Button>
            ) : null}
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground">
        {abiertos === 0
          ? 'Sin días abiertos: el sitio no mostrará horario para este punto.'
          : `Abre ${abiertos} ${abiertos === 1 ? 'día' : 'días'} a la semana.`}
      </p>
    </div>
  );
}
