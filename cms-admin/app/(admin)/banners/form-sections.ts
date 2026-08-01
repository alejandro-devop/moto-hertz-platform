import { seccionDeCampo as buscarSeccion, type SeccionFicha } from '@/lib/form-sections';

export type SeccionId = 'contenido' | 'enlace' | 'vigencia';

export type Seccion = SeccionFicha<SeccionId>;

/**
 * Contenido (lo que se ve), enlace (a dónde lleva) y vigencia (cuándo se ve):
 * son tres decisiones distintas al armar un banner.
 */
export const SECCIONES: Seccion[] = [
  {
    id: 'contenido',
    label: 'Contenido',
    hint: 'La imagen y el texto que se ven sobre ella.',
    campos: ['title', 'subtitle', 'image', 'imageMobile'],
  },
  {
    id: 'enlace',
    label: 'Enlace',
    hint: 'A dónde lleva el banner al hacerle clic, y con qué botón.',
    campos: ['link', 'linkLabel'],
  },
  {
    id: 'vigencia',
    label: 'Vigencia',
    hint: 'Si está activo hoy, y desde/hasta cuándo se ve en el sitio.',
    campos: ['active', 'startsAt', 'endsAt'],
  },
];

/** A qué sección pertenece un campo, para saltar al primer error. */
export function seccionDeCampo(campo: string): SeccionId | undefined {
  return buscarSeccion(SECCIONES, campo);
}
