'use client';

import { BUSCADORES } from '@/lib/list-search';
import { BarraFiltros, SelectFiltro, opcionesDe } from '@/components/admin/filter-bar';
import {
  contarFiltrosActivos,
  ETIQUETAS_ESTADO,
  ETIQUETAS_ORDEN,
  ETIQUETAS_TIPO,
  FILTROS_POR_DEFECTO,
  type Estado,
  type Filtros,
  type Orden,
  type Tipo,
} from './filters';

export function PuntosFilters({
  filtros,
  onChange,
}: {
  filtros: Filtros;
  onChange: (patch: Partial<Filtros>) => void;
}) {
  const activos = contarFiltrosActivos(filtros);

  return (
    <BarraFiltros
      activos={activos}
      /* Limpiar deja la búsqueda y el orden: son del usuario, no del filtro. */
      onLimpiar={() => onChange({ ...FILTROS_POR_DEFECTO, q: filtros.q, orden: filtros.orden })}
      busqueda={{
        value: filtros.q,
        onChange: (q) => onChange({ q }),
        placeholder: BUSCADORES['/puntos-de-atencion'].placeholder,
      }}
      controles={(apilado) => (
        <>
          <SelectFiltro<Estado>
            value={filtros.estado}
            onChange={(estado) => onChange({ estado })}
            opciones={opcionesDe(ETIQUETAS_ESTADO)}
            etiqueta="Ver los puntos del sitio o la papelera"
            apilado={apilado}
          />
          <SelectFiltro<Tipo>
            value={filtros.tipo}
            onChange={(tipo) => onChange({ tipo })}
            opciones={opcionesDe(ETIQUETAS_TIPO)}
            etiqueta="Filtrar por tipo de punto"
            apilado={apilado}
          />
        </>
      )}
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
