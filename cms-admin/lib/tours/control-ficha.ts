/**
 * El puente entre un recorrido guiado y la ficha abierta, para que un paso
 * pueda señalar algo que vive en una pestaña que no es la que abre por defecto.
 *
 * **Por qué hace falta.** Lo que de verdad hay que explicar de una ficha está
 * casi siempre detrás de una pestaña: los horarios de un punto de atención, el
 * enlace de Google Maps, las tres modalidades de precio de un servicio. Sin
 * esto, esos pasos no tendrían ancla visible y se saltarían siempre — la ficha
 * se quedaría explicando solo lo genérico, que es lo que menos falta hace.
 *
 * **Es una excepción consciente.** Hasta aquí el sistema no le tocaba la
 * interfaz a nadie: señalaba lo que ya estaba en pantalla. Abrir una pestaña sí
 * es manejarla, aunque sea poco. Se acota a esto —cambiar de sección dentro de
 * una ficha que el usuario ya abrió— y el recorrido devuelve la ficha a la
 * pestaña en que estaba al terminar, para no dejarla movida.
 *
 * **Es un único registro global, no un contexto**, por la misma premisa que
 * hace que las anclas sean genéricas: solo hay una ficha abierta a la vez. Lo
 * registra `FormSheet` mientras está abierta, así que ninguna sección tiene que
 * acordarse de hacerlo.
 */

export interface ControlDeFicha {
  /** En qué sección está la ficha ahora mismo. */
  seccionActual: () => string;
  /** Abrir una sección. Tiene que ser idempotente: se llama varias veces. */
  abrirSeccion: (id: string) => void;
}

let control: ControlDeFicha | null = null;

/** La llama `FormSheet` al abrirse, y con `null` al cerrarse. */
export function registrarControlDeFicha(nuevo: ControlDeFicha | null): void {
  control = nuevo;
}

export function controlDeFicha(): ControlDeFicha | null {
  return control;
}
