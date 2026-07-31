'use client';

import { ExternalLink, MapPin, TriangleAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { ALTO_CAMPO, Field, Grid } from '@/components/admin/form-fields';
import { FormSheet } from '@/components/admin/form-sheet';
import { coordenadasDeMapsUrl, formatCoordenadas } from '@/lib/maps-url';
import { useFichaState } from '@/lib/use-ficha-state';
import { cn } from '@/lib/utils';
import type { ServicePoint, ServicePointFormInput, ServicePointType } from '@/lib/graphql/service-points';
import { ETIQUETA_DE_TIPO } from './filters';
import { SECCIONES, seccionDeCampo, type SeccionId } from './form-sections';
import { HoursEditor } from './hours-editor';
import {
  EMPTY_FORM,
  formToInput,
  servicePointToForm,
  slugSugerido,
  validar,
  type FormState,
} from './service-point-form-state';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  punto: ServicePoint | null;
  seccionInicial?: SeccionId;
  slugsEnUso: string[];
  onSubmit: (input: ServicePointFormInput) => Promise<unknown>;
  submitting: boolean;
}

export function ServicePointFormSheet({
  open,
  onOpenChange,
  punto,
  seccionInicial,
  slugsEnUso,
  onSubmit,
  submitting,
}: Props) {
  const slugDuplicadoDe = (actual: FormState) =>
    actual.slug.trim().length > 0 &&
    slugsEnUso.includes(actual.slug.trim()) &&
    actual.slug.trim() !== punto?.slug;

  /* El estado de la ficha vive en `lib/use-ficha-state.ts` desde la Fase 3:
     era idéntico aquí, en motos y en servicios. Aquí solo va lo del dominio. */
  const { form, setForm, set, seccion, setSeccion, errores, setErrores, sucio, handleSubmit } =
    useFichaState<FormState, SeccionId, ServicePoint>({
      open,
      registro: punto,
      seccionInicial,
      seccionPorDefecto: 'identidad',
      vacio: EMPTY_FORM,
      aForm: servicePointToForm,
      /* El slug se sigue derivando del nombre hasta que alguien lo escriba. */
      derivar: (siguiente, campo) =>
        campo === 'name' && !siguiente.slugManual
          ? { ...siguiente, slug: slugSugerido(siguiente) }
          : siguiente,
      validar,
      validarExtra: (actual): Record<string, string> =>
        slugDuplicadoDe(actual) ? { slug: 'Ya hay otro punto con este slug. Cámbialo.' } : {},
      seccionDeCampo,
      onSubmit: (actual) => onSubmit(formToInput(actual)),
    });

  const slugDuplicado = slugDuplicadoDe(form);
  const coords = coordenadasDeMapsUrl(form.mapsUrl);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      titulo={punto ? punto.name : 'Agregar un punto de atención'}
      descripcion={
        punto
          ? 'Los cambios salen en el sitio al guardar.'
          : 'Con el nombre y la dirección ya se puede guardar; el resto se completa después.'
      }
      secciones={SECCIONES}
      seccion={seccion}
      onSeccionChange={setSeccion}
      errores={errores}
      sucio={sucio}
      submitting={submitting}
      submitLabel={punto ? 'Guardar cambios' : 'Agregar punto'}
      onSubmit={handleSubmit}
    >
      {/* ------------------------------------------- identidad --- */}
      <TabsContent value="identidad" className="flex flex-col gap-4">
        <Field label="Nombre" htmlFor="name" required error={errores.name}>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="Sede San Diego"
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
              : 'Se arma solo con el nombre. Escríbelo si quieres otro.'
          }
        >
          <Input
            id="slug"
            value={form.slug}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, slug: event.target.value, slugManual: true }));
              setErrores((prev) => ({ ...prev, slug: '' }));
            }}
            placeholder="sede-san-diego"
            className={cn(ALTO_CAMPO, 'font-mono text-sm')}
          />
        </Field>
        {slugDuplicado && !errores.slug ? (
          <p className="-mt-2 flex items-center gap-1.5 text-xs font-medium text-warning">
            <TriangleAlert className="size-3.5" />
            Ya hay otro punto con este slug.
          </p>
        ) : null}

        <Field
          label="Tipo"
          hint="Es lo que se usa para filtrar la lista y para etiquetar el punto en el sitio."
        >
          <Select
            value={form.type}
            onValueChange={(value) => set('type', value as ServicePointType)}
          >
            <SelectTrigger className={cn(ALTO_CAMPO, 'w-full')} aria-label="Tipo de punto">
              <SelectValue>
                {(value: ServicePointType) => ETIQUETA_DE_TIPO[value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEDE">Sede</SelectItem>
              <SelectItem value="CONCESIONARIO">Concesionario</SelectItem>
              <SelectItem value="DISTRIBUIDOR">Distribuidor</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </TabsContent>

      {/* -------------------------------------------- contacto --- */}
      <TabsContent value="contacto" className="flex flex-col gap-4">
        <Grid>
          <Field label="Teléfono" htmlFor="phone" hint="Como se marca: +57 604 262 85 41.">
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(event) => set('phone', event.target.value)}
              placeholder="+57 604 262 85 41"
              className={cn(ALTO_CAMPO, 'font-mono')}
            />
          </Field>

          <Field
            label="WhatsApp"
            htmlFor="whatsapp"
            hint="El sitio arma el enlace de chat con este número."
          >
            <Input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              value={form.whatsapp}
              onChange={(event) => set('whatsapp', event.target.value)}
              placeholder="+57 318 716 66 13"
              className={cn(ALTO_CAMPO, 'font-mono')}
            />
          </Field>
        </Grid>

        <Field label="Correo" htmlFor="email" error={errores.email}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            value={form.email}
            onChange={(event) => set('email', event.target.value)}
            placeholder="sandiego@motoshotwheels.com"
            className={ALTO_CAMPO}
          />
        </Field>
      </TabsContent>

      {/* ------------------------------------------- ubicación --- */}
      <TabsContent value="ubicacion" className="flex flex-col gap-4">
        <Field label="Dirección" htmlFor="street" hint="Tal como se escribe en un sobre.">
          <Input
            id="street"
            value={form.street}
            onChange={(event) => set('street', event.target.value)}
            placeholder="Carrera 46 No 36-16"
            className={ALTO_CAMPO}
          />
        </Field>

        <Grid>
          <Field label="Barrio" htmlFor="neighborhood">
            <Input
              id="neighborhood"
              value={form.neighborhood}
              onChange={(event) => set('neighborhood', event.target.value)}
              placeholder="San Diego"
              className={ALTO_CAMPO}
            />
          </Field>

          <Field label="Ciudad" htmlFor="city" hint="El sitio agrupa los puntos por ciudad.">
            <Input
              id="city"
              value={form.city}
              onChange={(event) => set('city', event.target.value)}
              placeholder="Medellín"
              className={ALTO_CAMPO}
            />
          </Field>

          <Field label="Departamento" htmlFor="state">
            <Input
              id="state"
              value={form.state}
              onChange={(event) => set('state', event.target.value)}
              placeholder="Antioquia"
              className={ALTO_CAMPO}
            />
          </Field>
        </Grid>

        <Field
          label="Enlace de Google Maps"
          htmlFor="mapsUrl"
          error={errores.mapsUrl}
          hint="Busca el punto en Google Maps, dale a Compartir → Copiar vínculo, y pégalo aquí."
        >
          <Input
            id="mapsUrl"
            type="url"
            inputMode="url"
            value={form.mapsUrl}
            onChange={(event) => set('mapsUrl', event.target.value)}
            placeholder="https://www.google.com/maps/place/…"
            className={cn(ALTO_CAMPO, 'font-mono text-xs')}
          />
        </Field>

        {/* El enlace corto (maps.app.goo.gl) no trae coordenadas: hay que
            decirlo antes de guardar, no después. */}
        {form.mapsUrl.trim() ? (
          coords ? (
            <p className="flex items-center gap-1.5 text-xs text-success">
              <MapPin className="size-3.5 shrink-0" />
              Coordenadas detectadas:{' '}
              <span className="font-mono">{formatCoordenadas(coords)}</span>. El sitio va a mostrar
              el mapa.
            </p>
          ) : (
            <p className="flex items-start gap-1.5 text-xs text-warning">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              <span>
                El enlace no trae coordenadas (los enlaces cortos{' '}
                <span className="font-mono">maps.app.goo.gl</span> nunca las traen). Se guarda
                igual y el sitio mostrará el botón <strong>Cómo llegar</strong> sin mapa. Para que
                salga el mapa, abre el punto en Google Maps en el computador y copia la URL de la
                barra de direcciones.
              </span>
            </p>
          )
        ) : null}

        {form.mapsUrl.trim() ? (
          <a
            href={form.mapsUrl.trim()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-foreground underline underline-offset-2"
          >
            <ExternalLink className="size-3.5" />
            Abrir el enlace para comprobarlo
          </a>
        ) : null}
      </TabsContent>

      {/* -------------------------------------------- horarios --- */}
      <TabsContent value="horarios">
        <HoursEditor
          hours={form.hours}
          error={errores.hours}
          onChange={(hours) => set('hours', hours)}
        />
      </TabsContent>
    </FormSheet>
  );
}
