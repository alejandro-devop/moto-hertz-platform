import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/states';

/**
 * Módulo todavía sin backend. Dice qué falta y de qué depende, en vez de
 * dejar la pantalla en blanco con un «próximamente».
 */
export function Proximamente({
  titulo,
  dominio,
}: {
  titulo: string;
  dominio: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={titulo} summary="Todavía no se puede administrar desde el panel" />
      <EmptyState
        icon={Construction}
        title={`${titulo} está pendiente`}
        description={`Esta pantalla sigue el mismo patrón que Motos —lista, filtros y ficha por secciones— en cuanto el backend exponga el dominio "${dominio}".`}
      />
    </div>
  );
}
