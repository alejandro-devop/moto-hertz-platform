# Cliente HTTP Singleton + React Query

Esta implementación proporciona un cliente HTTP robusto con patrón singleton y hooks personalizados para React Query, facilitando el manejo de peticiones HTTP en la aplicación.

## 🚀 Características

- **Patrón Singleton**: Una sola instancia del cliente HTTP en toda la aplicación
- **Configuración Dinámica**: URL base configurable en tiempo de ejecución
- **Integración con React Query**: Hooks personalizados para queries y mutations
- **TypeScript**: Completamente tipado para mejor experiencia de desarrollo
- **Manejo de Errores**: Sistema robusto de manejo de errores y reintentos
- **Timeouts Configurables**: Control sobre tiempos de espera de peticiones
- **Headers Personalizables**: Configuración flexible de headers HTTP

## 📁 Estructura

```
src/
├── utils/
│   ├── httpClient.ts      # Cliente HTTP singleton
│   └── index.ts           # Exportaciones
├── hooks/
│   ├── api/
│   │   ├── useApi.ts      # Hooks personalizados
│   │   └── index.ts       # Exportaciones
│   └── index.ts           # Exportaciones principales
├── providers/
│   ├── QueryProvider.tsx  # Provider de React Query
│   └── index.ts           # Exportaciones
└── examples/
    └── api-usage-example.tsx # Ejemplos de uso
```

## 🔧 Configuración Inicial

### 1. El QueryProvider ya está configurado en `layout.tsx`

```tsx
import { QueryProvider } from "@/providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

### 2. Configurar el cliente HTTP

```tsx
import { httpClient } from "@/utils";

// Configurar URL base
httpClient.setBaseURL("https://api.tudominio.com");

// Configurar token de autenticación
httpClient.setAuthToken("tu-token-jwt");

// Headers personalizados
httpClient.setDefaultHeaders({
  "X-API-Version": "v1",
  "Accept-Language": "es",
});
```

## 📖 Uso del Cliente HTTP

### Métodos Disponibles

```tsx
import { httpClient } from "@/utils";

// GET
const usuarios = await httpClient.get<Usuario[]>("/usuarios");

// POST
const nuevoUsuario = await httpClient.post<Usuario>("/usuarios", {
  nombre: "Juan",
  email: "juan@ejemplo.com",
});

// PUT
const usuarioActualizado = await httpClient.put<Usuario>("/usuarios/1", {
  nombre: "Juan Actualizado",
});

// DELETE
await httpClient.delete("/usuarios/1");

// PATCH
const usuarioParcial = await httpClient.patch<Usuario>("/usuarios/1", {
  activo: false,
});
```

### Configuración Dinámica

```tsx
// Cambiar URL base en cualquier momento
httpClient.setBaseURL("https://api-staging.tudominio.com");

// Agregar/quitar autenticación
httpClient.setAuthToken("nuevo-token");
httpClient.removeAuthToken();

// Configurar timeout
httpClient.setDefaultTimeout(30000); // 30 segundos
```

## 🪝 Hooks de React Query

### useApiQuery (GET)

```tsx
import { useApiQuery } from "@/hooks";

