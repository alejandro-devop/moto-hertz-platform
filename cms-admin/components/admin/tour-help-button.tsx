'use client';

import { CircleQuestionMark } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { tourAnchor } from '@/lib/tours/anchor';
import { useTourContext } from '@/lib/tours/tour-provider';
import type { ClaveTour } from '@/lib/tours/registry';

/**
 * El botón de ayuda de una sección: vuelve a mostrar su recorrido guiado, en
 * el momento, sin tocar la base de datos.
 *
 * Es lo que la mayoría de la gente quiere de verdad cuando dice «reiniciar el
 * tour» — repasar esta pantalla ahora, no empezar de cero en todas. Reiniciar
 * de verdad (borrar el progreso) vive en Configuración, que es donde tiene que
 * doler un poco llegar.
 */
export function BotonAyudaTour({ clave }: { clave: ClaveTour }) {
  const tours = useTourContext();
  if (!tours) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={() => tours.relanzar(clave)}
            aria-label="Ver el recorrido de esta sección"
            {...tourAnchor('panel.ayuda')}
            className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <CircleQuestionMark className="size-4" strokeWidth={1.9} />
          </button>
        }
      />
      <TooltipContent>Ver el recorrido de esta sección</TooltipContent>
    </Tooltip>
  );
}
