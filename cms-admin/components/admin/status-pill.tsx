import { cn } from '@/lib/utils';
import type { PaperLevel, PublicationLevel } from '@/lib/motorcycle-status';

export type Tone = 'ok' | 'warn' | 'bad' | 'muted';

const TONOS: Record<Tone, string> = {
  ok: 'bg-success-surface text-success',
  warn: 'bg-warning-surface text-warning',
  bad: 'bg-destructive-surface text-destructive',
  muted: 'bg-muted text-muted-foreground',
};

/**
 * Estado en forma, no solo en color: el punto y el fondo hacen que lo que
 * necesita atención se vea de un vistazo, y que se distinga sin depender del
 * color.
 */
export function StatusPill({
  tone,
  children,
  dot = true,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        TONOS[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export function publicationTone(level: PublicationLevel): Tone {
  if (level === 'publicada') return 'ok';
  if (level === 'incompleta') return 'warn';
  return 'muted';
}

export function paperTone(level: PaperLevel): Tone {
  if (level === 'vencido') return 'bad';
  if (level === 'por-vencer') return 'warn';
  if (level === 'vigente') return 'ok';
  return 'muted';
}
