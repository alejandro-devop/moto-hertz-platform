import { AdminShell } from '@/components/admin/admin-shell';

/**
 * Toda ruta del panel exige la cookie de sesión (ver `middleware.ts`), así que
 * ninguna se puede prerenderizar. Declararlo aquí también habilita
 * `useSearchParams` en los filtros de la lista.
 */
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
