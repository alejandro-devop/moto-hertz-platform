'use client';

import { useState } from 'react';
import { Eye, EyeOff, ExternalLink, Pencil, Trash2, Undo2 } from 'lucide-react';
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
import { SITIO_PUBLICO } from '@/lib/site';
import type { Banner } from '@/lib/graphql/banners';
import type { SeccionId } from './form-sections';
import { useBannerMutations } from './use-banners';

/**
 * Qué se le puede hacer a un banner. Primero lo que se hace seguido
 * —activar o desactivar—, después editar y ver en el sitio, y eliminar de
 * última, separada y en rojo.
 */
export function BannerActions({
  banner,
  onEdit,
}: {
  banner: Banner;
  onEdit: (banner: Banner, seccion?: SeccionId) => void;
}) {
  const { patch, remove, restore, purge } = useBannerMutations();
  const [borradoAbierto, setBorradoAbierto] = useState(false);
  const [purgaAbierta, setPurgaAbierta] = useState(false);

  const enPapelera = Boolean(banner.deletedAt);

  /* En la papelera solo hay dos caminos: traerlo de vuelta o borrarlo de
     verdad. */
  const accionesPapelera: AccionFila[] = [
    {
      id: 'restaurar',
      label: 'Restaurar al carrusel',
      icon: Undo2,
      onSelect: () => restore.mutate({ id: banner.id, title: banner.title }),
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
      id: 'activar',
      label: banner.active ? 'Desactivar' : 'Activar',
      icon: banner.active ? EyeOff : Eye,
      onSelect: () => patch.mutate({ id: banner.id, active: !banner.active }),
    },
    {
      id: 'editar',
      label: 'Editar ficha completa',
      icon: Pencil,
      onSelect: () => onEdit(banner),
    },
    {
      id: 'ver',
      label: 'Ver la portada del sitio',
      icon: ExternalLink,
      href: SITIO_PUBLICO,
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
        etiqueta={`Acciones para ${banner.title}`}
        encabezado={
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{banner.title}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {banner.active ? 'Activo' : 'Inactivo'}
            </span>
          </span>
        }
      />

      <AlertDialog open={borradoAbierto} onOpenChange={setBorradoAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Mandar “{banner.title}” a la papelera?</AlertDialogTitle>
            <AlertDialogDescription>
              Deja de salir en el carrusel de la portada, pero se puede recuperar desde el filtro{' '}
              <strong>En papelera</strong>. Si solo quieres que no se vea por ahora, desactívalo en
              vez de eliminarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(
                  { id: banner.id, title: banner.title },
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
            <AlertDialogTitle>¿Eliminar “{banner.title}” para siempre?</AlertDialogTitle>
            <AlertDialogDescription>
              El banner se borra de la base de datos y no se puede recuperar. Las imágenes que
              hayas subido quedan en la biblioteca de medios. Si solo quieres que no salga en el
              sitio, déjalo en la papelera.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar en la papelera</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={purge.isPending}
              onClick={() =>
                purge.mutate(
                  { id: banner.id, title: banner.title },
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
