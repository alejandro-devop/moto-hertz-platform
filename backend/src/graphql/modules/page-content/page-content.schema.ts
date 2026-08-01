import { gql } from 'graphql-tag';

export const pageContentTypeDefs = gql`
  """
  Contenido editorial suelto de una página del sitio (heading, caption, etc.),
  fuera de cualquier otro dominio. Tabla genérica \`page\` + \`field\` +
  \`value\`: agregar una página o un campo editable no pide una migración
  nueva — el código de \`web\`/\`cms-admin\` es quien sabe qué campos tiene
  cada página.
  """
  type PageContentField {
    page: String!
    field: String!
    value: String
    updatedAt: DateTime!
  }

  input PageContentFieldInput {
    field: String!
    value: String!
  }

  extend type Query {
    "Pública. Un campo que nunca se guardó desde el panel simplemente no aparece en la lista."
    pageContent(page: String!): [PageContentField!]!
  }

  extend type Mutation {
    pageContentSetMany(page: String!, fields: [PageContentFieldInput!]!): [PageContentField!]!
  }
`;
