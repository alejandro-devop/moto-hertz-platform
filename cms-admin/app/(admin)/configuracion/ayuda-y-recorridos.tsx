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
import { useTourContext } from '@/lib/tours/tour-provider';

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
