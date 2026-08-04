'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { StatusPill, type Tone } from '@/components/admin/status-pill';
import type { TourProgress } from '@/lib/graphql/tours';
import { TOURS_ORDENADOS, type ClaveTour } from '@/lib/tours/registry';
import { useTourContext } from '@/lib/tours/tour-provider';
import type { DefinicionTour } from '@/lib/tours/types';

type EstadoTour = 'visto' | 'saltado' | 'sin-ver';

const ETIQUETA_ESTADO: Record<EstadoTour, string> = {
  visto: 'Visto',
  saltado: 'Saltado',
  'sin-ver': 'Sin ver',
};

const TONO_ESTADO: Record<EstadoTour, Tone> = {
  visto: 'ok',
  saltado: 'warn',
  'sin-ver': 'muted',
};

/**
 * `visto.version < tour.version` es la misma comparación que hace el
 * provider para decidir si relanza un recorrido: si el código subió la
 * versión, lo que hay guardado ya no cuenta como visto.
 */
function estadoDeTour(tour: DefinicionTour, progreso: Map<string, TourProgress>): EstadoTour {
  const visto = progreso.get(tour.clave);
  if (!visto || visto.version < tour.version) return 'sin-ver';
  return visto.status === 'skipped' ? 'saltado' : 'visto';
}

/**
 * «Ayuda y recorridos» — el control de los recorridos guiados del panel.
 *
 * Va **fuera del formulario** de configuración a propósito: no es un campo de
 * `site_settings` que se guarda con «Guardar cambios», es una acción que se
 * ejecuta al pulsarla. Meterlo como una pestaña más de la ficha habría hecho
 * que un botón dentro de un `<form>` compitiera con el guardado.
 *
 * Fase 0 del plan de tours: solo el reinicio global. La Fase 4 agrega aquí la
 * lista de recorridos con su estado y su reinicio individual — «quiero repasar
 * solo el de banners» es la petición realista, y borrarlo todo para eso es un
 * martillazo.
 */
export function AyudaYRecorridos() {
  const tours = useTourContext();
  const [confirmar, setConfirmar] = useState(false);

  async function reiniciar() {
    await tours?.reiniciar();
    setConfirmar(false);
  }

  function reiniciarUno(clave: ClaveTour) {
    tours?.reiniciar(clave);
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold">Ayuda y recorridos</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          La primera vez que entras a una sección, el panel te muestra un recorrido corto con lo
          que hay ahí. Cada uno se ve una sola vez.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirmar(true)}
          disabled={!tours || tours.reiniciando}
          className="h-11 gap-2 md:h-9"
        >
          <RotateCcw className="size-4" />
          {tours?.reiniciando ? 'Reiniciando…' : 'Reiniciar tour'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Vuelven a salir todos, como la primera vez.
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <h3 className="text-xs font-semibold text-muted-foreground">Recorrido por recorrido</h3>

        {!tours || !tours.listo ? (
          <p className="text-xs text-muted-foreground">Cargando…</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {TOURS_ORDENADOS.map((tour) => {
              const estado = estadoDeTour(tour, tours.progreso);
              return (
                <li
                  key={tour.clave}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{tour.nombre}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {tour.descripcion}
                    </span>
                  </span>
                  <StatusPill tone={TONO_ESTADO[estado]} className="shrink-0">
                    {ETIQUETA_ESTADO[estado]}
                  </StatusPill>
                  {estado !== 'sin-ver' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Reiniciar el recorrido de ${tour.nombre}`}
                      title="Reiniciar solo este recorrido"
                      disabled={tours.reiniciando}
                      onClick={() => reiniciarUno(tour.clave as ClaveTour)}
                      className="shrink-0"
                    >
                      <RotateCcw />
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reiniciar todos los recorridos?</AlertDialogTitle>
            <AlertDialogDescription>
              Se olvida qué recorridos ya viste, así que volverán a aparecer al entrar a cada
              sección. No se pierde nada del contenido del sitio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Dejar como está</AlertDialogCancel>
            <AlertDialogAction onClick={reiniciar} disabled={tours?.reiniciando}>
              {tours?.reiniciando ? 'Reiniciando…' : 'Reiniciar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
