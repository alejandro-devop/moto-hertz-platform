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
import type { Motorcycle, MotorcycleFormInput } from "@/lib/graphql/motorcycles";

interface FormState {
  slug: string;
  name: string;
  category: string;
  year: string;
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
  available: boolean;
  featured: boolean;
}

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  category: "",
  year: "",
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
  available: true,
  featured: false,
};

function motorcycleToForm(motorcycle: Motorcycle): FormState {
  return {
    slug: motorcycle.slug,
    name: motorcycle.name,
    category: motorcycle.category ?? "",
    year: motorcycle.year?.toString() ?? "",
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
    year: form.year ? Number(form.year) : undefined,
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
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
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
