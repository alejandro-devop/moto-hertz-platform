'use client';

import { useEffect, useState } from 'react';
import { Field } from '@/components/admin/form-fields';
import { PageHeader } from '@/components/admin/page-header';
import { ErrorState, TableSkeleton } from '@/components/admin/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registrarError } from '@/lib/errors';
import { PAGE_FIELDS, PAGE_LABELS } from './page-fields';
import { usePageContentMutations, usePageContentQuery } from './use-page-content';

const PAGE = 'motos';

/**
 * Contenido editorial suelto de `/motos` (encabezado, bajada): pedido del
 * usuario en MEJORAS.md, resuelto con la tabla genérica `page_content` en vez
 * de una columna nueva por texto. Solo una página por ahora — agregar la
 * próxima es sumarla a `page-fields.ts` y repetir un módulo así, no
 * construir un sistema nuevo.
 */
export default function PaginasPage() {
  const fields = PAGE_FIELDS[PAGE];
  const { data, isLoading, isError, error, refetch, isFetching } = usePageContentQuery(PAGE);
  const { setMany } = usePageContentMutations(PAGE);

  const [form, setForm] = useState<Record<string, string>>({});
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    if (isError) registrarError('paginas', error);
  }, [isError, error]);

  /* El formulario se ancla la primera vez que llegan datos, no en cada
     revalidación en segundo plano — mismo criterio que /configuracion, para
     no borrar una edición sin guardar si TanStack Query refetchea sola. */
  useEffect(() => {
    if (!data || cargado) return;
    const guardados = new Map(data.pageContent.map((item) => [item.field, item.value ?? '']));
    const inicial: Record<string, string> = {};
    for (const campo of fields) {
      inicial[campo.key] = guardados.get(campo.key) ?? campo.default;
    }
    setForm(inicial);
    setCargado(true);
  }, [data, cargado, fields]);

  async function guardar() {
    await setMany.mutateAsync(
      fields.map((campo) => ({ field: campo.key, value: form[campo.key] ?? '' }))
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Páginas"
        summary="El encabezado y la bajada de cada página del sitio. Un campo vacío no se guarda vacío de verdad: usa el mismo texto que hoy trae el sitio hasta que lo cambies."
      />

      {isError ? (
        <ErrorState
          description="No se pudo cargar el contenido de la página."
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : isLoading || !cargado ? (
        <TableSkeleton rows={2} />
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground">{PAGE_LABELS[PAGE]}</h2>

          {fields.map((campo) => (
            <Field key={campo.key} label={campo.label} htmlFor={campo.key} hint={campo.hint}>
              {campo.multiline ? (
                <textarea
                  id={campo.key}
                  value={form[campo.key] ?? ''}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [campo.key]: event.target.value }))
                  }
                  rows={3}
                  className="min-h-20 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              ) : (
                <Input
                  id={campo.key}
                  value={form[campo.key] ?? ''}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [campo.key]: event.target.value }))
                  }
                />
              )}
            </Field>
          ))}

          <div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:mx-0 sm:rounded-lg sm:border">
            <span className="flex-1 font-mono text-[11px] text-muted-foreground">
              {setMany.isPending ? 'Guardando…' : `Editando ${PAGE_LABELS[PAGE]}`}
            </span>
            <Button onClick={guardar} disabled={setMany.isPending} className="h-11 md:h-9">
              Guardar cambios
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
