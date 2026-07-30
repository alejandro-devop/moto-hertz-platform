/**
 * Una ficha larga se parte en secciones para que un campo se busque donde uno
 * lo esperaría, no donde cayó en la tabla. Cada módulo declara las suyas en
 * `app/(admin)/<ruta>/form-sections.ts`; aquí vive solo la forma común y lo que
 * la ficha necesita para ubicar errores.
 */
export interface SeccionFicha<Id extends string = string> {
  id: Id;
  label: string;
  /** Qué se contesta en esta sección, en una línea. */
  hint: string;
  /** Campos del formulario que pertenecen a la sección, para ubicar errores. */
  campos: string[];
}

/** A qué sección pertenece un campo, para saltar al primer error. */
export function seccionDeCampo<Id extends string>(
  secciones: readonly SeccionFicha<Id>[],
  campo: string
): Id | undefined {
  return secciones.find((seccion) => seccion.campos.includes(campo))?.id;
}

/** Cuántos errores tiene cada sección, para el contador de la pestaña. */
export function erroresPorSeccion<Id extends string>(
  secciones: readonly SeccionFicha<Id>[],
  errores: Record<string, string>
): Map<Id, number> {
  const total = new Map<Id, number>();
  for (const seccion of secciones) {
    const cuantos = seccion.campos.filter((campo) => errores[campo]).length;
    if (cuantos > 0) total.set(seccion.id, cuantos);
  }
  return total;
}
