'use client';

import { Suspense, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { activeLink } from '@/app/(admin)/nav-links';
import { usePathname } from 'next/navigation';
import { AdminSearch, tieneBuscador } from '@/components/admin/admin-search';
import { BrandMark } from '@/components/admin/brand-mark';
import { ThemeToggle } from '@/components/admin/theme-toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SITIO_PUBLICO } from '@/lib/site';

/**
 * Barra superior. En escritorio el buscador está siempre visible; en móvil una
 * lupa lo despliega sobre la barra, que es donde ya está el pulgar.
 */
export function AdminTopbar() {
  const pathname = usePathname();
  const [buscando, setBuscando] = useState(false);
  const seccion = activeLink(pathname);
  const conBuscador = tieneBuscador(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-card px-3 md:h-12 md:px-4">
      {buscando && conBuscador ? (
        <Suspense fallback={null}>
          <AdminSearch className="flex-1 md:hidden" autoFocus onClose={() => setBuscando(false)} />
        </Suspense>
      ) : (
        <>
          {/* En móvil no hay barra lateral, así que la marca vive aquí. */}
          <span className="flex min-w-0 items-center gap-2 md:hidden">
            <BrandMark className="size-6" />
            <span className="truncate text-sm font-semibold">
              {seccion?.label ?? 'Administración'}
            </span>
          </span>

          {conBuscador ? (
            <Suspense fallback={null}>
              <AdminSearch className="hidden w-full max-w-sm md:flex" />
            </Suspense>
          ) : null}

          <span className="flex-1" />

          {conBuscador ? (
            <button
              type="button"
              onClick={() => setBuscando(true)}
              aria-label="Buscar motos"
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:hidden"
            >
              <Search className="size-4" />
            </button>
          ) : null}

          <Tooltip>
            <TooltipTrigger
              render={
                <a
                  href={SITIO_PUBLICO}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Ver el sitio público"
                  className="hidden size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:grid"
                >
                  <ExternalLink className="size-4" />
                </a>
              }
            />
            <TooltipContent>Ver el sitio público</TooltipContent>
          </Tooltip>

          <ThemeToggle className="hidden md:inline-flex" />
        </>
      )}
    </header>
  );
}
