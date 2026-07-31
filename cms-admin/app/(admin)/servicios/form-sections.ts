import { seccionDeCampo as buscarSeccion, type SeccionFicha } from '@/lib/form-sections';

export type SeccionId = 'identidad' | 'descripcion' | 'incluye' | 'precio';

export type Seccion = SeccionFicha<SeccionId>;

/**
 * Los campos agrupados como los piensa quien los llena: qué servicio es, cómo
 * se cuenta, qué incluye y cuánto vale.
 */
export const SECCIONES: Seccion[] = [
  {
    id: 'identidad',
    label: 'Identidad',
    hint: 'Qué servicio es, cómo se llama y con qué se ilustra.',
    campos: ['name', 'slug', 'category', 'icon', 'image', 'featured'],
  },
  {
    id: 'descripcion',
    label: 'Descripción',
    hint: 'La línea de la tarjeta y el texto largo del detalle.',
    campos: ['shortDescription', 'fullDescription'],
  },
  {
    id: 'incluye',
    label: 'Qué incluye',
    hint: 'Lo que trae el servicio y lo que gana el cliente, en orden.',
    campos: ['features', 'benefits'],
  },
  {
    id: 'precio',
    label: 'Precio y duración',
    hint: 'Cuánto vale, cada cuánto se hace y cuánto se demora.',
    campos: ['pricingMode', 'pricingAmount', 'pricingNote', 'duration'],
  },
];

/** A qué sección pertenece un campo, para saltar al primer error. */
export function seccionDeCampo(campo: string): SeccionId | undefined {
  return buscarSeccion(SECCIONES, campo);
}
