'use client';

import { useEffect, useState } from 'react';
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
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { erroresPorSeccion, type SeccionFicha } from '@/lib/form-sections';
import { tourAnchor } from '@/lib/tours/anchor';
import { cn } from '@/lib/utils';

interface Props<Id extends string> {
  open: boolean;
  /** Solo se llama cuando ya no hay nada que perder; el aviso lo da la ficha. */
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descripcion: string;
  secciones: readonly SeccionFicha<Id>[];
  seccion: Id;
  onSeccionChange: (seccion: Id) => void;
  /** Errores por campo; la ficha reparte el conteo entre las pestañas. */
  errores: Record<string, string>;
  /** Hay cambios sin guardar: cierra preguntando y la barra lo dice. */
  sucio: boolean;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (event: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * El armazón de toda ficha del panel: hoja lateral a pantalla completa en
 * móvil, pestañas por sección con el número de errores encima, y una barra de
 * guardado que no se mueve. Cerrar con cambios sin guardar siempre pregunta —
 * en una ficha de 40 campos, perder lo escrito por un toque de más es el peor
 * error posible.
 *
 * El contenido de cada sección lo pone el módulo, en `<TabsContent>` con el
 * `value` de la sección.
 */
export function FormSheet<Id extends string>({
  open,
  onOpenChange,
  titulo,
  descripcion,
  secciones,
  seccion,
  onSeccionChange,
  errores,
  sucio,
  submitting,
  submitLabel,
  onSubmit,
  children,
  className,
}: Props<Id>) {
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  /* Si la sección abierta deja de existir (una moto nueva no tiene papeles). */
  useEffect(() => {
    if (secciones.length > 0 && !secciones.some((item) => item.id === seccion)) {
      onSeccionChange(secciones[0].id);
    }
  }, [secciones, seccion, onSeccionChange]);

  const conteos = erroresPorSeccion(secciones, errores);

  function pedirCierre(next: boolean) {
    if (!next && sucio && !submitting) {
      setConfirmarSalida(true);
      return;
    }
    onOpenChange(next);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={pedirCierre}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className={cn('flex w-full! max-w-none! flex-col gap-0 p-0 md:max-w-2xl!', className)}
        >
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <header className="flex items-start gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold">{titulo}</h2>
                <p className="text-xs text-muted-foreground">{descripcion}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => pedirCierre(false)}
                className="h-9 shrink-0"
              >
                Cerrar
              </Button>
            </header>

            <Tabs
              value={seccion}
              onValueChange={(value) => onSeccionChange(value as Id)}
              className="min-h-0 flex-1 gap-0"
            >
              <TabsList
                variant="line"
                {...tourAnchor('ficha.secciones')}
                className="scroll-x h-auto w-full shrink-0 justify-start gap-1 border-b border-border px-3 py-2"
              >
                {secciones.map((item) => {
                  const conErrores = conteos.get(item.id);
                  return (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      className="h-9 flex-none gap-1.5 px-3 text-[13px]"
                    >
                      {item.label}
                      {conErrores ? (
                        <span
                          className="grid size-4 place-items-center rounded-full bg-destructive font-mono text-[10px] text-background"
                          aria-label={`${conErrores} campos por corregir`}
                        >
                          {conErrores}
                        </span>
                      ) : null}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <p className="mb-4 text-xs text-muted-foreground">
                  {secciones.find((item) => item.id === seccion)?.hint}
                </p>
                {children}
              </div>
            </Tabs>

            {/* La barra de guardado no se mueve: siempre al alcance del pulgar. */}
            <footer
              {...tourAnchor('ficha.guardar')}
              className="flex shrink-0 items-center gap-2 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <span className="flex-1 font-mono text-[11px] text-muted-foreground">
                {submitting ? 'Guardando…' : sucio ? 'Sin guardar' : 'Todo guardado'}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => pedirCierre(false)}
                className="h-11 md:h-9"
              >
                Descartar
              </Button>
              <Button type="submit" disabled={submitting} className="h-11 md:h-9">
                {submitLabel}
              </Button>
            </footer>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmarSalida} onOpenChange={setConfirmarSalida}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar los cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Lo que escribiste en esta ficha se pierde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmarSalida(false);
                onOpenChange(false);
              }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
