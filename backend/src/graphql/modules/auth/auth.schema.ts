import { gql } from 'graphql-tag';

export const authTypeDefs = gql`
  type AdminUser {
    id: ID!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: AdminUser!
  }

  extend type Mutation {
    login(email: String!, password: String!): AuthPayload!
  }
`;
