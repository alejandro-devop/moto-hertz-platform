"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  Motorcycle,
  MotorcycleCondition,
  MotorcycleFormInput,
} from "@/lib/graphql/motorcycles";

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

interface FormState {
  slug: string;
  name: string;
  category: string;
  brand: string;
  condition: MotorcycleCondition;
  year: string;
  mileageKm: string;
  price: string;
  currency: string;
  description: string;
  fullDescription: string;
  engineType: string;
  engineDisplacement: string;
  enginePower: string;
  engineTorque: string;
  features: string;
  colors: string;
  imagesMain: string;
  imagesGallery: string;
  specsWeight: string;
  specsSeatHeight: string;
  specsFuelCapacity: string;
  specsTransmission: string;
  registrationCity: string;
  soatExpiresAt: string;
  soatNote: string;
  technicalInspectionExpiresAt: string;
  technicalInspectionNote: string;
  registrationCostNote: string;
  transferIncluded: boolean;
  singleOwner: boolean;
  provenanceWarranty: boolean;
  acceptsTradeIn: boolean;
  hasFinancing: boolean;
  paymentMethods: string;
  locationName: string;
  locationAddress: string;
  locationCity: string;
  available: boolean;
  featured: boolean;
}

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  category: "",
  brand: "",
  condition: "NEW",
  year: "",
  mileageKm: "",
  price: "",
  currency: "COP",
  description: "",
  fullDescription: "",
  engineType: "",
  engineDisplacement: "",
  enginePower: "",
  engineTorque: "",
  features: "",
  colors: "",
  imagesMain: "",
  imagesGallery: "",
  specsWeight: "",
  specsSeatHeight: "",
  specsFuelCapacity: "",
  specsTransmission: "",
  registrationCity: "",
  soatExpiresAt: "",
  soatNote: "",
  technicalInspectionExpiresAt: "",
  technicalInspectionNote: "",
  registrationCostNote: "",
  transferIncluded: false,
  singleOwner: false,
  provenanceWarranty: false,
  acceptsTradeIn: false,
  hasFinancing: false,
  paymentMethods: "",
  locationName: "",
  locationAddress: "",
  locationCity: "",
  available: true,
  featured: false,
};

function motorcycleToForm(motorcycle: Motorcycle): FormState {
  return {
    slug: motorcycle.slug,
    name: motorcycle.name,
    category: motorcycle.category ?? "",
    brand: motorcycle.brand ?? "",
    condition: motorcycle.condition ?? "NEW",
    year: motorcycle.year?.toString() ?? "",
    mileageKm: motorcycle.mileageKm?.toString() ?? "",
    price: motorcycle.price ?? "",
    currency: motorcycle.currency,
    description: motorcycle.description ?? "",
    fullDescription: motorcycle.fullDescription ?? "",
    engineType: motorcycle.engine?.type ?? "",
    engineDisplacement: motorcycle.engine?.displacement ?? "",
    enginePower: motorcycle.engine?.power ?? "",
    engineTorque: motorcycle.engine?.torque ?? "",
    features: (motorcycle.features ?? []).join(", "),
    colors: (motorcycle.colors ?? []).join(", "),
    imagesMain: motorcycle.images?.main ?? "",
    imagesGallery: (motorcycle.images?.gallery ?? []).join(", "),
    specsWeight: motorcycle.specs?.weight ?? "",
    specsSeatHeight: motorcycle.specs?.seatHeight ?? "",
    specsFuelCapacity: motorcycle.specs?.fuelCapacity ?? "",
    specsTransmission: motorcycle.specs?.transmission ?? "",
    registrationCity: motorcycle.paperwork?.registrationCity ?? "",
    soatExpiresAt: motorcycle.paperwork?.soatExpiresAt ?? "",
    soatNote: motorcycle.paperwork?.soatNote ?? "",
    technicalInspectionExpiresAt:
      motorcycle.paperwork?.technicalInspectionExpiresAt ?? "",
    technicalInspectionNote: motorcycle.paperwork?.technicalInspectionNote ?? "",
    registrationCostNote: motorcycle.paperwork?.registrationCostNote ?? "",
    transferIncluded: motorcycle.paperwork?.transferIncluded ?? false,
    singleOwner: motorcycle.paperwork?.singleOwner ?? false,
    provenanceWarranty: motorcycle.paperwork?.provenanceWarranty ?? false,
    acceptsTradeIn: motorcycle.commercial?.acceptsTradeIn ?? false,
    hasFinancing: motorcycle.commercial?.hasFinancing ?? false,
    paymentMethods: (motorcycle.commercial?.paymentMethods ?? []).join(", "),
    locationName: motorcycle.location?.name ?? "",
    locationAddress: motorcycle.location?.address ?? "",
    locationCity: motorcycle.location?.city ?? "",
    available: motorcycle.available,
    featured: motorcycle.featured,
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formToInput(form: FormState): MotorcycleFormInput {
  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    category: form.category.trim() || undefined,
    brand: form.brand.trim() || undefined,
    condition: form.condition,
    year: form.year ? Number(form.year) : undefined,
    mileageKm: form.mileageKm ? Number(form.mileageKm) : undefined,
    price: form.price.trim() || undefined,
    currency: form.currency.trim() || undefined,
    description: form.description.trim() || undefined,
    fullDescription: form.fullDescription.trim() || undefined,
    engine: {
      type: form.engineType.trim() || undefined,
      displacement: form.engineDisplacement.trim() || undefined,
      power: form.enginePower.trim() || undefined,
      torque: form.engineTorque.trim() || undefined,
    },
    features: splitList(form.features),
    colors: splitList(form.colors),
    images: {
      main: form.imagesMain.trim(),
      gallery: splitList(form.imagesGallery),
    },
    specs: {
      weight: form.specsWeight.trim() || undefined,
      seatHeight: form.specsSeatHeight.trim() || undefined,
      fuelCapacity: form.specsFuelCapacity.trim() || undefined,
      transmission: form.specsTransmission.trim() || undefined,
    },
    paperwork: {
      registrationCity: form.registrationCity.trim() || undefined,
      soatExpiresAt: form.soatExpiresAt.trim() || undefined,
      soatNote: form.soatNote.trim() || undefined,
      technicalInspectionExpiresAt:
        form.technicalInspectionExpiresAt.trim() || undefined,
      technicalInspectionNote: form.technicalInspectionNote.trim() || undefined,
      registrationCostNote: form.registrationCostNote.trim() || undefined,
      transferIncluded: form.transferIncluded,
      singleOwner: form.singleOwner,
      provenanceWarranty: form.provenanceWarranty,
    },
    commercial: {
      acceptsTradeIn: form.acceptsTradeIn,
      hasFinancing: form.hasFinancing,
      paymentMethods: splitList(form.paymentMethods),
    },
    location: {
      name: form.locationName.trim() || undefined,
      address: form.locationAddress.trim() || undefined,
      city: form.locationCity.trim() || undefined,
    },
    available: form.available,
    featured: form.featured,
  };
}

interface MotorcycleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorcycle: Motorcycle | null;
  onSubmit: (input: MotorcycleFormInput) => Promise<void>;
  submitting: boolean;
}

