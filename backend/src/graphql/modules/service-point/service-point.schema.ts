import { gql } from 'graphql-tag';

export const servicePointTypeDefs = gql`
  """
  Catálogo cerrado de tipos de punto de atención. Sale de lo que publica el
  sitio actual: sedes propias, la sede de motos nuevas (concesionario) y los
  distribuidores aliados. Agregar un valor toca este enum, el validador Zod, el
  tipo de TypeScript y las etiquetas del panel.
  """
  enum ServicePointType {
    "Sede propia."
    SEDE
    "Concesionario de motos nuevas."
    CONCESIONARIO
    "Distribuidor aliado."
    DISTRIBUIDOR
  }

  "La dirección partida en lo que de verdad se escribe. Sin código postal ni país."
  type ServicePointAddress {
    street: String
    neighborhood: String
    city: String
    state: String
  }

  """
  Ubicación. Se captura pegando el enlace de Google Maps; \`lat\` y \`lng\` las
  extrae el backend del propio enlace cuando vienen en él. Si el enlace no las
  trae (los acortados \`maps.app.goo.gl\` no las traen), llegan en \`null\` y el
  sitio ofrece «Cómo llegar» sin mapa incrustado.
  """
  type ServicePointLocation {
    mapsUrl: String
    lat: Float
    lng: Float
  }

  "Un tramo de atención, en formato 24 h (\`\\"09:15\\"\`)."
  type ServicePointDayHours {
    open: String!
    close: String!
  }

  "Horario semanal. **Un día en \`null\` está cerrado**: no hay bandera aparte."
  type ServicePointHours {
    monday: ServicePointDayHours
    tuesday: ServicePointDayHours
    wednesday: ServicePointDayHours
    thursday: ServicePointDayHours
    friday: ServicePointDayHours
    saturday: ServicePointDayHours
    sunday: ServicePointDayHours
  }

  """
  Un punto de atención. Las columnas \`services\`, \`featured\` e \`image\` de la
  tabla quedaron sin usar (Fase 2 del plan CMS) y por eso no están aquí.
  """
  type ServicePoint {
    id: ID!
    slug: String!
    name: String!
    type: ServicePointType!
    address: ServicePointAddress
    phone: String
    whatsapp: String
    email: String
    location: ServicePointLocation
    hours: ServicePointHours
    createdAt: DateTime!
    updatedAt: DateTime!
    "Con valor = está en la papelera. No sale en ningún listado normal."
    deletedAt: DateTime
  }

  type ServicePointCollection {
    servicePoints: [ServicePoint!]!
    page: Int!
    limit: Int!
    total: Int!
  }

  extend type Query {
    servicePoint(slug: String!): ServicePoint
    servicePoints(
      type: ServicePointType
      page: Int
      limit: Int
      "Con \`true\` devuelve solo la papelera. Por defecto, solo lo no borrado."
      trashed: Boolean
    ): ServicePointCollection!
  }

  extend type Mutation {
    servicePointAdd(input: ServicePointInput!): ServicePoint!
    servicePointEdit(input: ServicePointEditInput!): ServicePoint!
    "A la papelera; se puede restaurar."
    servicePointRemove(id: ID!): Boolean!
    servicePointRestore(id: ID!): ServicePoint!
    "Definitivo. Solo funciona sobre un punto que ya está en la papelera."
    servicePointPurge(id: ID!): Boolean!
  }

  input ServicePointAddressInput {
    street: String
    neighborhood: String
    city: String
    state: String
  }

  "Solo el enlace: las coordenadas las saca el backend de ahí, no se envían."
  input ServicePointLocationInput {
    mapsUrl: String
  }

  input ServicePointDayHoursInput {
    open: String!
    close: String!
  }

  "Los días que no se manden quedan cerrados."
  input ServicePointHoursInput {
    monday: ServicePointDayHoursInput
    tuesday: ServicePointDayHoursInput
    wednesday: ServicePointDayHoursInput
    thursday: ServicePointDayHoursInput
    friday: ServicePointDayHoursInput
    saturday: ServicePointDayHoursInput
    sunday: ServicePointDayHoursInput
  }

  input ServicePointInput {
    slug: String!
    name: String!
    type: ServicePointType!
    address: ServicePointAddressInput
    phone: String
    whatsapp: String
    email: String
    location: ServicePointLocationInput
    hours: ServicePointHoursInput
  }

  input ServicePointEditInput {
    id: ID!
    slug: String
    name: String
    type: ServicePointType
    address: ServicePointAddressInput
    phone: String
    whatsapp: String
    email: String
    location: ServicePointLocationInput
    hours: ServicePointHoursInput
  }
`;
