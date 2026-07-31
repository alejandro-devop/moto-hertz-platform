'use client';

import { BarraFiltros, SelectFiltro, opcionesDe } from '@/components/admin/filter-bar';
import {
  contarFiltrosActivos,
  ETIQUETAS_DESTACADO,
  ETIQUETAS_ESTADO,
  ETIQUETAS_ORDEN,
  FILTROS_POR_DEFECTO,
  type Destacado,
  type Estado,
  type Filtros,
  type Orden,
} from './filters';

export function NoticiasFilters({
  filtros,
  categorias,
  onChange,
}: {
  filtros: Filtros;
  /** Las categorías que existen hoy; el desplegable se arma con ellas. */
  categorias: string[];
  onChange: (patch: Partial<Filtros>) => void;
}) {
  const activos = contarFiltrosActivos(filtros);

  const opcionesCategoria = [
    { value: '', label: 'Todas las categorías' },
    ...categorias.map((categoria) => ({ value: categoria, label: categoria })),
    ...(filtros.categoria && !categorias.includes(filtros.categoria)
      ? [{ value: filtros.categoria, label: `${filtros.categoria} (sin noticias)` }]
      : []),
  ];

  return (
    <BarraFiltros
      activos={activos}
      onLimpiar={() => onChange({ ...FILTROS_POR_DEFECTO, q: filtros.q, orden: filtros.orden })}
      controles={(apilado) => (
        <>
          <SelectFiltro<Estado>
            value={filtros.estado}
            onChange={(estado) => onChange({ estado })}
            opciones={opcionesDe(ETIQUETAS_ESTADO)}
            etiqueta="Filtrar por estado"
            apilado={apilado}
          />
          <SelectFiltro<string>
            value={filtros.categoria}
            onChange={(categoria) => onChange({ categoria })}
            opciones={opcionesCategoria}
            etiqueta="Filtrar por categoría"
            apilado={apilado}
          />
          <SelectFiltro<Destacado>
            value={filtros.destacado}
            onChange={(destacado) => onChange({ destacado })}
            opciones={opcionesDe(ETIQUETAS_DESTACADO)}
            etiqueta="Filtrar por noticias destacadas"
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
