'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/page-header';
import { ErrorState, TableSkeleton } from '@/components/admin/states';
import { registrarError } from '@/lib/errors';
import type { SiteSettings, SiteSettingsFormInput } from '@/lib/graphql/site-settings';
import { SiteSettingsForm } from './site-settings-form';
import { useSiteSettingsMutations, useSiteSettingsQuery } from './use-site-settings';

/**
 * `site_settings` es un registro único (Fase 6 del plan CMS): a diferencia de
 * todos los módulos anteriores, esta página no es una lista que abre una
 * ficha — es la ficha, directo. Ver `docs/cms-plan/phases/06-configuracion-sitio.md`.
 */
export default function ConfiguracionPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useSiteSettingsQuery();
  const { edit } = useSiteSettingsMutations();

  /**
   * La ficha se ancla a un `registro` que solo cambia cuando ESTE componente
   * decide que cambie (al cargar por primera vez, o tras guardar) — no cada
   * vez que TanStack Query revalida la consulta en segundo plano (por
   * ejemplo, al recuperar el foco de la ventana). Si se ató directo a `data`,
   * un refetch a mitad de una edición sin guardar borraría lo que se estaba
   * escribiendo.
   */
  const [registro, setRegistro] = useState<SiteSettings | null>(null);

  useEffect(() => {
    if (data?.siteSettings && !registro) setRegistro(data.siteSettings);
  }, [data, registro]);

  useEffect(() => {
    if (isError) registrarError('configuracion', error);
  }, [isError, error]);

  async function guardar(input: SiteSettingsFormInput) {
    const resultado = await edit.mutateAsync(input);
    setRegistro(resultado.siteSettingsEdit);
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Configuración del sitio"
        summary="Contacto, redes sociales, SEO y el nombre del sitio. Es un solo registro: se edita, no se crea ni se elimina."
      />

      {isError ? (
        <ErrorState
          description="No se pudo cargar la configuración del sitio."
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : isLoading || !registro ? (
        <TableSkeleton rows={4} />
      ) : (
        <SiteSettingsForm config={registro} onSubmit={guardar} submitting={edit.isPending} />
      )}
    </div>
  );
}
