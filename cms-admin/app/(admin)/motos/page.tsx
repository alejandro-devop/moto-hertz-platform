'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bike, Plus, SearchX, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/page-header';
import { ListaResponsive, type ColumnaLista } from '@/components/admin/responsive-list';
import { EmptyState, ErrorState, InlineSkeleton, TableSkeleton } from '@/components/admin/states';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { paginar } from '@/lib/list-params';
import { countNeedingAttention } from '@/lib/motorcycle-status';
import { useFiltrosUrl } from '@/lib/use-url-filters';
import type { Motorcycle, MotorcycleFormInput } from '@/lib/graphql/motorcycles';
import { aplicarFiltros, escribirFiltros, leerFiltros, type Filtros } from './filters';
import type { SeccionId } from './form-sections';
import { MotorcycleFormSheet } from './motorcycle-form-sheet';
import { MotorcycleCard, MotorcycleTableRow } from './motorcycle-row';
import { MotosFilters } from './motos-filters';
import { collectFacets, useMotorcycleMutations, useMotorcyclesQuery } from './use-motorcycles';

const COLUMNAS: ColumnaLista[] = [
  { label: 'Moto' },
  { label: 'Condición' },
  { label: 'Papeles' },
  { label: 'Sede' },
  { label: 'Precio', className: 'text-right' },
  { label: 'Publicación' },
  { label: 'Acciones', className: 'w-10 text-right', soloLectores: true },
];

export default function MotosPage() {
  const { filtros, actualizar, limpiarTodo } = useFiltrosUrl<Filtros>({
    ruta: '/motos',
    leer: leerFiltros,
    escribir: escribirFiltros,
  });

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
            onClick={() => actualizar({ papeles: 'atencion' })}
            className="ml-auto shrink-0 font-semibold text-warning underline underline-offset-2 focus-visible:ring-3 focus-visible:ring-warning/40 focus-visible:outline-none"
          >
            Ver {porVencer === 1 ? 'la moto' : `las ${porVencer}`}
          </button>
        </div>
      ) : null}

      <MotosFilters
        filtros={filtros}
        onChange={actualizar}
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
            <Button variant="outline" onClick={limpiarTodo}>
              Quitar todos los filtros
            </Button>
          }
        />
      ) : (
        <ListaResponsive
          pagina={pagina}
          onPagina={(n) => actualizar({ pagina: n })}
          columnas={COLUMNAS}
          etiquetaPaginacion="Paginación del catálogo"
          fila={(moto) => (
            <MotorcycleTableRow key={moto.id} motorcycle={moto} onEdit={abrirFicha} />
          )}
          tarjeta={(moto) => <MotorcycleCard key={moto.id} motorcycle={moto} onEdit={abrirFicha} />}
        />
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
