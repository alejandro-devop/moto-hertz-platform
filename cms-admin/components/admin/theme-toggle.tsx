'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const OPCIONES = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
] as const;

/**
 * Selector de tema de tres estados. En el patio, de día, el claro se lee; en
 * la oficina de noche, el oscuro cansa menos.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  /* El tema real solo se conoce en el cliente: hasta entonces no se marca nada. */
  useEffect(() => setMounted(true), []);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5',
        className
      )}
      role="radiogroup"
      aria-label="Tema de la interfaz"
    >
      {OPCIONES.map(({ value, label, icon: Icon }) => {
        const activo = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={activo}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              'grid size-8 place-items-center rounded-md text-muted-foreground transition-colors',
              'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
              'hover:text-foreground',
              activo && 'bg-card text-foreground shadow-xs'
            )}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
