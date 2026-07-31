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
  type LucideIcon,
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
} from "lucide-react";

/**
 * Espejo del catálogo de iconos del panel
 * (`cms-admin/lib/service-icons.ts`). **Está duplicado a propósito**: son dos
 * paquetes distintos y ninguno depende del otro, igual que las utilidades de
 * horarios de los puntos de atención.
 *
 * Lo que llega del backend es la clave (`wrench`, `shield-check`), nunca el
 * componente. Si el panel estrena un icono que este mapa todavía no conoce, el
 * sitio pinta la llave inglesa en vez de romperse — así se puede ampliar la
 * lista del panel sin desplegar el sitio el mismo día.
 *
 * Para agregar uno: impórtalo de `lucide-react` y agrégalo aquí con la **misma
 * clave** que en el panel.
 */
const ICONOS: Record<string, LucideIcon> = {
  wrench: Wrench,
  cog: Cog,
  settings: Settings,
  hammer: Hammer,
  gauge: Gauge,
  cpu: Cpu,
  "clipboard-check": ClipboardCheck,
  "shield-check": ShieldCheck,
  disc: Disc,
  "circle-dot": CircleDot,
  droplet: Droplet,
  fuel: Fuel,
  "battery-charging": BatteryCharging,
  zap: Zap,
  lightbulb: Lightbulb,
  sparkles: Sparkles,
  "spray-can": SprayCan,
  paintbrush: Paintbrush,
  bike: Bike,
  package: Package,
  truck: Truck,
  "life-buoy": LifeBuoy,
  "calendar-check": CalendarCheck,
  timer: Timer,
  award: Award,
  headphones: Headphones,
};

/** El icono del servicio, o la llave inglesa si el nombre no se reconoce. */
export function ServiceIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && ICONOS[name]) || Wrench;
  return <Icon className={className} aria-hidden strokeWidth={1.75} />;
}
