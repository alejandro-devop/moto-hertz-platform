'use client';

import { ExternalLink } from 'lucide-react';
import { activeLink } from '@/app/(admin)/nav-links';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/components/admin/brand-mark';
import { ThemeToggle } from '@/components/admin/theme-toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { tourAnchor } from '@/lib/tours/anchor';
import { SITIO_PUBLICO } from '@/lib/site';

/**
 * Barra superior. Sin buscador: cada lista tiene el suyo en su propia fila de
 * filtros (`BuscadorLista`, en `components/admin/filter-bar.tsx`) — uno en la
 * navbar que cambiaba de sección según dónde se estuviera parado se leía
 * como un buscador global y confundía más de lo que ayudaba.
 */
export function AdminTopbar() {
  const pathname = usePathname();
  const seccion = activeLink(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-card px-3 md:h-12 md:px-4">
      {/* En móvil no hay barra lateral, así que la marca vive aquí. */}
      <span className="flex min-w-0 items-center gap-2 md:hidden">
        <BrandMark className="size-6" />
        <span className="truncate text-sm font-semibold">{seccion?.label ?? 'Administración'}</span>
      </span>

      <span className="flex-1" />

      {/* Un solo envoltorio para los dos controles: son un solo paso del
          recorrido («abre el sitio, cambia el tema»), no dos. `ThemeToggle`
          además solo acepta `className`, así que no podría llevar el ancla. */}
      <span {...tourAnchor('panel.barra')} className="flex items-center gap-2">
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
      </span>
    </header>
  );
}
