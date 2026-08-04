import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { anclaVisible, elementoDeAncla } from './anchor';
import { controlDeFicha } from './control-ficha';
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
  if (!paso.ancla) return true;
  /* Un paso que vive en otra pestaña de la ficha todavía no está en el DOM;
     no se puede juzgar por su ancla. Lo que decide si aplica es que haya una
     ficha abierta a la que pedirle esa sección. */
  if (paso.seccion) return controlDeFicha() !== null;
  return anclaVisible(paso.ancla);
}

/**
 * Cuánto se le da a la ficha para pintar una pestaña recién abierta antes de
 * dar el paso por perdido. `driver.js` no espera este tiempo completo: reacciona
 * al primer cambio del DOM que haga aparecer el ancla, y esto es solo el tope.
 */
const ESPERA_DE_SECCION = 1200;

/**
 * Abrir la pestaña que necesita un paso es un efecto, y por eso **no puede
 * vivir en el resolutor del ancla**, aunque sea el sitio más obvio. `driver.js`
 * resuelve el elemento del paso *siguiente* mientras dibuja el actual, para
 * saber si el botón dice «Siguiente» o «Listo»: con el efecto ahí, la ficha
 * saltaba de pestaña un paso antes de tiempo y el paso que se estaba leyendo se
 * quedaba señalando algo que ya no estaba en pantalla.
 *
 * Así que el cambio lo dispara la navegación —el clic en Siguiente o en Atrás—,
 * y `objetivo` dice a qué paso vamos. El resolutor solo insiste sobre esa misma
 * sección, para el caso de que React todavía no haya repintado.
 */
function aDriveStep(paso: PasoTour, objetivo: () => string | null): DriveStep {
  const ancla = paso.ancla;
  return {
    /* Función y no cadena: devuelve la copia **visible** del elemento, que es
       lo que permite que la misma clave sirva en las dos pantallas. */
    element: ancla
      ? () => {
          if (paso.seccion && objetivo() === paso.seccion) {
            controlDeFicha()?.abrirSeccion(paso.seccion);
          }
          return elementoDeAncla(ancla) as Element;
        }
      : undefined,
    /* Lo que tarde la ficha en pintar la pestaña recién abierta. */
    waitForElement: paso.seccion ? ESPERA_DE_SECCION : undefined,
    /**
     * Y por lo mismo de arriba: mientras su pestaña está cerrada, el ancla de
     * un paso con sección no existe. Si se dejara que `driver.js` lo diera por
     * ausente, lo descartaría del recorrido y el paso anterior mostraría
     * «Listo» en vez de «Siguiente». Estos pasos no se saltan: se espera a que
     * su pestaña se abra.
     */
    skipMissingElement: paso.seccion ? false : undefined,
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

  /* Para devolver la ficha a donde estaba: el recorrido la mueve de pestaña,
     pero quien la abrió no pidió que se la movieran. */
  const seccionInicial = pasos.some((paso) => paso.seccion)
    ? controlDeFicha()?.seccionActual()
    : undefined;

  /** A qué paso vamos: lo pone la navegación, lo consulta el resolutor. */
  let objetivo: string | null = pasos[0]?.seccion ?? null;
  if (objetivo) controlDeFicha()?.abrirSeccion(objetivo);

  /**
   * Prepara el salto a un paso: si vive en otra pestaña de la ficha, la abre
   * **antes** de movernos, para que `driver.js` ya encuentre el ancla (y si no
   * la encuentra al instante, la espere con `waitForElement`).
   */
  function irA(indice: number, mover: () => void) {
    objetivo = pasos[indice]?.seccion ?? null;
    if (objetivo) controlDeFicha()?.abrirSeccion(objetivo);
    mover();
  }

  const recorrido = driver({
    steps: pasos.map((paso, indice) => {
      const step = aDriveStep(paso, () => objetivo);
      return {
        ...step,
        popover: {
          ...step.popover,
          /* Al pisar estos manejadores hay que mover el recorrido a mano:
             `driver.js` solo navega solo cuando no se los reemplazas. */
          onNextClick: () => irA(indice + 1, () => recorrido.moveNext()),
          onPrevClick: () => irA(indice - 1, () => recorrido.movePrevious()),
        },
      };
    }),
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
      if (seccionInicial) controlDeFicha()?.abrirSeccion(seccionInicial);
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
