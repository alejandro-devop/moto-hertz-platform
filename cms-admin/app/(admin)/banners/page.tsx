'use client';

import { useEffect, useMemo, useState } from 'react';
import { GalleryHorizontal, Plus, SearchX, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/page-header';
import { ListaResponsive, type ColumnaLista } from '@/components/admin/responsive-list';
import { EmptyState, ErrorState, InlineSkeleton, TableSkeleton } from '@/components/admin/states';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { paginar } from '@/lib/list-params';
import { useFiltrosUrl } from '@/lib/use-url-filters';
import type { Banner, BannerFormInput } from '@/lib/graphql/banners';
import { aplicarFiltros, escribirFiltros, leerFiltros, type Filtros } from './filters';
import type { SeccionId } from './form-sections';
import { BannersFilters } from './banners-filters';
import { BannerCard, BannerTableRow } from './banner-row';
import { BannerFormSheet } from './banner-form-sheet';
import { useBannerMutations, useBannersQuery } from './use-banners';

const COLUMNAS: ColumnaLista[] = [
  { label: 'Orden', className: 'w-24' },
  { label: 'Banner' },
  { label: 'Vigencia' },
  { label: 'Estado' },
  { label: 'Acciones', className: 'w-10 text-right', soloLectores: true },
];

export default function BannersPage() {
  const { filtros, actualizar, limpiarTodo } = useFiltrosUrl<Filtros>({
    ruta: '/banners',
    leer: leerFiltros,
    escribir: escribirFiltros,
  });

  /* «En papelera» no es un filtro sobre la lista: es otra consulta. */
  const enPapelera = filtros.estado === 'papelera';
  const { data, isLoading, isError, error, refetch, isFetching } = useBannersQuery(enPapelera);
  const { add, edit, reorder } = useBannerMutations();

  const [fichaAbierta, setFichaAbierta] = useState(false);
  const [editando, setEditando] = useState<Banner | null>(null);
  const [seccionInicial, setSeccionInicial] = useState<SeccionId | undefined>();

  useEffect(() => {
    if (isError) registrarError('banners', error);
  }, [isError, error]);

  const banners = useMemo(() => data?.banners.banners ?? [], [data]);
  /* El orden real, sin filtrar: lo que mueven los botones de subir/bajar y lo
     que el carrusel del sitio respeta tal cual. */
  const ordenados = useMemo(() => [...banners].sort((a, b) => a.position - b.position), [banners]);
  const filtrados = useMemo(() => aplicarFiltros(banners, filtros), [banners, filtros]);
  const pagina = paginar(filtrados, filtros.pagina);
  const activos = banners.filter((banner) => banner.active).length;

  /* Reordenar compite con la búsqueda: si hay texto escrito, la vecina de una
     fila puede no ser la que se ve en pantalla. Se deshabilita mientras haya
     búsqueda, en vez de mover algo que no se ve. */
  const puedeReordenar = !enPapelera && filtros.q.trim() === '';

  function abrirFicha(banner: Banner | null, seccion?: SeccionId) {
    setEditando(banner);
    setSeccionInicial(seccion);
    setFichaAbierta(true);
  }

  async function guardar(input: BannerFormInput) {
    if (editando) await edit.mutateAsync({ ...input, id: editando.id });
    else await add.mutateAsync(input);
    setFichaAbierta(false);
  }

  function mover(id: string, delta: 1 | -1) {
    const indice = ordenados.findIndex((banner) => banner.id === id);
    const destino = indice + delta;
    if (indice < 0 || destino < 0 || destino >= ordenados.length) return;
    const siguiente = [...ordenados];
    [siguiente[indice], siguiente[destino]] = [siguiente[destino], siguiente[indice]];
    reorder.mutate(siguiente.map((banner) => banner.id));
  }

  const resumen = isLoading ? (
    <InlineSkeleton />
  ) : isError ? (
    'No se pudieron cargar los banners'
  ) : enPapelera ? (
    `${banners.length} ${banners.length === 1 ? 'banner' : 'banners'} en la papelera`
  ) : (
    `${banners.length} ${banners.length === 1 ? 'banner' : 'banners'} en el carrusel · ${activos} ${
      activos === 1 ? 'activo' : 'activos'
    }`
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Banners"
        summary={resumen}
        action={
          <Button onClick={() => abrirFicha(null)} className="h-11 md:h-9">
            <Plus />
            Agregar banner
          </Button>
        }
      />

      <BannersFilters filtros={filtros} onChange={actualizar} />

      {enPapelera && banners.length > 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-muted-foreground">
          Estos banners no salen en el carrusel. Se pueden restaurar desde el menú de cada fila.
        </p>
      ) : null}

      {!enPapelera && !puedeReordenar && banners.length > 1 ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-muted-foreground">
          Quita la búsqueda para poder reordenar los banners.
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
      ) : banners.length === 0 ? (
        enPapelera ? (
          <EmptyState
            icon={Trash2}
            title="La papelera está vacía"
            description="Aquí llegan los banners que elimines. Se pueden restaurar mientras estén acá."
            action={
              <Button variant="outline" onClick={() => actualizar({ estado: 'activos' })}>
                Volver a los banners del sitio
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={GalleryHorizontal}
            title="Todavía no hay banners"
            description="Agrega el primero: con una imagen ya sale en el carrusel de la portada."
            action={
              <Button onClick={() => abrirFicha(null)}>
                <Plus />
                Agregar el primer banner
              </Button>
            }
          />
        )
      ) : pagina.total === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Ningún banner coincide"
          description="Prueba con otro texto."
          action={
            <Button variant="outline" onClick={limpiarTodo}>
              Quitar la búsqueda
            </Button>
          }
        />
      ) : (
        <ListaResponsive
          pagina={pagina}
          onPagina={(n) => actualizar({ pagina: n })}
          columnas={COLUMNAS}
          etiquetaPaginacion="Paginación de banners"
          fila={(banner) => {
            const indice = ordenados.findIndex((b) => b.id === banner.id);
            return (
              <BannerTableRow
                key={banner.id}
                banner={banner}
                onEdit={abrirFicha}
                onMover={puedeReordenar ? (delta) => mover(banner.id, delta) : undefined}
                puedeSubir={indice > 0}
                puedeBajar={indice >= 0 && indice < ordenados.length - 1}
              />
            );
          }}
          tarjeta={(banner) => {
            const indice = ordenados.findIndex((b) => b.id === banner.id);
            return (
              <BannerCard
                key={banner.id}
                banner={banner}
                onEdit={abrirFicha}
                onMover={puedeReordenar ? (delta) => mover(banner.id, delta) : undefined}
                puedeSubir={indice > 0}
                puedeBajar={indice >= 0 && indice < ordenados.length - 1}
              />
            );
          }}
        />
      )}

      <BannerFormSheet
        open={fichaAbierta}
        onOpenChange={setFichaAbierta}
        banner={editando}
        seccionInicial={seccionInicial}
        onSubmit={guardar}
        submitting={add.isPending || edit.isPending}
      />
    </div>
  );
}
