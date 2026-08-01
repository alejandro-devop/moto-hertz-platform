/**
 * El texto del buscador de cada lista — hoy solo el placeholder, uno por
 * módulo. El campo en sí vive en la fila de filtros de cada lista
 * (`BuscadorLista`, dentro de `components/admin/filter-bar.tsx`), no en la
 * barra superior: un buscador que cambia de sección según dónde esté parado
 * quien administra se lee como un buscador global, no como el buscador de
 * la lista que se está mirando.
 */
export const BUSCADORES: Record<string, { placeholder: string }> = {
  '/motos': { placeholder: 'Buscar por nombre o matrícula' },
  '/puntos-de-atencion': { placeholder: 'Buscar por nombre o dirección' },
  '/servicios': { placeholder: 'Buscar por nombre o categoría' },
  '/noticias': { placeholder: 'Buscar por título o autor' },
  '/banners': { placeholder: 'Buscar por título' },
  '/medios': { placeholder: 'Buscar por nombre de archivo' },
};
