import { seccionDeCampo as buscarSeccion, type SeccionFicha } from '@/lib/form-sections';

export type SeccionId = 'identidad' | 'contacto' | 'ubicacion' | 'horarios';

export type Seccion = SeccionFicha<SeccionId>;

/**
 * Los campos agrupados como los piensa quien los llena: qué punto es, cómo lo
 * contactan, dónde queda y cuándo abre.
 */
export const SECCIONES: Seccion[] = [
  {
    id: 'identidad',
    label: 'Identidad',
    hint: 'Qué punto es y cómo se llama en el sitio.',
    campos: ['name', 'slug', 'type'],
  },
  {
    id: 'contacto',
    label: 'Contacto',
    hint: 'Por dónde le escriben o le marcan.',
    campos: ['phone', 'whatsapp', 'email'],
  },
  {
    id: 'ubicacion',
    label: 'Ubicación',
    hint: 'La dirección y el enlace de Google Maps del punto.',
    campos: ['street', 'neighborhood', 'city', 'state', 'mapsUrl'],
  },
  {
    id: 'horarios',
    label: 'Horarios',
    hint: 'Los días que abre y a qué horas. Un día apagado sale como cerrado.',
    campos: ['hours'],
  },
];

/** A qué sección pertenece un campo, para saltar al primer error. */
export function seccionDeCampo(campo: string): SeccionId | undefined {
  return buscarSeccion(SECCIONES, campo);
}
