'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { navGroups, navLinks } from '@/app/(admin)/nav-links';
import { BrandMark } from '@/components/admin/brand-mark';
import { LogoutButton } from '@/components/admin/logout-button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { tourAnchor } from '@/lib/tours/anchor';
import { cn } from '@/lib/utils';

/**
 * Barra lateral de escritorio. Se queda en asfalto en los dos temas y se
 * colapsa a solo iconos cuando la tabla necesita el ancho.
 */
export function AdminRail({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      data-collapsed={collapsed}
      {...tourAnchor('panel.rail')}
      className={cn(
        'hidden shrink-0 flex-col gap-1 bg-rail p-3 text-rail-foreground transition-[width] duration-200 md:flex',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className={cn('flex items-center gap-2.5 px-1 pt-1 pb-4', collapsed && 'justify-center')}>
        <BrandMark />
        {!collapsed && (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">Motos Hot Wheels</span>
            <span className="block text-[11px] leading-tight text-rail-muted">Administración</span>
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-1" aria-label="Secciones del panel">
        {navGroups.map((group) => {
          const links = navLinks.filter((link) => link.group === group);
          if (links.length === 0) return null;
          return (
            <div key={group} className="flex flex-col gap-0.5">
              {collapsed ? (
                <span className="mx-auto my-2 h-px w-6 bg-rail-border" aria-hidden />
              ) : (
                <p className="px-2 pt-3 pb-1 font-mono text-[10px] tracking-[0.14em] text-rail-muted uppercase">
                  {group}
                </p>
              )}
              {links.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                const item = (
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                      'focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:outline-none',
                      collapsed && 'justify-center px-0',
                      active
                        ? 'bg-white/8 font-semibold text-rail-foreground'
                        : 'text-rail-muted hover:bg-white/5 hover:text-rail-foreground'
                    )}
                  >
                    {active && (
                      <span
                        className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-primary"
                        aria-hidden
                      />
                    )}
                    <Icon className="size-4 shrink-0" strokeWidth={1.9} />
                    {!collapsed && <span className="truncate">{link.label}</span>}
                  </Link>
                );

                return collapsed ? (
                  <Tooltip key={link.href}>
                    <TooltipTrigger render={item} />
                    <TooltipContent side="right">{link.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={link.href}>{item}</div>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-rail-border pt-3">
        <LogoutButton collapsed={collapsed} />
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir la barra lateral' : 'Colapsar la barra lateral'}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-rail-muted transition-colors hover:bg-white/5 hover:text-rail-foreground',
            'focus-visible:ring-3 focus-visible:ring-primary/50 focus-visible:outline-none',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4 shrink-0" strokeWidth={1.9} />
          ) : (
            <>
              <PanelLeftClose className="size-4 shrink-0" strokeWidth={1.9} />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
