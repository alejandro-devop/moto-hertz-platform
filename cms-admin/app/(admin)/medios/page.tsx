'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Images, SearchX, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/admin/page-header';
import { ListaResponsive, type ColumnaLista } from '@/components/admin/responsive-list';
import { SubidorMedios } from '@/components/admin/image-picker';
import { EmptyState, ErrorState, InlineSkeleton, TableSkeleton } from '@/components/admin/states';
import { mensajeDeError, registrarError } from '@/lib/errors';
import { paginar } from '@/lib/list-params';
import { formatBytes } from '@/lib/media-upload';
import { useFiltrosUrl } from '@/lib/use-url-filters';
import { aplicarFiltros, escribirFiltros, leerFiltros, type Filtros } from './filters';
import { MediaCard, MediaTableRow } from './media-row';
import { MediosFilters } from './medios-filters';
import { MEDIA_KEY, useMediaQuery } from './use-media';

const COLUMNAS: ColumnaLista[] = [
  { label: 'Imagen' },
  { label: 'Medidas' },
  { label: 'Peso' },
  { label: 'Subida' },
  { label: 'Formato' },
  { label: 'Acciones', className: 'w-10 text-right', soloLectores: true },
];

/**
 * La biblioteca de archivos subidos desde el panel, con su papelera.
 *
 * Es el **único sitio desde donde se borra una imagen**: quitarla de una ficha
 * solo la desvincula, y eliminar una moto no toca sus archivos.
 */
export default function MediosPage() {
  const { filtros, actualizar, limpiarTodo } = useFiltrosUrl<Filtros>({
    ruta: '/medios',
    leer: leerFiltros,
    escribir: escribirFiltros,
  });

  const enPapelera = filtros.estado === 'papelera';
  const { data, isLoading, isError, error, refetch, isFetching } = useMediaQuery(enPapelera);
  const queryClient = useQueryClient();
  const [subirAbierto, setSubirAbierto] = useState(false);

  useEffect(() => {
    if (isError) registrarError('medios', error);
  }, [isError, error]);

  const media = useMemo(() => data ?? [], [data]);
  const filtradas = useMemo(() => aplicarFiltros(media, filtros), [media, filtros]);
  const pagina = paginar(filtradas, filtros.pagina);

  const pesoTotal = media.reduce((total, item) => total + (item.sizeBytes ?? 0), 0);
  const resumen = isLoading ? (
    <InlineSkeleton />
  ) : isError ? (
    'No se pudo cargar la biblioteca'
  ) : enPapelera ? (
    `${media.length} en la papelera · ${formatBytes(pesoTotal)} sin liberar`
  ) : (
    `${media.length} ${media.length === 1 ? 'imagen' : 'imágenes'} · ${formatBytes(pesoTotal)}`
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Medios"
        summary={resumen}
        action={
          <Button onClick={() => setSubirAbierto(true)} className="h-11 md:h-9">
            <ImagePlus />
            Subir imágenes
          </Button>
        }
      />

      <MediosFilters filtros={filtros} onChange={actualizar} />

      {enPapelera && media.length > 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px] text-muted-foreground">
          Las imágenes en la papelera <strong>siguen visibles</strong> en las fichas que las usen:
          su enlace no deja de funcionar hasta que se eliminan definitivamente.
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
      ) : media.length === 0 ? (
        enPapelera ? (
          <EmptyState
            icon={Trash2}
            title="La papelera está vacía"
            description="Aquí llegan las imágenes que elimines de la biblioteca. Se pueden restaurar mientras estén acá."
            action={
              <Button variant="outline" onClick={() => actualizar({ estado: 'biblioteca' })}>
                Volver a la biblioteca
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Images}
            title="Todavía no hay imágenes"
            description="Sube las fotos aquí o directamente desde la ficha de una moto: en las dos partes terminan en esta biblioteca."
            action={
              <Button onClick={() => setSubirAbierto(true)}>
                <ImagePlus />
                Subir las primeras
              </Button>
            }
          />
        )
      ) : pagina.total === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Ninguna imagen coincide"
          description="Prueba con otro texto o quita los filtros."
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
          etiquetaPaginacion="Paginación de la biblioteca"
          fila={(item) => <MediaTableRow key={item.id} item={item} />}
          tarjeta={(item) => <MediaCard key={item.id} item={item} />}
        />
      )}

      <Dialog open={subirAbierto} onOpenChange={setSubirAbierto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Subir imágenes</DialogTitle>
            <DialogDescription>
              Se guardan en WebP y con el lado mayor reducido a 1600 px. El original no se conserva.
            </DialogDescription>
          </DialogHeader>
          {/* Cada archivo que entra refresca la lista, así se ve llegar. Se
              invalidan las dos (biblioteca y papelera) por si se subió estando
              en la papelera. */}
          <SubidorMedios onSubida={() => queryClient.invalidateQueries({ queryKey: MEDIA_KEY })} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
