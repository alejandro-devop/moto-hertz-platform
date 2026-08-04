'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import type { TourProgress } from '@/lib/graphql/tours';
import { TOURS, type ClaveTour } from './registry';
import { runTour } from './run-tour';
import { useTourMutations, useTourProgressQuery } from './use-tour-progress';

/**
 * Quién decide si un recorrido guiado se muestra. Las páginas no deciden: solo
 * avisan «yo tengo este recorrido y ya estoy lista» con `useTour()`, y aquí se
 * resuelve el resto.
 *
 * Lo que se resuelve aquí, una vez, en lugar de en cada sección:
 *
 * - **Uno a la vez.** Dos recorridos superpuestos son una pantalla ilegible.
 *   Lo que llega mientras hay uno corriendo espera en la cola.
 * - **Solo lo no visto.** Con el progreso ya cargado se compara la versión
 *   guardada contra la del código: si el panel subió la versión, vuelve a salir.
 * - **Una vez por sesión de navegador.** `lanzados` evita que volver a la
 *   misma pantalla —o el doble montaje de React en desarrollo— relance lo que
 *   ya se mostró.
 * - **Cambiar de ruta cancela.** Un recorrido a medias apunta a elementos que
 *   ya no están; se cierra sin marcarlo visto, para que pueda volver a salir.
 */

interface Contexto {
  /** El progreso ya cargó: hasta entonces no se arranca nada. */
  listo: boolean;
  /** Lo que el usuario ya vio, por clave de recorrido. */
  progreso: Map<string, TourProgress>;
  /** «Tengo este recorrido y estoy lista». No garantiza que se muestre. */
  pedir: (clave: ClaveTour) => void;
  /** «Ya no estoy lista» — se cerró la ficha, se fue de la pantalla. Cierra sin marcar. */
  cancelar: (clave: ClaveTour) => void;
  /** Mostrarlo ahora aunque ya se haya visto (el botón de ayuda). */
  relanzar: (clave: ClaveTour) => void;
  /** Borra el progreso para que vuelvan a salir. Sin clave, todos. */
  reiniciar: (clave?: ClaveTour) => Promise<unknown>;
  reiniciando: boolean;
  /**
   * Sube en cada reinicio. `useTour` depende de ella para volver a pedir su
   * recorrido sin que haya que recargar la página.
   */
  generacion: number;
}

const TourContext = createContext<Contexto | null>(null);

interface Peticion {
  clave: ClaveTour;
  /** Salta las comprobaciones de «ya lo vio»: viene del botón de ayuda. */
  forzar: boolean;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { data, isSuccess } = useTourProgressQuery();
  const { marcarVisto, reiniciar: reiniciarMutation } = useTourMutations();
  const pathname = usePathname();

  const [cola, setCola] = useState<Peticion[]>([]);
  const [enCurso, setEnCurso] = useState<ClaveTour | null>(null);
  const [generacion, setGeneracion] = useState(0);

  /** Lo ya mostrado en esta sesión de navegador. No viaja a la base. */
  const lanzados = useRef(new Set<string>());
  const enCursoRef = useRef<ClaveTour | null>(null);
  enCursoRef.current = enCurso;

  /* La mutación cambia de identidad en cada render; si entrara como
     dependencia del efecto que arranca el recorrido, lo relanzaría solo. */
  const marcarVistoRef = useRef(marcarVisto);
  marcarVistoRef.current = marcarVisto;

  const progreso = useMemo(
    () => new Map((data?.tourProgress ?? []).map((item) => [item.tourKey, item])),
    [data]
  );
  const progresoRef = useRef(progreso);
  progresoRef.current = progreso;

  const pedir = useCallback((clave: ClaveTour) => {
    if (lanzados.current.has(clave)) return;
    setCola((actual) =>
      actual.some((item) => item.clave === clave) ? actual : [...actual, { clave, forzar: false }]
    );
  }, []);

  /**
   * Lo contrario de `pedir`. Se olvida de que se lanzó, para que la próxima
   * vez que la pantalla esté lista vuelva a salir: cerrar la ficha a mitad del
   * recorrido no es haberlo visto.
   */
  const cancelar = useCallback((clave: ClaveTour) => {
    setCola((actual) => actual.filter((item) => item.clave !== clave));
    if (enCursoRef.current !== clave) return;
    lanzados.current.delete(clave);
    setEnCurso(null);
  }, []);

  const relanzar = useCallback((clave: ClaveTour) => {
    lanzados.current.delete(clave);
    setEnCurso(null);
    setCola((actual) => [...actual.filter((item) => item.clave !== clave), { clave, forzar: true }]);
  }, []);

  const reiniciar = useCallback(
    async (clave?: ClaveTour) => {
      const resultado = await reiniciarMutation.mutateAsync(clave);
      /* Sin esto habría que recargar la página para volver a ver nada: el
         progreso ya estaría borrado en la base, pero `lanzados` seguiría
         diciendo que en esta pestaña ya se mostraron. */
      if (clave) lanzados.current.delete(clave);
      else lanzados.current.clear();
      setGeneracion((valor) => valor + 1);
      return resultado;
    },
    [reiniciarMutation]
  );

