'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Cerrar sesión. Vive al pie de la barra lateral en escritorio y en la hoja
 * «Más» en móvil, por lo que se estila para los dos fondos.
 */
export function LogoutButton({
  collapsed = false,
  variant = 'rail',
  className,
}: {
  collapsed?: boolean;
  variant?: 'rail' | 'plain';
  className?: string;
}) {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function handleLogout() {
    setSaliendo(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const button = (
    <button
      type="button"
      onClick={handleLogout}
      disabled={saliendo}
      className={cn(
        'flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60',
        'focus-visible:outline-none',
        variant === 'rail'
          ? 'px-2.5 py-2 text-rail-muted hover:bg-white/5 hover:text-rail-foreground focus-visible:ring-3 focus-visible:ring-primary/50'
          : 'min-h-11 w-full px-3 text-destructive hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-destructive/30',
        collapsed && 'justify-center px-0',
        className
      )}
    >
      <LogOut className="size-4 shrink-0" strokeWidth={1.9} />
      {!collapsed && <span>{saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>}
    </button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="right">Cerrar sesión</TooltipContent>
    </Tooltip>
  );
}
