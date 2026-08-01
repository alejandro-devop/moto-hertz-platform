'use client';

import { useMemo } from 'react';
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
import { GaleriaImagenes } from '@/components/admin/image-picker';
import { ListaEditable } from '@/components/admin/list-editor';
import { StatusPill, paperTone } from '@/components/admin/status-pill';
import { daysUntil, formatCop, formatDate, groupDigits, humanizeDays, onlyDigits } from '@/lib/format';
import { useFichaState } from '@/lib/use-ficha-state';
import { cn } from '@/lib/utils';
import type { Motorcycle, MotorcycleFormInput } from '@/lib/graphql/motorcycles';
import { seccionDeCampo, seccionesVisibles, type SeccionId } from './form-sections';
import {
  EMPTY_FORM,
  formToInput,
  motorcycleToForm,
  slugSugerido,
  validar,
  type FormState,
} from './motorcycle-form-state';

const ETIQUETAS_CONDICION = { NEW: 'Nueva', USED: 'Usada' } as const;

/* ------------------------------------------------------------ formulario --- */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorcycle: Motorcycle | null;
  seccionInicial?: SeccionId;
  slugsEnUso: string[];
  onSubmit: (input: MotorcycleFormInput) => Promise<unknown>;
  submitting: boolean;
}

export function MotorcycleFormSheet({
  open,
  onOpenChange,
  motorcycle,
  seccionInicial,
  slugsEnUso,
  onSubmit,
  submitting,
}: Props) {
  const slugDuplicadoDe = (actual: FormState) =>
    actual.slug.trim().length > 0 &&
    slugsEnUso.includes(actual.slug.trim()) &&
    actual.slug.trim() !== motorcycle?.slug;

  /* El estado de la ficha vive en `lib/use-ficha-state.ts` desde la Fase 3:
     era idéntico aquí, en puntos de atención y en servicios. Aquí solo va lo
     del dominio. */
  const { form, setForm, set, seccion, setSeccion, errores, setErrores, sucio, handleSubmit } =
    useFichaState<FormState, SeccionId, Motorcycle>({
      open,
      registro: motorcycle,
      seccionInicial,
      seccionPorDefecto: 'identidad',
      vacio: EMPTY_FORM,
      aForm: motorcycleToForm,
      /* El slug se sigue derivando del nombre hasta que alguien lo escriba. */
      derivar: (siguiente, campo) =>
        (campo === 'name' || campo === 'year') && !siguiente.slugManual
          ? { ...siguiente, slug: slugSugerido(siguiente) }
          : siguiente,
      validar,
      validarExtra: (actual): Record<string, string> =>
        slugDuplicadoDe(actual) ? { slug: 'Ya hay otra moto con este slug. Cámbialo.' } : {},
      seccionDeCampo,
      onSubmit: (actual) => onSubmit(formToInput(actual)),
    });

  /* Una moto nueva no tiene papeles: la sección desaparece y `FormSheet` mueve
     la pestaña abierta si era esa. */
  const secciones = useMemo(() => seccionesVisibles(form.condition), [form.condition]);
  const slugDuplicado = slugDuplicadoDe(form);
  const fotos = [form.imagesMain, ...form.imagesGallery].filter(Boolean);

  const soatDias = daysUntil(form.soatExpiresAt);
  const tecnoDias = daysUntil(form.technicalInspectionExpiresAt);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      titulo={motorcycle ? motorcycle.name : 'Publicar una moto'}
      descripcion={
        motorcycle
          ? 'Los cambios salen en el sitio al guardar.'
          : 'Con el nombre y el precio ya se puede guardar; el resto se completa después.'
      }
      secciones={secciones}
      seccion={seccion}
      onSeccionChange={setSeccion}
      errores={errores}
      sucio={sucio}
      submitting={submitting}
      submitLabel={motorcycle ? 'Guardar cambios' : 'Publicar moto'}
      onSubmit={handleSubmit}
    >
      <TabsContent value="identidad" className="flex flex-col gap-4">
        <Field label="Nombre" htmlFor="name" required error={errores.name}>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="Yamaha NMAX 155 V3 2027"
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
              : 'Se arma solo con el nombre y el año. Escríbelo si quieres otro.'
          }
        >
          <Input
            id="slug"
            value={form.slug}
            onChange={(event) => {
              setForm((prev) => ({
                ...prev,
                slug: event.target.value,
                slugManual: true,
              }));
              setErrores((prev) => ({ ...prev, slug: '' }));
            }}
            placeholder="yamaha-nmax-155-v3-2027"
            className={cn(ALTO_CAMPO, 'font-mono text-sm')}
          />
        </Field>
        {slugDuplicado && !errores.slug ? (
          <p className="-mt-2 flex items-center gap-1.5 text-xs font-medium text-warning">
            <TriangleAlert className="size-3.5" />
            Ya hay otra moto con este slug.
          </p>
        ) : null}

        <Grid>
          <Field label="Marca" htmlFor="brand">
            <Input
              id="brand"
              value={form.brand}
              onChange={(event) => set('brand', event.target.value)}
              placeholder="Yamaha"
              className={ALTO_CAMPO}
            />
          </Field>

          <Field label="Condición">
            <Select
              value={form.condition}
              onValueChange={(value) => set('condition', value as 'NEW' | 'USED')}
            >
              <SelectTrigger className={cn(ALTO_CAMPO, 'w-full')} aria-label="Condición">
                <SelectValue>
                  {(value: 'NEW' | 'USED') => ETIQUETAS_CONDICION[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USED">Usada</SelectItem>
                <SelectItem value="NEW">Nueva</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Año" htmlFor="year" error={errores.year}>
            <Input
              id="year"
              inputMode="numeric"
              value={form.year}
              onChange={(event) => set('year', onlyDigits(event.target.value))}
              placeholder="2022"
              className={cn(ALTO_CAMPO, 'font-mono')}
            />
          </Field>

          {form.condition === 'USED' ? (
            <Field
              label="Kilometraje"
              htmlFor="mileageKm"
              error={errores.mileageKm}
              hint="En kilómetros, sin puntos."
            >
              <Input
                id="mileageKm"
                inputMode="numeric"
                value={form.mileageKm}
                onChange={(event) => set('mileageKm', onlyDigits(event.target.value))}
                placeholder="14320"
                className={cn(ALTO_CAMPO, 'font-mono')}
              />
            </Field>
          ) : null}

          <Field label="Categoría" htmlFor="category" hint="Como se agrupa en el sitio.">
            <Input
              id="category"
              value={form.category}
              onChange={(event) => set('category', event.target.value)}
              placeholder="scooter"
              className={ALTO_CAMPO}
            />
          </Field>
        </Grid>

        <Field
          label="Resumen"
          htmlFor="description"
          hint="Una o dos líneas: es lo que se lee en la tarjeta del catálogo."
        >
          <Textarea
            id="description"
            rows={2}
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
          />
        </Field>

        <Field
          label="Descripción completa"
          htmlFor="fullDescription"
          hint="El texto largo de la ficha."
        >
          <Textarea
            id="fullDescription"
            rows={6}
            value={form.fullDescription}
            onChange={(event) => set('fullDescription', event.target.value)}
          />
        </Field>
      </TabsContent>

      {/* --------------------------------------------- precio --- */}
      <TabsContent value="precio" className="flex flex-col gap-4">
        <Field
          label="Precio"
          htmlFor="price"
          hint={
            onlyDigits(form.price)
              ? (formatCop(onlyDigits(form.price)) ?? undefined)
              : 'Sin precio la moto queda incompleta y no sale en el sitio.'
          }
        >
          <Input
            id="price"
            inputMode="numeric"
            value={form.price}
            onChange={(event) => set('price', groupDigits(event.target.value))}
            placeholder="8.900.000"
            className={cn(ALTO_CAMPO, 'font-mono text-base')}
          />
        </Field>

        <Field label="Moneda" htmlFor="currency" hint="El catálogo trabaja en pesos.">
          <Input
            id="currency"
            value={form.currency}
            onChange={(event) => set('currency', event.target.value.toUpperCase())}
            className={cn(ALTO_CAMPO, 'w-28 font-mono')}
          />
        </Field>

        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Publicada en el sitio"
            hint="Al apagarlo la moto sale del catálogo, como cuando se vende."
            checked={form.available}
            onCheckedChange={(checked) => set('available', checked)}
          />
          <ToggleRow
            label="Destacada"
            hint="Aparece primero en el home."
            checked={form.featured}
            onCheckedChange={(checked) => set('featured', checked)}
          />
        </div>
      </TabsContent>

      {/* -------------------------------------------- papeles --- */}
      <TabsContent value="papeles" className="flex flex-col gap-4">
        <Field label="Ciudad de matrícula" htmlFor="registrationCity">
          <Input
            id="registrationCity"
            value={form.registrationCity}
            onChange={(event) => set('registrationCity', event.target.value)}
            placeholder="Medellín"
            className={ALTO_CAMPO}
          />
        </Field>

        <Grid>
          <Field
            label="SOAT vence el"
            htmlFor="soatExpiresAt"
            error={errores.soatExpiresAt}
            hint={
              soatDias === null ? undefined : (
                <span className={cn(soatDias <= 30 && 'font-medium text-warning')}>
                  {soatDias < 0
                    ? `Venció ${humanizeDays(soatDias)}.`
                    : `Vence ${humanizeDays(soatDias)} (${formatDate(form.soatExpiresAt)}).`}
                </span>
              )
            }
          >
            <Input
              id="soatExpiresAt"
              type="date"
              value={form.soatExpiresAt}
              onChange={(event) => set('soatExpiresAt', event.target.value)}
              className={cn(ALTO_CAMPO, 'font-mono')}
            />
          </Field>

          <Field
            label="Tecnomecánica vence el"
            htmlFor="technicalInspectionExpiresAt"
            error={errores.technicalInspectionExpiresAt}
            hint={
              tecnoDias === null ? undefined : (
                <span className={cn(tecnoDias <= 30 && 'font-medium text-warning')}>
                  {tecnoDias < 0
                    ? `Venció ${humanizeDays(tecnoDias)}.`
                    : `Vence ${humanizeDays(tecnoDias)} (${formatDate(form.technicalInspectionExpiresAt)}).`}
                </span>
              )
            }
          >
            <Input
              id="technicalInspectionExpiresAt"
              type="date"
              value={form.technicalInspectionExpiresAt}
              onChange={(event) =>
                set('technicalInspectionExpiresAt', event.target.value)
              }
              className={cn(ALTO_CAMPO, 'font-mono')}
            />
          </Field>
        </Grid>

        {soatDias !== null || tecnoDias !== null ? (
          <div className="flex flex-wrap gap-2">
            {soatDias !== null ? (
              <StatusPill tone={paperTone(soatDias < 0 ? 'vencido' : soatDias <= 30 ? 'por-vencer' : 'vigente')}>
                SOAT
              </StatusPill>
            ) : null}
            {tecnoDias !== null ? (
              <StatusPill tone={paperTone(tecnoDias < 0 ? 'vencido' : tecnoDias <= 30 ? 'por-vencer' : 'vigente')}>
                Tecnomecánica
              </StatusPill>
            ) : null}
          </div>
        ) : null}

        <Field label="Nota del SOAT" htmlFor="soatNote">
          <Input
            id="soatNote"
            value={form.soatNote}
            onChange={(event) => set('soatNote', event.target.value)}
            className={ALTO_CAMPO}
          />
        </Field>

        <Field label="Nota de la tecnomecánica" htmlFor="technicalInspectionNote">
          <Input
            id="technicalInspectionNote"
            value={form.technicalInspectionNote}
            onChange={(event) => set('technicalInspectionNote', event.target.value)}
            className={ALTO_CAMPO}
          />
        </Field>

        <Field
          label="Nota del traspaso"
          htmlFor="registrationCostNote"
          hint="Quién paga qué, si aplica."
        >
          <Input
            id="registrationCostNote"
            value={form.registrationCostNote}
            onChange={(event) => set('registrationCostNote', event.target.value)}
            className={ALTO_CAMPO}
          />
        </Field>

        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Traspaso incluido"
            checked={form.transferIncluded}
            onCheckedChange={(checked) => set('transferIncluded', checked)}
          />
          <ToggleRow
            label="Único dueño"
            checked={form.singleOwner}
            onCheckedChange={(checked) => set('singleOwner', checked)}
          />
          <ToggleRow
            label="Garantía de procedencia"
            checked={form.provenanceWarranty}
            onCheckedChange={(checked) => set('provenanceWarranty', checked)}
          />
        </div>
      </TabsContent>

      {/* --------------------------------------------- técnica --- */}
      <TabsContent value="tecnica" className="flex flex-col gap-4">
        <Grid>
          <Field label="Tipo de motor" htmlFor="engineType">
            <Input
              id="engineType"
              value={form.engineType}
              onChange={(event) => set('engineType', event.target.value)}
              className={ALTO_CAMPO}
            />
          </Field>
          <Field label="Cilindraje" htmlFor="engineDisplacement">
            <Input
              id="engineDisplacement"
              value={form.engineDisplacement}
              onChange={(event) => set('engineDisplacement', event.target.value)}
              placeholder="155 cc"
              className={ALTO_CAMPO}
            />
          </Field>
          <Field label="Potencia" htmlFor="enginePower">
            <Input
              id="enginePower"
              value={form.enginePower}
              onChange={(event) => set('enginePower', event.target.value)}
              className={ALTO_CAMPO}
            />
          </Field>
          <Field label="Torque" htmlFor="engineTorque">
            <Input
              id="engineTorque"
              value={form.engineTorque}
              onChange={(event) => set('engineTorque', event.target.value)}
              className={ALTO_CAMPO}
            />
          </Field>
          <Field label="Peso" htmlFor="specsWeight">
            <Input
              id="specsWeight"
              value={form.specsWeight}
              onChange={(event) => set('specsWeight', event.target.value)}
              className={ALTO_CAMPO}
            />
          </Field>
          <Field label="Altura del asiento" htmlFor="specsSeatHeight">
            <Input
              id="specsSeatHeight"
              value={form.specsSeatHeight}
              onChange={(event) => set('specsSeatHeight', event.target.value)}
              className={ALTO_CAMPO}
            />
          </Field>
          <Field label="Capacidad de combustible" htmlFor="specsFuelCapacity">
            <Input
              id="specsFuelCapacity"
              value={form.specsFuelCapacity}
              onChange={(event) => set('specsFuelCapacity', event.target.value)}
              className={ALTO_CAMPO}
            />
          </Field>
          <Field label="Transmisión" htmlFor="specsTransmission">
            <Input
              id="specsTransmission"
              value={form.specsTransmission}
              onChange={(event) => set('specsTransmission', event.target.value)}
              className={ALTO_CAMPO}
            />
          </Field>
        </Grid>

        <Field
          label="Equipamiento"
          error={errores.features}
          hint="Lo que trae la moto. El orden es el que verá el cliente."
        >
          <ListaEditable
            items={form.features}
            onChange={(features) => set('features', features)}
            etiquetaItem="característica"
            placeholder="Frenos ABS"
          />
        </Field>

        <Field label="Colores" error={errores.colors}>
          <ListaEditable
            items={form.colors}
            onChange={(colors) => set('colors', colors)}
            etiquetaItem="color"
            genero="m"
            placeholder="Rojo"
          />
        </Field>
      </TabsContent>

      {/* ----------------------------------------------- fotos --- */}
      <TabsContent value="fotos">
        <GaleriaImagenes
          fotos={fotos}
          error={errores.imagesMain}
          onChange={(next) =>
            setForm((prev) => ({
              ...prev,
              imagesMain: next[0] ?? '',
              imagesGallery: next.slice(1),
            }))
          }
        />
      </TabsContent>

      {/* ------------------------------------------------ sede --- */}
      <TabsContent value="sede" className="flex flex-col gap-4">
        <Field label="Nombre de la sede" htmlFor="locationName">
          <Input
            id="locationName"
            value={form.locationName}
            onChange={(event) => set('locationName', event.target.value)}
            placeholder="San Diego"
            className={ALTO_CAMPO}
          />
        </Field>
        <Field label="Dirección" htmlFor="locationAddress">
          <Input
            id="locationAddress"
            value={form.locationAddress}
            onChange={(event) => set('locationAddress', event.target.value)}
            className={ALTO_CAMPO}
          />
        </Field>
        <Field label="Ciudad" htmlFor="locationCity">
          <Input
            id="locationCity"
            value={form.locationCity}
            onChange={(event) => set('locationCity', event.target.value)}
            placeholder="Medellín"
            className={ALTO_CAMPO}
          />
        </Field>

        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Recibe usada en parte de pago"
            checked={form.acceptsTradeIn}
            onCheckedChange={(checked) => set('acceptsTradeIn', checked)}
          />
          <ToggleRow
            label="Tiene financiación"
            checked={form.hasFinancing}
            onCheckedChange={(checked) => set('hasFinancing', checked)}
          />
        </div>

        <Field
          label="Medios de pago"
          htmlFor="paymentMethods"
          hint="Separados por comas."
        >
          <Input
            id="paymentMethods"
            value={form.paymentMethods}
            onChange={(event) => set('paymentMethods', event.target.value)}
            placeholder="Efectivo, transferencia, tarjeta"
            className={ALTO_CAMPO}
          />
        </Field>
      </TabsContent>
    </FormSheet>
  );
}
