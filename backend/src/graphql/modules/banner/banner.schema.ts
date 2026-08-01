import { gql } from 'graphql-tag';

export const bannerTypeDefs = gql`
  """
  Dónde aparece un banner en \`web\`. Catálogo cerrado: el valor decide en qué
  componente se pinta, así que lo controla el dominio, no texto libre — ver
  la migración \`013\`.
  """
  enum BannerSlot {
    "El carrusel de la portada."
    HOME
    "El banner ancho debajo de la franja de servicios del home."
    SECUNDARIO
  }

  """
  Un banner de \`web\`. **La vista pública y la del panel difieren aquí**,
  mismo criterio que \`News\`: el sitio solo ve banners \`active: true\` y
  dentro de vigencia (\`startsAt\`/\`endsAt\`); el panel los ve todos, papelera
  aparte. Ver \`banner.resolvers.ts\`.
  """
  type Banner {
    id: ID!
    title: String!
    subtitle: String
    image: String!
    "Si falta, el sitio usa \`image\` también en pantallas pequeñas."
    imageMobile: String
    link: String
    linkLabel: String
    slot: BannerSlot!
    "El orden dentro de su slot. Un banner nuevo se agrega al final del suyo."
    position: Int!
    active: Boolean!
    "Sin fecha, el banner ya está vigente."
    startsAt: DateTime
    "Sin fecha, el banner no vence nunca."
    endsAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    "Con valor = está en la papelera. No sale en ningún listado normal."
    deletedAt: DateTime
  }

  type BannerCollection {
    banners: [Banner!]!
    page: Int!
    limit: Int!
    total: Int!
  }

  extend type Query {
    "Sin sesión, solo devuelve los banners activos y vigentes, en orden."
    banners(
      page: Int
      limit: Int
      "Sin esto, trae banners de todos los slots (lo que usa la lista del panel)."
      slot: BannerSlot
      "Con \`true\` devuelve solo la papelera. Solo tiene efecto con sesión: sin ella siempre se ignora."
      trashed: Boolean
    ): BannerCollection!
  }

  extend type Mutation {
    bannerAdd(input: BannerInput!): Banner!
    bannerEdit(input: BannerEditInput!): Banner!
    "A la papelera; se puede restaurar."
    bannerRemove(id: ID!): Boolean!
    bannerRestore(id: ID!): Banner!
    "Definitivo. Solo funciona sobre un banner que ya está en la papelera."
    bannerPurge(id: ID!): Boolean!
    "El orden completo de un slot, de arriba a abajo: la posición de cada uno pasa a ser su índice en esta lista. No toca los demás slots."
    bannerReorder(slot: BannerSlot!, ids: [ID!]!): [Banner!]!
  }

  input BannerInput {
    title: String!
    subtitle: String
    image: String!
    imageMobile: String
    link: String
    linkLabel: String
    slot: BannerSlot!
    active: Boolean
    startsAt: DateTime
    endsAt: DateTime
  }

  input BannerEditInput {
    id: ID!
    title: String
    subtitle: String
    image: String
    imageMobile: String
    link: String
    linkLabel: String
    slot: BannerSlot
    active: Boolean
    "Mandar \`null\` explícito quita la fecha (el banner queda sin vencer o vigente desde ya)."
    startsAt: DateTime
    endsAt: DateTime
  }
`;
