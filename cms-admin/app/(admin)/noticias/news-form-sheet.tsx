'use client';

import { CalendarClock, TriangleAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ALTO_CAMPO, Field, ToggleRow } from '@/components/admin/form-fields';
import { FormSheet } from '@/components/admin/form-sheet';
import { ImagePicker } from '@/components/admin/image-picker';
import { ListaEditable } from '@/components/admin/list-editor';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { humanizeDays } from '@/lib/format';
import { ETIQUETAS_ESTADO_NOTICIA, getNewsStatus, newsStatusTone } from '@/lib/news-status';
import { StatusPill } from '@/components/admin/status-pill';
import { useFichaState } from '@/lib/use-ficha-state';
import { cn } from '@/lib/utils';
import type { News, NewsFormInput } from '@/lib/graphql/news';
import { SECCIONES, seccionDeCampo, type SeccionId } from './form-sections';
import {
  EMPTY_FORM,
  formToInput,
  newsToForm,
  readTimeSugerido,
  slugSugerido,
  validar,
  type FormState,
} from './news-form-state';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noticia: News | null;
  seccionInicial?: SeccionId;
  slugsEnUso: string[];
  /** Las categorías que ya existen, para sugerirlas y que converjan. */
  categorias: string[];
  onSubmit: (input: NewsFormInput) => Promise<unknown>;
  submitting: boolean;
}

