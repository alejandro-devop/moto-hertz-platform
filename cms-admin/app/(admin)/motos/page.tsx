'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bike, ChevronLeft, ChevronRight, Plus, SearchX, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState, ErrorState, InlineSkeleton, TableSkeleton } from '@/components/admin/states';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { countNeedingAttention } from '@/lib/motorcycle-status';
import type { Motorcycle, MotorcycleFormInput } from '@/lib/graphql/motorcycles';
import { aplicarFiltros, escribirFiltros, leerFiltros, paginar, type Filtros } from './filters';
import type { SeccionId } from './form-sections';
import { MotorcycleFormSheet } from './motorcycle-form-sheet';
import { MotorcycleCard, MotorcycleTableRow } from './motorcycle-row';
import { MotosFilters } from './motos-filters';
import { collectFacets, useMotorcycleMutations, useMotorcyclesQuery } from './use-motorcycles';

export default function MotosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtros = leerFiltros(new URLSearchParams(searchParams.toString()));

  const { data, isLoading, isError, error, refetch, isFetching } = useMotorcyclesQuery();
  const { add, edit } = useMotorcycleMutations();

  const [fichaAbierta, setFichaAbierta] = useState(false);
  const [editando, setEditando] = useState<Motorcycle | null>(null);
  const [seccionInicial, setSeccionInicial] = useState<SeccionId | undefined>();

  /* El estado de error muestra una frase; el volcado del servidor va aquí. */
  useEffect(() => {
    if (isError) registrarError('motos', error);
  }, [isError, error]);

  const motos = data?.motorcycles.motorcycles ?? [];
  const facetas = useMemo(() => collectFacets(motos), [motos]);
  const filtradas = useMemo(() => aplicarFiltros(motos, filtros), [motos, filtros]);
  const pagina = paginar(filtradas, filtros.pagina);
  const porVencer = useMemo(() => countNeedingAttention(motos), [motos]);
  const slugsEnUso = useMemo(() => motos.map((moto) => moto.slug), [motos]);

  function actualizarFiltros(patch: Partial<Filtros>) {
    /* Cualquier cambio de filtro vuelve a la primera página. */
    const siguiente: Filtros = { ...filtros, ...patch, pagina: patch.pagina ?? 1 };
    const params = escribirFiltros(siguiente);
    router.replace(params.size > 0 ? `/motos?${params}` : '/motos', { scroll: false });
  }

  function abrirFicha(motorcycle: Motorcycle | null, seccion?: SeccionId) {
    setEditando(motorcycle);
    setSeccionInicial(seccion);
    setFichaAbierta(true);
  }

  async function guardar(input: MotorcycleFormInput) {
    if (editando) await edit.mutateAsync({ ...input, id: editando.id });
    else await add.mutateAsync(input);
    setFichaAbierta(false);
  }

  const disponibles = motos.filter((moto) => moto.available).length;
  const resumen = isLoading ? (
    <InlineSkeleton />
  ) : isError ? (
    'No se pudo cargar el catálogo'
  ) : (
    `${motos.length} en catálogo · ${disponibles} en el sitio · ${motos.length - disponibles} fuera`
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Motos"
        summary={resumen}
        action={
          <Button onClick={() => abrirFicha(null)} className="h-11 md:h-9">
            <Plus />
            Publicar moto
          </Button>
        }
      />

      {/* Lo único que caduca solo en el catálogo va arriba de todo. */}
      {porVencer > 0 && filtros.papeles !== 'atencion' ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-warning/30 border-l-[3px] border-l-warning bg-warning-surface px-3 py-2.5 text-[13px]">
          <TriangleAlert className="size-4 shrink-0 text-warning" />
          <span className="min-w-0">
            <strong className="font-semibold">
              {porVencer} {porVencer === 1 ? 'moto' : 'motos'} con papeles por vencer
            </strong>{' '}
            <span className="text-muted-foreground">
              — SOAT o tecnomecánica en los próximos 30 días.
            </span>
          </span>
          <button
            type="button"
            onClick={() => actualizarFiltros({ papeles: 'atencion' })}
            className="ml-auto shrink-0 font-semibold text-warning underline underline-offset-2 focus-visible:ring-3 focus-visible:ring-warning/40 focus-visible:outline-none"
          >
            Ver {porVencer === 1 ? 'la moto' : `las ${porVencer}`}
          </button>
        </div>
      ) : null}

      <MotosFilters
        filtros={filtros}
        onChange={actualizarFiltros}
        marcas={facetas.marcas}
        sedes={facetas.sedes}
      />

      {isError ? (
        <ErrorState
          description={`${mensajeDeError(error)} El detalle completo está en la consola del navegador.`}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : isLoading ? (
        <div className="rounded-xl border border-border bg-card">
          <TableSkeleton />
        </div>
      ) : motos.length === 0 ? (
        <EmptyState
          icon={Bike}
          title="El catálogo está vacío"
          description="Publica la primera moto: con el nombre y el precio ya queda visible en el sitio."
          action={
            <Button onClick={() => abrirFicha(null)}>
              <Plus />
              Publicar la primera moto
            </Button>
          }
        />
      ) : pagina.total === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Ninguna moto coincide"
          description="Prueba con otro texto o quita algún filtro."
          action={
            <Button variant="outline" onClick={() => router.replace('/motos', { scroll: false })}>
              Quitar todos los filtros
            </Button>
          }
        />
      ) : (
        <>
          {/* Escritorio: tabla. */}
          <div className="hidden rounded-xl border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Moto</TableHead>
                  <TableHead>Condición</TableHead>
                  <TableHead>Papeles</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Publicación</TableHead>
                  <TableHead className="w-10 text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagina.items.map((moto) => (
                  <MotorcycleTableRow key={moto.id} motorcycle={moto} onEdit={abrirFicha} />
                ))}
              </TableBody>
            </Table>
            <Paginacion pagina={pagina} onChange={(n) => actualizarFiltros({ pagina: n })} />
          </div>

          {/* Móvil: tarjetas. */}
          <ul className="flex flex-col gap-2 md:hidden">
            {pagina.items.map((moto) => (
              <MotorcycleCard key={moto.id} motorcycle={moto} onEdit={abrirFicha} />
            ))}
          </ul>
          <div className="md:hidden">
            <Paginacion pagina={pagina} onChange={(n) => actualizarFiltros({ pagina: n })} />
          </div>
        </>
      )}

      <MotorcycleFormSheet
        open={fichaAbierta}
        onOpenChange={setFichaAbierta}
        motorcycle={editando}
        seccionInicial={seccionInicial}
        slugsEnUso={slugsEnUso}
        onSubmit={guardar}
        submitting={add.isPending || edit.isPending}
      />
    </div>
  );
}

function Paginacion({
  pagina,
  onChange,
}: {
  pagina: { pagina: number; paginas: number; desde: number; hasta: number; total: number };
  onChange: (pagina: number) => void;
}) {
  if (pagina.total === 0) return null;

  const numeros = Array.from({ length: pagina.paginas }, (_, index) => index + 1).filter(
    (n) => n === 1 || n === pagina.paginas || Math.abs(n - pagina.pagina) <= 1
  );

  return (
    <nav
      aria-label="Paginación del catálogo"
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
