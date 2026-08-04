import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { anclaVisible, elementoDeAncla } from './anchor';
import type { DefinicionTour, PasoTour, TourStatus } from './types';

/**
 * El envoltorio de `driver.js`: traduce una `DefinicionTour` nuestra a lo que
 * la librería entiende, y resuelve de una vez —aquí y no en cada sección— las
 * cuatro cosas que se repiten en todos los recorridos.
 *
 * 1. **Un paso sin ancla visible se salta en silencio.** Se filtra antes de
 *    arrancar para que el contador diga «2 de 4» de verdad, y además se deja
 *    `skipMissingElement` como red por si un elemento desaparece a mitad del
 *    recorrido.
 * 2. **Qué pasos van en qué pantalla.** La barra lateral no existe en móvil y
 *    la barra inferior no existe en escritorio: el mismo recorrido se cuenta
 *    distinto en cada una.
 * 3. **Cuál de las dos copias de un elemento señalar.** El ancla se resuelve
 *    con una función, no con un selector, para que `driver.js` señale la copia
 *    visible y no la que está oculta detrás de un `hidden md:block`.
 * 4. **Terminado vs. saltado.** Llegar al último paso es `completed`; cerrarlo
 *    antes es `skipped`. Los dos marcan visto, pero solo uno dice que sirvió.
 */

interface Opciones {
  /** Se llama cuando el **usuario** cierra o termina. No se llama al cancelar. */
  onFinish: (estado: TourStatus) => void;
}

/** Debajo de esto no hay barra lateral: es el mismo corte que usa `md:` en el panel. */
const ANCHO_MOVIL = 768;

function esMovil(): boolean {
  return window.matchMedia(`(max-width: ${ANCHO_MOVIL - 1}px)`).matches;
}

function prefiereMenosMovimiento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function pasoAplica(paso: PasoTour, movil: boolean): boolean {
  if (paso.solo === 'movil' && !movil) return false;
  if (paso.solo === 'escritorio' && movil) return false;
  /* Sin ancla es un cartel centrado: siempre se puede mostrar. */
  return !paso.ancla || anclaVisible(paso.ancla);
}

function aDriveStep(paso: PasoTour): DriveStep {
  const ancla = paso.ancla;
  return {
    /* Función y no cadena: se resuelve en el momento de mostrar el paso, y
       devuelve la copia visible del elemento (ver `elementoDeAncla`). */
    element: ancla ? () => elementoDeAncla(ancla) as Element : undefined,
    popover: {
      title: paso.titulo,
      description: paso.texto,
      side: paso.lado,
      align: paso.alineacion,
    },
  };
}

/**
 * Arranca el recorrido. Devuelve la función de cancelar, que lo cierra **sin**
 * marcarlo visto — es lo que se usa al desmontar o al cambiar de ruta, donde
 * el usuario no decidió nada y el recorrido tiene que poder volver a salir.
 *
 * Devuelve **`null` si no arrancó** porque no sobrevivió ningún paso al
 * filtro. No es un error: la pantalla todavía no está en condiciones de
 * explicarse (una lista vacía, una ruta que ya cambió). Quien llama tiene que
 * tratarlo como «no se mostró» y dejar que vuelva a intentarse — si lo diera
 * por mostrado, ese recorrido no saldría nunca.
 */
export function runTour(tour: DefinicionTour, { onFinish }: Opciones): (() => void) | null {
  const pasos = tour.pasos.filter((paso) => pasoAplica(paso, esMovil()));
  if (pasos.length === 0) return null;

  /**
   * Qué decidió el usuario, capturado en `onDestroyStarted` — que `driver.js`
   * solo dispara en los cierres que vienen de él (botón, Esc, clic fuera), no
   * en el `destroy()` que llamamos nosotros. De ahí sale gratis que cancelar
   * no marque visto.
   */
  let resultado: TourStatus | null = null;

  const recorrido = driver({
    steps: pasos.map(aDriveStep),
    popoverClass: 'tour-panel',
    animate: !prefiereMenosMovimiento(),
    smoothScroll: true,
    allowClose: true,
    /* El elemento resaltado no se puede tocar: evita que alguien navegue a
       otra pantalla a mitad del recorrido y deje los pasos apuntando al aire. */
    disableActiveInteraction: true,
    skipMissingElement: true,
    stagePadding: 6,
    stageRadius: 10,
    showProgress: pasos.length > 1,
    progressText: '{{current}} de {{total}}',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Atrás',
    doneBtnText: 'Listo',
    onDestroyStarted: () => {
      resultado = recorrido.isLastStep() ? 'completed' : 'skipped';
      recorrido.destroy();
    },
    onDestroyed: () => {
      const decidido = resultado;
      resultado = null;
      if (decidido) onFinish(decidido);
    },
  });

  recorrido.drive();

  return () => {
    if (recorrido.isActive()) recorrido.destroy();
  };
}
