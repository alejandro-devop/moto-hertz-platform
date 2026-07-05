export interface MotorcycleEngine {
  [key: string]: string | undefined;
  type?: string;
  displacement?: string;
  power?: string;
  torque?: string;
}

export interface MotorcycleImages {
  main: string;
  gallery: string[];
}

export interface MotorcycleSpecs {
  [key: string]: string | undefined;
  weight?: string;
  seatHeight?: string;
  fuelCapacity?: string;
  transmission?: string;
}

export interface Motorcycle {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
  year?: number | null;
  price?: string | null;
  currency: string;
  description?: string | null;
  fullDescription?: string | null;
  engine?: MotorcycleEngine | null;
  features: string[];
  colors: string[];
  images?: MotorcycleImages | null;
  specs?: MotorcycleSpecs | null;
  available: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MotorcycleCollection {
  motorcycles: Motorcycle[];
  page: number;
  limit: number;
  total: number;
}

export interface ListMotorcyclesOptions {
  category?: string;
  featured?: boolean;
  available?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateMotorcycleInput {
  slug: string;
  name: string;
  category?: string;
  year?: number;
  price?: string;
  currency?: string;
  description?: string;
  fullDescription?: string;
  engine?: MotorcycleEngine;
  features?: string[];
  colors?: string[];
  images?: MotorcycleImages;
  specs?: MotorcycleSpecs;
  available?: boolean;
  featured?: boolean;
}

export interface UpdateMotorcycleInput extends Partial<CreateMotorcycleInput> {}
