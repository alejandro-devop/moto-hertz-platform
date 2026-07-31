import { gql } from 'graphql-tag';

export const mediaTypeDefs = gql`
  """
  Un archivo de la biblioteca de medios. Lo que se guarda siempre es un WebP
  procesado al subir (lado mayor acotado); el original no se conserva.

  La **subida no pasa por GraphQL**: va al endpoint REST \`POST /api/media\`
  (multipart), que exige el mismo JWT que las mutaciones.
  """
  type Media {
    id: ID!
    "Ruta dentro del driver de almacenamiento."
    key: String!
    "URL pública, la misma que se guarda en el contenido."
    url: String!
    driver: String!
    mimeType: String!
    sizeBytes: Int!
    width: Int
    height: Int
    originalName: String
    createdAt: DateTime!
    updatedAt: DateTime!
    "Con valor = está en la papelera."
    deletedAt: DateTime
  }

  type MediaCollection {
    media: [Media!]!
    page: Int!
    limit: Int!
    total: Int!
  }

  extend type Query {
    """
    La biblioteca. **Exige sesión**, a diferencia de las queries de catálogo:
    es una herramienta del panel, no contenido público.
    """
    mediaList(page: Int, limit: Int, q: String, trashed: Boolean): MediaCollection!
  }

  extend type Mutation {
    "A la papelera. El archivo se queda y su URL sigue respondiendo."
    mediaRemove(id: ID!): Media!
    mediaRestore(id: ID!): Media!
    "Definitivo: borra también el archivo del almacenamiento."
    mediaPurge(id: ID!): Boolean!
  }
`;
