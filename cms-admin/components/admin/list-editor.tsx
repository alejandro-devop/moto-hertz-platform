'use client';

import { useRef } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Una lista de renglones cortos que se edita de verdad: agregar, quitar y
 * **reordenar**. Es lo que necesitan `features` y `benefits` de un servicio, y
 * lo que van a necesitar las viñetas de una noticia y los enlaces de un banner.
 *
 * **Por qué no un campo de texto separado por comas** (que es lo que hace hoy
 * `motos` con sus `features`, vía `listaDesdeTexto`): en una lista con orden,
 * mover el tercer elemento al primer lugar con comas obliga a reescribir la
 * línea entera, y una coma dentro de un renglón —«Cambio de aceite, filtro y
 * bujía»— parte el renglón en dos sin avisar.
 *
 * **El orden es el dato.** El sitio pinta los renglones en el orden en que
 * están aquí, así que subir y bajar tienen que estar al alcance del pulgar:
 * son botones de 44 px, no arrastrar y soltar. Arrastrar en un teléfono, dentro
 * de una hoja que también se desplaza, pelea con el gesto de scroll; el asa
 * (`GripVertical`) está solo como indicio visual de que la fila se mueve.
 */
export function ListaEditable({
  items,
  onChange,
  placeholder,
  /** Singular, en minúsculas: «característica», «beneficio». */
  etiquetaItem,
  error,
  max = 30,
  className,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  etiquetaItem: string;
  error?: string;
  max?: number;
  className?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  /** Tras agregar, quitar o mover, el foco sigue al renglón: escribir es lo
      siguiente que se hace, y en el teléfono recuperar el foco a mano es caro. */
  function enfocar(indice: number) {
    /* En el siguiente cuadro: el input todavía no existe en el DOM. */
    requestAnimationFrame(() => refs.current[indice]?.focus());
  }

  function cambiar(indice: number, valor: string) {
    const next = [...items];
    next[indice] = valor;
    onChange(next);
  }

  function agregar() {
    if (items.length >= max) return;
    onChange([...items, '']);
    enfocar(items.length);
  }

  function quitar(indice: number) {
    onChange(items.filter((_, i) => i !== indice));
    /* El foco se queda en la fila que ocupó el lugar de la borrada, o en la
       anterior si se borró la última: nunca se pierde en el aire. */
    enfocar(Math.min(indice, items.length - 2));
  }

  function mover(indice: number, delta: number) {
    const destino = indice + delta;
    if (destino < 0 || destino >= items.length) return;
    const next = [...items];
    [next[indice], next[destino]] = [next[destino], next[indice]];
    onChange(next);
    enfocar(destino);
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[13px] text-muted-foreground">
          Todavía no hay ninguna {etiquetaItem}.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((item, indice) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={indice} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="hidden shrink-0 text-muted-foreground sm:grid sm:size-6 sm:place-items-center"
              >
                <GripVertical className="size-4" />
              </span>

              <Input
                ref={(el) => {
                  refs.current[indice] = el;
                }}
                value={item}
                onChange={(event) => cambiar(indice, event.target.value)}
                onKeyDown={(event) => {
                  /* Enter agrega el siguiente renglón, como en cualquier lista:
                     escribir cinco cosas no debería costar cinco clics. */
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    agregar();
                  }
                }}
                placeholder={placeholder}
                aria-label={`${etiquetaItem} ${indice + 1}`}
                className="h-11 md:h-9"
              />

              <div className="flex shrink-0 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 md:size-9"
                  disabled={indice === 0}
                  onClick={() => mover(indice, -1)}
                  aria-label={`Subir la ${etiquetaItem} ${indice + 1}`}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 md:size-9"
                  disabled={indice === items.length - 1}
                  onClick={() => mover(indice, 1)}
                  aria-label={`Bajar la ${etiquetaItem} ${indice + 1}`}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 text-muted-foreground hover:text-destructive md:size-9"
                  onClick={() => quitar(indice)}
                  aria-label={`Quitar la ${etiquetaItem} ${indice + 1}`}
                >
                  <X />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 md:h-9"
          onClick={agregar}
          disabled={items.length >= max}
        >
          <Plus />
          Agregar {etiquetaItem}
        </Button>
        {items.length >= max ? (
          <span className="text-xs text-muted-foreground">
            Máximo {max}; ya no cabe una más.
          </span>
        ) : null}
      </div>
    </div>
  );
}
