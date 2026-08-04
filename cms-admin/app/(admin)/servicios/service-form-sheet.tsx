'use client';

import { TriangleAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ALTO_CAMPO, Field, Grid, ToggleRow } from '@/components/admin/form-fields';
import { FormSheet } from '@/components/admin/form-sheet';
import { ImagePicker } from '@/components/admin/image-picker';
import { ListaEditable } from '@/components/admin/list-editor';
import { groupDigits } from '@/lib/format';
import { ETIQUETAS_MODALIDAD } from '@/lib/service-pricing';
import { useFichaState } from '@/lib/use-ficha-state';
import { cn } from '@/lib/utils';
import type { Service, ServiceFormInput, ServicePricingMode } from '@/lib/graphql/services';
import { SECCIONES, seccionDeCampo, type SeccionId } from './form-sections';
import { IconPicker } from './icon-picker';
import {
  EMPTY_FORM,
  formToInput,
  serviceToForm,
  slugSugerido,
  validar,
  type FormState,
} from './service-form-state';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicio: Service | null;
  seccionInicial?: SeccionId;
  slugsEnUso: string[];
  /** Las categorías que ya existen, para sugerirlas y que converjan. */
  categorias: string[];
  onSubmit: (input: ServiceFormInput) => Promise<unknown>;
  submitting: boolean;
}

