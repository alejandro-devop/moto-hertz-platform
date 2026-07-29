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

export interface MotorcycleFormInput {
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

const MOTORCYCLE_FIELDS = /* GraphQL */ `
  id
  slug
  name
  category
  year
  price
  currency
  description
  fullDescription
  engine {
    type
    displacement
    power
    torque
  }
  features
  colors
  images {
    main
    gallery
  }
  specs {
    weight
    seatHeight
    fuelCapacity
    transmission
  }
  available
  featured
`;

export const MOTORCYCLES_QUERY = /* GraphQL */ `
  query Motorcycles($page: Int, $limit: Int) {
    motorcycles(page: $page, limit: $limit) {
      total
      page
      limit
      motorcycles {
        ${MOTORCYCLE_FIELDS}
      }
    }
  }
`;

export const MOTORCYCLE_ADD_MUTATION = /* GraphQL */ `
  mutation MotorcycleAdd($input: MotorcycleInput!) {
    motorcycleAdd(input: $input) {
      ${MOTORCYCLE_FIELDS}
    }
  }
`;

export const MOTORCYCLE_EDIT_MUTATION = /* GraphQL */ `
  mutation MotorcycleEdit($input: MotorcycleEditInput!) {
    motorcycleEdit(input: $input) {
      ${MOTORCYCLE_FIELDS}
    }
  }
`;

export const MOTORCYCLE_REMOVE_MUTATION = /* GraphQL */ `
  mutation MotorcycleRemove($id: ID!) {
    motorcycleRemove(id: $id)
  }
`;

export interface MotorcyclesQueryResult {
  motorcycles: {
    total: number;
    page: number;
    limit: number;
    motorcycles: Motorcycle[];
  };
}
