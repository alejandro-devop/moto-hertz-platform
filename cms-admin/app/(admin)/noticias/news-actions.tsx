'use client';

import { useState } from 'react';
import { ExternalLink, Pencil, Star, StarOff, Trash2, Undo2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RowActions, type AccionFila } from '@/components/admin/row-actions';
import { urlPublicaDeNoticia } from '@/lib/site';
import { ETIQUETAS_ESTADO_NOTICIA, getNewsStatus } from '@/lib/news-status';
import type { News } from '@/lib/graphql/news';
import type { SeccionId } from './form-sections';
import { useNewsMutations } from './use-news';

/**
 * Qué se le puede hacer a una noticia. Primero lo que se hace seguido
 * —destacarla—, después editar y ver en el sitio, y eliminar de última,
 * separada y en rojo.
 */
export function NewsActions({
  noticia,
  onEdit,
}: {
  noticia: News;
  onEdit: (noticia: News, seccion?: SeccionId) => void;
}) {
  const { patch, remove, restore, purge } = useNewsMutations();
  const [borradoAbierto, setBorradoAbierto] = useState(false);
  const [purgaAbierta, setPurgaAbierta] = useState(false);

  const enPapelera = Boolean(noticia.deletedAt);
  const estado = getNewsStatus(noticia.publishedAt);
  const puedeVerse = estado === 'publicada' && !enPapelera;

  /* En la papelera solo hay dos caminos: traerla de vuelta o borrarla de verdad. */
  const accionesPapelera: AccionFila[] = [
    {
      id: 'restaurar',
      label: 'Restaurar',
      icon: Undo2,
      onSelect: () => restore.mutate({ id: noticia.id, title: noticia.title }),
    },
    {
      id: 'purgar',
      label: 'Eliminar definitivamente',
      icon: Trash2,
      danger: true,
      onSelect: () => setPurgaAbierta(true),
    },
  ];

  const acciones: AccionFila[] = [
    {
      id: 'destacar',
      label: noticia.featured ? 'Quitar de destacadas' : 'Destacar en el sitio',
      icon: noticia.featured ? StarOff : Star,
      onSelect: () => patch.mutate({ id: noticia.id, featured: !noticia.featured }),
    },
    {
      id: 'editar',
      label: 'Editar ficha completa',
      icon: Pencil,
      onSelect: () => onEdit(noticia),
    },
    {
      id: 'ver',
      label: puedeVerse ? 'Ver en el sitio' : `Ver en el sitio (${ETIQUETAS_ESTADO_NOTICIA[estado]})`,
      icon: ExternalLink,
      href: urlPublicaDeNoticia(noticia.slug),
      onSelect: () => {},
    },
    {
      id: 'eliminar',
      label: 'Mover a la papelera',
      icon: Trash2,
      danger: true,
      onSelect: () => setBorradoAbierto(true),
    },
  ];

  return (
    <>
      <RowActions
        acciones={enPapelera ? accionesPapelera : acciones}
        etiqueta={`Acciones para ${noticia.title}`}
        encabezado={
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{noticia.title}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {[noticia.author?.trim(), ETIQUETAS_ESTADO_NOTICIA[estado]].filter(Boolean).join(' · ')}
            </span>
          </span>
        }
      />

      <AlertDialog open={borradoAbierto} onOpenChange={setBorradoAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Mandar “{noticia.title}” a la papelera?</AlertDialogTitle>
            <AlertDialogDescription>
              Deja de salir en el sitio, pero se puede recuperar desde el filtro{' '}
              <strong>En papelera</strong>. Si solo quieres dejar de mostrarla sin perder lo escrito,
              quítale la fecha de publicación para volverla borrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(
                  { id: noticia.id, title: noticia.title },
                  { onSuccess: () => setBorradoAbierto(false) }
                )
              }
            >
              {remove.isPending ? 'Moviendo…' : 'Mover a la papelera'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={purgaAbierta} onOpenChange={setPurgaAbierta}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar “{noticia.title}” para siempre?</AlertDialogTitle>
            <AlertDialogDescription>
              La noticia se borra de la base de datos —contenido, etiquetas y todo— y no se puede
              recuperar. La imagen que hayas subido queda en la biblioteca de medios. Si solo
              quieres que no salga en el sitio, déjala en la papelera.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar en la papelera</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={purge.isPending}
              onClick={() =>
                purge.mutate(
                  { id: noticia.id, title: noticia.title },
                  { onSuccess: () => setPurgaAbierta(false) }
                )
              }
            >
              {purge.isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
