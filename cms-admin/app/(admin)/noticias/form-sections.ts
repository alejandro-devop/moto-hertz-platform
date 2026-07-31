import { seccionDeCampo as buscarSeccion, type SeccionFicha } from '@/lib/form-sections';

export type SeccionId = 'identidad' | 'contenido' | 'publicacion';

export type Seccion = SeccionFicha<SeccionId>;

/**
 * Tal como lo pide el documento de la fase: identidad de la noticia,
 * contenido y publicación — separado, porque publicar es una decisión aparte
 * de escribir.
 */
export const SECCIONES: Seccion[] = [
  {
    id: 'identidad',
    label: 'Identidad',
    hint: 'Cómo se llama la noticia, quién la escribe y con qué se ilustra.',
    campos: ['title', 'slug', 'author', 'category', 'image'],
  },
  {
    id: 'contenido',
    label: 'Contenido',
    hint: 'El resumen de la tarjeta y el cuerpo completo del detalle.',
    campos: ['excerpt', 'content'],
  },
  {
    id: 'publicacion',
    label: 'Publicación',
    hint: 'Cuándo sale, si va destacada y con qué etiquetas.',
    campos: ['publishedAt', 'featured', 'tags', 'readTime'],
  },
];

/** A qué sección pertenece un campo, para saltar al primer error. */
export function seccionDeCampo(campo: string): SeccionId | undefined {
  return buscarSeccion(SECCIONES, campo);
}
