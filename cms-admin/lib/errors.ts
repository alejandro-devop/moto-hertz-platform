/**
 * Los errores de `graphql-request` traen la respuesta entera serializada en
 * `message`: query, variables y stacktrace del servidor. Eso no se le muestra
 * a nadie. De aquí sale una frase, y el detalle completo va a la consola.
 */

interface RespuestaGraphQL {
  response?: { errors?: { message?: string }[] };
}

export function mensajeDeError(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return 'Algo salió mal. Intenta de nuevo.';
  }

  const conRespuesta = error as RespuestaGraphQL;
  const delServidor = conRespuesta.response?.errors?.[0]?.message;
  if (delServidor) return traducir(delServidor);

  if (error instanceof Error) {
    /* `graphql-request` corta el mensaje legible con «: {» antes del volcado. */
    const [primeraLinea] = error.message.split(/:\s*\{/);
    return traducir(primeraLinea.trim() || error.message.slice(0, 160));
  }

  return 'Algo salió mal. Intenta de nuevo.';
}

/** Los mensajes del backend vienen en inglés y son para desarrolladores. */
function traducir(mensaje: string): string {
  const texto = mensaje.toLowerCase();
  if (texto.includes('validation failed')) {
    return 'El servidor rechazó los datos. Revisa los campos y vuelve a intentar.';
  }
  if (texto.includes('unauthorized') || texto.includes('unauthenticated')) {
    return 'La sesión venció. Vuelve a entrar.';
  }
  if (texto.includes('duplicate') || texto.includes('unique')) {
    return 'Ya existe una moto con ese slug.';
  }
  if (texto.includes('fetch failed') || texto.includes('econnrefused')) {
    return 'No hay conexión con el servidor.';
  }
  return mensaje;
}

/** El detalle técnico completo, para la consola del navegador. */
export function registrarError(contexto: string, error: unknown): void {
  console.error(`[${contexto}]`, error);
}