export function MotorcycleFormDialog({
  open,
  onOpenChange,
  motorcycle,
  onSubmit,
  submitting,
}: MotorcycleFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(motorcycle ? motorcycleToForm(motorcycle) : EMPTY_FORM);
    }
  }, [open, motorcycle]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(formToInput(form));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{motorcycle ? "Editar moto" : "Nueva moto"}</DialogTitle>
          <DialogDescription>
            Completa la información del modelo. Los campos de lista (características, colores,
            galería) se separan por comas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                required
                disabled={!!motorcycle}
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="condition">Condición</Label>
              <select
                id="condition"
                className={SELECT_CLASS}
                value={form.condition}
                onChange={(e) =>
                  set("condition", e.target.value as MotorcycleCondition)
                }
              >
                <option value="NEW">Nueva</option>
                <option value="USED">Usada</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mileageKm">Kilometraje</Label>
              <Input
                id="mileageKm"
                type="number"
                min={0}
                placeholder="Solo para usadas"
                value={form.mileageKm}
                onChange={(e) => set("mileageKm", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descripción corta</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fullDescription">Descripción completa</Label>
            <Textarea
              id="fullDescription"
              rows={4}
              value={form.fullDescription}
              onChange={(e) => set("fullDescription", e.target.value)}
            />
          </div>

          <fieldset className="grid grid-cols-2 gap-4 rounded-md border p-4">
            <legend className="px-1 text-sm font-medium">Motor</legend>
            <div className="flex flex-col gap-2">
              <Label htmlFor="engineType">Tipo</Label>
              <Input
                id="engineType"
                value={form.engineType}
                onChange={(e) => set("engineType", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="engineDisplacement">Cilindraje</Label>
              <Input
                id="engineDisplacement"
                value={form.engineDisplacement}
                onChange={(e) => set("engineDisplacement", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="enginePower">Potencia</Label>
              <Input
                id="enginePower"
                value={form.enginePower}
                onChange={(e) => set("enginePower", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="engineTorque">Torque</Label>
              <Input
                id="engineTorque"
                value={form.engineTorque}
                onChange={(e) => set("engineTorque", e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="grid grid-cols-2 gap-4 rounded-md border p-4">
            <legend className="px-1 text-sm font-medium">Especificaciones</legend>
            <div className="flex flex-col gap-2">
              <Label htmlFor="specsWeight">Peso</Label>
              <Input
                id="specsWeight"
                value={form.specsWeight}
                onChange={(e) => set("specsWeight", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="specsSeatHeight">Altura de asiento</Label>
              <Input
                id="specsSeatHeight"
                value={form.specsSeatHeight}
                onChange={(e) => set("specsSeatHeight", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="specsFuelCapacity">Capacidad de tanque</Label>
              <Input
                id="specsFuelCapacity"
                value={form.specsFuelCapacity}
                onChange={(e) => set("specsFuelCapacity", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="specsTransmission">Transmisión</Label>
              <Input
                id="specsTransmission"
                value={form.specsTransmission}
                onChange={(e) => set("specsTransmission", e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-md border p-4">
            <legend className="px-1 text-sm font-medium">
              Documentación y procedencia
            </legend>
            <p className="text-xs text-muted-foreground">
              Cada trámite acepta fecha o nota. Usa la fecha para vigencias reales
              (usadas) y la nota para condiciones de venta (ej. &quot;No incluido en
              el precio publicado&quot;).
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="registrationCity">Ciudad de matrícula</Label>
                <Input
                  id="registrationCity"
                  value={form.registrationCity}
                  onChange={(e) => set("registrationCity", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="registrationCostNote">
                  Gastos de matrícula (nota)
                </Label>
                <Input
                  id="registrationCostNote"
                  value={form.registrationCostNote}
                  onChange={(e) => set("registrationCostNote", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="soatExpiresAt">SOAT vigente hasta</Label>
                <Input
                  id="soatExpiresAt"
                  type="date"
                  value={form.soatExpiresAt}
                  onChange={(e) => set("soatExpiresAt", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="soatNote">SOAT (nota)</Label>
                <Input
                  id="soatNote"
                  value={form.soatNote}
                  onChange={(e) => set("soatNote", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="technicalInspectionExpiresAt">
                  Tecnomecánica vigente hasta
                </Label>
                <Input
                  id="technicalInspectionExpiresAt"
                  type="date"
                  value={form.technicalInspectionExpiresAt}
                  onChange={(e) =>
                    set("technicalInspectionExpiresAt", e.target.value)
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="technicalInspectionNote">
                  Tecnomecánica (nota)
                </Label>
                <Input
                  id="technicalInspectionNote"
                  value={form.technicalInspectionNote}
                  onChange={(e) =>
                    set("technicalInspectionNote", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="transferIncluded"
                  checked={form.transferIncluded}
                  onCheckedChange={(checked) =>
                    set("transferIncluded", checked === true)
                  }
                />
                <Label htmlFor="transferIncluded">Traspaso incluido</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="singleOwner"
                  checked={form.singleOwner}
                  onCheckedChange={(checked) =>
                    set("singleOwner", checked === true)
                  }
                />
                <Label htmlFor="singleOwner">Único dueño</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="provenanceWarranty"
                  checked={form.provenanceWarranty}
                  onCheckedChange={(checked) =>
                    set("provenanceWarranty", checked === true)
                  }
                />
                <Label htmlFor="provenanceWarranty">
                  Garantía de procedencia
                </Label>
              </div>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-md border p-4">
            <legend className="px-1 text-sm font-medium">
              Condiciones comerciales
            </legend>

            <div className="flex flex-col gap-2">
              <Label htmlFor="paymentMethods">
                Medios de pago (separados por coma)
              </Label>
              <Input
                id="paymentMethods"
                placeholder="Efectivo, Tarjeta de crédito, Transferencia bancaria"
                value={form.paymentMethods}
                onChange={(e) => set("paymentMethods", e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="acceptsTradeIn"
                  checked={form.acceptsTradeIn}
                  onCheckedChange={(checked) =>
                    set("acceptsTradeIn", checked === true)
                  }
                />
                <Label htmlFor="acceptsTradeIn">Recibe usada en parte de pago</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasFinancing"
                  checked={form.hasFinancing}
                  onCheckedChange={(checked) =>
                    set("hasFinancing", checked === true)
                  }
                />
                <Label htmlFor="hasFinancing">Tiene financiación</Label>
              </div>
            </div>
          </fieldset>

          <fieldset className="grid grid-cols-2 gap-4 rounded-md border p-4">
            <legend className="px-1 text-sm font-medium">
              Sede donde está la moto
            </legend>
            <div className="flex flex-col gap-2">
              <Label htmlFor="locationName">Nombre de la sede</Label>
              <Input
                id="locationName"
                value={form.locationName}
                onChange={(e) => set("locationName", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="locationCity">Ciudad</Label>
              <Input
                id="locationCity"
                value={form.locationCity}
                onChange={(e) => set("locationCity", e.target.value)}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="locationAddress">Dirección</Label>
              <Input
                id="locationAddress"
                value={form.locationAddress}
                onChange={(e) => set("locationAddress", e.target.value)}
              />
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="features">Características (separadas por coma)</Label>
            <Input
              id="features"
              value={form.features}
              onChange={(e) => set("features", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="colors">Colores (separados por coma)</Label>
            <Input
              id="colors"
              value={form.colors}
              onChange={(e) => set("colors", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="imagesMain">Imagen principal (URL)</Label>
            <Input
              id="imagesMain"
              required
              value={form.imagesMain}
              onChange={(e) => set("imagesMain", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="imagesGallery">Galería (URLs separadas por coma)</Label>
            <Input
              id="imagesGallery"
              value={form.imagesGallery}
              onChange={(e) => set("imagesGallery", e.target.value)}
            />
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="available"
                checked={form.available}
                onCheckedChange={(checked) => set("available", checked === true)}
              />
              <Label htmlFor="available">Disponible</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="featured"
                checked={form.featured}
                onCheckedChange={(checked) => set("featured", checked === true)}
              />
              <Label htmlFor="featured">Destacada</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
