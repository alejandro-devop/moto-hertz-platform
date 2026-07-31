import { gql } from 'graphql-tag';

export const serviceTypeDefs = gql`
  """
  Cómo se cobra un servicio. Se acordó con el usuario en la Fase 3 del plan
  CMS y las tres capas leen la misma forma: \`DESDE\` y \`FIJO\` llevan monto,
  \`A_CONVENIR\` no lleva ninguno.
  """
  enum ServicePricingMode {
    "Hay un piso; el total depende del trabajo."
    DESDE
    "Vale eso y punto."
    FIJO
    "Se cotiza: no hay número que publicar."
    A_CONVENIR
  }

  """
  El precio. \`amount\` viene en \`null\` cuando la modalidad es
  \`A_CONVENIR\`; \`currency\` es siempre \`COP\`. \`note\` es la nota libre
  («cada 5.000 km», «una vez al año»). **Si \`pricing\` entero llega en
  \`null\`, se lee como \`A_CONVENIR\`.**
  """
  type ServicePricing {
    mode: ServicePricingMode!
    amount: Float
    currency: String!
    note: String
  }

  """
  Un servicio del taller. \`features\` y \`benefits\` son listas ordenadas: el
  orden en que llegan es el orden en que se editaron en el panel y el orden en
  que las pinta el sitio.
  """
  type Service {
    id: ID!
    slug: String!
    name: String!
    "Texto libre, no un catálogo cerrado: el panel sugiere las que ya existen."
    category: String
    shortDescription: String
    fullDescription: String
    "Nombre de un icono de lucide en kebab-case (\`wrench\`, \`shield-check\`)."
    icon: String
    features: [String!]!
    benefits: [String!]!
    pricing: ServicePricing
    "Cuánto se demora, como se le dice al cliente: «2-3 horas»."
    duration: String
    featured: Boolean!
    image: String
    createdAt: DateTime!
    updatedAt: DateTime!
    "Con valor = está en la papelera. No sale en ningún listado normal."
    deletedAt: DateTime
  }

  type ServiceCollection {
    services: [Service!]!
    page: Int!
    limit: Int!
    total: Int!
  }

  extend type Query {
    service(slug: String!): Service
    services(
      category: String
      featured: Boolean
      page: Int
      limit: Int
      "Con \`true\` devuelve solo la papelera. Por defecto, solo lo no borrado."
      trashed: Boolean
    ): ServiceCollection!
  }

  extend type Mutation {
    serviceAdd(input: ServiceInput!): Service!
    serviceEdit(input: ServiceEditInput!): Service!
    "A la papelera; se puede restaurar."
    serviceRemove(id: ID!): Boolean!
    serviceRestore(id: ID!): Service!
    "Definitivo. Solo funciona sobre un servicio que ya está en la papelera."
    servicePurge(id: ID!): Boolean!
  }

  """
  El precio que se manda al guardar. La moneda no se envía: la fija el backend
  en \`COP\`. Con \`A_CONVENIR\` el monto se ignora.
  """
  input ServicePricingInput {
    mode: ServicePricingMode!
    amount: Float
    note: String
  }

  input ServiceInput {
    slug: String!
    name: String!
    category: String
    shortDescription: String
    fullDescription: String
    icon: String
    features: [String!]
    benefits: [String!]
    pricing: ServicePricingInput
    duration: String
    featured: Boolean
    image: String
  }

  input ServiceEditInput {
    id: ID!
    slug: String
    name: String
    category: String
    shortDescription: String
    fullDescription: String
    icon: String
    features: [String!]
    benefits: [String!]
    pricing: ServicePricingInput
    duration: String
    featured: Boolean
    image: String
  }
`;
