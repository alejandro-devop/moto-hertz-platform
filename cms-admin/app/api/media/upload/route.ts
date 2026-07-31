import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/session';

/**
 * Subida de archivos hacia el backend.
 *
 * Va por su propia ruta y **no** por el proxy `/api/graphql`: GraphQL no
 * transporta binarios, y ese proxy lee el cuerpo como texto. Aquí se hace lo
 * mismo que allá con el token —leer la cookie httpOnly en el servidor y
 * reenviarla como `Authorization: Bearer`— pero con el multipart intacto.
 */
export const runtime = 'nodejs';

function backendMediaUrl(): string {
  /* Se deriva del GraphQL para no tener dos variables que se puedan desalinear. */
  const graphql = process.env.BACKEND_GRAPHQL_URL || 'http://localhost:8080/graphql';
  return graphql.replace(/\/graphql\/?$/, '/api/media');
}

export async function POST(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json(
      { status: false, errors: ['La sesión venció. Vuelve a entrar al panel.'] },
      { status: 401 }
    );
  }

  /* Se rearma el multipart en vez de reenviar el stream: así el `boundary` lo
     pone `fetch` y no hay que lidiar con `duplex: 'half'`. */
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { status: false, errors: ['No se pudo leer el archivo que se envió.'] },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(backendMediaUrl(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const texto = await response.text();
    return new NextResponse(texto, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[medios] subida fallida', error);
    return NextResponse.json(
      { status: false, errors: ['No hay conexión con el servidor de medios.'] },
      { status: 502 }
    );
  }
}
