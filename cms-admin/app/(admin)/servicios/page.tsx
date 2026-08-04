'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, SearchX, Trash2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/page-header';
import { ListaResponsive, type ColumnaLista } from '@/components/admin/responsive-list';
import { EmptyState, ErrorState, InlineSkeleton, TableSkeleton } from '@/components/admin/states';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { paginar } from '@/lib/list-params';
import { useTour } from '@/lib/tours/tour-provider';
import { useFiltrosUrl } from '@/lib/use-url-filters';
import type { Service, ServiceFormInput } from '@/lib/graphql/services';
import {
  aplicarFiltros,
  categoriasDe,
  contarSinDescripcion,
  escribirFiltros,
  leerFiltros,
  type Filtros,
} from './filters';
import type { SeccionId } from './form-sections';
import { ServiciosFilters } from './servicios-filters';
import { ServiceCard, ServiceTableRow } from './service-row';
import { ServiceFormSheet } from './service-form-sheet';
import { useServiceMutations, useServicesQuery } from './use-services';

const COLUMNAS: ColumnaLista[] = [
  { label: 'Servicio' },
  { label: 'Categoría' },
  { label: 'Precio', className: 'text-right' },
  { label: 'Duración' },
  { label: 'Estado' },
  { label: 'Acciones', className: 'w-10 text-right', soloLectores: true },
];

export default function ServiciosPage() {
  const { filtros, actualizar, limpiarTodo } = useFiltrosUrl<Filtros>({
    ruta: '/servicios',
    leer: leerFiltros,
    escribir: escribirFiltros,
  });

  /* «En papelera» no es un filtro sobre la lista: es otra consulta. */
  const enPapelera = filtros.estado === 'papelera';
  const { data, isLoading, isError, error, refetch, isFetching } = useServicesQuery(enPapelera);
  const { add, edit } = useServiceMutations();

  const [fichaAbierta, setFichaAbierta] = useState(false);
  const [editando, setEditando] = useState<Service | null>(null);
  const [seccionInicial, setSeccionInicial] = useState<SeccionId | undefined>();

  useEffect(() => {
    if (isError) registrarError('servicios', error);
  }, [isError, error]);

  const servicios = useMemo(() => data?.services.services ?? [], [data]);
  const filtrados = useMemo(() => aplicarFiltros(servicios, filtros), [servicios, filtros]);
  const pagina = paginar(filtrados, filtros.pagina);
  /* Ver `motos/page.tsx`: el de la lista espera a que haya filas, el de la
     ficha se dispara al abrirla. */
  useTour('servicios.lista', !isLoading && !isError && pagina.total > 0);
  useTour('servicios.ficha', fichaAbierta);

  const categorias = useMemo(() => categoriasDe(servicios), [servicios]);
  const sinDescripcion = useMemo(() => contarSinDescripcion(servicios), [servicios]);
  const slugsEnUso = useMemo(() => servicios.map((servicio) => servicio.slug), [servicios]);
  const destacados = servicios.filter((servicio) => servicio.featured).length;

  function abrirFicha(servicio: Service | null, seccion?: SeccionId) {
    setEditando(servicio);
    setSeccionInicial(seccion);
    setFichaAbierta(true);
  }

  async function guardar(input: ServiceFormInput) {
    if (editando) await edit.mutateAsync({ ...input, id: editando.id });
    else await add.mutateAsync(input);
    setFichaAbierta(false);
  }

  const resumen = isLoading ? (
    <InlineSkeleton />
  ) : isError ? (
    'No se pudieron cargar los servicios'
  ) : enPapelera ? (
    `${servicios.length} ${servicios.length === 1 ? 'servicio' : 'servicios'} en la papelera`
  ) : (
    `${servicios.length} ${servicios.length === 1 ? 'servicio' : 'servicios'} en el sitio · ${destacados} ${
      destacados === 1 ? 'destacado' : 'destacados'
    }`
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Servicios"
        tour="servicios.lista"
        summary={resumen}
        action={
          <Button onClick={() => abrirFicha(null)} className="h-11 md:h-9">
            <Plus />
            Agregar servicio
          </Button>
        }
      />

      {/* Sin descripción corta la tarjeta del sitio sale muda: se avisa arriba. */}
      {!enPapelera && sinDescripcion > 0 && servicios.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-warning/30 border-l-[3px] border-l-warning bg-warning-surface px-3 py-2.5 text-[13px]">
          <FileText className="size-4 shrink-0 text-warning" />
          <span className="min-w-0">
            <strong className="font-semibold">
              {sinDescripcion} {sinDescripcion === 1 ? 'servicio' : 'servicios'} sin descripción
              corta
            </strong>{' '}
            <span className="text-muted-foreground">
              — la tarjeta del sitio sale sin nada que leer.
            </span>
          </span>
        </div>
      ) : null}

      <ServiciosFilters filtros={filtros} categorias={categorias} onChange={actualizar} />

      {enPapelera && servicios.length > 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-muted-foreground">
          Estos servicios no salen en el sitio. Se pueden restaurar desde el menú de cada fila.
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
      ) : servicios.length === 0 ? (
        enPapelera ? (
          <EmptyState
            icon={Trash2}
            title="La papelera está vacía"
            description="Aquí llegan los servicios que elimines. Se pueden restaurar mientras estén acá."
            action={
              <Button variant="outline" onClick={() => actualizar({ estado: 'activos' })}>
                Volver a los servicios del sitio
              </Button>
            }
          />
        ) : (
          /* La sección arranca vacía a propósito: no se sembró nada. El vacío
             tiene que invitar a cargar el primero, no parecer una falla. */
          <EmptyState
            icon={Wrench}
            title="Todavía no hay servicios"
            description="Agrega el primero: con el nombre y una descripción corta ya sale en la página de servicios del sitio."
            action={
              <Button onClick={() => abrirFicha(null)}>
                <Plus />
                Agregar el primer servicio
              </Button>
            }
          />
        )
      ) : pagina.total === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Ningún servicio coincide"
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
          etiquetaPaginacion="Paginación de servicios"
          fila={(servicio) => (
            <ServiceTableRow key={servicio.id} servicio={servicio} onEdit={abrirFicha} />
          )}
          tarjeta={(servicio) => (
            <ServiceCard key={servicio.id} servicio={servicio} onEdit={abrirFicha} />
          )}
        />
      )}

      <ServiceFormSheet
        open={fichaAbierta}
        onOpenChange={setFichaAbierta}
        servicio={editando}
        seccionInicial={seccionInicial}
        slugsEnUso={slugsEnUso}
        categorias={categorias}
        onSubmit={guardar}
        submitting={add.isPending || edit.isPending}
      />
    </div>
  );
}
