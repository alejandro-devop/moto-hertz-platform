import { navLinks, type NavLink } from '@/app/(admin)/nav-links';
import { anclaDeGrupo } from './grupos';
import { tourDeFicha, tourDeLista } from './plantillas';
import type { DefinicionTour, PasoTour } from './types';

/**
 * El listado de secciones de un grupo, para el recorrido de bienvenida. Sale
 * de `navLinks`, que es donde ya vive cada `descripcion`: una sección nueva
 * queda explicada por el solo hecho de declararse ahí, sin un texto paralelo
 * que se olvide de actualizar.
 *
 * `driver.js` mete la descripción con `innerHTML`, así que se puede maquetar.
 * Lo que va aquí lo escribimos nosotros —nunca datos de nadie—, que es la
 * única razón por la que eso es seguro.
 */
function secciones(grupo: NavLink['group']): string {
  const items = navLinks
    .filter((enlace) => enlace.group === grupo)
    .map((enlace) => `<li><b>${enlace.label}</b> — ${enlace.descripcion}</li>`)
    .join('');
  return `<ul class="tour-secciones">${items}</ul>`;
}

/** Un paso por grupo de la barra lateral: qué es cada opción del menú. */
function pasoDeGrupo(grupo: NavLink['group'], titulo: string): PasoTour {
  return {
    ancla: anclaDeGrupo(grupo),
    solo: 'escritorio',
    titulo,
    texto: secciones(grupo),
    lado: 'right',
    alineacion: 'start',
  };
}

/**
 * El catálogo de recorridos guiados del panel. Todo lo que existe está aquí:
 * es la lista que se muestra en «Ayuda y recorridos» (Configuración) y la
 * única fuente de claves y versiones.
 *
 * Para agregar un recorrido de sección: se llama a `tourDeLista` /
 * `tourDeFicha` con los sustantivos de la sección, se cuelgan los `data-tour`
 * propios si los hay, y la página llama a `useTour()`. Los pasos comunes
 * (crear, filtrar, papelera, tabla, acciones) ya los traen las plantillas, y
 * sus anclas ya están en los componentes compartidos.
 */
const DEFINICIONES = {
  /**
   * **Versión 3.** La Fase 0 lo dejó en 3 pasos, la Fase 1 lo subió a 4 con el
   * botón de ayuda, y esta versión hace lo que faltaba: **decir qué es cada
   * opción del menú**, no solo que el menú existe. Un paso por grupo de la
   * barra lateral, con las secciones de ese grupo y media línea cada una.
   *
   * Para que quepa sin pasarse del tope de seis, «ver el sitio» y «cambiar el
   * tema» pasaron a ser un solo paso: son dos controles vecinos y triviales,
   * y gastaban dos pasos de un presupuesto que hacía falta para el menú.
   */
  'panel.bienvenida': {
    clave: 'panel.bienvenida',
    nombre: 'Bienvenida al panel',
    descripcion: 'Qué se administra en cada sección, y dónde está cada cosa.',
    version: 3,
    pasos: [
      pasoDeGrupo('Catálogo', 'Catálogo — lo que ofreces'),
      pasoDeGrupo('Contenido', 'Contenido — lo que publicas'),
      pasoDeGrupo('Sistema', 'Sistema — cómo se comporta el sitio'),
      {
        ancla: 'panel.tabbar',
        solo: 'movil',
        titulo: 'Todo el panel está aquí',
        texto: `Las secciones que más se visitan, al alcance del pulgar; el resto —y el cambio de tema— está en «Más».${secciones('Catálogo')}`,
        lado: 'top',
        alineacion: 'center',
      },
      {
        ancla: 'panel.tabbar',
        solo: 'movil',
        titulo: 'Y lo que publicas',
        texto: `${secciones('Contenido')}${secciones('Sistema')}`,
        lado: 'top',
        alineacion: 'center',
      },
      {
        ancla: 'panel.ayuda',
        titulo: 'Cada sección se explica sola',
        texto:
          'La primera vez que entras a una sección te muestra un recorrido como este. Con este botón lo vuelves a ver cuando quieras.',
        lado: 'bottom',
        alineacion: 'start',
      },
      {
        ancla: 'panel.barra',
        solo: 'escritorio',
        titulo: 'Ver cómo quedó, y con qué luz',
        texto:
          'El primer botón abre el sitio público en otra pestaña: lo que guardas aquí se ve allá. Al lado se cambia entre claro y oscuro.',
        lado: 'bottom',
        alineacion: 'end',
      },
    ],
  },

  /**
   * Motos es la sección de referencia del panel, así que es la primera que
   * estrena las plantillas. Lo único que aporta más allá de la plantilla es el
   * paso de los papeles: SOAT y tecnomecánica son los únicos datos del panel
   * que caducan solos, y esa franja de aviso aparece sin que nadie la pida.
   */
  /* Versión 2: la plantilla ganó el paso de cierre que recuerda dónde está el
     «?», así que el recorrido vuelve a salir para quien ya vio la versión 1. */
  'motos.lista': tourDeLista({
    clave: 'motos.lista',
    version: 2,
    nombre: 'Motos',
    singular: 'moto',
    plural: 'las motos',
    crear: 'Publicar moto',
    textos: {
      acciones: {
        texto:
          'Aquí está lo que se le puede hacer a una moto sin abrir la ficha — entre otras, marcarla como vendida, que la saca del sitio pero conserva el registro. Eliminar va de último y siempre pregunta.',
      },
    },
    extra: [
      {
        ancla: 'motos.papeles',
        titulo: 'Los papeles avisan solos',
        texto:
          'SOAT y tecnomecánica son lo único que caduca sin que nadie lo toque. Cuando a alguna moto usada le queden 30 días o menos, aparece esta franja y lleva directo a las afectadas.',
        lado: 'bottom',
        alineacion: 'start',
      },
    ],
  }),

  'motos.ficha': tourDeFicha({
    clave: 'motos.ficha',
    version: 1,
    nombre: 'Motos',
    singular: 'moto',
    textos: {
      secciones: {
        texto:
          'Una moto tiene 41 campos: en un formulario de corrido no se encuentra nada. Cada pestaña agrupa los que se piensan juntos, y moverte entre ellas no pierde lo escrito.',
      },
    },
  }),
} satisfies Record<string, DefinicionTour>;

export type ClaveTour = keyof typeof DEFINICIONES;

/**
 * El `satisfies` de arriba comprueba cada definición y deja inferir las claves
 * exactas; esta línea ensancha los valores a `DefinicionTour`, porque si no el
 * tipo de `TOURS[clave]` sería la unión de los literales y un campo opcional
 * que solo usa una definición (`retraso`) «no existiría» en las demás.
 */
export const TOURS: Record<ClaveTour, DefinicionTour> = DEFINICIONES;

/** El orden en que se listan en Configuración: el mismo en que se declaran. */
export const TOURS_ORDENADOS: DefinicionTour[] = Object.values(TOURS);

export function esClaveTour(clave: string): clave is ClaveTour {
  return clave in DEFINICIONES;
}
