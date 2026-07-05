/**
 * Utilidad para resolver referencias de Contentful recursivamente
 */

interface ContentfulLink {
  sys: {
    type: "Link";
    linkType: "Entry" | "Asset";
    id: string;
  };
}

interface ContentfulEntry {
  sys: {
    id: string;
    type: string;
    [key: string]: any;
  };
  fields?: Record<string, any>;
  [key: string]: any;
}

interface ContentfulResponse {
  items: ContentfulEntry[];
  includes?: {
    Entry?: ContentfulEntry[];
    Asset?: ContentfulEntry[];
  };
}

/**
 * Verifica si un objeto es un Link de Contentful que debe ser resuelto
 * Excluye links de metadata (space, environment, contentType)
 */
function isContentfulLink(obj: any): obj is ContentfulLink {
  if (
    !obj ||
    typeof obj !== "object" ||
    !obj.sys ||
    obj.sys.type !== "Link" ||
    !obj.sys.id ||
    !obj.sys.linkType
  ) {
    return false;
  }

  // Solo resolver Links de tipo Entry o Asset
  // Ignorar Space, Environment y ContentType (son metadata)
  return obj.sys.linkType === "Entry" || obj.sys.linkType === "Asset";
}

/**
 * Crea un mapa de todas las entradas incluidas para búsqueda rápida
 */
function createIncludesMap(
  includes?: ContentfulResponse["includes"]
): Map<string, ContentfulEntry> {
  const map = new Map<string, ContentfulEntry>();

  if (!includes) return map;

  // Agregar entradas
  if (includes.Entry) {
    for (const entry of includes.Entry) {
      map.set(entry.sys.id, entry);
    }
  }

  // Agregar assets
  if (includes.Asset) {
    for (const asset of includes.Asset) {
      map.set(asset.sys.id, asset);
    }
  }

  return map;
}

/**
 * Resuelve una referencia Link buscándola en el mapa de includes
 */
function resolveLink(
  link: ContentfulLink,
  includesMap: Map<string, ContentfulEntry>,
  visited: Set<string> = new Set()
): ContentfulEntry | ContentfulLink {
  const id = link.sys.id;

  // Evitar referencias circulares
  if (visited.has(id)) {
    console.warn(`⚠️ Circular reference detected for entry: ${id}`);
    return link;
  }

  const entry = includesMap.get(id);

  if (!entry) {
    console.warn(`⚠️ Referenced entry not found in includes: ${id}`);
    return link;
  }

  // Marcar como visitado antes de resolver recursivamente
  visited.add(id);

  // Resolver recursivamente las referencias dentro de esta entrada
  const resolved = resolveReferencesInObject(entry, includesMap, visited);

  // Remover de visitados después de resolver (para permitir reutilización en otras ramas)
  visited.delete(id);

  return resolved;
}

/**
 * Resuelve todas las referencias en un objeto recursivamente
 */
function resolveReferencesInObject(
  obj: any,
  includesMap: Map<string, ContentfulEntry>,
  visited: Set<string> = new Set()
): any {
  // Casos base
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Si es un Link, resolverlo
  if (isContentfulLink(obj)) {
    return resolveLink(obj, includesMap, visited);
  }

  // Si es un array, resolver cada elemento
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      resolveReferencesInObject(item, includesMap, visited)
    );
  }

  // Si es un objeto, resolver cada propiedad
  if (typeof obj === "object") {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = resolveReferencesInObject(value, includesMap, visited);
    }

    return resolved;
  }

  // Primitivos (string, number, boolean)
  return obj;
}

/**
 * Resuelve todas las referencias en una respuesta de Contentful
 * @param response - La respuesta de Contentful con items e includes
 * @returns La respuesta con todas las referencias resueltas
 */
export function resolveContentfulResponse<T = any>(
  response: ContentfulResponse
): T {
  console.log("🔍 Resolving Contentful references...");
  console.log(`📦 Items: ${response.items?.length || 0}`);
  console.log(`📚 Includes (Entry): ${response.includes?.Entry?.length || 0}`);
  console.log(`🖼️ Includes (Asset): ${response.includes?.Asset?.length || 0}`);

  // Crear mapa de includes para búsqueda rápida
  const includesMap = createIncludesMap(response.includes);
  console.log(`🗺️ Total entries in map: ${includesMap.size}`);

  // Resolver referencias en todos los items
  const resolvedItems = response.items.map((item) =>
    resolveReferencesInObject(item, includesMap)
  );

  console.log("✅ References resolved successfully");

  // Retornar la respuesta con referencias resueltas
  return {
    ...response,
    items: resolvedItems,
  } as T;
}

/**
 * Extrae un item específico de una respuesta resuelta
 */
export function extractFirstItem<T = any>(
  response: ContentfulResponse
): T | null {
  const resolved = resolveContentfulResponse<ContentfulResponse>(response);
  return (resolved.items?.[0] as T) || null;
}
