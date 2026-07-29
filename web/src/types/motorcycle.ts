export interface MotorcycleEngine {
  type?: string | null;
  displacement?: string | null;
  power?: string | null;
  torque?: string | null;
}

export interface MotorcycleImages {
  main: string;
  gallery: string[];
}

export interface MotorcycleSpecs {
  weight?: string | null;
  seatHeight?: string | null;
  fuelCapacity?: string | null;
  transmission?: string | null;
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
}

export interface MotorcycleCollection {
  total: number;
  page: number;
  limit: number;
  motorcycles: Motorcycle[];
}
