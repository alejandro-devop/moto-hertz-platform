import { z } from 'zod';
import { slugify, toDateInput } from '@/lib/format';
import { erroresDeZod, textoOpcional } from '@/lib/form-state';
import type { ResultadoValidacion } from '@/lib/use-ficha-state';
import type { News, NewsFormInput } from '@/lib/graphql/news';
import { tiempoDeLecturaSugerido } from '@/lib/news-status';
import { seccionDeCampo, type SeccionId } from './form-sections';

/**
 * El formulario es plano, y aquí sí que casi coincide con el backend: `news`
 * no tiene ningún campo anidado (a diferencia de `pricing` en `service` o
 * `location`/`hours` en `service-point`).
 */
export interface FormState {
  slug: string;
  /** `true` cuando alguien editó el slug a mano: deja de derivarse del título. */
  slugManual: boolean;
  title: string;
  author: string;
  category: string;
  image: string;
  excerpt: string;
  /** HTML del editor enriquecido. */
  content: string;
  /** `'YYYY-MM-DD'` para el `<input type="date">`, o `''` = borrador. */
  publishedAt: string;
  featured: boolean;
  tags: string[];
  readTime: string;
  /** `true` cuando alguien escribió el tiempo de lectura a mano. */
  readTimeManual: boolean;
}

export const EMPTY_FORM: FormState = {
  slug: '',
  slugManual: false,
  title: '',
  author: '',
  category: '',
  image: '',
  excerpt: '',
  content: '',
  /* Una noticia nueva arranca sin fecha: es lo que la deja en borrador hasta
     que alguien decida publicarla, ver `lib/news-status.ts`. */
  publishedAt: '',
  featured: false,
  tags: [],
  readTime: '',
  readTimeManual: false,
};

export function newsToForm(noticia: News): FormState {
  return {
    slug: noticia.slug,
    /* Una noticia que ya existe conserva su slug: cambiarlo rompe su enlace. */
    slugManual: true,
    title: noticia.title,
    author: noticia.author ?? '',
    category: noticia.category ?? '',
    image: noticia.image ?? '',
    excerpt: noticia.excerpt ?? '',
    content: noticia.content ?? '',
    publishedAt: toDateInput(noticia.publishedAt),
    featured: noticia.featured,
    tags: [...noticia.tags],
    readTime: noticia.readTime ?? '',
    readTimeManual: true,
  };
}

/** El slug se deriva del título mientras nadie lo haya tocado. */
export function slugSugerido(form: FormState): string {
  return slugify(form.title);
}

/**
 * El tiempo de lectura se sugiere del contenido mientras nadie lo haya
 * escrito a mano — mismo gesto que el slug con el título.
 */
export function readTimeSugerido(form: FormState): string {
  return tiempoDeLecturaSugerido(form.content);
}

export function formToInput(form: FormState): NewsFormInput {
  const trim = textoOpcional;

  return {
    slug: form.slug.trim(),
    title: form.title.trim(),
    excerpt: trim(form.excerpt),
    content: trim(form.content),
    author: trim(form.author),
    category: trim(form.category),
    /* `''` (sin fecha) viaja como `null` explícito: así una noticia que ya
       tenía fecha puede volver a borrador, no solo dejarla intacta. */
    publishedAt: form.publishedAt ? `${form.publishedAt}T00:00:00.000Z` : null,
    featured: form.featured,
    tags: form.tags.map((item) => item.trim()).filter(Boolean),
    image: trim(form.image),
    readTime: trim(form.readTime),
  };
}

/* -------------------------------------------------------------------------- *
 * Validación
 * -------------------------------------------------------------------------- */

const esquema = z.object({
  title: z.string().trim().min(1, 'Ponle un título: así la van a encontrar en el sitio.'),
  slug: z
    .string()
    .trim()
    .min(1, 'El slug identifica la noticia en el sitio.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones simples.'),
  excerpt: z.string().trim().max(500, 'El resumen es la línea de la tarjeta: máximo 500 caracteres.'),
});

export function validar(form: FormState): ResultadoValidacion<SeccionId> {
  const errores = erroresDeZod(esquema.safeParse(form));

  /* Una etiqueta en blanco en medio de la lista no se guarda, pero avisarlo
     evita que alguien crea que se perdió lo que escribió (mismo gesto que
     `features`/`benefits` en `servicios`). */
  if (form.tags.length > 0 && form.tags.every((item) => !item.trim())) {
    errores.tags = 'Escribe la etiqueta o quita el renglón.';
  }

  const primerCampo = Object.keys(errores)[0];
  return {
    errores,
    primeraSeccion: primerCampo ? seccionDeCampo(primerCampo) : undefined,
  };
}
