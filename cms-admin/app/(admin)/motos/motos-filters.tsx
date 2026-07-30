'use client';

import { useState } from 'react';
import { SlidersHorizontal, TriangleAlert, X } from 'lucide-react';
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
import {
  contarFiltrosActivos,
  ETIQUETAS_CONDICION,
  ETIQUETAS_ESTADO,
  ETIQUETAS_ORDEN,
  FILTROS_POR_DEFECTO,
  TODAS,
  type Condicion,
  type Estado,
  type Filtros,
  type Orden,
} from './filters';

interface Props {
  filtros: Filtros;
  onChange: (patch: Partial<Filtros>) => void;
  marcas: string[];
  sedes: string[];
}

/** Un filtro puesto o quitado de un toque, sin abrir nada. */
function FilterChip({
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

const TRIGGER = 'h-9 md:h-8 bg-card text-[13px] font-medium';

/** Los mismos controles en la fila de escritorio y en la hoja de móvil. */
function Controles({ filtros, onChange, marcas, sedes, stacked }: Props & { stacked?: boolean }) {
  const clase = cn(TRIGGER, stacked && 'h-11 w-full justify-between text-sm');

  return (
    <>
      <Select
        value={filtros.estado}
        onValueChange={(value) => onChange({ estado: value as Estado })}
      >
        <SelectTrigger className={clase} aria-label="Filtrar por estado de publicación">
          <SelectValue>{(value: Estado) => ETIQUETAS_ESTADO[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ETIQUETAS_ESTADO) as Estado[]).map((value) => (
            <SelectItem key={value} value={value}>
              {ETIQUETAS_ESTADO[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filtros.condicion}
        onValueChange={(value) => onChange({ condicion: value as Condicion })}
      >
        <SelectTrigger className={clase} aria-label="Filtrar por condición">
          <SelectValue>{(value: Condicion) => ETIQUETAS_CONDICION[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ETIQUETAS_CONDICION) as Condicion[]).map((value) => (
            <SelectItem key={value} value={value}>
              {ETIQUETAS_CONDICION[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filtros.marca} onValueChange={(value) => onChange({ marca: String(value) })}>
        <SelectTrigger className={clase} aria-label="Filtrar por marca">
          <SelectValue>
            {(value: string) => (value === TODAS ? 'Todas las marcas' : value)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODAS}>Todas las marcas</SelectItem>
          {marcas.map((marca) => (
            <SelectItem key={marca} value={marca}>
              {marca}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {sedes.length > 0 ? (
        <Select value={filtros.sede} onValueChange={(value) => onChange({ sede: String(value) })}>
          <SelectTrigger className={clase} aria-label="Filtrar por sede">
            <SelectValue>
              {(value: string) => (value === TODAS ? 'Todas las sedes' : value)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas las sedes</SelectItem>
            {sedes.map((sede) => (
              <SelectItem key={sede} value={sede}>
                {sede}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </>
  );
}

function SelectOrden({
  filtros,
  onChange,
  className,
}: {
  filtros: Filtros;
  onChange: (patch: Partial<Filtros>) => void;
  className?: string;
}) {
  return (
    <Select value={filtros.orden} onValueChange={(value) => onChange({ orden: value as Orden })}>
      <SelectTrigger className={cn(TRIGGER, className)} aria-label="Ordenar la lista">
        <SelectValue>{(value: Orden) => ETIQUETAS_ORDEN[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {(Object.keys(ETIQUETAS_ORDEN) as Orden[]).map((value) => (
          <SelectItem key={value} value={value}>
            {ETIQUETAS_ORDEN[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function MotosFilters(props: Props) {
  const { filtros, onChange } = props;
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const activos = contarFiltrosActivos(filtros);

  function limpiar() {
    onChange({ ...FILTROS_POR_DEFECTO, q: filtros.q, orden: filtros.orden });
  }

  const chipPapeles = (
    <FilterChip
      icon={TriangleAlert}
      active={filtros.papeles === 'atencion'}
      onClick={() =>
        onChange({ papeles: filtros.papeles === 'atencion' ? 'todos' : 'atencion' })
      }
    >
      Papeles por vencer
    </FilterChip>
  );

  return (
    <>
      {/* Escritorio: todo a la vista, en una fila sobre la tabla. */}
      <div className="hidden flex-wrap items-center gap-2 md:flex">
        <Controles {...props} />
        {chipPapeles}
        {activos > 0 ? (
          <Button variant="ghost" onClick={limpiar} className="h-8 text-[13px]">
            Limpiar filtros
          </Button>
        ) : null}
        <span className="flex-1" />
        <SelectOrden filtros={filtros} onChange={onChange} />
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
        <span className="shrink-0">{chipPapeles}</span>
        <SelectOrden filtros={filtros} onChange={onChange} className="h-9 shrink-0" />
      </div>

      <Sheet open={hojaAbierta} onOpenChange={setHojaAbierta}>
        <SheetContent
          side="bottom"
          className="gap-0 rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="pb-1">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4 pt-2">
            <Controles {...props} stacked />
          </div>
          <div className="mt-4 flex gap-2 px-4">
            <Button
              variant="outline"
              onClick={limpiar}
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
    </>
  );
}
