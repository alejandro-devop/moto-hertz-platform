import { gql } from 'graphql-tag';

export const tourTypeDefs = gql`
  """
  Cómo terminó un recorrido. Los dos cuentan como visto —no se vuelve a
  mostrar—, pero la diferencia es la única señal de si un tour ayuda o estorba.
  """
  enum TourStatus {
    "Llegó al último paso."
    completed
    "Lo cerró antes de terminar."
    skipped
  }

  """
  Un recorrido guiado que este usuario ya vio. Sin registro = no lo ha visto.
  Fase 0 del plan de tours (\`docs/tours-plan/PLAN.md\`).
  """
  type TourProgress {
    "La clave del recorrido en el código del panel: \`panel.bienvenida\`, \`motos.lista\`…"
    tourKey: String!
    "Qué versión del recorrido vio. Si el panel sube la versión, vuelve a salir."
    version: Int!
    status: TourStatus!
    seenAt: DateTime!
  }

  extend type Query {
    """
    **No es pública** — es la excepción declarada al patrón, porque el progreso
    es un dato por usuario y el sitio no lo consume. Devuelve solo lo del
    usuario de la sesión: no hay forma de leer el de otro.
    """
    tourProgress: [TourProgress!]!
  }

  extend type Mutation {
    "Marca un recorrido como visto. Idempotente: repetirlo actualiza la misma fila."
    tourSeen(key: String!, version: Int!, status: TourStatus!): TourProgress!

    """
    Borra el progreso para que los recorridos vuelvan a salir. Sin \`key\`,
    reinicia todos los del usuario. Devuelve cuántos se reiniciaron, para poder
    distinguir «listo» de «no había nada que reiniciar».
    """
    tourReset(key: String): Int!
  }
`;
