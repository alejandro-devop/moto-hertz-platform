'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ImagePlus,
  Images,
  Link2,
  Loader2,
  Star,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/admin/form-fields';
import { StatusPill } from '@/components/admin/status-pill';
import { Thumb } from '@/components/admin/thumb';
import { textoBuscable } from '@/lib/format';
import { ACEPTA_IMAGENES, esImagen, subirImagen } from '@/lib/media-upload';
import { tourAnchor } from '@/lib/tours/anchor';
import { useTour } from '@/lib/tours/tour-provider';
import { useMediaQuery } from '@/lib/use-media-library';
import { cn } from '@/lib/utils';

/**
 * Subida de imágenes del panel, en dos variantes sobre el mismo motor:
 * `ImagePicker` (una sola) y `GaleriaImagenes` (varias, con portada y orden).
 *
 * Cuatro decisiones que se ven en el código:
 *
 * - **Las fotos se suben de a una, en el orden en que se eligieron.** Una moto
 *   trae 16–18 y llegan numeradas; subirlas en paralelo las desordena y pone a
 *   `sharp` a procesar varias a la vez en un droplet chico.
 * - **Se puede seguir pegando URLs externas.** El catálogo legacy tiene
 *   imágenes alojadas fuera y romperlas no es una opción.
 * - **Quitar una foto de aquí solo la desvincula.** El archivo sigue en la
 *   biblioteca (`/medios`); se borra desde allá.
 * - **También se puede reusar una imagen ya subida**, con `SelectorBiblioteca`
 *   (mismo `mediaList` que consume la página `/medios`). Evita volver a subir
 *   la misma foto para varias fichas.
 */

interface EstadoSubida {
  id: number;
  nombre: string;
  progreso: number;
  error?: string;
}

let contador = 0;

