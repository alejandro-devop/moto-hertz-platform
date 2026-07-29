import { NextRequest, NextResponse } from 'next/server';
import { getBackendGraphQLUrl } from '@/lib/backend';
import { getSessionToken } from '@/lib/session';

/**
 * Proxy hacia el GraphQL del backend. El JWT vive en una cookie httpOnly
 * (no accesible desde JS del navegador); este route handler la lee en el
 * servidor y la reenvía como `Authorization: Bearer <token>`, para que el
 * cliente GraphQL del navegador solo necesite hablar con el mismo origen.
 */
export async function POST(request: NextRequest) {
  const token = await getSessionToken();
  const body = await request.text();

  const response = await fetch(getBackendGraphQLUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  const data = await response.text();
  return new NextResponse(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