function ListaUsuarios() {
  const {
    data: usuarios,
    isLoading,
    error,
    refetch,
  } = useApiQuery<Usuario[]>(
    ["usuarios"], // Query key
    "/usuarios", // Endpoint
    {
      params: { activo: true },
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {usuarios?.map((usuario) => (
        <div key={usuario.id}>{usuario.nombre}</div>
      ))}
    </div>
  );
}
```

### useApiPost (CREATE)

```tsx
import { useApiPost, useInvalidateQueries } from "@/hooks";

function CrearUsuario() {
  const { invalidate } = useInvalidateQueries();

  const crearUsuario = useApiPost<Usuario, CrearUsuarioDto>({
    onSuccess: () => {
      // Invalidar la cache de usuarios para refrescar la lista
      invalidate(["usuarios"]);
    },
    onError: (error) => {
      console.error("Error:", error);
    },
  });

  const handleSubmit = (datos: CrearUsuarioDto) => {
    crearUsuario.mutate({
      endpoint: "/usuarios",
      data: datos,
    });
  };

  return (
    <button
      onClick={() => handleSubmit({ nombre: "Juan", email: "juan@test.com" })}
      disabled={crearUsuario.isPending}
    >
      {crearUsuario.isPending ? "Creando..." : "Crear Usuario"}
    </button>
  );
}
```

### useApiPut (UPDATE)

```tsx
const actualizarUsuario = useApiPut<Usuario, ActualizarUsuarioDto>({
  onSuccess: () => {
    invalidate(["usuarios"]);
    invalidate(["usuario", id]);
  },
});

const handleUpdate = (id: number, datos: ActualizarUsuarioDto) => {
  actualizarUsuario.mutate({
    endpoint: `/usuarios/${id}`,
    data: datos,
  });
};
```

### useApiDelete (DELETE)

```tsx
const eliminarUsuario = useApiDelete({
  onSuccess: () => {
    invalidate(["usuarios"]);
  },
});

const handleDelete = (id: number) => {
  eliminarUsuario.mutate({
    endpoint: `/usuarios/${id}`,
  });
};
```

## 🔄 Manejo de Cache

### Invalidar Queries

```tsx
import { useInvalidateQueries } from "@/hooks";

function MiComponente() {
  const { invalidate, invalidateAll, remove, clear } = useInvalidateQueries();

  const handleActualizacion = () => {
    // Invalidar una query específica
    invalidate(["usuarios"]);

    // Invalidar todas las queries
    invalidateAll();

    // Remover una query específica
    remove(["usuario", "1"]);

    // Limpiar toda la cache
    clear();
  };
}
```

## ⚙️ Configuración Avanzada

### Query Client Personalizado

El QueryProvider ya está configurado con opciones optimizadas:

```tsx
// En QueryProvider.tsx
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      retry: 3, // 3 reintentos
      refetchOnWindowFocus: false, // No refetch al enfocar
    },
    mutations: {
      retry: false, // No reintentar mutations
    },
  },
});
```

### Manejo de Errores Global

```tsx
// El cliente HTTP maneja automáticamente:
// - Timeouts
// - Errores HTTP (4xx, 5xx)
// - Parsing de respuestas JSON
// - Errores de red

// Ejemplo de manejo personalizado
const { data, error } = useApiQuery(["usuarios"], "/usuarios", {
  onError: (error) => {
    if (error.message.includes("401")) {
      // Redirigir a login
      router.push("/login");
    }
  },
});
```

## 🔍 DevTools

En desarrollo, React Query DevTools está disponible automáticamente en la esquina inferior izquierda para inspeccionar:

- Estado de queries
- Cache de datos
- Mutaciones en curso
- Tiempos de fetch
- Errores

## 📝 Tipos TypeScript

```tsx
// Tipos de ejemplo
interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
}

interface CrearUsuarioDto {
  nombre: string;
  email: string;
}

interface ActualizarUsuarioDto {
  nombre?: string;
  email?: string;
  activo?: boolean;
}

// Usar con hooks tipados
const usuarios = useApiQuery<Usuario[]>(["usuarios"], "/usuarios");
const crear = useApiPost<Usuario, CrearUsuarioDto>();
```

## 🚨 Mejores Prácticas

1. **Query Keys**: Usar arrays descriptivos `['usuarios', 'lista', { filtro: 'activo' }]`
2. **Invalidación**: Invalidar queries relacionadas después de mutations
3. **Error Handling**: Siempre manejar estados de error en la UI
4. **Loading States**: Mostrar indicadores de carga apropiados
5. **Optimistic Updates**: Considerar actualizaciones optimistas para mejor UX
6. **Timeouts**: Configurar timeouts apropiados según el contexto
7. **Retry Logic**: Usar retry selectivo (no para errores 4xx)

## 🔄 Próximos Pasos

Ya tienes todo configurado y listo para usar. Puedes:

1. Configurar la URL base de tu API
2. Crear tus tipos TypeScript específicos
3. Implementar tus primeras queries y mutations
4. Agregar manejo de autenticación si es necesario

¡El sistema está completamente funcional y optimizado para producción!
