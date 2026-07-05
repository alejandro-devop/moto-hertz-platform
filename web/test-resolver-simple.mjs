/**
 * Script de prueba simple para verificar el resolver de Contentful
 * Ejecutar con: node test-resolver-simple.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Función para verificar si es un Link de Contentful que debe resolverse
function isContentfulLink(obj) {
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

// Crear mapa de includes
function createIncludesMap(includes) {
  const map = new Map();

  if (!includes) return map;

  if (includes.Entry) {
    for (const entry of includes.Entry) {
      map.set(entry.sys.id, entry);
    }
  }

  if (includes.Asset) {
    for (const asset of includes.Asset) {
      map.set(asset.sys.id, asset);
    }
  }

  return map;
}

// Resolver link
function resolveLink(link, includesMap, visited = new Set()) {
  const id = link.sys.id;

  if (visited.has(id)) {
    console.warn(`⚠️ Circular reference detected for entry: ${id}`);
    return link;
  }

  const entry = includesMap.get(id);

  if (!entry) {
    console.warn(`⚠️ Referenced entry not found in includes: ${id}`);
    return link;
  }

  visited.add(id);
  const resolved = resolveReferencesInObject(entry, includesMap, visited);
  visited.delete(id);

  return resolved;
}

// Resolver objeto recursivamente
function resolveReferencesInObject(obj, includesMap, visited = new Set()) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (isContentfulLink(obj)) {
    return resolveLink(obj, includesMap, visited);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      resolveReferencesInObject(item, includesMap, visited)
    );
  }

  if (typeof obj === "object") {
    const resolved = {};
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = resolveReferencesInObject(value, includesMap, visited);
    }
    return resolved;
  }

  return obj;
}

// Resolver respuesta completa
function resolveContentfulResponse(response) {
  console.log("🔍 Resolving Contentful references...");
  console.log(`📦 Items: ${response.items?.length || 0}`);
  console.log(`📚 Includes (Entry): ${response.includes?.Entry?.length || 0}`);
  console.log(`🖼️ Includes (Asset): ${response.includes?.Asset?.length || 0}`);

  const includesMap = createIncludesMap(response.includes);
  console.log(`🗺️ Total entries in map: ${includesMap.size}`);

  const resolvedItems = response.items.map((item) =>
    resolveReferencesInObject(item, includesMap)
  );

  console.log("✅ References resolved successfully");

  return {
    ...response,
    items: resolvedItems,
  };
}

// Ejecutar test
console.log("🧪 Testing Contentful Resolver");
console.log("================================\n");

// Cargar datos de ejemplo
const dataPath = join(process.cwd(), "src/hooks/data-example.json");
const rawData = readFileSync(dataPath, "utf-8");
const exampleData = JSON.parse(rawData);

console.log("📥 Original data:");
console.log(`  - Items: ${exampleData.items?.length || 0}`);
console.log(
  `  - Includes (Entry): ${exampleData.includes?.Entry?.length || 0}`
);
console.log("\n");

// Resolver
const resolved = resolveContentfulResponse(exampleData);

console.log("\n📤 Resolved data:");
console.log(`  - Items: ${resolved.items?.length || 0}`);

// Inspeccionar primer item
const firstItem = resolved.items[0];
console.log("\n🔍 First item inspection:");
console.log(`  - Title: ${firstItem.fields?.title}`);
console.log(`  - Entry ID: ${firstItem.fields?.entryId}`);
console.log(`  - Layout items: ${firstItem.fields?.layout?.length || 0}`);

// Verificar primer layout item
if (firstItem.fields?.layout?.[0]) {
  const firstLayout = firstItem.fields.layout[0];
  console.log("\n🔗 First layout item:");
  console.log(`  - Is Link object: ${isContentfulLink(firstLayout)}`);
  console.log(`  - Type: ${typeof firstLayout}`);
  console.log(`  - Has fields: ${!!firstLayout.fields}`);
  console.log(`  - Entry ID: ${firstLayout.fields?.entryId || "N/A"}`);

  // Verificar components si existen
  if (firstLayout.fields?.components?.[0]) {
    const firstComponent = firstLayout.fields.components[0];
    console.log("\n📦 First component:");
    console.log(`  - Is Link object: ${isContentfulLink(firstComponent)}`);
    console.log(`  - Has fields: ${!!firstComponent.fields}`);
    console.log(`  - Entry ID: ${firstComponent.fields?.entryId || "N/A"}`);

    // Verificar slides si existen
    if (firstComponent.fields?.slides?.[0]) {
      const firstSlide = firstComponent.fields.slides[0];
      console.log("\n🎬 First slide:");
      console.log(`  - Is Link object: ${isContentfulLink(firstSlide)}`);
      console.log(`  - Has fields: ${!!firstSlide.fields}`);
      console.log(`  - Entry ID: ${firstSlide.fields?.entryId || "N/A"}`);
      console.log(`  - Title: ${firstSlide.fields?.title || "N/A"}`);

      // Verificar imagen
      if (firstSlide.fields?.image) {
        const image = firstSlide.fields.image;
        console.log("\n🖼️ Slide image:");
        console.log(`  - Is Link object: ${isContentfulLink(image)}`);
        console.log(`  - Has fields: ${!!image.fields}`);
        console.log(`  - URL: ${image.fields?.url || "N/A"}`);
      }

      // Verificar botón CTA
      if (firstSlide.fields?.ctaButton) {
        const button = firstSlide.fields.ctaButton;
        console.log("\n🔘 CTA Button:");
        console.log(`  - Is Link object: ${isContentfulLink(button)}`);
        console.log(`  - Has fields: ${!!button.fields}`);
        console.log(`  - Text: ${button.fields?.text || "N/A"}`);
        console.log(`  - URL: ${button.fields?.url || "N/A"}`);
      }
    }
  }
}

// Guardar resultado
const outputPath = join(process.cwd(), "src/hooks/data-resolved.json");
writeFileSync(outputPath, JSON.stringify(resolved, null, 2));

console.log("\n✅ Test completed!");
console.log(`📁 Resolved data saved to: ${outputPath}`);
console.log("\n💡 Tip: Open data-resolved.json to see all references resolved");
