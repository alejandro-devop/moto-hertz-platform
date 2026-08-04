import { BotonAyudaTour } from '@/components/admin/tour-help-button';
import { tourAnchor } from '@/lib/tours/anchor';
import type { ClaveTour } from '@/lib/tours/registry';
import { cn } from '@/lib/utils';

/**
 * Encabezado de módulo. La acción principal queda arriba a la derecha en
 * escritorio; en móvil se apila debajo y ocupa todo el ancho, porque a la
 * esquina superior derecha no llega el pulgar.
 */
export function PageHeader({
  title,
  summary,
  action,
  tour,
  className,
}: {
  title: string;
  summary?: React.ReactNode;
  action?: React.ReactNode;
  /** Con esto sale el «?» junto al título, que vuelve a mostrar el recorrido de la sección. */
  tour?: ClaveTour;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4',
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
          {tour ? <BotonAyudaTour clave={tour} /> : null}
        </div>
        {summary ? <p className="mt-0.5 text-sm text-muted-foreground">{summary}</p> : null}
      </div>
      {action ? (
        <div {...tourAnchor('lista.crear')} className="flex shrink-0 gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
          {action}
        </div>
      ) : null}
    </div>
  );
}
