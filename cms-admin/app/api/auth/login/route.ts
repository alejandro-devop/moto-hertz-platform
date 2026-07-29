import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';
import { getBackendGraphQLUrl } from '@/lib/backend';
import { setSessionCookie } from '@/lib/session';

const LOGIN_MUTATION = /* GraphQL */ `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
      }
    }
  }
`;

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y password son requeridos' }, { status: 400 });
  }

  const client = new GraphQLClient(getBackendGraphQLUrl());

  try {
    const data = await client.request<{
      login: { token: string; user: { id: string; email: string } };
    }>(LOGIN_MUTATION, { email, password });

    await setSessionCookie(data.login.token);

    return NextResponse.json({ user: data.login.user });
  } catch {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  }
}
