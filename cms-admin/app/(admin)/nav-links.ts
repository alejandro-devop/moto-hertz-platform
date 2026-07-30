import { Bike, MapPin, Newspaper, Wrench, type LucideIcon } from 'lucide-react';

export interface NavLink {
  href: string;
  /** Etiqueta completa: barra lateral y hoja de navegación. */
  label: string;
  /** Etiqueta corta: solo cabe esto debajo del icono en la barra inferior. */
  short: string;
  icon: LucideIcon;
  group: 'Catálogo' | 'Contenido';
}

export const navLinks: NavLink[] = [
  { href: '/motos', label: 'Motos', short: 'Motos', icon: Bike, group: 'Catálogo' },
  {
    href: '/puntos-de-atencion',
    label: 'Puntos de atención',
    short: 'Puntos',
    icon: MapPin,
    group: 'Catálogo',
  },
  { href: '/servicios', label: 'Servicios', short: 'Servicios', icon: Wrench, group: 'Catálogo' },
  { href: '/noticias', label: 'Noticias', short: 'Noticias', icon: Newspaper, group: 'Contenido' },
];

export const navGroups = ['Catálogo', 'Contenido'] as const;

/** El destino activo, resolviendo también las rutas hijas (`/motos/nueva`). */
export function activeLink(pathname: string): NavLink | undefined {
  return navLinks.find(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
  );
}
