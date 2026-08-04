import type { TourStatus } from '@/lib/graphql/tours';

export type { TourStatus };

/** Dónde tiene sentido un paso. La barra lateral no existe en móvil, y la barra inferior no existe en escritorio. */
export type PantallaTour = 'escritorio' | 'movil';

export interface PasoTour {
  /**
   * La clave del `data-tour` al que se ancla el paso. Sin ella, el paso es un
   * cartel centrado en la pantalla (sirve para abrir o cerrar un recorrido).
   *
   * **Nunca una clase de Tailwind**: las clases cambian con cada retoque
   * visual y nadie se entera de que rompió un tour. Un `data-tour` está ahí a
   * propósito y aparece en el `grep`.
   */
  ancla?: string;
  titulo: string;
  texto: string;
  lado?: 'top' | 'right' | 'bottom' | 'left';
  alineacion?: 'start' | 'center' | 'end';
  /** Sin esto, el paso sale en las dos pantallas. */
  solo?: PantallaTour;
}

export interface DefinicionTour {
  /** Minúsculas separadas por puntos: `panel.bienvenida`, `motos.lista`. El backend valida el formato. */
  clave: string;
  /** Nombre legible: es como se lista en «Ayuda y recorridos», en Configuración. */
  nombre: string;
  /** Una línea de qué explica el recorrido, para la misma lista. */
  descripcion: string;
  /**
   * Súbela cuando cambien los pasos porque cambió la interfaz: el recorrido
   * vuelve a salir para todo el mundo, sin borrarle el historial a nadie.
   */
  version: number;
  /**
   * Máximo 5 o 6, y esto es una regla, no una sugerencia: un recorrido largo
   * lo salta todo el mundo, y saltar también cuenta como visto — con lo cual
   * el usuario se queda sin la ayuda para siempre. Lo que no cabe en 6 pasos
   * son dos recorridos.
   */
  pasos: PasoTour[];
  /**
   * Milisegundos de espera antes de medir las anclas. Solo hace falta cuando
   * el recorrido arranca sobre algo que entra animado —la ficha es una hoja
   * que se desliza— y medirlo a mitad del deslizamiento deja el globo
   * apuntando a donde el elemento estaba, no a donde quedó.
   */
  retraso?: number;
}
