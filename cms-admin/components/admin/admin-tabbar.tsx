'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { navLinks } from '@/app/(admin)/nav-links';
import { MoreSheet } from '@/components/admin/more-sheet';
import { cn } from '@/lib/utils';

const ITEM =
  'flex flex-1 flex-col items-center gap-1 rounded-lg px-1 pt-1.5 pb-1 text-[10px] font-medium ' +
  'text-muted-foreground transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none';

/**
 * Navegación de móvil: cinco destinos al alcance del pulgar. Barra inferior en
 * vez de menú hamburguesa, porque cambiar de módulo es lo que más se hace.
 */
export function AdminTabBar() {
  const pathname = usePathname();
  const [masAbierto, setMasAbierto] = useState(false);

  return (
    <>
      <nav
        aria-label="Secciones del panel"
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-0.5 border-t border-border bg-card px-1 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden"
      >
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={cn(ITEM, active && 'text-foreground')}
            >
              <Icon className="size-5" strokeWidth={active ? 2.1 : 1.8} />
              <span className="max-w-full truncate">{link.short}</span>
              <span
                className={cn('h-0.5 w-4 rounded-full', active ? 'bg-primary' : 'bg-transparent')}
                aria-hidden
              />
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMasAbierto(true)}
          aria-haspopup="dialog"
          className={cn(ITEM, masAbierto && 'text-foreground')}
        >
          <MoreHorizontal className="size-5" strokeWidth={1.8} />
          <span>Más</span>
          <span className="h-0.5 w-4 rounded-full bg-transparent" aria-hidden />
        </button>
      </nav>

      <MoreSheet open={masAbierto} onOpenChange={setMasAbierto} />
    </>
  );
}
