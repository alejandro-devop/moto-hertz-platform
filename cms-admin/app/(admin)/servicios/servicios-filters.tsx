'use client';

import { BUSCADORES } from '@/lib/list-search';
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

export function ServiciosFilters({
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

  /* La categoría es texto libre: las opciones salen de los datos, no de un
     catálogo. `''` es «todas». Si la categoría filtrada dejó de existir se
     agrega igual, para que el filtro de la URL no se pierda en silencio. */
  const opcionesCategoria = [
    { value: '', label: 'Todas las categorías' },
    ...categorias.map((categoria) => ({ value: categoria, label: categoria })),
    ...(filtros.categoria && !categorias.includes(filtros.categoria)
      ? [{ value: filtros.categoria, label: `${filtros.categoria} (sin servicios)` }]
      : []),
  ];

  return (
    <BarraFiltros
      activos={activos}
      /* Limpiar deja la búsqueda y el orden: son del usuario, no del filtro. */
      onLimpiar={() => onChange({ ...FILTROS_POR_DEFECTO, q: filtros.q, orden: filtros.orden })}
      busqueda={{
        value: filtros.q,
        onChange: (q) => onChange({ q }),
        placeholder: BUSCADORES['/servicios'].placeholder,
      }}
      controles={(apilado) => (
        <>
          <SelectFiltro<Estado>
            value={filtros.estado}
            onChange={(estado) => onChange({ estado })}
            opciones={opcionesDe(ETIQUETAS_ESTADO)}
            etiqueta="Ver los servicios del sitio o la papelera"
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
            etiqueta="Filtrar por servicios destacados"
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
