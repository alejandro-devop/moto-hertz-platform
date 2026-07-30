'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  pagina: { pagina: number; paginas: number; desde: number; hasta: number; total: number };
  onChange: (pagina: number) => void;
  /** Para el lector de pantalla: «Paginación del catálogo», «…de las noticias». */
  etiqueta?: string;
}

/**
 * Primera, última y las vecinas de la actual. Con 40 páginas, dibujar las 40 no
 * ayuda a llegar a ninguna; el «…» dice que hay más en medio.
 */
export function Paginacion({ pagina, onChange, etiqueta = 'Paginación' }: Props) {
  if (pagina.total === 0) return null;

  const numeros = Array.from({ length: pagina.paginas }, (_, index) => index + 1).filter(
    (n) => n === 1 || n === pagina.paginas || Math.abs(n - pagina.pagina) <= 1
  );

  return (
    <nav
      aria-label={etiqueta}
      className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-[13px] text-muted-foreground"
    >
      <span className="tabular">
        {pagina.desde}–{pagina.hasta} de {pagina.total}
      </span>
      <span className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Página anterior"
          disabled={pagina.pagina === 1}
          onClick={() => onChange(pagina.pagina - 1)}
        >
          <ChevronLeft />
        </Button>
        {numeros.map((n, index) => (
          <span key={n} className="flex items-center gap-1">
            {index > 0 && n - numeros[index - 1] > 1 ? (
              <span className="px-0.5 text-muted-foreground">…</span>
            ) : null}
            <Button
              variant={n === pagina.pagina ? 'default' : 'outline'}
              size="icon-sm"
              aria-label={`Página ${n}`}
              aria-current={n === pagina.pagina ? 'page' : undefined}
              onClick={() => onChange(n)}
              className="font-mono text-[11px]"
            >
              {n}
            </Button>
          </span>
        ))}
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Página siguiente"
          disabled={pagina.pagina === pagina.paginas}
          onClick={() => onChange(pagina.pagina + 1)}
        >
          <ChevronRight />
        </Button>
      </span>
    </nav>
  );
}
