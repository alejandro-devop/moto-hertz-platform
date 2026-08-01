'use client';

import { BUSCADORES } from '@/lib/list-search';
import { BarraFiltros, SelectFiltro, opcionesDe } from '@/components/admin/filter-bar';
import { BANNER_SLOT_LABELS, type BannerSlot } from '@/lib/graphql/banners';
import { ETIQUETAS_ESTADO, FILTROS_POR_DEFECTO, type Estado, type Filtros } from './filters';

/**
 * El slot no es un filtro que se pueda "limpiar": siempre hay uno puesto,
 * porque cada slot es su propio carrusel con su propio orden — mezclarlos no
 * tendría sentido. Estado (en el sitio / en papelera) sí es opcional. No hay
 * «ordenar por»: el orden lo define `position`, y eso se edita con los
 * botones de subir/bajar de la lista (ver `filters.ts`).
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
      onLimpiar={() => onChange({ ...FILTROS_POR_DEFECTO, q: filtros.q, slot: filtros.slot })}
      busqueda={{
        value: filtros.q,
        onChange: (q) => onChange({ q }),
        placeholder: BUSCADORES['/banners'].placeholder,
      }}
      controles={(apilado) => (
        <>
          <SelectFiltro<BannerSlot>
            value={filtros.slot}
            onChange={(slot) => onChange({ slot, pagina: 1 })}
            opciones={opcionesDe(BANNER_SLOT_LABELS)}
            etiqueta="Dónde aparece"
            apilado={apilado}
          />
          <SelectFiltro<Estado>
            value={filtros.estado}
            onChange={(estado) => onChange({ estado })}
            opciones={opcionesDe(ETIQUETAS_ESTADO)}
            etiqueta="Ver los banners del sitio o la papelera"
            apilado={apilado}
          />
        </>
      )}
    />
  );
}
