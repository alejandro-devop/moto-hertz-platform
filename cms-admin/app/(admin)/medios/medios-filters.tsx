'use client';

import { BUSCADORES } from '@/lib/list-search';
import { BarraFiltros, SelectFiltro, opcionesDe } from '@/components/admin/filter-bar';
import {
  contarFiltrosActivos,
  ETIQUETAS_ESTADO,
  ETIQUETAS_ORDEN,
  FILTROS_POR_DEFECTO,
  type Estado,
  type Filtros,
  type Orden,
} from './filters';

export function MediosFilters({
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
      onLimpiar={() => onChange({ ...FILTROS_POR_DEFECTO, q: filtros.q, orden: filtros.orden })}
      busqueda={{
        value: filtros.q,
        onChange: (q) => onChange({ q }),
        placeholder: BUSCADORES['/medios'].placeholder,
      }}
      controles={(apilado) => (
        <SelectFiltro<Estado>
          value={filtros.estado}
          onChange={(estado) => onChange({ estado })}
          opciones={opcionesDe(ETIQUETAS_ESTADO)}
          etiqueta="Ver la biblioteca o la papelera"
          apilado={apilado}
        />
      )}
      orden={(className) => (
        <SelectFiltro<Orden>
          value={filtros.orden}
          onChange={(orden) => onChange({ orden })}
          opciones={opcionesDe(ETIQUETAS_ORDEN)}
          etiqueta="Ordenar la biblioteca"
          align="end"
          className={className}
        />
      )}
    />
  );
}
