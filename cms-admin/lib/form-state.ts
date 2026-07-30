/**
 * Piezas sueltas que usa el estado de cualquier ficha: el formulario es plano
 * aunque el tipo del backend sea anidado, así que siempre hay que convertir
 * texto → dato y recoger los errores de Zod en un mapa por campo.
 */
/** La forma de un `safeParse`, descrita a mano para no atarse a la versión de Zod. */
type ResultadoZod =
  | { success: true }
  | { success: false; error: { issues: { path: readonly PropertyKey[]; message: string }[] } };

/**
 * Un error por campo, el primero que aparezca. Mostrar tres mensajes sobre el
 * mismo input no ayuda a nadie.
 */
export function erroresDeZod(resultado: ResultadoZod): Record<string, string> {
  const errores: Record<string, string> = {};
  if (resultado.success) return errores;
  for (const issue of resultado.error.issues) {
    const campo = String(issue.path[0]);
    if (!errores[campo]) errores[campo] = issue.message;
  }
  return errores;
}

/** `"ABS, tablero digital"` → `["ABS", "tablero digital"]`. */
export function listaDesdeTexto(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** `["ABS", "tablero digital"]` → `"ABS, tablero digital"`, para editarla. */
export function textoDesdeLista(values?: readonly string[] | null): string {
  return (values ?? []).join(', ');
}

/** Campo de texto vacío = campo sin valor: al backend no viaja `""`. */
export function textoOpcional(value: string): string | undefined {
  return value.trim() || undefined;
}
