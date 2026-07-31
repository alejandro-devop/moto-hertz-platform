'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Las listas que leen `?q=` de la URL, con lo que se busca en cada una. El
 * buscador escribe sobre **la sección donde uno está**; fuera de ellas cae en
 * `/motos`, que es el catálogo y lo que se busca el 90 % de las veces.
 *
 * Hasta la Fase 2 escribía siempre en `/motos`: estando en Medios o en Puntos
 * de atención, escribir en la barra te sacaba de la sección que estabas
 * mirando. **Al agregar una lista con búsqueda hay que agregarla aquí.**
 */
const BUSCADORES: Record<string, { placeholder: string; aria: string }> = {
  '/motos': {
    placeholder: 'Buscar por nombre o matrícula',
    aria: 'Buscar motos por nombre o matrícula',
  },
  '/puntos-de-atencion': {
    placeholder: 'Buscar por nombre o dirección',
    aria: 'Buscar puntos de atención por nombre o dirección',
  },
  '/servicios': {
    placeholder: 'Buscar por nombre o categoría',
    aria: 'Buscar servicios por nombre o categoría',
  },
  '/noticias': {
    placeholder: 'Buscar por título o autor',
    aria: 'Buscar noticias por título o autor',
  },
  '/medios': {
    placeholder: 'Buscar por nombre de archivo',
    aria: 'Buscar imágenes por nombre de archivo',
  },
};

const DESTINO_POR_DEFECTO = '/motos';

/**
 * Buscador global. Escribe en `?q=` de la lista de la sección actual, que es de
 * donde esa lista lee su filtro — así la búsqueda queda en la URL y el botón de
 * atrás funciona.
 */
export function AdminSearch({
  className,
  autoFocus = false,
  onClose,
}: {
  className?: string;
  autoFocus?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const destino =
    Object.keys(BUSCADORES).find(
      (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
    ) ?? DESTINO_POR_DEFECTO;
  const textos = BUSCADORES[destino];

  const q = searchParams.get('q') ?? '';
  const [value, setValue] = useState(q);
  /* Último valor que llegó a la URL, para no pelear con la sincronización. */
  const applied = useRef(q);

  useEffect(() => {
    if (q !== applied.current) {
      applied.current = q;
      setValue(q);
    }
  }, [q]);

  useEffect(() => {
    if (value === applied.current) return;
    const timer = setTimeout(() => {
      applied.current = value;
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set('q', value);
      else next.delete('q');
      /* Cambiar la búsqueda siempre vuelve a la primera página. */
      next.delete('pagina');
      const url = next.size > 0 ? `${destino}?${next}` : destino;
      if (pathname === destino) router.replace(url, { scroll: false });
      else router.push(url);
    }, 250);
    return () => clearTimeout(timer);
  }, [value, pathname, destino, router, searchParams]);

  /* ⌘K / Ctrl+K enfoca el buscador desde cualquier parte del panel. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div
      className={cn(
        'flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 md:h-8',
        className
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            if (value) setValue('');
            else onClose?.();
          }
        }}
        placeholder={textos.placeholder}
        aria-label={textos.aria}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Borrar la búsqueda"
          className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <kbd className="hidden shrink-0 rounded border border-border px-1.5 font-mono text-[10px] text-muted-foreground md:block">
          ⌘K
        </kbd>
      )}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:hidden"
        >
          Cancelar
        </button>
      ) : null}
    </div>
  );
}