/** El motor compartido: cola de archivos, progreso y errores por archivo. */
function useSubidas(onSubida: (url: string) => void) {
  const [subidas, setSubidas] = useState<EstadoSubida[]>([]);
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  function actualizar(id: number, patch: Partial<EstadoSubida>) {
    if (!vivo.current) return;
    setSubidas((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  async function agregar(files: File[]) {
    /* Lo que no es imagen se rechaza aquí, sin ir al servidor. */
    const [imagenes, otros] = files.reduce<[File[], File[]]>(
      (acc, file) => {
        acc[esImagen(file) ? 0 : 1].push(file);
        return acc;
      },
      [[], []]
    );

    const rechazados: EstadoSubida[] = otros.map((file) => ({
      id: (contador += 1),
      nombre: file.name,
      progreso: 0,
      error: 'No es una imagen. Sube un JPG, PNG, WebP o HEIC.',
    }));
    if (rechazados.length > 0) setSubidas((prev) => [...prev, ...rechazados]);

    for (const file of imagenes) {
      const id = (contador += 1);
      setSubidas((prev) => [...prev, { id, nombre: file.name, progreso: 0 }]);
      try {
        const { promesa } = subirImagen(file, (progreso) => actualizar(id, { progreso }));
        const media = await promesa;
        if (!vivo.current) return;
        onSubida(media.url);
        setSubidas((prev) => prev.filter((s) => s.id !== id));
      } catch (error) {
        actualizar(id, {
          error: error instanceof Error ? error.message : 'No se pudo subir la imagen.',
        });
      }
    }
  }

  const enCurso = subidas.filter((s) => !s.error).length;

  return {
    subidas,
    enCurso,
    agregar,
    descartar: (id: number) => setSubidas((prev) => prev.filter((s) => s.id !== id)),
  };
}

/* ------------------------------------------------------- zona de subida --- */

function ZonaSubida({
  multiple,
  onFiles,
  ocupada,
  compacta,
}: {
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  ocupada: boolean;
  compacta?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(event) => {
        event.preventDefault();
        setEncima(false);
        const files = Array.from(event.dataTransfer.files ?? []);
        if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 text-center transition-colors',
        compacta ? 'py-4' : 'py-6',
        encima ? 'border-primary bg-primary/5' : 'border-border bg-card'
      )}
    >
      <input
        ref={input}
        type="file"
        /* `image/*` es lo que hace que el teléfono ofrezca cámara o galería. */
        accept={ACEPTA_IMAGENES}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFiles(files);
          /* Se limpia para poder volver a elegir el mismo archivo. */
          event.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={ocupada}
        onClick={() => input.current?.click()}
        className="h-11 md:h-9"
      >
        {ocupada ? <Loader2 className="animate-spin" /> : <ImagePlus />}
        {ocupada ? 'Subiendo…' : multiple ? 'Subir fotos' : 'Subir imagen'}
      </Button>
      <p className="text-xs text-muted-foreground">
        <span className="hidden md:inline">Arrastra {multiple ? 'las imágenes' : 'la imagen'} aquí o pulsa el botón. </span>
        <span className="md:hidden">Puedes tomar la foto con la cámara. </span>
        Se guardan en WebP y reducidas.
      </p>
    </div>
  );
}

function ListaSubidas({
  subidas,
  onDescartar,
}: {
  subidas: EstadoSubida[];
  onDescartar: (id: number) => void;
}) {
  if (subidas.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1.5">
      {subidas.map((subida) => (
        <li
          key={subida.id}
          className={cn(
            'flex items-center gap-3 rounded-lg border px-3 py-2 text-xs',
            subida.error
              ? 'border-destructive/30 bg-destructive-surface'
              : 'border-border bg-card'
          )}
        >
          {subida.error ? (
            <TriangleAlert className="size-4 shrink-0 text-destructive" />
          ) : (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{subida.nombre}</span>
            {subida.error ? (
              <span className="block text-destructive">{subida.error}</span>
            ) : (
              <span className="mt-1 block h-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${subida.progreso}%` }}
                />
              </span>
            )}
          </span>
          {subida.error ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Descartar el aviso de ${subida.nombre}`}
              onClick={() => onDescartar(subida.id)}
            >
              <X />
            </Button>
          ) : (
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {subida.progreso}%
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** El campo de siempre: pegar URLs de imágenes que ya viven en otro lado. */
function PegarUrls({
  onAgregar,
  multiple,
  yaPuestas,
}: {
  onAgregar: (urls: string[]) => void;
  multiple?: boolean;
  yaPuestas: string[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');

  const nuevas = texto
    .split(/[\s,]+/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0 && !yaPuestas.includes(url));

  if (!abierto) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => setAbierto(true)}
        className="h-9 self-start text-[13px] text-muted-foreground"
      >
        <Link2 />
        Pegar {multiple ? 'URLs' : 'una URL'} en vez de subir
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <Field
        label={multiple ? 'Pegar URLs' : 'Pegar una URL'}
        htmlFor="fotos-pegar"
        hint={
          multiple
            ? 'Varias de una vez, separadas por espacios, comas o saltos de línea. Sirve para las fotos que ya están alojadas en otro sitio.'
            : 'Para una imagen que ya está alojada en otro sitio.'
        }
      >
        <Textarea
          id="fotos-pegar"
          rows={multiple ? 3 : 2}
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder={'https://…/moto-1.jpg\nhttps://…/moto-2.jpg'}
          className="font-mono text-xs"
        />
      </Field>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={nuevas.length === 0}
          onClick={() => {
            onAgregar(multiple ? nuevas : nuevas.slice(0, 1));
            setTexto('');
            setAbierto(false);
          }}
          className="h-10"
        >
          {nuevas.length === 0
            ? 'Agregar'
            : `Agregar ${nuevas.length} ${nuevas.length === 1 ? 'imagen' : 'imágenes'}`}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setTexto('');
            setAbierto(false);
          }}
          className="h-10"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------------------------- biblioteca (medios) --- */

/**
 * Elegir entre las imágenes ya subidas a `/medios`, en vez de volver a
 * subirlas o pegar su URL de memoria. En modo simple, tocar una imagen la
 * elige y cierra; en modo múltiple, toca varias y confirma con el botón.
 */
function SelectorBiblioteca({
  open,
  onOpenChange,
  multiple,
  excluir = [],
  onElegir,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  multiple?: boolean;
  excluir?: string[];
  onElegir: (urls: string[]) => void;
}) {
  const { data, isLoading, isError } = useMediaQuery(false);
  const [busqueda, setBusqueda] = useState('');
  const [elegidas, setElegidas] = useState<Set<string>>(new Set());

  /* Se pide al abrir este diálogo, no al abrir la ficha que lo contiene: así
     nunca compite por la cola con el recorrido de esa ficha (ver `registry.ts`,
     `panel.imagenes`). */
  useTour('panel.imagenes', open);

  useEffect(() => {
    if (!open) return;
    setBusqueda('');
    setElegidas(new Set());
  }, [open]);

  const disponibles = (data ?? []).filter((item) => !excluir.includes(item.url));
  const textoBuscado = textoBuscable(busqueda.trim());
  const filtradas = textoBuscado
    ? disponibles.filter((item) => textoBuscable(item.originalName, item.key).includes(textoBuscado))
    : disponibles;

  function elegir(url: string) {
    if (!multiple) {
      onElegir([url]);
      onOpenChange(false);
      return;
    }
    setElegidas((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Elegir de la biblioteca</DialogTitle>
          <DialogDescription>
            {multiple
              ? 'Imágenes ya subidas a Medios. Toca las que quieras agregar.'
              : 'Imágenes ya subidas a Medios.'}
          </DialogDescription>
        </DialogHeader>

        <div {...tourAnchor('imagenes.buscar')}>
          <Input
            type="search"
            placeholder="Buscar por nombre…"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            className="h-10"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No se pudo cargar la biblioteca.
          </p>
        ) : filtradas.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {disponibles.length === 0
              ? 'Todavía no hay imágenes en la biblioteca. Sube alguna primero.'
              : 'Ninguna imagen coincide con la búsqueda.'}
          </p>
        ) : (
          <div
            {...tourAnchor('imagenes.grid')}
            className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-5"
          >
            {filtradas.map((item) => {
              const activa = elegidas.has(item.url);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => elegir(item.url)}
                  title={item.originalName ?? item.key}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-lg border-2 transition-colors',
                    activa ? 'border-primary' : 'border-transparent hover:border-border'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.originalName ?? ''}
                    className="size-full object-cover"
                  />
                  {activa ? (
                    <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        {multiple ? (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={elegidas.size === 0}
              onClick={() => {
                onElegir(Array.from(elegidas));
                onOpenChange(false);
              }}
            >
              {elegidas.size === 0 ? 'Agregar' : `Agregar ${elegidas.size}`}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** El botón que abre `SelectorBiblioteca`, con el mismo estilo que el resto de disparadores. */
function AbrirBiblioteca({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="h-9 self-start text-[13px] text-muted-foreground"
    >
      <Images />
      Elegir de la biblioteca
    </Button>
  );
}

/* ------------------------------------------------------------- galería --- */

export function GaleriaImagenes({
  fotos,
  onChange,
  error,
}: {
  fotos: string[];
  onChange: (fotos: string[]) => void;
  error?: string;
}) {
  /* `fotos` se lee con un ref para que la cola de subidas no trabaje sobre una
     lista vieja: entre foto y foto ya se agregaron las anteriores. */
  const actuales = useRef(fotos);
  actuales.current = fotos;

  const { subidas, enCurso, agregar, descartar } = useSubidas((url) =>
    onChange([...actuales.current, url])
  );
  const [bibliotecaAbierta, setBibliotecaAbierta] = useState(false);

  function mover(index: number, delta: number) {
    const destino = index + delta;
    if (destino < 0 || destino >= fotos.length) return;
    const next = [...fotos];
    [next[index], next[destino]] = [next[destino], next[index]];
    onChange(next);
  }

  function hacerPortada(index: number) {
    const next = [...fotos];
    const [foto] = next.splice(index, 1);
    onChange([foto, ...next]);
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}

      {fotos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
          Todavía no hay fotos. La primera de la lista queda como portada.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {fotos.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-2"
            >
              <Thumb src={url} alt={`Foto ${index + 1}`} className="size-12" />
              <span className="min-w-0 flex-1">
                {index === 0 ? (
                  <StatusPill tone="ok" dot={false} className="mb-1">
                    Portada
                  </StatusPill>
                ) : null}
                <span className="block truncate font-mono text-[11px] text-muted-foreground">
                  {url}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-0.5">
                {index !== 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Hacer portada la foto ${index + 1}`}
                    onClick={() => hacerPortada(index)}
                  >
                    <Star />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Subir la foto ${index + 1}`}
                  disabled={index === 0}
                  onClick={() => mover(index, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Bajar la foto ${index + 1}`}
                  disabled={index === fotos.length - 1}
                  onClick={() => mover(index, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Quitar la foto ${index + 1}`}
                  title="Quitar de esta ficha. El archivo sigue en la biblioteca."
                  onClick={() => onChange(fotos.filter((_, i) => i !== index))}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <ListaSubidas subidas={subidas} onDescartar={descartar} />

      <ZonaSubida multiple onFiles={agregar} ocupada={enCurso > 0} />

      <AbrirBiblioteca onClick={() => setBibliotecaAbierta(true)} />

      <PegarUrls
        multiple
        yaPuestas={fotos}
        onAgregar={(urls) => onChange([...fotos, ...urls])}
      />

      <SelectorBiblioteca
        open={bibliotecaAbierta}
        onOpenChange={setBibliotecaAbierta}
        multiple
        excluir={fotos}
        onElegir={(urls) => onChange([...fotos, ...urls])}
      />

      <p className="text-xs text-muted-foreground">
        Quitar una foto de aquí solo la desvincula de esta ficha: el archivo
        sigue disponible en <strong>Medios</strong>.
      </p>
    </div>
  );
}

/* ---------------------------------------------- subida suelta (medios) --- */

/**
 * Subir sin asociar a ninguna ficha: es lo que usa la biblioteca `/medios`.
 * Avisa por cada archivo que entra para que la lista se refresque sola.
 */
export function SubidorMedios({ onSubida }: { onSubida: (url: string) => void }) {
  const { subidas, enCurso, agregar, descartar } = useSubidas(onSubida);

  return (
    <div className="flex flex-col gap-3">
      <ListaSubidas subidas={subidas} onDescartar={descartar} />
      <ZonaSubida multiple onFiles={agregar} ocupada={enCurso > 0} />
    </div>
  );
}

/* --------------------------------------------------------- una imagen --- */

export function ImagePicker({
  value,
  onChange,
  alt = 'Imagen',
}: {
  value: string;
  onChange: (url: string) => void;
  alt?: string;
}) {
  const { subidas, enCurso, agregar, descartar } = useSubidas((url) => onChange(url));
  const [bibliotecaAbierta, setBibliotecaAbierta] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
          <Thumb src={value} alt={alt} className="size-16" />
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
            {value}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Quitar la imagen"
            onClick={() => onChange('')}
          >
            <Trash2 className="text-destructive" />
          </Button>
        </div>
      ) : null}

      <ListaSubidas subidas={subidas} onDescartar={descartar} />

      <ZonaSubida compacta onFiles={agregar} ocupada={enCurso > 0} />

      <AbrirBiblioteca onClick={() => setBibliotecaAbierta(true)} />

      <PegarUrls yaPuestas={value ? [value] : []} onAgregar={(urls) => onChange(urls[0] ?? '')} />

      <SelectorBiblioteca
        open={bibliotecaAbierta}
        onOpenChange={setBibliotecaAbierta}
        excluir={value ? [value] : []}
        onElegir={(urls) => onChange(urls[0] ?? '')}
      />
    </div>
  );
}
