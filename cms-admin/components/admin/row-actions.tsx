'use client';

import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface AccionFila {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  /** Dato al margen: cuántas fotos tiene, cuánto cuesta, a dónde lleva. */
  tail?: string;
  /** Se separa del resto y va en rojo. Va de última, siempre. */
  danger?: boolean;
  /** Abre en otra pestaña en vez de ejecutar `onSelect`. */
  href?: string;
}

interface Props {
  acciones: AccionFila[];
  /** `aria-label` de los dos disparadores: «Acciones para NMAX 155». */
  etiqueta: string;
  /** Encabezado de la hoja del móvil: miniatura, nombre y el dato que ubica. */
  encabezado?: React.ReactNode;
}

/**
 * Todo lo que se le puede hacer a un registro, en las dos pantallas: en
 * escritorio es el menú anclado a la fila; en móvil, una hoja inferior con
 * objetivos grandes. Es la misma lista de acciones — ninguna pantalla puede
 * menos que la otra.
 */
export function RowActions({ acciones, etiqueta, encabezado }: Props) {
  const [hoja, setHoja] = useState(false);

  function ejecutar(accion: AccionFila) {
    setHoja(false);
    if (accion.href) {
      window.open(accion.href, '_blank', 'noreferrer');
      return;
    }
    accion.onSelect();
  }

  return (
    <>
      {/* Escritorio: menú anclado a la fila. */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={etiqueta}
              className="hidden md:inline-flex"
            />
          }
        >
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {acciones.map((accion) => {
            const Icon = accion.icon;
            const item = (
              <DropdownMenuItem
                key={accion.id}
                variant={accion.danger ? 'destructive' : 'default'}
                onClick={() => ejecutar(accion)}
                className="min-h-8 gap-2"
              >
                <Icon className="text-muted-foreground" />
                <span className="flex-1">{accion.label}</span>
                {accion.tail ? (
                  <span className="font-mono text-[10px] text-muted-foreground">{accion.tail}</span>
                ) : null}
              </DropdownMenuItem>
            );
            return accion.danger ? (
              <div key={accion.id}>
                <DropdownMenuSeparator />
                {item}
              </div>
            ) : (
              item
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Móvil: la misma lista en una hoja, con objetivos grandes. */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={etiqueta}
        aria-haspopup="dialog"
        onClick={() => setHoja(true)}
        className="size-9 md:hidden"
      >
        <MoreVertical />
      </Button>

      <Sheet open={hoja} onOpenChange={setHoja}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="gap-0 rounded-t-2xl px-0 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <span className="mx-auto mb-2 h-1 w-9 rounded-full bg-border" aria-hidden />
          {encabezado ? (
            <div className="flex items-center gap-3 border-b border-border-soft px-4 pb-3">
              {encabezado}
            </div>
          ) : null}
          <div className="flex flex-col pt-1">
            {acciones.map((accion) => {
              const Icon = accion.icon;
              return (
                <div
                  key={accion.id}
                  className={cn(accion.danger && 'mt-1 border-t border-border-soft pt-1')}
                >
                  <button
                    type="button"
                    onClick={() => ejecutar(accion)}
                    className={cn(
                      'flex min-h-12 w-full items-center gap-3 px-4 text-left text-[15px] font-medium',
                      'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                      accion.danger ? 'text-destructive' : 'text-foreground'
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-4 shrink-0',
                        accion.danger ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <span className="flex-1">{accion.label}</span>
                    {accion.tail ? (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {accion.tail}
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
