import {
  Award,
  BatteryCharging,
  Bike,
  CalendarCheck,
  CircleDot,
  ClipboardCheck,
  Cog,
  Cpu,
  Disc,
  Droplet,
  Fuel,
  Gauge,
  Hammer,
  Headphones,
  LifeBuoy,
  Lightbulb,
  Package,
  Paintbrush,
  Settings,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Timer,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * El catálogo de iconos de un servicio.
 *
 * **Son iconos de `lucide-react`, no emojis** (decisión del usuario en la Fase
 * 3 del plan CMS). Lo que se guarda en la base es la clave de este mapa —el
 * nombre del icono en kebab-case, `wrench`, `shield-check`—, no el componente;
 * el backend solo comprueba la forma del nombre, así que **agregar un icono no
 * obliga a tocar el backend ni a migrar**.
 *
 * ### Cómo se amplía la lista
 *
 * 1. Busca el icono en <https://lucide.dev/icons> y anota su nombre.
 * 2. Impórtalo arriba (en PascalCase) y agrégalo a `ICONOS_SERVICIO` con su
 *    nombre en kebab-case y una etiqueta que diga **para qué sirve en el
 *    taller**, no cómo se llama el dibujo («Frenos», no «Disco»).
 * 3. Haz lo mismo en `web/src/utils/service-icons.tsx`, que es el espejo del
 *    sitio público. **Son dos paquetes distintos y ninguno depende del otro**,
 *    igual que las utilidades de horarios de `service-point`.
 *
 * Si el sitio se encuentra un nombre que no está en su mapa, cae en
 * `ICONO_POR_DEFECTO` en vez de romperse: la lista puede crecer aquí primero.
 */
export interface IconoServicio {
  /** Lo que se guarda en `service.icon`. */
  name: string;
  label: string;
  Icon: LucideIcon;
}

export const ICONOS_SERVICIO: IconoServicio[] = [
  { name: 'wrench', label: 'Mantenimiento', Icon: Wrench },
  { name: 'cog', label: 'Motor', Icon: Cog },
  { name: 'settings', label: 'Ajustes generales', Icon: Settings },
  { name: 'hammer', label: 'Reparación', Icon: Hammer },
  { name: 'gauge', label: 'Diagnóstico', Icon: Gauge },
  { name: 'cpu', label: 'Electrónica e inyección', Icon: Cpu },
  { name: 'clipboard-check', label: 'Revisión e inspección', Icon: ClipboardCheck },
  { name: 'shield-check', label: 'Garantía y seguridad', Icon: ShieldCheck },
  { name: 'disc', label: 'Frenos', Icon: Disc },
  { name: 'circle-dot', label: 'Llantas', Icon: CircleDot },
  { name: 'droplet', label: 'Aceite y lubricación', Icon: Droplet },
  { name: 'fuel', label: 'Combustible', Icon: Fuel },
  { name: 'battery-charging', label: 'Batería', Icon: BatteryCharging },
  { name: 'zap', label: 'Sistema eléctrico', Icon: Zap },
  { name: 'lightbulb', label: 'Luces', Icon: Lightbulb },
  { name: 'sparkles', label: 'Lavado y estética', Icon: Sparkles },
  { name: 'spray-can', label: 'Detallado', Icon: SprayCan },
  { name: 'paintbrush', label: 'Pintura', Icon: Paintbrush },
  { name: 'bike', label: 'Moto completa', Icon: Bike },
  { name: 'package', label: 'Repuestos', Icon: Package },
  { name: 'truck', label: 'Recogida y entrega', Icon: Truck },
  { name: 'life-buoy', label: 'Asistencia en vía', Icon: LifeBuoy },
  { name: 'calendar-check', label: 'Cita programada', Icon: CalendarCheck },
  { name: 'timer', label: 'Servicio rápido', Icon: Timer },
  { name: 'award', label: 'Servicio certificado', Icon: Award },
  { name: 'headphones', label: 'Asesoría', Icon: Headphones },
];

export const ICONO_POR_DEFECTO = Wrench;

const POR_NOMBRE = new Map(ICONOS_SERVICIO.map((icono) => [icono.name, icono]));

/** El componente del icono guardado, o la llave inglesa si no se reconoce. */
export function iconoDeServicio(name?: string | null): LucideIcon {
  return (name && POR_NOMBRE.get(name)?.Icon) || ICONO_POR_DEFECTO;
}

/** Para qué sirve el icono, en palabras. `null` si no está en el catálogo. */
export function etiquetaDeIcono(name?: string | null): string | null {
  return (name && POR_NOMBRE.get(name)?.label) ?? null;
}
