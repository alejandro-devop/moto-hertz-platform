// Ejemplo de uso del cliente HTTP y React Query

import { httpClient } from "@/utils";
import { useApiQuery, useApiPost, useApiPut, useApiDelete } from "@/hooks";

// =======================
// CONFIGURACIÓN INICIAL
// =======================

// Configurar la URL base del cliente HTTP
// httpClient.setBaseURL('https://api.ejemplo.com');

// Configurar headers por defecto (como token de autenticación)
// httpClient.setAuthToken('tu-token-aqui');

// Configurar headers personalizados
// httpClient.setDefaultHeaders({
//   'X-Custom-Header': 'valor',
//   'Content-Type': 'application/json'
// });

// =======================
// TIPOS DE EJEMPLO
// =======================

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
}

interface CrearUsuario {
  nombre: string;
  email: string;
}

interface ActualizarUsuario {
  nombre?: string;
  email?: string;
  activo?: boolean;
}

// =======================
// COMPONENTE DE EJEMPLO
// =======================

export function EjemploUsoAPI() {
  // ---------------
  // QUERIES (GET)
  // ---------------

  // Obtener lista de usuarios
  const {
    data: usuarios,
    isLoading: cargandoUsuarios,
    error: errorUsuarios,
    refetch: recargarUsuarios,
  } = useApiQuery<Usuario[]>(
    ["usuarios"], // Query key
    "/usuarios", // Endpoint
    {
      // Opciones adicionales
      enabled: true, // Solo ejecutar si está habilitado
      staleTime: 5 * 60 * 1000, // 5 minutos
      params: {
        activo: true,
        limite: 10,
      },
    }
  );

  // Obtener usuario específico
  const usuarioId = 1;
  const { data: usuario, isLoading: cargandoUsuario } = useApiQuery<Usuario>(
    ["usuario", usuarioId.toString()],
    `/usuarios/${usuarioId}`,
    {
      enabled: !!usuarioId, // Solo ejecutar si hay ID
    }
  );

  // ---------------
  // MUTATIONS
  // ---------------

  // Crear usuario
  const crearUsuario = useApiPost<Usuario, CrearUsuario>({
    onSuccess: (nuevoUsuario) => {
      console.log("Usuario creado:", nuevoUsuario);
      // Recargar la lista de usuarios
      recargarUsuarios();
    },
    onError: (error) => {
      console.error("Error al crear usuario:", error);
    },
  });

  // Actualizar usuario
  const actualizarUsuario = useApiPut<Usuario, ActualizarUsuario>({
    onSuccess: (usuarioActualizado) => {
      console.log("Usuario actualizado:", usuarioActualizado);
      recargarUsuarios();
    },
  });

  // Eliminar usuario
  const eliminarUsuario = useApiDelete<{ mensaje: string }>({
    onSuccess: () => {
      console.log("Usuario eliminado");
      recargarUsuarios();
    },
  });

  // ---------------
  // HANDLERS
  // ---------------

  const handleCrearUsuario = () => {
    crearUsuario.mutate({
      endpoint: "/usuarios",
      data: {
        nombre: "Juan Pérez",
        email: "juan@ejemplo.com",
      },
    });
  };

  const handleActualizarUsuario = (id: number) => {
    actualizarUsuario.mutate({
      endpoint: `/usuarios/${id}`,
      data: {
        nombre: "Juan Pérez Actualizado",
        activo: false,
      },
    });
  };

  const handleEliminarUsuario = (id: number) => {
    eliminarUsuario.mutate({
      endpoint: `/usuarios/${id}`,
    });
  };

  // ---------------
  // RENDER
  // ---------------

  if (cargandoUsuarios) {
    return <div>Cargando usuarios...</div>;
  }

  if (errorUsuarios) {
    return <div>Error: {errorUsuarios.message}</div>;
  }

  return (
    <div>
      <h2>Lista de Usuarios</h2>

      <button onClick={handleCrearUsuario} disabled={crearUsuario.isPending}>
        {crearUsuario.isPending ? "Creando..." : "Crear Usuario"}
      </button>

      {usuarios?.map((usuario) => (
        <div
          key={usuario.id}
          style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}
        >
          <h3>{usuario.nombre}</h3>
          <p>Email: {usuario.email}</p>
          <p>Activo: {usuario.activo ? "Sí" : "No"}</p>

          <button
            onClick={() => handleActualizarUsuario(usuario.id)}
            disabled={actualizarUsuario.isPending}
          >
            {actualizarUsuario.isPending ? "Actualizando..." : "Actualizar"}
          </button>

          <button
            onClick={() => handleEliminarUsuario(usuario.id)}
            disabled={eliminarUsuario.isPending}
            style={{ marginLeft: "10px" }}
          >
            {eliminarUsuario.isPending ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      ))}
    </div>
  );
}

// =======================
// USO DIRECTO DEL CLIENTE HTTP
// =======================

export async function ejemploUsoDirecto() {
  try {
    // Configurar la URL base
    httpClient.setBaseURL("https://jsonplaceholder.typicode.com");

    // GET request
    const usuarios = await httpClient.get<Usuario[]>("/users");
    console.log("Usuarios:", usuarios);

    // POST request
    const nuevoUsuario = await httpClient.post<Usuario>("/users", {
      nombre: "Nuevo Usuario",
      email: "nuevo@ejemplo.com",
    });
    console.log("Usuario creado:", nuevoUsuario);

    // PUT request
    const usuarioActualizado = await httpClient.put<Usuario>("/users/1", {
      nombre: "Usuario Actualizado",
    });
    console.log("Usuario actualizado:", usuarioActualizado);

    // DELETE request
    await httpClient.delete("/users/1");
    console.log("Usuario eliminado");
  } catch (error) {
    console.error("Error:", error);
  }
}

// =======================
// CONFIGURACIÓN AVANZADA
// =======================

export function configuracionAvanzada() {
  // Configurar cliente para una API específica
  httpClient
    .setBaseURL("https://api.miapp.com")
    .setAuthToken("mi-token-jwt")
    .setDefaultHeaders({
      "X-API-Version": "v1",
      "X-Client": "web-app",
    })
    .setDefaultTimeout(15000); // 15 segundos

  // El cliente mantendrá esta configuración hasta que se cambie
}
