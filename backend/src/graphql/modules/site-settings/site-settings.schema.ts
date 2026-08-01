import { gql } from 'graphql-tag';

export const siteSettingsTypeDefs = gql`
  """
  Configuración global del sitio: contacto, redes sociales, SEO y el nombre
  del sitio (Fase 6 del plan CMS). Es un **registro único**: no hay \`Add\` ni
  \`Remove\`, solo \`siteSettingsEdit\` sobre la misma fila.
  """
  type SiteSettings {
    id: ID!
    siteName: String!
    phone: String
    email: String
    "Campo nuevo de esta fase: no existía configuración de WhatsApp a nivel de sitio, solo por punto de atención."
    whatsapp: String
    "Dirección física global, texto libre. No reemplaza las direcciones de cada punto de atención."
    address: String
    socialFacebook: String
    socialInstagram: String
    socialTwitter: String
    socialYoutube: String
    seoTitle: String
    seoDescription: String
    seoKeywords: [String!]!
    "Imagen para compartir en redes (Open Graph)."
    seoImage: String
    updatedAt: DateTime!
  }

  extend type Query {
    "Pública, sin argumentos: siempre hay una fila (la migración 011 la siembra)."
    siteSettings: SiteSettings!
  }

  extend type Mutation {
    siteSettingsEdit(input: SiteSettingsEditInput!): SiteSettings!
  }

  input SiteSettingsEditInput {
    siteName: String
    phone: String
    email: String
    whatsapp: String
    address: String
    socialFacebook: String
    socialInstagram: String
    socialTwitter: String
    socialYoutube: String
    seoTitle: String
    seoDescription: String
    seoKeywords: [String!]
    seoImage: String
  }
`;
