import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Una pantalla vacía es una invitación a actuar, y un error dice qué pasó y
 * cómo salir de ahí. Ninguno de los dos es texto plano.
 */
export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center">
      {Icon ? (
        <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'No se pudo cargar la información',
  description,
  onRetry,
  retrying = false,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive-surface px-5 py-5"
    >
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-destructive">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} disabled={retrying} className="h-9 md:h-8">
          {retrying ? 'Reintentando…' : 'Reintentar'}
        </Button>
      ) : null}
    </div>
  );
}

/** Esqueletos con la forma de la tabla, para que la página no salte al cargar. */
export function TableSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-px', className)} aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-border-soft px-4 py-3">
          <Skeleton className="size-10 shrink-0 rounded-md" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-48 max-w-full" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="hidden h-3.5 w-20 md:block" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * Mientras se carga, el resumen del encabezado tampoco debería estar vacío.
 * Va como `<span>` porque vive dentro de un párrafo: un `<div>` ahí rompe la
 * hidratación.
 */
export function InlineSkeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-3 w-40 animate-pulse rounded-md bg-muted align-middle',
        className
      )}
    />
  );
}
