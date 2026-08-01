'use client';

import { ImagePicker } from '@/components/admin/image-picker';
import { ALTO_CAMPO, Field, Grid } from '@/components/admin/form-fields';
import { ListaEditable } from '@/components/admin/list-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { erroresPorSeccion } from '@/lib/form-sections';
import { useFichaState } from '@/lib/use-ficha-state';
import type { SiteSettings, SiteSettingsFormInput } from '@/lib/graphql/site-settings';
import { SECCIONES, seccionDeCampo, type SeccionId } from './form-sections';
import {
  EMPTY_FORM,
  formToInput,
  siteSettingsToForm,
  validar,
  type FormState,
} from './site-settings-form-state';

interface Props {
  config: SiteSettings;
  onSubmit: (input: SiteSettingsFormInput) => Promise<unknown>;
  submitting: boolean;
}

/**
 * La misma ficha por secciones del patrón (pestañas con contador de errores,
 * barra de guardado fija), pero **sin `FormSheet`**: no hay una lista delante
 * que abra esta ficha en una hoja lateral — `site_settings` es un registro
 * único, así que `/configuracion` entra directo aquí. Por eso tampoco hay
 * «Cerrar» ni el aviso de «¿Descartar los cambios?»: no hay a dónde volver.
 */
export function SiteSettingsForm({ config, onSubmit, submitting }: Props) {
  const { form, set, seccion, setSeccion, errores, sucio, handleSubmit } = useFichaState<
    FormState,
    SeccionId,
    SiteSettings
  >({
    open: true,
    registro: config,
    seccionPorDefecto: 'contacto',
    vacio: EMPTY_FORM,
    aForm: siteSettingsToForm,
    validar,
    seccionDeCampo,
    onSubmit: (actual) => onSubmit(formToInput(actual)),
  });

  const conteos = erroresPorSeccion(SECCIONES, errores);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Tabs value={seccion} onValueChange={(value) => setSeccion(value as SeccionId)} className="gap-0">
        <TabsList
          variant="line"
          className="scroll-x h-auto w-full justify-start gap-1 border-b border-border px-0 py-2"
        >
          {SECCIONES.map((item) => {
            const conErrores = conteos.get(item.id);
            return (
              <TabsTrigger key={item.id} value={item.id} className="h-9 flex-none gap-1.5 px-3 text-[13px]">
                {item.label}
                {conErrores ? (
                  <span
                    className="grid size-4 place-items-center rounded-full bg-destructive font-mono text-[10px] text-background"
                    aria-label={`${conErrores} campos por corregir`}
                  >
                    {conErrores}
                  </span>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="flex flex-col gap-4 py-4">
          <p className="text-xs text-muted-foreground">
            {SECCIONES.find((item) => item.id === seccion)?.hint}
          </p>

          {/* ------------------------------------------- contacto --- */}
          <TabsContent value="contacto" className="flex flex-col gap-4">
            <Grid>
              <Field
                label="Teléfono"
                htmlFor="phone"
                hint="El que se muestra en el pie de página."
              >
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) => set('phone', event.target.value)}
                  placeholder="+57 300 000 0000"
                  className={`${ALTO_CAMPO} font-mono`}
                />
              </Field>

              <Field
                label="WhatsApp"
                htmlFor="whatsapp"
                error={errores.whatsapp}
                hint="El sitio arma el botón de chat con este número."
              >
                <Input
                  id="whatsapp"
                  type="tel"
                  inputMode="tel"
                  value={form.whatsapp}
                  onChange={(event) => set('whatsapp', event.target.value)}
                  placeholder="+57 300 000 0000"
                  className={`${ALTO_CAMPO} font-mono`}
                />
              </Field>
            </Grid>

            <Field label="Correo de contacto" htmlFor="email" error={errores.email}>
              <Input
                id="email"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(event) => set('email', event.target.value)}
                placeholder="info@yamahaoriente.com"
                className={ALTO_CAMPO}
              />
            </Field>

            <Field
              label="Dirección"
              htmlFor="address"
              hint="Texto libre, sin calle si no la manejas — es la dirección global del sitio, no la de cada sede (eso lo administra Puntos de atención)."
            >
              <Input
                id="address"
                value={form.address}
                onChange={(event) => set('address', event.target.value)}
                placeholder="Medellín, Colombia"
                className={ALTO_CAMPO}
              />
            </Field>
          </TabsContent>

          {/* ---------------------------------------------- redes --- */}
          <TabsContent value="redes" className="flex flex-col gap-4">
            <Field label="Facebook" htmlFor="socialFacebook" error={errores.socialFacebook}>
              <Input
                id="socialFacebook"
                type="url"
                inputMode="url"
                value={form.socialFacebook}
                onChange={(event) => set('socialFacebook', event.target.value)}
                placeholder="https://facebook.com/yamahaoriente"
                className={`${ALTO_CAMPO} font-mono text-xs`}
              />
            </Field>

            <Field label="Instagram" htmlFor="socialInstagram" error={errores.socialInstagram}>
              <Input
                id="socialInstagram"
                type="url"
                inputMode="url"
                value={form.socialInstagram}
                onChange={(event) => set('socialInstagram', event.target.value)}
                placeholder="https://instagram.com/yamahaoriente"
                className={`${ALTO_CAMPO} font-mono text-xs`}
              />
            </Field>

            <Field label="Twitter / X" htmlFor="socialTwitter" error={errores.socialTwitter}>
              <Input
                id="socialTwitter"
                type="url"
                inputMode="url"
                value={form.socialTwitter}
                onChange={(event) => set('socialTwitter', event.target.value)}
                placeholder="https://x.com/yamahaoriente"
                className={`${ALTO_CAMPO} font-mono text-xs`}
              />
            </Field>

            <Field label="YouTube" htmlFor="socialYoutube" error={errores.socialYoutube}>
              <Input
                id="socialYoutube"
                type="url"
                inputMode="url"
                value={form.socialYoutube}
                onChange={(event) => set('socialYoutube', event.target.value)}
                placeholder="https://youtube.com/@yamahaoriente"
                className={`${ALTO_CAMPO} font-mono text-xs`}
              />
            </Field>

            <p className="text-xs text-muted-foreground">
              Un campo vacío hace que el pie de página no muestre ese ícono, en vez de enlazar a
              ningún lado.
            </p>
          </TabsContent>

          {/* ------------------------------------------------ seo --- */}
          <TabsContent value="seo" className="flex flex-col gap-4">
            <Field
              label="Título del sitio (SEO)"
              htmlFor="seoTitle"
              hint="Lo que se lee en la pestaña del navegador y en el resultado de Google."
            >
              <Input
                id="seoTitle"
                value={form.seoTitle}
                onChange={(event) => set('seoTitle', event.target.value)}
                placeholder="Yamaha Oriente"
                className={ALTO_CAMPO}
              />
            </Field>

            <Field
              label="Descripción (SEO)"
              htmlFor="seoDescription"
              hint="La línea gris debajo del título en los resultados de Google."
            >
              <textarea
                id="seoDescription"
                value={form.seoDescription}
                onChange={(event) => set('seoDescription', event.target.value)}
                placeholder="Sitio web de Yamaha Oriente"
                rows={3}
                className="min-h-20 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </Field>

            <Field
              label="Palabras clave"
              hint="No cambian cómo se ve el sitio; ayudan a que los buscadores lo entiendan."
            >
              <ListaEditable
                items={form.seoKeywords}
                onChange={(items) => set('seoKeywords', items)}
                etiquetaItem="palabra clave"
                placeholder="motos Yamaha Medellín"
                error={errores.seoKeywords}
                max={20}
              />
            </Field>

            <Field
              label="Imagen para compartir (Open Graph)"
              hint="Se ve al pegar el enlace del sitio en WhatsApp, Facebook o Twitter."
            >
              <ImagePicker value={form.seoImage} onChange={(url) => set('seoImage', url)} alt="Vista previa al compartir" />
              {errores.seoImage ? (
                <p className="text-xs font-medium text-destructive">{errores.seoImage}</p>
              ) : null}
            </Field>
          </TabsContent>

          {/* --------------------------------------------- textos --- */}
          <TabsContent value="textos" className="flex flex-col gap-4">
            <Field
              label="Nombre del sitio"
              htmlFor="siteName"
              required
              error={errores.siteName}
              hint="Sale en el pie de página, en el título de la pestaña y como autor por defecto de una noticia sin firma."
            >
              <Input
                id="siteName"
                value={form.siteName}
                onChange={(event) => set('siteName', event.target.value)}
                placeholder="Yamaha Oriente"
                className={ALTO_CAMPO}
              />
            </Field>

            <Field
              label="Logo"
              hint="Sale en el menú del sitio. Sin uno, se usa el logo de Yamaha por defecto."
            >
              <ImagePicker value={form.logo} onChange={(url) => set('logo', url)} alt="Logo del sitio" />
              {errores.logo ? (
                <p className="text-xs font-medium text-destructive">{errores.logo}</p>
              ) : null}
            </Field>
          </TabsContent>
        </div>
      </Tabs>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:mx-0 sm:rounded-lg sm:border">
        <span className="flex-1 font-mono text-[11px] text-muted-foreground">
          {submitting ? 'Guardando…' : sucio ? 'Sin guardar' : 'Todo guardado'}
        </span>
        <Button type="submit" disabled={submitting} className="h-11 md:h-9">
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
