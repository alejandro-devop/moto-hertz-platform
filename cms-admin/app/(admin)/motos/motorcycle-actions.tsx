'use client';

import { useState } from 'react';
import { Camera, CheckCircle2, ExternalLink, Pencil, Tag, Trash2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RowActions, type AccionFila } from '@/components/admin/row-actions';
import { Thumb } from '@/components/admin/thumb';
import { formatCop, groupDigits, onlyDigits } from '@/lib/format';
import { urlPublicaDeMoto } from '@/lib/site';
import type { Motorcycle } from '@/lib/graphql/motorcycles';
import type { SeccionId } from './form-sections';
import { useMotorcycleMutations } from './use-motorcycles';

/**
 * Todo lo que se le puede hacer a una moto. El menú y la hoja los dibuja
 * `RowActions`; aquí solo se decide qué acciones hay y en qué orden: las dos
 * cosas que de verdad pasan en el patio —cambiar precio y marcar vendida— van
 * primero, y eliminar va última, separada y en rojo.
 */
export function MotorcycleActions({
  motorcycle,
  onEdit,
}: {
  motorcycle: Motorcycle;
  onEdit: (motorcycle: Motorcycle, seccion?: SeccionId) => void;
}) {
  const { patch, remove, restore, purge } = useMotorcycleMutations();
  const [precioAbierto, setPrecioAbierto] = useState(false);
  const [borradoAbierto, setBorradoAbierto] = useState(false);
  const [purgaAbierta, setPurgaAbierta] = useState(false);

  const fotos = (motorcycle.images?.gallery?.length ?? 0) + (motorcycle.images?.main ? 1 : 0);
  const enPapelera = Boolean(motorcycle.deletedAt);

  /* En la papelera solo hay dos caminos: traerla de vuelta o borrarla de
     verdad. Editar precio o publicar una moto borrada no significa nada. */
  const accionesPapelera: AccionFila[] = [
    {
      id: 'restaurar',
      label: 'Restaurar al catálogo',
      icon: Undo2,
      onSelect: () => restore.mutate({ id: motorcycle.id, name: motorcycle.name }),
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
      id: 'precio',
      label: 'Cambiar precio',
      icon: Tag,
      tail: formatCop(motorcycle.price) ?? 'sin precio',
      onSelect: () => setPrecioAbierto(true),
    },
    motorcycle.available
      ? {
          id: 'vendida',
          label: 'Marcar como vendida',
          icon: CheckCircle2,
          onSelect: () =>
            patch.mutate({
              id: motorcycle.id,
              available: false,
              mensaje: 'Marcada como vendida y retirada del sitio',
            }),
        }
      : {
          id: 'publicar',
          label: 'Volver a publicar',
          icon: Undo2,
          onSelect: () =>
            patch.mutate({
              id: motorcycle.id,
              available: true,
              mensaje: 'Publicada de nuevo en el sitio',
            }),
        },
    {
      id: 'fotos',
      label: 'Agregar fotos',
      icon: Camera,
      tail: fotos > 0 ? `${fotos}` : 'ninguna',
      onSelect: () => onEdit(motorcycle, 'fotos'),
    },
    {
      id: 'editar',
      label: 'Editar ficha completa',
      icon: Pencil,
      onSelect: () => onEdit(motorcycle),
    },
    {
      id: 'ver',
      label: 'Ver en el sitio',
      icon: ExternalLink,
      href: urlPublicaDeMoto(motorcycle.slug),
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
        etiqueta={`Acciones para ${motorcycle.name}`}
        encabezado={
          <>
            <Thumb src={motorcycle.images?.main} alt={motorcycle.name} className="size-10" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{motorcycle.name}</span>
              <span className="block font-mono text-[11px] text-muted-foreground">
                {formatCop(motorcycle.price) ?? 'Sin precio'}
              </span>
            </span>
          </>
        }
      />

      <PrecioDialog
        motorcycle={motorcycle}
        open={precioAbierto}
        onOpenChange={setPrecioAbierto}
        onSave={(price) =>
          patch.mutate(
            { id: motorcycle.id, price, mensaje: 'Precio actualizado' },
            { onSuccess: () => setPrecioAbierto(false) }
          )
        }
        saving={patch.isPending}
      />

      <AlertDialog open={borradoAbierto} onOpenChange={setBorradoAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Mandar “{motorcycle.name}” a la papelera?</AlertDialogTitle>
            <AlertDialogDescription>
              Sale del sitio y del catálogo, pero se puede recuperar desde el filtro{' '}
              <strong>En papelera</strong>. Sus fotos no se tocan: siguen en{' '}
              <strong>Medios</strong>. Si la moto se vendió, mejor usa{' '}
              <strong>Marcar como vendida</strong>: sale del sitio y el registro queda a la vista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(
                  { id: motorcycle.id, name: motorcycle.name },
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
            <AlertDialogTitle>¿Eliminar “{motorcycle.name}” para siempre?</AlertDialogTitle>
            <AlertDialogDescription>
              La ficha se borra de la base de datos y no se puede recuperar. Sus fotos quedan en{' '}
              <strong>Medios</strong>: si tampoco las quieres, elimínalas desde allá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar en la papelera</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={purge.isPending}
              onClick={() =>
                purge.mutate(
                  { id: motorcycle.id, name: motorcycle.name },
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

/** Cambiar precio es la edición más frecuente: un campo y guardar. */
function PrecioDialog({
  motorcycle,
  open,
  onOpenChange,
  onSave,
  saving,
}: {
  motorcycle: Motorcycle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (price: string) => void;
  saving: boolean;
}) {
  const [valor, setValor] = useState(() => groupDigits(motorcycle.price ?? ''));

  /* Al reabrir, el campo vuelve a mostrar el precio guardado. */
  function handleOpenChange(next: boolean) {
    if (next) setValor(groupDigits(motorcycle.price ?? ''));
    onOpenChange(next);
  }

  const digitos = onlyDigits(valor);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar precio</DialogTitle>
          <DialogDescription>{motorcycle.name}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(digitos);
          }}
        >
          <Label htmlFor="precio-rapido">Precio en pesos</Label>
          <Input
            id="precio-rapido"
            inputMode="numeric"
            autoComplete="off"
            value={valor}
            onChange={(event) => setValor(groupDigits(event.target.value))}
            placeholder="8.900.000"
            className="h-11 font-mono text-base md:h-9"
          />
          <p className="text-xs text-muted-foreground">
            {digitos ? formatCop(digitos) : 'Sin precio: la moto queda incompleta.'}
          </p>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar precio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