export function ServiceFormSheet({
  open,
  onOpenChange,
  servicio,
  seccionInicial,
  slugsEnUso,
  categorias,
  onSubmit,
  submitting,
}: Props) {
  const slugRepetido = (form: FormState) =>
    form.slug.trim().length > 0 &&
    slugsEnUso.includes(form.slug.trim()) &&
    form.slug.trim() !== servicio?.slug;

  /* El estado de la ficha es el mismo en las tres secciones del panel: vive en
     `lib/use-ficha-state.ts` desde la Fase 3. Aquí solo va lo del dominio. */
  const { form, setForm, set, seccion, setSeccion, errores, setErrores, sucio, handleSubmit } =
    useFichaState<FormState, SeccionId, Service>({
      open,
      registro: servicio,
      seccionInicial,
      seccionPorDefecto: 'identidad',
      vacio: EMPTY_FORM,
      aForm: serviceToForm,
      /* El slug se sigue derivando del nombre hasta que alguien lo escriba. */
      derivar: (siguiente, campo) =>
        campo === 'name' && !siguiente.slugManual
          ? { ...siguiente, slug: slugSugerido(siguiente) }
          : siguiente,
      validar,
      validarExtra: (actual): Record<string, string> =>
        slugRepetido(actual) ? { slug: 'Ya hay otro servicio con este slug. Cámbialo.' } : {},
      seccionDeCampo,
      onSubmit: (actual) => onSubmit(formToInput(actual)),
    });

  const avisoSlug = slugRepetido(form);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      titulo={servicio ? servicio.name : 'Agregar un servicio'}
      descripcion={
        servicio
          ? 'Los cambios salen en el sitio al guardar.'
          : 'Con el nombre y la descripción corta ya se puede guardar; el resto se completa después.'
      }
      secciones={SECCIONES}
      seccion={seccion}
      onSeccionChange={setSeccion}
      errores={errores}
      sucio={sucio}
      submitting={submitting}
      submitLabel={servicio ? 'Guardar cambios' : 'Agregar servicio'}
      onSubmit={handleSubmit}
    >
      {/* ------------------------------------------- identidad --- */}
      <TabsContent value="identidad" className="flex flex-col gap-4">
        <Field label="Nombre" htmlFor="name" required error={errores.name}>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="Mantenimiento preventivo"
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
            placeholder="mantenimiento-preventivo"
            className={cn(ALTO_CAMPO, 'font-mono text-sm')}
          />
        </Field>
        {avisoSlug && !errores.slug ? (
          <p className="-mt-2 flex items-center gap-1.5 text-xs font-medium text-warning">
            <TriangleAlert className="size-3.5" />
            Ya hay otro servicio con este slug.
          </p>
        ) : null}

        <Field
          label="Categoría"
          htmlFor="category"
          hint="Agrupa los servicios en el sitio y en la lista. Escribe una nueva o elige de las que ya usaste."
        >
          <Input
            id="category"
            list="categorias-de-servicio"
            value={form.category}
            onChange={(event) => set('category', event.target.value)}
            placeholder="Mantenimiento"
            className={ALTO_CAMPO}
          />
          {/* Sugerencias, no un catálogo cerrado: la categoría es texto libre
              a propósito (ver `filters.ts`). */}
          <datalist id="categorias-de-servicio">
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria} />
            ))}
          </datalist>
        </Field>

        <Field
          tour="servicios.icono"
          label="Icono"
          hint="Es lo que identifica el servicio en la lista y en el sitio."
        >
          <IconPicker value={form.icon} onChange={(icon) => set('icon', icon)} />
        </Field>

        <Field
          label="Imagen"
          hint="Sale en la tarjeta del sitio. Si no hay, la tarjeta se ve igual, solo que sin foto."
        >
          <ImagePicker value={form.image} onChange={(url) => set('image', url)} />
        </Field>

        <ToggleRow
          label="Destacar en el sitio"
          hint="Los destacados salen arriba, en su propia franja."
          checked={form.featured}
          onCheckedChange={(featured) => set('featured', featured)}
        />
      </TabsContent>

      {/* ------------------------------------------ descripción --- */}
      <TabsContent value="descripcion" className="flex flex-col gap-4">
        <Field
          label="Descripción corta"
          htmlFor="shortDescription"
          error={errores.shortDescription}
          hint="Una o dos líneas: es lo único que se lee en la tarjeta antes de abrirla."
        >
          <Textarea
            id="shortDescription"
            value={form.shortDescription}
            onChange={(event) => set('shortDescription', event.target.value)}
            placeholder="Mantén tu moto en óptimas condiciones con revisiones programadas."
            rows={3}
          />
        </Field>

        <Field
          label="Descripción completa"
          htmlFor="fullDescription"
          error={errores.fullDescription}
          hint="Lo que se lee al abrir el detalle. Aquí sí cabe explicar el procedimiento."
        >
          <Textarea
            id="fullDescription"
            value={form.fullDescription}
            onChange={(event) => set('fullDescription', event.target.value)}
            placeholder="El mantenimiento preventivo alarga la vida de la moto…"
            rows={8}
          />
        </Field>
      </TabsContent>

      {/* ------------------------------------------ qué incluye --- */}
      <TabsContent value="incluye" className="flex flex-col gap-6">
        <Field
          label="Qué incluye"
          error={errores.features}
          hint="Lo que se le hace a la moto. El orden es el que verá el cliente."
        >
          <ListaEditable
            items={form.features}
            onChange={(features) => set('features', features)}
            etiquetaItem="característica"
            placeholder="Cambio de aceite y filtro"
          />
        </Field>

        <Field
          label="Beneficios"
          error={errores.benefits}
          hint="Qué gana el cliente. Van aparte de lo que incluye, y también en orden."
        >
          <ListaEditable
            items={form.benefits}
            onChange={(benefits) => set('benefits', benefits)}
            etiquetaItem="beneficio"
            genero="m"
            placeholder="Previene averías costosas"
          />
        </Field>
      </TabsContent>

      {/* ------------------------------------ precio y duración --- */}
      <TabsContent value="precio" className="flex flex-col gap-4">
        <Field
          tour="servicios.precio"
          label="Modalidad"
          hint="«A convenir» es lo correcto cuando el precio depende de revisar la moto."
        >
          <Select
            value={form.pricingMode}
            onValueChange={(value) => set('pricingMode', value as ServicePricingMode)}
          >
            <SelectTrigger className={cn(ALTO_CAMPO, 'w-full')} aria-label="Modalidad de precio">
              <SelectValue>
                {(value: ServicePricingMode) => ETIQUETAS_MODALIDAD[value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DESDE">Desde un monto</SelectItem>
              <SelectItem value="FIJO">Precio fijo</SelectItem>
              <SelectItem value="A_CONVENIR">A convenir</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Grid>
          {/* Con «a convenir» el monto no aplica: se apaga en vez de esconderse,
              para que no parezca que el campo se perdió. */}
          <Field
            label="Monto"
            htmlFor="pricingAmount"
            required={form.pricingMode !== 'A_CONVENIR'}
            error={errores.pricingAmount}
            hint={
              form.pricingMode === 'A_CONVENIR'
                ? 'No aplica: el servicio se cotiza.'
                : 'En pesos, sin decimales.'
            }
          >
            <Input
              id="pricingAmount"
              inputMode="numeric"
              disabled={form.pricingMode === 'A_CONVENIR'}
              value={form.pricingAmount}
              onChange={(event) => set('pricingAmount', groupDigits(event.target.value))}
              placeholder="150.000"
              className={cn(ALTO_CAMPO, 'font-mono tabular-nums')}
            />
          </Field>

          <Field
            label="Nota del precio"
            htmlFor="pricingNote"
            error={errores.pricingNote}
            hint="Cada cuánto se hace o de qué depende: «cada 5.000 km», «según el daño»."
          >
            <Input
              id="pricingNote"
              value={form.pricingNote}
              onChange={(event) => set('pricingNote', event.target.value)}
              placeholder="cada 5.000 km"
              className={ALTO_CAMPO}
            />
          </Field>
        </Grid>

        <Field
          label="Duración"
          htmlFor="duration"
          hint="Tal como se le dice al cliente: «2-3 horas», «1 semana»."
        >
          <Input
            id="duration"
            value={form.duration}
            onChange={(event) => set('duration', event.target.value)}
            placeholder="2-3 horas"
            className={ALTO_CAMPO}
          />
        </Field>
      </TabsContent>
    </FormSheet>
  );
}
