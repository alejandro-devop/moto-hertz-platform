'use client';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Paginacion } from '@/components/admin/pagination';
import type { Pagina } from '@/lib/list-params';

export interface ColumnaLista {
  label: string;
  className?: string;
  /** El título no se dibuja; solo lo leen los lectores de pantalla. */
  soloLectores?: boolean;
}

interface Props<T> {
  pagina: Pagina<T>;
  onPagina: (pagina: number) => void;
  columnas: ColumnaLista[];
  /** Devuelve un `<TableRow>` con su `key`. */
  fila: (item: T) => React.ReactNode;
  /** Devuelve un `<li>` con su `key`. */
  tarjeta: (item: T) => React.ReactNode;
  etiquetaPaginacion?: string;
}

/**
 * El contenedor de toda lista del panel: tabla en escritorio, tarjetas en el
 * teléfono, y la misma paginación en las dos. La fila y la tarjeta las pone
 * cada módulo — lo que se comparte es el armazón, no el contenido.
 */
export function ListaResponsive<T>({
  pagina,
  onPagina,
  columnas,
  fila,
  tarjeta,
  etiquetaPaginacion,
}: Props<T>) {
  const paginacion = (
    <Paginacion pagina={pagina} onChange={onPagina} etiqueta={etiquetaPaginacion} />
  );

  return (
    <>
      {/* Escritorio: tabla. */}
      <div className="hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columnas.map((columna) => (
                <TableHead key={columna.label} className={columna.className}>
                  {columna.soloLectores ? (
                    <span className="sr-only">{columna.label}</span>
                  ) : (
                    columna.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{pagina.items.map((item) => fila(item))}</TableBody>
        </Table>
        {paginacion}
      </div>

      {/* Móvil: tarjetas. */}
      <ul className="flex flex-col gap-2 md:hidden">
        {pagina.items.map((item) => tarjeta(item))}
      </ul>
      <div className="md:hidden">{paginacion}</div>
    </>
  );
}
