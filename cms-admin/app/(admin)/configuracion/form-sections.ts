import { seccionDeCampo as buscarSeccion, type SeccionFicha } from '@/lib/form-sections';

export type SeccionId = 'contacto' | 'redes' | 'seo' | 'textos';

export type Seccion = SeccionFicha<SeccionId>;

/**
 * Las cuatro secciones que resolvió el inventario de la Fase 6: contacto,
 * redes, SEO y el único texto que se administra (el nombre del sitio). El
 * orden es el mismo del documento de la fase.
 */
export const SECCIONES: Seccion[] = [
  {
    id: 'contacto',
    label: 'Contacto',
    hint: 'Cómo te encuentra alguien que quiere escribirte o llamarte.',
    campos: ['phone', 'email', 'whatsapp', 'address'],
  },
  {
    id: 'redes',
    label: 'Redes sociales',
    hint: 'Los enlaces de los íconos del pie de página.',
    campos: ['socialFacebook', 'socialInstagram', 'socialTwitter', 'socialYoutube'],
  },
  {
    id: 'seo',
    label: 'SEO',
    hint: 'Cómo se ve el sitio en los resultados de Google y al compartirlo en redes.',
    campos: ['seoTitle', 'seoDescription', 'seoKeywords', 'seoImage'],
  },
  {
    id: 'textos',
    label: 'Textos',
    hint: 'El nombre del sitio: pie de página, título de la pestaña y autor por defecto de las noticias.',
    campos: ['siteName'],
  },
];

/** A qué sección pertenece un campo, para saltar al primer error. */
export function seccionDeCampo(campo: string): SeccionId | undefined {
  return buscarSeccion(SECCIONES, campo);
}
