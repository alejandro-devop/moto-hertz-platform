import { Bike } from 'lucide-react';
import { cn } from '@/lib/utils';

/** La única mancha de amarillo que está siempre en pantalla. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground',
        className
      )}
    >
      <Bike className="size-4" strokeWidth={1.9} />
    </span>
  );
}
