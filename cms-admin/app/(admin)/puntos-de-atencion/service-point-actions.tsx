'use client';

import { useState } from 'react';
import {
  Clock,
  ExternalLink,
  Map,
  MessageCircle,
  Pencil,
  Trash2,
  Undo2,
} from 'lucide-react';
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
import { diasAbiertos } from '@/lib/service-point-hours';
import { urlPublicaDePunto, urlWhatsApp } from '@/lib/site';
import type { ServicePoint } from '@/lib/graphql/service-points';
import { direccionCompleta, ETIQUETA_DE_TIPO } from './filters';
import type { SeccionId } from './form-sections';
import { useServicePointMutations } from './use-service-points';

/**
 * Qué se le puede hacer a un punto de atención. Primero lo que se hace todos
 * los días —escribirle por WhatsApp, corregir el horario—, después editar y ver
 * en el sitio, y eliminar de última, separada y en rojo.
 */
export function ServicePointActions({
  punto,
  onEdit,
}: {
  punto: ServicePoint;
  onEdit: (punto: ServicePoint, seccion?: SeccionId) => void;
}) {
  const { remove, restore, purge } = useServicePointMutations();
  const [borradoAbierto, setBorradoAbierto] = useState(false);
  const [purgaAbierta, setPurgaAbierta] = useState(false);

  const enPapelera = Boolean(punto.deletedAt);
  const whatsapp = urlWhatsApp(punto.whatsapp);
  const abiertos = diasAbiertos(punto.hours).length;

  /* En la papelera solo hay dos caminos: traerlo de vuelta o borrarlo de
     verdad. */
  const accionesPapelera: AccionFila[] = [
    {
      id: 'restaurar',
      label: 'Restaurar al sitio',
      icon: Undo2,
      onSelect: () => restore.mutate({ id: punto.id, name: punto.name }),
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
      id: 'horarios',
      label: 'Editar horarios',
      icon: Clock,
      tail: abiertos > 0 ? `${abiertos} días` : 'sin horario',
      onSelect: () => onEdit(punto, 'horarios'),
    },
    ...(whatsapp
      ? [
          {
            id: 'whatsapp',
            label: 'Escribir por WhatsApp',
            icon: MessageCircle,
            href: whatsapp,
            onSelect: () => {},
          } satisfies AccionFila,
        ]
      : []),
    ...(punto.location?.mapsUrl
      ? [
          {
            id: 'mapa',
            label: 'Abrir en Google Maps',
            icon: Map,
            href: punto.location.mapsUrl,
            onSelect: () => {},
          } satisfies AccionFila,
        ]
      : []),
    {
      id: 'editar',
      label: 'Editar ficha completa',
      icon: Pencil,
      onSelect: () => onEdit(punto),
    },
    {
      id: 'ver',
      label: 'Ver en el sitio',
      icon: ExternalLink,
      href: urlPublicaDePunto(punto.slug),
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
        etiqueta={`Acciones para ${punto.name}`}
        encabezado={
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{punto.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {ETIQUETA_DE_TIPO[punto.type]}
              {direccionCompleta(punto) ? ` · ${direccionCompleta(punto)}` : ''}
            </span>
          </span>
        }
      />

      <AlertDialog open={borradoAbierto} onOpenChange={setBorradoAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Mandar “{punto.name}” a la papelera?</AlertDialogTitle>
            <AlertDialogDescription>
              Deja de salir en la página de puntos de atención del sitio, pero se puede recuperar
              desde el filtro <strong>En papelera</strong>. Nada más se borra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(
                  { id: punto.id, name: punto.name },
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
            <AlertDialogTitle>¿Eliminar “{punto.name}” para siempre?</AlertDialogTitle>
            <AlertDialogDescription>
              La ficha se borra de la base de datos —dirección, teléfonos y horarios— y no se puede
              recuperar. Si solo quieres que no salga en el sitio, déjalo en la papelera.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar en la papelera</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={purge.isPending}
              onClick={() =>
                purge.mutate(
                  { id: punto.id, name: punto.name },
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
