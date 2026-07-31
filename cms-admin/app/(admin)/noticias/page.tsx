'use client';

import { useEffect, useMemo, useState } from 'react';
import { Newspaper, Plus, SearchX, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/page-header';
import { ListaResponsive, type ColumnaLista } from '@/components/admin/responsive-list';
import { EmptyState, ErrorState, InlineSkeleton, TableSkeleton } from '@/components/admin/states';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { paginar } from '@/lib/list-params';
import { useFiltrosUrl } from '@/lib/use-url-filters';
import type { News, NewsFormInput } from '@/lib/graphql/news';
import {
  aplicarFiltros,
  categoriasDe,
  escribirFiltros,
  leerFiltros,
  type Filtros,
} from './filters';
import type { SeccionId } from './form-sections';
import { NoticiasFilters } from './noticias-filters';
import { NewsCard, NewsTableRow } from './news-row';
import { NewsFormSheet } from './news-form-sheet';
import { useNewsMutations, useNewsQuery } from './use-news';

const COLUMNAS: ColumnaLista[] = [
  { label: 'Noticia' },
  { label: 'Autor' },
  { label: 'Categoría' },
  { label: 'Fecha' },
  { label: 'Estado' },
  { label: 'Acciones', className: 'w-10 text-right', soloLectores: true },
];

export default function NoticiasPage() {
  const { filtros, actualizar, limpiarTodo } = useFiltrosUrl<Filtros>({
    ruta: '/noticias',
    leer: leerFiltros,
    escribir: escribirFiltros,
  });

  /* «En papelera» no es un filtro sobre la lista: es otra consulta. */
  const enPapelera = filtros.estado === 'papelera';
  const { data, isLoading, isError, error, refetch, isFetching } = useNewsQuery(enPapelera);
  const { add, edit } = useNewsMutations();

  const [fichaAbierta, setFichaAbierta] = useState(false);
  const [editando, setEditando] = useState<News | null>(null);
  const [seccionInicial, setSeccionInicial] = useState<SeccionId | undefined>();

  useEffect(() => {
    if (isError) registrarError('noticias', error);
  }, [isError, error]);

  const noticias = useMemo(() => data?.newsList.news ?? [], [data]);
  const filtradas = useMemo(() => aplicarFiltros(noticias, filtros), [noticias, filtros]);
  const pagina = paginar(filtradas, filtros.pagina);
  const categorias = useMemo(() => categoriasDe(noticias), [noticias]);
  const slugsEnUso = useMemo(() => noticias.map((noticia) => noticia.slug), [noticias]);
  const publicadas = noticias.filter((n) => !n.deletedAt && n.publishedAt && new Date(n.publishedAt) <= new Date()).length;

  function abrirFicha(noticia: News | null, seccion?: SeccionId) {
    setEditando(noticia);
    setSeccionInicial(seccion);
    setFichaAbierta(true);
  }

  async function guardar(input: NewsFormInput) {
    if (editando) await edit.mutateAsync({ ...input, id: editando.id });
    else await add.mutateAsync(input);
    setFichaAbierta(false);
  }

  const resumen = isLoading ? (
    <InlineSkeleton />
  ) : isError ? (
    'No se pudieron cargar las noticias'
  ) : enPapelera ? (
    `${noticias.length} ${noticias.length === 1 ? 'noticia' : 'noticias'} en la papelera`
  ) : (
    `${noticias.length} ${noticias.length === 1 ? 'noticia' : 'noticias'} · ${publicadas} ${
      publicadas === 1 ? 'publicada' : 'publicadas'
    }`
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Noticias"
        summary={resumen}
        action={
          <Button onClick={() => abrirFicha(null)} className="h-11 md:h-9">
            <Plus />
            Agregar noticia
          </Button>
        }
      />

      <NoticiasFilters filtros={filtros} categorias={categorias} onChange={actualizar} />

      {enPapelera && noticias.length > 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-muted-foreground">
          Estas noticias no salen en el sitio. Se pueden restaurar desde el menú de cada fila.
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
      ) : noticias.length === 0 ? (
        enPapelera ? (
          <EmptyState
            icon={Trash2}
            title="La papelera está vacía"
            description="Aquí llegan las noticias que elimines. Se pueden restaurar mientras estén acá."
            action={
              <Button variant="outline" onClick={() => actualizar({ estado: 'todas' })}>
                Volver a las noticias
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Newspaper}
            title="Todavía no hay noticias"
            description="Agrega la primera: con el título y el contenido ya se puede guardar. Queda en borrador hasta que le pongas fecha de publicación."
            action={
              <Button onClick={() => abrirFicha(null)}>
                <Plus />
                Agregar la primera noticia
              </Button>
            }
          />
        )
      ) : pagina.total === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Ninguna noticia coincide"
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
          etiquetaPaginacion="Paginación de noticias"
          fila={(noticia) => <NewsTableRow key={noticia.id} noticia={noticia} onEdit={abrirFicha} />}
          tarjeta={(noticia) => <NewsCard key={noticia.id} noticia={noticia} onEdit={abrirFicha} />}
        />
      )}

      <NewsFormSheet
        open={fichaAbierta}
        onOpenChange={setFichaAbierta}
        noticia={editando}
        seccionInicial={seccionInicial}
        slugsEnUso={slugsEnUso}
        categorias={categorias}
        onSubmit={guardar}
        submitting={add.isPending || edit.isPending}
      />
    </div>
  );
}
