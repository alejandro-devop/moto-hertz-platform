import {
  Bike,
  FileText,
  GalleryHorizontal,
  Images,
  MapPin,
  Newspaper,
  Settings,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export interface NavLink {
  href: string;
  /** Etiqueta completa: barra lateral y hoja de navegación. */
  label: string;
  /** Etiqueta corta: solo cabe esto debajo del icono en la barra inferior. */
  short: string;
  icon: LucideIcon;
  group: 'Catálogo' | 'Contenido' | 'Sistema';
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
  {
    href: '/banners',
    label: 'Banners',
    short: 'Banners',
    icon: GalleryHorizontal,
    group: 'Contenido',
  },
  /* Medios va de último: es la caja de herramientas, no una sección del sitio.
     Las fotos se suben desde cada ficha; aquí se entra a buscar o a borrar. */
  { href: '/medios', label: 'Medios', short: 'Medios', icon: Images, group: 'Contenido' },
  /* Contenido editorial suelto de cada página (heading, bajada), no un
     catálogo de registros — mismo grupo que Configuración por eso. */
  {
    href: '/paginas',
    label: 'Páginas',
    short: 'Páginas',
    icon: FileText,
    group: 'Sistema',
  },
  /* Grupo aparte: no es catálogo ni contenido del sitio, es un registro único
     de configuración (Fase 6 del plan CMS). Desborda a la hoja «Más» en móvil
     igual que Medios, porque no es de lo que más se visita. */
  {
    href: '/configuracion',
    label: 'Configuración',
    short: 'Config',
    icon: Settings,
    group: 'Sistema',
  },
];

export const navGroups = ['Catálogo', 'Contenido', 'Sistema'] as const;

/** El destino activo, resolviendo también las rutas hijas (`/motos/nueva`). */
export function activeLink(pathname: string): NavLink | undefined {
  return navLinks.find(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
  );
}