  /**
   * Cambiar de sección cierra lo que esté corriendo, sin marcarlo visto: un
   * recorrido a medias apunta a elementos que ya no están.
   *
   * **No se vacía la cola.** Los efectos de los hijos corren antes que los del
   * padre, así que lo que ya pidió la pantalla nueva estaría en la cola cuando
   * este efecto se ejecuta, y vaciarla se lo comería. Lo que sobre de la
   * pantalla vieja se cae solo: sus anclas ya no existen, `runTour` devuelve
   * `null` y el recorrido queda otra vez pendiente.
   */
  const rutaPrevia = useRef(pathname);
  useEffect(() => {
    if (rutaPrevia.current === pathname) return;
    rutaPrevia.current = pathname;
    const actual = enCursoRef.current;
    if (!actual) return;
    lanzados.current.delete(actual);
    setEnCurso(null);
  }, [pathname]);

  /* Saca de la cola lo que toque mostrar. */
  useEffect(() => {
    if (!isSuccess || enCurso || cola.length === 0) return;

    const [siguiente, ...resto] = cola;
    setCola(resto);

    if (!siguiente.forzar) {
      if (lanzados.current.has(siguiente.clave)) return;
      const visto = progresoRef.current.get(siguiente.clave);
      /* Ya lo vio, y en una versión que sigue siendo la del código. */
      if (visto && visto.version >= TOURS[siguiente.clave].version) return;
    }

    lanzados.current.add(siguiente.clave);
    setEnCurso(siguiente.clave);
  }, [isSuccess, enCurso, cola]);

  /* Y lo corre. La limpieza cierra sin marcar: cancelar no es decidir. */
  useEffect(() => {
    if (!enCurso) return;
    const tour = TOURS[enCurso];
    let cerrar: (() => void) | null = null;
    let abortado = false;
    let cuadro = 0;

    /* Una espera antes de medir las anclas: un cuadro para que el navegador
       termine de pintar, y lo que pida el recorrido si además arranca sobre
       algo que entra animado (la ficha es una hoja que se desliza). */
    const temporizador = window.setTimeout(
      () =>
        (cuadro = requestAnimationFrame(() => {
          if (abortado) return;
          cerrar = runTour(tour, {
            onFinish: (estado) => {
              marcarVistoRef.current.mutate({
                key: tour.clave,
                version: tour.version,
                status: estado,
              });
              /**
               * **Un recorrido por visita.** Terminar uno vacía la cola en vez
               * de encadenar con el siguiente. Sin esto, el primer ingreso al
               * panel son los 4 pasos de la bienvenida y, sin pausa ninguna,
               * los 6 de la sección: diez globos seguidos, que es justo la
               * pared que el tope de seis pasos por recorrido existe para
               * evitar — encadenar la saltaba por la puerta de atrás.
               *
               * Lo que quedó en la cola no se pierde: sale la próxima vez que
               * se entre a esa pantalla (`useTour` vuelve a pedir en cada
               * cambio de ruta), y mientras tanto el «?» de la sección lo tiene
               * a un clic.
               */
              setCola([]);
              setEnCurso(null);
            },
          });

          /* No arrancó porque ningún paso tenía dónde anclarse. No se dio por
             mostrado: se olvida el lanzamiento para que vuelva a intentarse
             cuando la pantalla sí pueda explicarse. */
          if (!cerrar) {
            lanzados.current.delete(tour.clave);
            setEnCurso(null);
          }
        })),
      tour.retraso ?? 0
    );

    return () => {
      abortado = true;
      window.clearTimeout(temporizador);
      cancelAnimationFrame(cuadro);
      cerrar?.();
    };
  }, [enCurso]);

  const valor = useMemo<Contexto>(
    () => ({
      listo: isSuccess,
      progreso,
      pedir,
      cancelar,
      relanzar,
      reiniciar,
      reiniciando: reiniciarMutation.isPending,
      generacion,
    }),
    [
      isSuccess,
      progreso,
      pedir,
      cancelar,
      relanzar,
      reiniciar,
      reiniciarMutation.isPending,
      generacion,
    ]
  );

  return <TourContext.Provider value={valor}>{children}</TourContext.Provider>;
}

/**
 * El acceso al control de recorridos. Devuelve `null` fuera del panel (la
 * pantalla de login no tiene sesión, así que tampoco tiene progreso) para que
 * un componente compartido no reviente por estar en los dos lados.
 */
export function useTourContext(): Contexto | null {
  return useContext(TourContext);
}

/**
 * Lo que declara una pantalla: «tengo este recorrido». `listo` es la condición
 * de que la pantalla ya se pueda explicar — normalmente `!isLoading && !isError`
 * en una lista, o «la ficha está abierta» en una ficha. Nunca se arranca un
 * recorrido sobre un esqueleto de carga, y cuando `listo` vuelve a `false` el
 * recorrido se cierra sin marcarse visto.
 *
 * Se vuelve a pedir en cada cambio de ruta. Hace falta para el caso más
 * tonto y más frecuente de todos: entrar a `/`, que redirige a `/motos` — sin
 * esto, el recorrido de bienvenida se cancelaría con la redirección y no
 * volvería a pedirse, porque el armazón no se vuelve a montar. Pedir de más es
 * gratis: el provider ignora lo que ya lanzó.
 *
 * Devuelve `relanzar` para el botón de ayuda de la sección.
 */
export function useTour(clave: ClaveTour, listo: boolean = true) {
  const ctx = useTourContext();
  const pathname = usePathname();
  const pedir = ctx?.pedir;
  const cancelar = ctx?.cancelar;
  const generacion = ctx?.generacion ?? 0;

  useEffect(() => {
    if (listo) pedir?.(clave);
    else cancelar?.(clave);
  }, [clave, listo, pedir, cancelar, generacion, pathname]);

  return {
    relanzar: useCallback(() => ctx?.relanzar(clave), [ctx, clave]),
  };
}
