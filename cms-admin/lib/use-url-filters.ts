'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Opciones<T> {
  /** Ruta del módulo, sin parámetros: `/motos`. */
  ruta: string;
  leer: (params: URLSearchParams) => T;
  escribir: (filtros: T) => URLSearchParams;
}

/**
 * Los filtros de una lista viven en la URL: se pueden compartir, el botón de
 * atrás funciona y recargar no pierde nada.
 *
 * `actualizar` aplica un parche sobre lo que ya hay y **vuelve a la página 1**
 * salvo que el parche traiga página propia — cambiar un filtro y quedarse en la
 * página 7 de una lista que ahora tiene 2 es la forma más rápida de creer que
 * la lista quedó vacía.
 */
export function useFiltrosUrl<T extends { pagina: number }>({ ruta, leer, escribir }: Opciones<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtros = leer(new URLSearchParams(searchParams.toString()));

  function actualizar(patch: Partial<T>) {
    const siguiente = { ...filtros, ...patch, pagina: patch.pagina ?? 1 } as T;
    const params = escribir(siguiente);
    router.replace(params.size > 0 ? `${ruta}?${params}` : ruta, { scroll: false });
  }

  /** Deja la lista sin filtros ni búsqueda: la URL vuelve a la ruta pelada. */
  function limpiarTodo() {
    router.replace(ruta, { scroll: false });
  }

  return { filtros, actualizar, limpiarTodo };
}
