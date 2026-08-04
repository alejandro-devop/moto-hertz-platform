import type { NavLink } from '@/app/(admin)/nav-links';

/**
 * La clave de ancla del grupo de la barra lateral. Vive aparte de
 * `registry.ts` porque la usan los dos lados —`admin-rail.tsx` la escribe y el
 * recorrido de bienvenida la busca— y `admin-rail` no tiene por qué importar
 * el catálogo entero de recorridos para colgar un atributo.
 *
 * Los nombres de grupo llevan tilde («Catálogo»); las claves de ancla no,
 * porque el backend valida el formato de `tour_key` en minúsculas ASCII y no
 * vale la pena tener dos convenciones distintas conviviendo.
 */
export function anclaDeGrupo(grupo: NavLink['group']): string {
  const sinTildes = grupo.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return `panel.grupo.${sinTildes.toLowerCase()}`;
}
