'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import type { NavLink } from '@/app/(admin)/nav-links';
import { LogoutButton } from '@/components/admin/logout-button';
import { ThemeToggle } from '@/components/admin/theme-toggle';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SITIO_PUBLICO } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * Todo lo que en escritorio vive en la barra lateral y no es uno de los cinco
 * destinos de la barra inferior: las secciones que desbordan (`enlaces`, ver
 * `AdminTabBar`), apariencia, el sitio público y cerrar sesión.
 */
export function MoreSheet({
  open,
  onOpenChange,
  enlaces = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Secciones que no caben en la barra inferior — siguen alcanzables aquí. */
  enlaces?: NavLink[];
}) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="gap-0 rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="pb-2">
          <SheetTitle>Más</SheetTitle>
        </SheetHeader>

        {enlaces.length > 0 ? (
          <div className="mb-1 flex flex-col border-b border-border-soft pb-1">
            {enlaces.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'mx-1 flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium hover:bg-muted',
                    'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                    active && 'bg-muted font-semibold'
                  )}
                >
                  <Icon className="size-4 text-muted-foreground" strokeWidth={1.9} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm font-medium">Apariencia</span>
          <ThemeToggle />
        </div>

        <a
          href={SITIO_PUBLICO}
          target="_blank"
          rel="noreferrer"
          className="mx-1 flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <ExternalLink className="size-4 text-muted-foreground" strokeWidth={1.9} />
          Ver el sitio público
        </a>

        <div className="mx-1 mt-1 border-t border-border-soft pt-1">
          <LogoutButton variant="plain" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
