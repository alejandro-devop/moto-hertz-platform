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
  className,
}: {
  title: string;
  summary?: React.ReactNode;
  action?: React.ReactNode;
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
        <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
        {summary ? <p className="mt-0.5 text-sm text-muted-foreground">{summary}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{action}</div> : null}
    </div>
  );
}