export function NewsFormSheet({
  open,
  onOpenChange,
  noticia,
  seccionInicial,
  slugsEnUso,
  categorias,
  onSubmit,
  submitting,
}: Props) {
  const slugRepetido = (form: FormState) =>
    form.slug.trim().length > 0 &&
    slugsEnUso.includes(form.slug.trim()) &&
    form.slug.trim() !== noticia?.slug;

  /* El estado de la ficha es el mismo en todas las secciones del panel: vive
     en `lib/use-ficha-state.ts` desde la Fase 3. Aquí solo va lo del dominio:
     el slug sigue al título y el tiempo de lectura sigue al contenido,
     mientras nadie los haya tocado a mano. */
  const { form, setForm, set, seccion, setSeccion, errores, setErrores, sucio, handleSubmit } =
    useFichaState<FormState, SeccionId, News>({
      open,
      registro: noticia,
      seccionInicial,
      seccionPorDefecto: 'identidad',
      vacio: EMPTY_FORM,
      aForm: newsToForm,
      derivar: (siguiente, campo) => {
        let resultado = siguiente;
        if (campo === 'title' && !resultado.slugManual) {
          resultado = { ...resultado, slug: slugSugerido(resultado) };
        }
        if (campo === 'content' && !resultado.readTimeManual) {
          resultado = { ...resultado, readTime: readTimeSugerido(resultado) };
        }
        return resultado;
      },
      validar,
      validarExtra: (actual): Record<string, string> =>
        slugRepetido(actual) ? { slug: 'Ya hay otra noticia con este slug. Cámbialo.' } : {},
      seccionDeCampo,
      onSubmit: (actual) => onSubmit(formToInput(actual)),
    });

  const avisoSlug = slugRepetido(form);
  const estado = getNewsStatus(form.publishedAt ? `${form.publishedAt}T00:00:00.000Z` : null);
  const dias = form.publishedAt
    ? Math.round(
        (new Date(`${form.publishedAt}T00:00:00.000Z`).getTime() -
          new Date(new Date().toDateString()).getTime()) /
          86_400_000
      )
    : null;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      titulo={noticia ? noticia.title : 'Agregar una noticia'}
      descripcion={
        noticia
          ? 'Los cambios salen en el sitio al guardar, si la noticia está publicada.'
          : 'Con el título y el contenido ya se puede guardar; queda en borrador hasta que le pongas fecha.'
      }
      secciones={SECCIONES}
      seccion={seccion}
      onSeccionChange={setSeccion}
      errores={errores}
      sucio={sucio}
      submitting={submitting}
      submitLabel={noticia ? 'Guardar cambios' : 'Agregar noticia'}
      onSubmit={handleSubmit}
    >
      {/* ------------------------------------------- identidad --- */}
      <TabsContent value="identidad" className="flex flex-col gap-4">
        <Field label="Título" htmlFor="title" required error={errores.title}>
          <Input
            id="title"
            value={form.title}
            onChange={(event) => set('title', event.target.value)}
            placeholder="Yamaha presenta la nueva MT-10 2024"
            className={ALTO_CAMPO}
          />
        </Field>

        <Field
          label="Slug"
          htmlFor="slug"
          required
          error={errores.slug}
          hint={
            form.slugManual
              ? 'Cambiarlo rompe el enlace que ya esté circulando.'
              : 'Se arma solo con el título. Escríbelo si quieres otro.'
          }
        >
          <Input
            id="slug"
            value={form.slug}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, slug: event.target.value, slugManual: true }));
              setErrores((prev) => ({ ...prev, slug: '' }));
            }}
            placeholder="yamaha-mt-10-2024-lanzamiento"
            className={cn(ALTO_CAMPO, 'font-mono text-sm')}
          />
        </Field>
        {avisoSlug && !errores.slug ? (
          <p className="-mt-2 flex items-center gap-1.5 text-xs font-medium text-warning">
            <TriangleAlert className="size-3.5" />
            Ya hay otra noticia con este slug.
          </p>
        ) : null}

        <Field label="Autor" htmlFor="author" hint="El nombre de quien la escribe.">
          <Input
            id="author"
            value={form.author}
            onChange={(event) => set('author', event.target.value)}
            placeholder="Carlos Rodríguez"
            className={ALTO_CAMPO}
          />
        </Field>

        <Field
          label="Categoría"
          htmlFor="category"
          hint="Agrupa las noticias en el sitio y en la lista. Escribe una nueva o elige de las que ya usaste."
        >
          <Input
            id="category"
            list="categorias-de-noticia"
            value={form.category}
            onChange={(event) => set('category', event.target.value)}
            placeholder="Lanzamientos"
            className={ALTO_CAMPO}
          />
          <datalist id="categorias-de-noticia">
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria} />
            ))}
          </datalist>
        </Field>

        <Field label="Portada" hint="Sale en el listado y en el detalle. Sin ella, se ve igual, solo sin foto.">
          <ImagePicker value={form.image} onChange={(url) => set('image', url)} />
        </Field>
      </TabsContent>

      {/* ------------------------------------------- contenido --- */}
      <TabsContent value="contenido" className="flex flex-col gap-4">
        <Field
          label="Resumen"
          htmlFor="excerpt"
          error={errores.excerpt}
          hint="Una o dos líneas: es lo único que se lee en la tarjeta antes de abrirla."
        >
          <Textarea
            id="excerpt"
            value={form.excerpt}
            onChange={(event) => set('excerpt', event.target.value)}
            placeholder="La icónica naked japonesa llega con mejoras en electrónica."
            rows={3}
          />
        </Field>

        <Field
          label="Contenido"
          error={errores.content}
          hint="Lo que se lee al abrir el detalle. Negrita, encabezados, listas y enlaces."
        >
          <RichTextEditor
            value={form.content}
            onChange={(html) => set('content', html)}
            placeholder="Escribe la noticia…"
            error={errores.content}
          />
        </Field>
      </TabsContent>

      {/* ------------------------------------------ publicación --- */}
      <TabsContent value="publicacion" className="flex flex-col gap-4">
        <Field
          label="Fecha de publicación"
          htmlFor="publishedAt"
          hint="Sin fecha, la noticia queda en borrador y no se ve en el sitio."
        >
          <Input
            id="publishedAt"
            type="date"
            value={form.publishedAt}
            onChange={(event) => set('publishedAt', event.target.value)}
            className={cn(ALTO_CAMPO, 'font-mono')}
          />
        </Field>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-[13px]">
          <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
          <StatusPill tone={newsStatusTone(estado)}>{ETIQUETAS_ESTADO_NOTICIA[estado]}</StatusPill>
          <span className="text-muted-foreground">
            {estado === 'borrador'
              ? 'No se ve en el sitio hasta que le pongas fecha.'
              : estado === 'programada' && dias !== null
                ? `Sale sola ${humanizeDays(dias)} — nadie tiene que hacer nada más, pero solo se refleja cuando alguien recargue el sitio ese día.`
                : 'Ya se puede ver en el sitio.'}
          </span>
        </div>

        <ToggleRow
          label="Destacar en el sitio"
          hint="Las destacadas salen arriba, en su propia franja."
          checked={form.featured}
          onCheckedChange={(featured) => set('featured', featured)}
        />

        <Field label="Etiquetas" error={errores.tags} hint="Palabras clave del sitio. El orden no importa aquí.">
          <ListaEditable
            items={form.tags}
            onChange={(tags) => set('tags', tags)}
            etiquetaItem="etiqueta"
            placeholder="Lanzamiento"
          />
        </Field>

        <Field
          label="Tiempo de lectura"
          htmlFor="readTime"
          hint={
            form.readTimeManual
              ? 'Escrito a mano. Bórralo para que vuelva a calcularse del contenido.'
              : 'Se calcula solo con el contenido. Escríbelo si prefieres otro valor.'
          }
        >
          <Input
            id="readTime"
            value={form.readTime}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, readTime: event.target.value, readTimeManual: true }));
              setErrores((prev) => ({ ...prev, readTime: '' }));
            }}
            placeholder="5 min"
            className={ALTO_CAMPO}
          />
        </Field>
      </TabsContent>
    </FormSheet>
  );
}
