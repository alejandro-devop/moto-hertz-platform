import { gql } from 'graphql-tag';

export const motorcycleTypeDefs = gql`
  "Nueva o usada. Ambas comparten tipo: cambian los bloques que se llenan."
  enum MotorcycleCondition {
    NEW
    USED
  }

  type MotorcycleEngine {
    type: String
    displacement: String
    power: String
    torque: String
  }

  type MotorcycleImages {
    main: String!
    gallery: [String!]!
  }

  type MotorcycleSpecs {
    weight: String
    seatHeight: String
    fuelCapacity: String
    transmission: String
  }

  """
  Documentación y procedencia. Cada trámite tiene fecha y nota: en las usadas
  se publica una vigencia real, en las nuevas una condición de venta
  ("NO INCLUIDO EN EL PRECIO PUBLICADO"). Las fechas son ISO \`YYYY-MM-DD\`.
  """
  type MotorcyclePaperwork {
    registrationCity: String
    soatExpiresAt: String
    soatNote: String
    technicalInspectionExpiresAt: String
    technicalInspectionNote: String
    registrationCostNote: String
    transferIncluded: Boolean
    singleOwner: Boolean
    provenanceWarranty: Boolean
  }

  type MotorcycleCommercial {
    acceptsTradeIn: Boolean
    hasFinancing: Boolean
    paymentMethods: [String!]
  }

  "Sede donde está físicamente la moto."
  type MotorcycleLocation {
    name: String
    address: String
    city: String
  }

  type Motorcycle {
    id: ID!
    slug: String!
    name: String!
    category: String
    brand: String
    condition: MotorcycleCondition!
    year: Int
    mileageKm: Int
    price: String
    currency: String!
    description: String
    fullDescription: String
    engine: MotorcycleEngine
    features: [String!]!
    colors: [String!]!
    images: MotorcycleImages
    specs: MotorcycleSpecs
    paperwork: MotorcyclePaperwork
    commercial: MotorcycleCommercial
    location: MotorcycleLocation
    available: Boolean!
    featured: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MotorcycleCollection {
    motorcycles: [Motorcycle!]!
    page: Int!
    limit: Int!
    total: Int!
  }

  extend type Query {
    motorcycle(slug: String!): Motorcycle
    motorcycles(
      category: String
      brand: String
      condition: MotorcycleCondition
      featured: Boolean
      available: Boolean
      page: Int
      limit: Int
    ): MotorcycleCollection!
  }

  extend type Mutation {
    motorcycleAdd(input: MotorcycleInput!): Motorcycle!
    motorcycleEdit(input: MotorcycleEditInput!): Motorcycle!
    motorcycleRemove(id: ID!): Boolean!
  }

  input MotorcycleEngineInput {
    type: String
    displacement: String
    power: String
    torque: String
  }

  input MotorcycleImagesInput {
    main: String!
    gallery: [String!]
  }

  input MotorcycleSpecsInput {
    weight: String
    seatHeight: String
    fuelCapacity: String
    transmission: String
  }

  input MotorcyclePaperworkInput {
    registrationCity: String
    soatExpiresAt: String
    soatNote: String
    technicalInspectionExpiresAt: String
    technicalInspectionNote: String
    registrationCostNote: String
    transferIncluded: Boolean
    singleOwner: Boolean
    provenanceWarranty: Boolean
  }

  input MotorcycleCommercialInput {
    acceptsTradeIn: Boolean
    hasFinancing: Boolean
    paymentMethods: [String!]
  }

  input MotorcycleLocationInput {
    name: String
    address: String
    city: String
  }

  input MotorcycleInput {
    slug: String!
    name: String!
    category: String
    brand: String
    condition: MotorcycleCondition
    year: Int
    mileageKm: Int
    price: String
    currency: String
    description: String
    fullDescription: String
    engine: MotorcycleEngineInput
    features: [String!]
    colors: [String!]
    images: MotorcycleImagesInput
    specs: MotorcycleSpecsInput
    paperwork: MotorcyclePaperworkInput
    commercial: MotorcycleCommercialInput
    location: MotorcycleLocationInput
    available: Boolean
    featured: Boolean
  }

  input MotorcycleEditInput {
    id: ID!
    slug: String
    name: String
    category: String
    brand: String
    condition: MotorcycleCondition
    year: Int
    mileageKm: Int
    price: String
    currency: String
    description: String
    fullDescription: String
    engine: MotorcycleEngineInput
    features: [String!]
    colors: [String!]
    images: MotorcycleImagesInput
    specs: MotorcycleSpecsInput
    paperwork: MotorcyclePaperworkInput
    commercial: MotorcycleCommercialInput
    location: MotorcycleLocationInput
    available: Boolean
    featured: Boolean
  }
`;
