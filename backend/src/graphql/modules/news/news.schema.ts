import { gql } from 'graphql-tag';

export const newsTypeDefs = gql`
  """
  Una noticia del blog del sitio. **La vista pública y la del panel difieren
  aquí, y solo aquí en todo el proyecto**: el sitio nunca devuelve una
  noticia sin \`publishedAt\` (borrador) ni con \`publishedAt\` en el futuro
  (programada); el panel las ve todas siempre. Ver \`news.resolvers.ts\`.
  """
  type News {
    id: ID!
    slug: String!
    title: String!
    excerpt: String
    "HTML del editor enriquecido del panel, ya saneado al guardarse."
    content: String
    "Solo el nombre: no hay avatar (ver migración \`009\`)."
    author: String
    "Texto libre, no un catálogo cerrado: el panel sugiere las que ya existen."
    category: String
    "\`null\` = borrador. En el futuro = programada. Hoy o antes = publicada."
    publishedAt: DateTime
    featured: Boolean!
    tags: [String!]!
    image: String
    "Tal como se le dice al lector: «5 min»."
    readTime: String
    createdAt: DateTime!
    updatedAt: DateTime!
    "Con valor = está en la papelera. No sale en ningún listado normal."
    deletedAt: DateTime
  }

  type NewsCollection {
    news: [News!]!
    page: Int!
    limit: Int!
    total: Int!
  }

  extend type Query {
    "Detalle por slug. Sin sesión, nunca devuelve un borrador ni algo programado."
    news(slug: String!): News
    newsList(
      category: String
      featured: Boolean
      page: Int
      limit: Int
      "Con \`true\` devuelve solo la papelera. Solo tiene efecto con sesión: sin ella siempre se ignora."
      trashed: Boolean
    ): NewsCollection!
  }

  extend type Mutation {
    newsAdd(input: NewsInput!): News!
    newsEdit(input: NewsEditInput!): News!
    "A la papelera; se puede restaurar."
    newsRemove(id: ID!): Boolean!
    newsRestore(id: ID!): News!
    "Definitivo. Solo funciona sobre una noticia que ya está en la papelera."
    newsPurge(id: ID!): Boolean!
  }

  input NewsInput {
    slug: String!
    title: String!
    excerpt: String
    content: String
    author: String
    category: String
    "Vacío o sin mandar = borrador."
    publishedAt: DateTime
    featured: Boolean
    tags: [String!]
    image: String
    readTime: String
  }

  input NewsEditInput {
    id: ID!
    slug: String
    title: String
    excerpt: String
    content: String
    author: String
    category: String
    "Mandar \`null\` explícito vuelve la noticia a borrador."
    publishedAt: DateTime
    featured: Boolean
    tags: [String!]
    image: String
    readTime: String
  }
`;
