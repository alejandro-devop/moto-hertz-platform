'use client';

import { TriangleAlert } from 'lucide-react';
import {
  BarraFiltros,
  FilterChip,
  SelectFiltro,
  opcionesDe,
  type OpcionFiltro,
} from '@/components/admin/filter-bar';
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

/** Las marcas y sedes salen del catálogo, así que se arman en cada render. */
function opcionesLibres(valores: string[], todas: string): OpcionFiltro[] {
  return [{ value: TODAS, label: todas }, ...valores.map((value) => ({ value, label: value }))];
}

export function MotosFilters({ filtros, onChange, marcas, sedes }: Props) {
  const activos = contarFiltrosActivos(filtros);

  /* Limpiar deja la búsqueda y el orden: son del usuario, no del filtro. */
  function limpiar() {
    onChange({ ...FILTROS_POR_DEFECTO, q: filtros.q, orden: filtros.orden });
  }

  return (
    <BarraFiltros
      activos={activos}
      onLimpiar={limpiar}
      controles={(apilado) => (
        <>
          <SelectFiltro<Estado>
            value={filtros.estado}
            onChange={(estado) => onChange({ estado })}
            opciones={opcionesDe(ETIQUETAS_ESTADO)}
            etiqueta="Filtrar por estado de publicación"
            apilado={apilado}
          />
          <SelectFiltro<Condicion>
            value={filtros.condicion}
            onChange={(condicion) => onChange({ condicion })}
            opciones={opcionesDe(ETIQUETAS_CONDICION)}
            etiqueta="Filtrar por condición"
            apilado={apilado}
          />
          <SelectFiltro
            value={filtros.marca}
            onChange={(marca) => onChange({ marca })}
            opciones={opcionesLibres(marcas, 'Todas las marcas')}
            etiqueta="Filtrar por marca"
            apilado={apilado}
          />
          {sedes.length > 0 ? (
            <SelectFiltro
              value={filtros.sede}
              onChange={(sede) => onChange({ sede })}
              opciones={opcionesLibres(sedes, 'Todas las sedes')}
              etiqueta="Filtrar por sede"
              apilado={apilado}
            />
          ) : null}
        </>
      )}
      chips={
        <FilterChip
          icon={TriangleAlert}
          active={filtros.papeles === 'atencion'}
          onClick={() =>
            onChange({ papeles: filtros.papeles === 'atencion' ? 'todos' : 'atencion' })
          }
        >
          Papeles por vencer
        </FilterChip>
      }
      orden={(className) => (
        <SelectFiltro<Orden>
          value={filtros.orden}
          onChange={(orden) => onChange({ orden })}
          opciones={opcionesDe(ETIQUETAS_ORDEN)}
          etiqueta="Ordenar la lista"
          align="end"
          className={className}
        />
      )}
    />
  );
}
