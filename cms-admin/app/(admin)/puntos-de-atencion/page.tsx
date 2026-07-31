'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, MapPin, Plus, SearchX, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/page-header';
import { ListaResponsive, type ColumnaLista } from '@/components/admin/responsive-list';
import { EmptyState, ErrorState, InlineSkeleton, TableSkeleton } from '@/components/admin/states';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { paginar } from '@/lib/list-params';
import { useFiltrosUrl } from '@/lib/use-url-filters';
import type { ServicePoint, ServicePointFormInput } from '@/lib/graphql/service-points';
import {
  aplicarFiltros,
  contarSinHorario,
  escribirFiltros,
  leerFiltros,
  type Filtros,
} from './filters';
import type { SeccionId } from './form-sections';
import { PuntosFilters } from './puntos-filters';
import { ServicePointCard, ServicePointTableRow } from './service-point-row';
import { ServicePointFormSheet } from './service-point-form-sheet';
import { useServicePointMutations, useServicePointsQuery } from './use-service-points';

const COLUMNAS: ColumnaLista[] = [
  { label: 'Punto' },
  { label: 'Tipo' },
  { label: 'Dirección' },
  { label: 'Contacto' },
  { label: 'Horario' },
  { label: 'Acciones', className: 'w-10 text-right', soloLectores: true },
];

export default function PuntosDeAtencionPage() {
  const { filtros, actualizar, limpiarTodo } = useFiltrosUrl<Filtros>({
    ruta: '/puntos-de-atencion',
    leer: leerFiltros,
    escribir: escribirFiltros,
  });

  /* «En papelera» no es un filtro sobre la lista: es otra consulta. */
  const enPapelera = filtros.estado === 'papelera';
  const { data, isLoading, isError, error, refetch, isFetching } =
    useServicePointsQuery(enPapelera);
  const { add, edit } = useServicePointMutations();

  const [fichaAbierta, setFichaAbierta] = useState(false);
  const [editando, setEditando] = useState<ServicePoint | null>(null);
  const [seccionInicial, setSeccionInicial] = useState<SeccionId | undefined>();

  useEffect(() => {
    if (isError) registrarError('puntos-de-atencion', error);
  }, [isError, error]);

  const puntos = data?.servicePoints.servicePoints ?? [];
  const filtrados = useMemo(() => aplicarFiltros(puntos, filtros), [puntos, filtros]);
  const pagina = paginar(filtrados, filtros.pagina);
  const sinHorario = useMemo(() => contarSinHorario(puntos), [puntos]);
  const slugsEnUso = useMemo(() => puntos.map((punto) => punto.slug), [puntos]);

  function abrirFicha(punto: ServicePoint | null, seccion?: SeccionId) {
    setEditando(punto);
    setSeccionInicial(seccion);
    setFichaAbierta(true);
  }

  async function guardar(input: ServicePointFormInput) {
    if (editando) await edit.mutateAsync({ ...input, id: editando.id });
    else await add.mutateAsync(input);
    setFichaAbierta(false);
  }

  const ciudades = new Set(puntos.map((punto) => punto.address?.city).filter(Boolean));
  const resumen = isLoading ? (
    <InlineSkeleton />
  ) : isError ? (
    'No se pudieron cargar los puntos de atención'
  ) : enPapelera ? (
    `${puntos.length} ${puntos.length === 1 ? 'punto' : 'puntos'} en la papelera`
  ) : (
    `${puntos.length} ${puntos.length === 1 ? 'punto' : 'puntos'} en el sitio · ${ciudades.size} ${
      ciudades.size === 1 ? 'ciudad' : 'ciudades'
    }`
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Puntos de atención"
        summary={resumen}
        action={
          <Button onClick={() => abrirFicha(null)} className="h-11 md:h-9">
            <Plus />
            Agregar punto
          </Button>
        }
      />

      {/* Un punto sin horario es el reclamo más común: llegan y está cerrado. */}
      {!enPapelera && sinHorario > 0 && puntos.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-warning/30 border-l-[3px] border-l-warning bg-warning-surface px-3 py-2.5 text-[13px]">
          <Clock className="size-4 shrink-0 text-warning" />
          <span className="min-w-0">
            <strong className="font-semibold">
              {sinHorario} {sinHorario === 1 ? 'punto' : 'puntos'} sin horario
            </strong>{' '}
            <span className="text-muted-foreground">
              — el sitio no puede decir cuándo abren.
            </span>
          </span>
        </div>
      ) : null}

      <PuntosFilters filtros={filtros} onChange={actualizar} />

      {enPapelera && puntos.length > 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-muted-foreground">
          Estos puntos no salen en el sitio. Se pueden restaurar desde el menú de cada fila.
        </p>
      ) : null}

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
      ) : puntos.length === 0 ? (
        enPapelera ? (
          <EmptyState
            icon={Trash2}
            title="La papelera está vacía"
            description="Aquí llegan los puntos de atención que elimines. Se pueden restaurar mientras estén acá."
            action={
              <Button variant="outline" onClick={() => actualizar({ estado: 'activos' })}>
                Volver a los puntos del sitio
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={MapPin}
            title="Todavía no hay puntos de atención"
            description="Agrega el primero: con el nombre y la dirección ya sale en el sitio."
            action={
              <Button onClick={() => abrirFicha(null)}>
                <Plus />
                Agregar el primer punto
              </Button>
            }
          />
        )
      ) : pagina.total === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Ningún punto coincide"
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
          etiquetaPaginacion="Paginación de puntos de atención"
          fila={(punto) => (
            <ServicePointTableRow key={punto.id} punto={punto} onEdit={abrirFicha} />
          )}
          tarjeta={(punto) => (
            <ServicePointCard key={punto.id} punto={punto} onEdit={abrirFicha} />
          )}
        />
      )}

      <ServicePointFormSheet
        open={fichaAbierta}
        onOpenChange={setFichaAbierta}
        punto={editando}
        seccionInicial={seccionInicial}
        slugsEnUso={slugsEnUso}
        onSubmit={guardar}
        submitting={add.isPending || edit.isPending}
      />
    </div>
  );
}
