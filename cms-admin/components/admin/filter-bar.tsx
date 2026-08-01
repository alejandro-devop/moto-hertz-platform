'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/** Un filtro puesto o quitado de un toque, sin abrir nada. */
export function FilterChip({
  active,
  onClick,
  children,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-medium transition-colors md:h-8',
        'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-card text-muted-foreground hover:text-foreground'
      )}
    >
      {Icon ? <Icon className="size-3.5" /> : null}
      {children}
      {active ? <X className="size-3.5 opacity-70" /> : null}
    </button>
  );
}

export const TRIGGER_FILTRO = 'h-9 md:h-8 bg-card text-[13px] font-medium';

export interface OpcionFiltro<T extends string = string> {
  value: T;
  label: string;
}

/** `{ todas: 'Todos los estados', … }` → opciones en el orden en que se declararon. */
export function opcionesDe<T extends string>(etiquetas: Record<T, string>): OpcionFiltro<T>[] {
  return (Object.keys(etiquetas) as T[]).map((value) => ({ value, label: etiquetas[value] }));
}

/**
 * El desplegable de un filtro. En la fila de escritorio va compacto; dentro de
 * la hoja del móvil (`apilado`) ocupa el ancho y crece a 44 px de alto.
 */
export function SelectFiltro<T extends string>({
  value,
  onChange,
  opciones,
  etiqueta,
  apilado,
  align,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  opciones: OpcionFiltro<T>[];
  /** `aria-label` del control: «Filtrar por sede», «Ordenar la lista». */
  etiqueta: string;
  apilado?: boolean;
  align?: 'start' | 'center' | 'end';
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger
        className={cn(TRIGGER_FILTRO, apilado && 'h-11 w-full justify-between text-sm', className)}
        aria-label={etiqueta}
      >
        <SelectValue>
          {(actual: T) => opciones.find((opcion) => opcion.value === actual)?.label ?? String(actual)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align={align}>
        {opciones.map((opcion) => (
          <SelectItem key={opcion.value} value={opcion.value}>
            {opcion.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * El buscador de texto de la lista, visible en la fila de filtros — no solo en
 * la lupa de la navbar. Se agregó porque el buscador de la navbar cambia de
 * sección según dónde esté parado quien administra, y sin uno a la vista en
 * la propia lista se lee como un buscador global en vez del buscador de este
 * catálogo puntual.
 */
function BuscadorLista({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const [texto, setTexto] = useState(value);
  /* Último valor que llegó del padre (la URL), para no pelear con la sincronización. */
  const aplicado = useRef(value);

  useEffect(() => {
    if (value !== aplicado.current) {
      aplicado.current = value;
      setTexto(value);
    }
  }, [value]);

  useEffect(() => {
    if (texto === aplicado.current) return;
    const timer = setTimeout(() => {
      aplicado.current = texto;
      onChange(texto);
    }, 250);
    return () => clearTimeout(timer);
  }, [texto, onChange]);

  return (
    <div
      className={cn(
        'flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-2.5 md:h-8',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        className
      )}
    >
      <Search className="size-3.5 shrink-0 text-muted-foreground" />
      <input
        type="search"
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {texto ? (
        <button
          type="button"
          onClick={() => setTexto('')}
          aria-label="Borrar la búsqueda"
          className="grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

interface BarraProps {
  /** Los desplegables del módulo. `apilado` es `true` dentro de la hoja del móvil. */
  controles: (apilado: boolean) => React.ReactNode;
  /** Filtros de un toque, visibles en las dos pantallas. */
  chips?: React.ReactNode;
  /** El selector de orden; recibe la clase que necesita en cada pantalla. */
  orden?: (className?: string) => React.ReactNode;
  /** Cuántos filtros están puestos, para la insignia del botón «Filtros». */
  activos: number;
  onLimpiar: () => void;
  /**
   * El buscador de texto de la lista. Opcional porque no todo módulo lo tiene
   * hoy, pero las seis listas actuales lo pasan.
   */
  busqueda?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };
}

/**
 * Los mismos filtros en las dos pantallas: en escritorio, una fila sobre la
 * tabla con todo a la vista; en móvil, los chips y el orden a la mano y el
 * resto en una hoja inferior, porque en 390 px no caben cuatro desplegables.
 */
export function BarraFiltros({ controles, chips, orden, activos, onLimpiar, busqueda }: BarraProps) {
  const [hojaAbierta, setHojaAbierta] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* El buscador va primero y a la vista en las dos pantallas: es lo que
          más se usa y no puede depender de la lupa de la navbar para saber
          que existe. */}
      {busqueda ? (
        <BuscadorLista
          value={busqueda.value}
          onChange={busqueda.onChange}
          placeholder={busqueda.placeholder}
          className="w-full md:max-w-xs"
        />
      ) : null}

      {/* Escritorio: todo a la vista, en una fila sobre la tabla. */}
      <div className="hidden flex-wrap items-center gap-2 md:flex">
        {controles(false)}
        {chips}
        {activos > 0 ? (
          <Button variant="ghost" onClick={onLimpiar} className="h-8 text-[13px]">
            Limpiar filtros
          </Button>
        ) : null}
        <span className="flex-1" />
        {orden?.()}
      </div>

      {/* Móvil: chips a la mano y el resto en una hoja. */}
      <div className="scroll-x flex items-center gap-2 pb-0.5 md:hidden">
        <Button
          variant="outline"
          onClick={() => setHojaAbierta(true)}
          className="h-9 shrink-0 text-[13px]"
        >
          <SlidersHorizontal className="size-3.5" />
          Filtros
          {activos > 0 ? (
            <span className="ml-0.5 grid size-4 place-items-center rounded-full bg-primary font-mono text-[10px] text-primary-foreground">
              {activos}
            </span>
          ) : null}
        </Button>
        {chips ? <span className="flex shrink-0 items-center gap-2">{chips}</span> : null}
        {orden?.('h-9 shrink-0')}
      </div>

      <Sheet open={hojaAbierta} onOpenChange={setHojaAbierta}>
        <SheetContent
          side="bottom"
          className="gap-0 rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="pb-1">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4 pt-2">{controles(true)}</div>
          <div className="mt-4 flex gap-2 px-4">
            <Button
              variant="outline"
              onClick={onLimpiar}
              disabled={activos === 0}
              className="h-11 flex-1"
            >
              Limpiar
            </Button>
            <Button onClick={() => setHojaAbierta(false)} className="h-11 flex-1">
              Ver resultados
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
