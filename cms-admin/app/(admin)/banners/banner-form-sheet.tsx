'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ALTO_CAMPO, Field, Grid, ToggleRow } from '@/components/admin/form-fields';
import { FormSheet } from '@/components/admin/form-sheet';
import { ImagePicker } from '@/components/admin/image-picker';
import { useFichaState } from '@/lib/use-ficha-state';
import { cn } from '@/lib/utils';
import { BANNER_SLOT_LABELS, type Banner, type BannerFormInput, type BannerSlot } from '@/lib/graphql/banners';
import { SECCIONES, seccionDeCampo, type SeccionId } from './form-sections';
import { EMPTY_FORM, bannerToForm, formToInput, validar, type FormState } from './banner-form-state';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
  seccionInicial?: SeccionId;
  onSubmit: (input: BannerFormInput) => Promise<unknown>;
  submitting: boolean;
}

export function BannerFormSheet({
  open,
  onOpenChange,
  banner,
  seccionInicial,
  onSubmit,
  submitting,
}: Props) {
  /* El estado de la ficha es el mismo en todas las secciones del panel: vive
     en `lib/use-ficha-state.ts` desde la Fase 3. Aquí solo va lo del dominio. */
  const { form, set, seccion, setSeccion, errores, sucio, handleSubmit } = useFichaState<
    FormState,
    SeccionId,
    Banner
  >({
    open,
    registro: banner,
    seccionInicial,
    seccionPorDefecto: 'contenido',
    vacio: EMPTY_FORM,
    aForm: bannerToForm,
    validar,
    seccionDeCampo,
    onSubmit: (actual) => onSubmit(formToInput(actual)),
  });

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      titulo={banner ? banner.title : 'Agregar un banner'}
      descripcion={
        banner
          ? 'Los cambios salen en el carrusel de la portada al guardar.'
          : 'Se agrega al final del carrusel; el orden se ajusta después desde la lista.'
      }
      secciones={SECCIONES}
      seccion={seccion}
      onSeccionChange={setSeccion}
      errores={errores}
      sucio={sucio}
      submitting={submitting}
      submitLabel={banner ? 'Guardar cambios' : 'Agregar banner'}
      onSubmit={handleSubmit}
    >
      {/* ------------------------------------------- contenido --- */}
      <TabsContent value="contenido" className="flex flex-col gap-4">
        <Field label="Dónde aparece" hint="Cada lugar del sitio tiene su propio orden.">
          <Select value={form.slot} onValueChange={(value) => set('slot', value as BannerSlot)}>
            <SelectTrigger className={cn(ALTO_CAMPO, 'w-full')} aria-label="Dónde aparece el banner">
              <SelectValue>{(value: BannerSlot) => BANNER_SLOT_LABELS[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HOME">{BANNER_SLOT_LABELS.HOME}</SelectItem>
              <SelectItem value="SECUNDARIO">{BANNER_SLOT_LABELS.SECUNDARIO}</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Título"
          htmlFor="title"
          required
          error={errores.title}
          hint="Sale en grande sobre la imagen."
        >
          <Input
            id="title"
            value={form.title}
            onChange={(event) => set('title', event.target.value)}
            placeholder="Yamaha Oriente"
            className={ALTO_CAMPO}
          />
        </Field>

        <Field
          label="Subtítulo"
          htmlFor="subtitle"
          error={errores.subtitle}
          hint="El texto debajo del título. Una o dos líneas."
        >
          <Textarea
            id="subtitle"
            value={form.subtitle}
            onChange={(event) => set('subtitle', event.target.value)}
            placeholder="Descubre la nueva generación de motocicletas Yamaha."
            rows={3}
          />
        </Field>

        <Field
          label="Imagen de escritorio"
          required
          error={errores.image}
          hint="La que se ve en pantallas grandes. Usa una imagen ancha (horizontal)."
        >
          <ImagePicker value={form.image} onChange={(url) => set('image', url)} alt={form.title} />
        </Field>

        <Field
          label="Imagen de móvil"
          hint="Opcional. Si no hay, el sitio usa la de escritorio también en el teléfono."
        >
          <ImagePicker
            value={form.imageMobile}
            onChange={(url) => set('imageMobile', url)}
            alt={form.title}
          />
        </Field>
      </TabsContent>

      {/* --------------------------------------------- enlace --- */}
      <TabsContent value="enlace" className="flex flex-col gap-4">
        <Field
          label="Enlace"
          htmlFor="link"
          hint="A dónde lleva al hacer clic en el banner: una ruta del sitio (/motos) o una URL completa."
        >
          <Input
            id="link"
            value={form.link}
            onChange={(event) => set('link', event.target.value)}
            placeholder="/motos"
            className={ALTO_CAMPO}
          />
        </Field>

        <Field
          label="Texto del botón"
          htmlFor="linkLabel"
          error={errores.linkLabel}
          hint="Sin enlace no importa; con enlace, es lo que dice el botón."
        >
          <Input
            id="linkLabel"
            value={form.linkLabel}
            onChange={(event) => set('linkLabel', event.target.value)}
            placeholder="Explorar modelos"
            className={ALTO_CAMPO}
          />
        </Field>
      </TabsContent>

      {/* ------------------------------------------- vigencia --- */}
      <TabsContent value="vigencia" className="flex flex-col gap-4">
        <ToggleRow
          label="Activo"
          hint="Con esto apagado, el banner no sale en el sitio aunque esté dentro de la vigencia."
          checked={form.active}
          onCheckedChange={(active) => set('active', active)}
        />

        <Grid>
          <Field
            label="Empieza a verse"
            htmlFor="startsAt"
            error={errores.startsAt}
            hint="Vacío: ya está vigente."
          >
            <Input
              id="startsAt"
              type="date"
              value={form.startsAt}
              onChange={(event) => set('startsAt', event.target.value)}
              className={cn(ALTO_CAMPO, 'font-mono')}
            />
          </Field>

          <Field
            label="Deja de verse"
            htmlFor="endsAt"
            error={errores.endsAt}
            hint="Vacío: no vence nunca."
          >
            <Input
              id="endsAt"
              type="date"
              value={form.endsAt}
              onChange={(event) => set('endsAt', event.target.value)}
              className={cn(ALTO_CAMPO, 'font-mono')}
            />
          </Field>
        </Grid>
      </TabsContent>
    </FormSheet>
  );
}
