'use client';

import { BarraFiltros, SelectFiltro, opcionesDe } from '@/components/admin/filter-bar';
import { ETIQUETAS_ESTADO, FILTROS_POR_DEFECTO, type Estado, type Filtros } from './filters';

/**
 * Solo el estado (en el sitio / en papelera): no hay «ordenar por» — el orden
 * lo define `position`, y eso se edita con los botones de subir/bajar de la
 * lista, no con un desplegable (ver `filters.ts`).
 */
export function BannersFilters({
  filtros,
  onChange,
}: {
  filtros: Filtros;
  onChange: (patch: Partial<Filtros>) => void;
}) {
  const activos = filtros.estado !== FILTROS_POR_DEFECTO.estado ? 1 : 0;

  return (
    <BarraFiltros
      activos={activos}
      onLimpiar={() => onChange({ ...FILTROS_POR_DEFECTO, q: filtros.q })}
      controles={(apilado) => (
        <SelectFiltro<Estado>
          value={filtros.estado}
          onChange={(estado) => onChange({ estado })}
          opciones={opcionesDe(ETIQUETAS_ESTADO)}
          etiqueta="Ver los banners del sitio o la papelera"
          apilado={apilado}
        />
      )}
    />
  );
}
