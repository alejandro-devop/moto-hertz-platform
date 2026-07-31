'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { Thumb } from '@/components/admin/thumb';
import { formatBytes } from '@/lib/media-upload';
import type { Media } from '@/lib/graphql/media';
import { useMediaMutations } from './use-media';

/** El nombre con el que se reconoce un archivo en la biblioteca. */
export function nombreDeMedia(item: Media): string {
  return item.originalName || item.key.split('/').pop() || item.key;
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success('URL copiada');
  } catch {
    toast.error('El navegador no dejó copiar. Selecciona la URL a mano.');
  }
}

/**
 * Lo que se le puede hacer a un archivo. En la biblioteca, copiar la URL es lo
 * que de verdad se hace todos los días, así que va primero; eliminar (a la
 * papelera) va última. En la papelera cambian las tres: restaurar arriba y
 * eliminar definitivamente al final, con una confirmación que dice que el
 * archivo se borra de verdad.
 */
export function MediaActions({ item }: { item: Media }) {
  const { remove, restore, purge } = useMediaMutations();
  const [borrarAbierto, setBorrarAbierto] = useState(false);
  const enPapelera = Boolean(item.deletedAt);

  const acciones: AccionFila[] = enPapelera
    ? [
        {
          id: 'restaurar',
          label: 'Restaurar',
          icon: Undo2,
          onSelect: () => restore.mutate({ id: item.id }),
        },
        {
          id: 'abrir',
          label: 'Abrir la imagen',
          icon: ExternalLink,
          href: item.url,
          onSelect: () => {},
        },
        {
          id: 'purgar',
          label: 'Eliminar definitivamente',
          icon: Trash2,
          danger: true,
          onSelect: () => setBorrarAbierto(true),
        },
      ]
    : [
        {
          id: 'copiar',
          label: 'Copiar URL',
          icon: Copy,
          onSelect: () => copiar(item.url),
        },
        {
          id: 'abrir',
          label: 'Abrir la imagen',
          icon: ExternalLink,
          href: item.url,
          onSelect: () => {},
        },
        {
          id: 'papelera',
          label: 'Mover a la papelera',
          icon: Trash2,
          danger: true,
          onSelect: () => remove.mutate({ id: item.id }),
        },
      ];

  return (
    <>
      <RowActions
        acciones={acciones}
        etiqueta={`Acciones para ${nombreDeMedia(item)}`}
        encabezado={
          <>
            <Thumb src={item.url} alt={nombreDeMedia(item)} className="size-10" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{nombreDeMedia(item)}</span>
              <span className="block font-mono text-[11px] text-muted-foreground">
                {formatBytes(item.sizeBytes)}
              </span>
            </span>
          </>
        }
      />

      <AlertDialog open={borrarAbierto} onOpenChange={setBorrarAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar “{nombreDeMedia(item)}” para siempre?</AlertDialogTitle>
            <AlertDialogDescription>
              El archivo se borra del servidor y su enlace deja de funcionar. Si alguna ficha
              todavía lo usa, ahí quedará una foto rota. Esto no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={purge.isPending}
              onClick={() =>
                purge.mutate({ id: item.id }, { onSuccess: () => setBorrarAbierto(false) })
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
