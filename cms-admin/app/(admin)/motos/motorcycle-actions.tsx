'use client';

import { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  MoreVertical,
  Pencil,
  Tag,
  Trash2,
  Undo2,
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Thumb } from '@/components/admin/thumb';
import { formatCop, groupDigits, onlyDigits } from '@/lib/format';
import { urlPublicaDeMoto } from '@/lib/site';
import { cn } from '@/lib/utils';
import type { Motorcycle } from '@/lib/graphql/motorcycles';
import type { SeccionId } from './form-sections';
import { useMotorcycleMutations } from './use-motorcycles';

interface Accion {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  /** Dato al margen: cuántas fotos tiene, a dónde lleva el enlace. */
  tail?: string;
  danger?: boolean;
  href?: string;
}

/**
 * Todo lo que se le puede hacer a una moto. En escritorio es el menú de la
 * fila; en móvil, una hoja inferior con objetivos de 46 px. Las dos cosas que
 * de verdad pasan en el patio —cambiar precio y marcar vendida— van primero, y
 * eliminar va última, separada y en rojo.
 */
export function MotorcycleActions({
  motorcycle,
  onEdit,
}: {
  motorcycle: Motorcycle;
  onEdit: (motorcycle: Motorcycle, seccion?: SeccionId) => void;
}) {
  const { patch, remove } = useMotorcycleMutations();
  const [hoja, setHoja] = useState(false);
  const [precioAbierto, setPrecioAbierto] = useState(false);
  const [borradoAbierto, setBorradoAbierto] = useState(false);

  const fotos = (motorcycle.images?.gallery?.length ?? 0) + (motorcycle.images?.main ? 1 : 0);

  const acciones: Accion[] = [
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
      label: 'Eliminar',
      icon: Trash2,
      danger: true,
      onSelect: () => setBorradoAbierto(true),
    },
  ];

  function ejecutar(accion: Accion) {
    setHoja(false);
    if (accion.href) {
      window.open(accion.href, '_blank', 'noreferrer');
      return;
    }
    accion.onSelect();
  }

  return (
    <>
      {/* Escritorio: menú anclado a la fila. */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Acciones para ${motorcycle.name}`}
              className="hidden md:inline-flex"
            />
          }
        >
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {acciones.map((accion) => {
            const Icon = accion.icon;
            const item = (
              <DropdownMenuItem
                key={accion.id}
                variant={accion.danger ? 'destructive' : 'default'}
                onClick={() => ejecutar(accion)}
                className="min-h-8 gap-2"
              >
                <Icon className="text-muted-foreground" />
                <span className="flex-1">{accion.label}</span>
                {accion.tail ? (
                  <span className="font-mono text-[10px] text-muted-foreground">{accion.tail}</span>
                ) : null}
              </DropdownMenuItem>
            );
            return accion.danger ? (
              <div key={accion.id}>
                <DropdownMenuSeparator />
                {item}
              </div>
            ) : (
              item
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Móvil: la misma lista en una hoja, con objetivos grandes. */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Acciones para ${motorcycle.name}`}
        aria-haspopup="dialog"
        onClick={() => setHoja(true)}
        className="size-9 md:hidden"
      >
        <MoreVertical />
      </Button>

      <Sheet open={hoja} onOpenChange={setHoja}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="gap-0 rounded-t-2xl px-0 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <span className="mx-auto mb-2 h-1 w-9 rounded-full bg-border" aria-hidden />
          <div className="flex items-center gap-3 border-b border-border-soft px-4 pb-3">
            <Thumb src={motorcycle.images?.main} alt={motorcycle.name} className="size-10" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{motorcycle.name}</span>
              <span className="block font-mono text-[11px] text-muted-foreground">
                {formatCop(motorcycle.price) ?? 'Sin precio'}
              </span>
            </span>
          </div>
          <div className="flex flex-col pt-1">
            {acciones.map((accion) => {
              const Icon = accion.icon;
              return (
                <div key={accion.id} className={cn(accion.danger && 'mt-1 border-t border-border-soft pt-1')}>
                  <button
                    type="button"
                    onClick={() => ejecutar(accion)}
                    className={cn(
                      'flex min-h-12 w-full items-center gap-3 px-4 text-left text-[15px] font-medium',
                      'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                      accion.danger ? 'text-destructive' : 'text-foreground'
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-4 shrink-0',
                        accion.danger ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <span className="flex-1">{accion.label}</span>
                    {accion.tail ? (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {accion.tail}
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

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
            <AlertDialogTitle>¿Eliminar “{motorcycle.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              La ficha y sus fotos se borran del catálogo y no se pueden recuperar. Si la moto se
              vendió, mejor usa <strong>Marcar como vendida</strong>: sale del sitio y el registro
              queda.
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
              {remove.isPending ? 'Eliminando…' : 'Eliminar la moto'}
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
