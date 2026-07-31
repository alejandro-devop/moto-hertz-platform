'use client';

import { useState } from 'react';
import { ExternalLink, ListChecks, Pencil, Star, StarOff, Trash2, Undo2 } from 'lucide-react';
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
import { urlPublicaDeServicio } from '@/lib/site';
import { formatPrecio } from '@/lib/service-pricing';
import type { Service } from '@/lib/graphql/services';
import type { SeccionId } from './form-sections';
import { useServiceMutations } from './use-services';

/**
 * Qué se le puede hacer a un servicio. Primero lo que se hace seguido
 * —destacarlo, corregir qué incluye—, después editar y ver en el sitio, y
 * eliminar de última, separada y en rojo.
 */
export function ServiceActions({
  servicio,
  onEdit,
}: {
  servicio: Service;
  onEdit: (servicio: Service, seccion?: SeccionId) => void;
}) {
  const { patch, remove, restore, purge } = useServiceMutations();
  const [borradoAbierto, setBorradoAbierto] = useState(false);
  const [purgaAbierta, setPurgaAbierta] = useState(false);

  const enPapelera = Boolean(servicio.deletedAt);
  const cuantas = servicio.features.length;

  /* En la papelera solo hay dos caminos: traerlo de vuelta o borrarlo de
     verdad. */
  const accionesPapelera: AccionFila[] = [
    {
      id: 'restaurar',
      label: 'Restaurar al sitio',
      icon: Undo2,
      onSelect: () => restore.mutate({ id: servicio.id, name: servicio.name }),
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
      label: servicio.featured ? 'Quitar de destacados' : 'Destacar en el sitio',
      icon: servicio.featured ? StarOff : Star,
      onSelect: () => patch.mutate({ id: servicio.id, featured: !servicio.featured }),
    },
    {
      id: 'incluye',
      label: 'Editar qué incluye',
      icon: ListChecks,
      tail: cuantas > 0 ? `${cuantas} ${cuantas === 1 ? 'ítem' : 'ítems'}` : 'vacío',
      onSelect: () => onEdit(servicio, 'incluye'),
    },
    {
      id: 'editar',
      label: 'Editar ficha completa',
      icon: Pencil,
      onSelect: () => onEdit(servicio),
    },
    {
      id: 'ver',
      label: 'Ver en el sitio',
      icon: ExternalLink,
      href: urlPublicaDeServicio(servicio.slug),
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
        etiqueta={`Acciones para ${servicio.name}`}
        encabezado={
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{servicio.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {[servicio.category?.trim(), formatPrecio(servicio.pricing)]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
        }
      />

      <AlertDialog open={borradoAbierto} onOpenChange={setBorradoAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Mandar “{servicio.name}” a la papelera?</AlertDialogTitle>
            <AlertDialogDescription>
              Deja de salir en la página de servicios del sitio, pero se puede recuperar desde el
              filtro <strong>En papelera</strong>. Si solo quieres bajarle protagonismo, quítalo de
              destacados en vez de eliminarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(
                  { id: servicio.id, name: servicio.name },
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
            <AlertDialogTitle>¿Eliminar “{servicio.name}” para siempre?</AlertDialogTitle>
            <AlertDialogDescription>
              La ficha se borra de la base de datos —descripciones, listas y precio— y no se puede
              recuperar. La imagen que hayas subido queda en la biblioteca de medios. Si solo
              quieres que no salga en el sitio, déjalo en la papelera.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar en la papelera</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={purge.isPending}
              onClick={() =>
                purge.mutate(
                  { id: servicio.id, name: servicio.name },
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
