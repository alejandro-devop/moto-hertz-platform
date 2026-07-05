import { gql } from 'graphql-tag';

export const motorcycleTypeDefs = gql`
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

  type Motorcycle {
    id: ID!
    slug: String!
    name: String!
    category: String
    year: Int
    price: String
    currency: String!
    description: String
    fullDescription: String
    engine: MotorcycleEngine
    features: [String!]!
    colors: [String!]!
    images: MotorcycleImages
    specs: MotorcycleSpecs
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

  input MotorcycleInput {
    slug: String!
    name: String!
    category: String
    year: Int
    price: String
    currency: String
    description: String
    fullDescription: String
    engine: MotorcycleEngineInput
    features: [String!]
    colors: [String!]
    images: MotorcycleImagesInput
    specs: MotorcycleSpecsInput
    available: Boolean
    featured: Boolean
  }

  input MotorcycleEditInput {
    id: ID!
    slug: String
    name: String
    category: String
    year: Int
    price: String
    currency: String
    description: String
    fullDescription: String
    engine: MotorcycleEngineInput
    features: [String!]
    colors: [String!]
    images: MotorcycleImagesInput
    specs: MotorcycleSpecsInput
    available: Boolean
    featured: Boolean
  }
`;
