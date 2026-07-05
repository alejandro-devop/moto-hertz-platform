/**
 * Script de prueba para verificar el resolver de Contentful
 * Ejecutar con: node --loader ts-node/esm test-resolver.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { resolveContentfulResponse } from "./src/utils/contentful-resolver";

// Cargar el archivo de ejemplo
const dataPath = join(process.cwd(), "src/hooks/data-example.json");
const rawData = readFileSync(dataPath, "utf-8");
const exampleData = JSON.parse(rawData);

console.log("🧪 Testing Contentful Resolver");
console.log("================================\n");

console.log("📥 Original data:");
console.log(`  - Items: ${exampleData.items?.length || 0}`);
console.log(
  `  - Includes (Entry): ${exampleData.includes?.Entry?.length || 0}`
);
console.log("\n");

// Resolver las referencias
const resolved = resolveContentfulResponse(exampleData);

console.log("\n📤 Resolved data:");
console.log(`  - Items: ${resolved.items?.length || 0}`);

// Verificar el primer item
const firstItem = resolved.items[0];
console.log("\n🔍 First item inspection:");
console.log(`  - Title: ${firstItem.fields?.title}`);
console.log(`  - Entry ID: ${firstItem.fields?.entryId}`);
console.log(`  - Layout items: ${firstItem.fields?.layout?.length || 0}`);

// Verificar que el primer elemento del layout está resuelto
if (firstItem.fields?.layout?.[0]) {
  const firstLayout = firstItem.fields.layout[0];
  console.log("\n🔗 First layout item:");
  console.log(`  - Type: ${typeof firstLayout}`);
  console.log(`  - Has fields: ${!!firstLayout.fields}`);
  console.log(`  - Entry ID: ${firstLayout.fields?.entryId}`);

  // Si tiene components, verificar que también están resueltos
  if (firstLayout.fields?.components?.[0]) {
    const firstComponent = firstLayout.fields.components[0];
    console.log("\n📦 First component:");
    console.log(`  - Type: ${typeof firstComponent}`);
    console.log(`  - Has fields: ${!!firstComponent.fields}`);
    console.log(`  - Entry ID: ${firstComponent.fields?.entryId}`);

    // Si tiene slides, verificar que también están resueltos
    if (firstComponent.fields?.slides?.[0]) {
      const firstSlide = firstComponent.fields.slides[0];
      console.log("\n🎬 First slide:");
      console.log(`  - Type: ${typeof firstSlide}`);
      console.log(`  - Has fields: ${!!firstSlide.fields}`);
      console.log(`  - Entry ID: ${firstSlide.fields?.entryId}`);
      console.log(`  - Title: ${firstSlide.fields?.title}`);
      console.log(`  - Caption: ${firstSlide.fields?.caption}`);

      // Verificar la imagen del slide
      if (firstSlide.fields?.image) {
        const image = firstSlide.fields.image;
        console.log("\n🖼️ Slide image:");
        console.log(`  - Type: ${typeof image}`);
        console.log(`  - Has fields: ${!!image.fields}`);
        console.log(`  - URL: ${image.fields?.url}`);
      }

      // Verificar el botón CTA del slide
      if (firstSlide.fields?.ctaButton) {
        const button = firstSlide.fields.ctaButton;
        console.log("\n🔘 CTA Button:");
        console.log(`  - Type: ${typeof button}`);
        console.log(`  - Has fields: ${!!button.fields}`);
        console.log(`  - Text: ${button.fields?.text}`);
        console.log(`  - URL: ${button.fields?.url}`);
      }
    }
  }
}

// Guardar el resultado resuelto en un archivo para inspección
const outputPath = join(process.cwd(), "src/hooks/data-resolved.json");
import { writeFileSync } from "fs";
writeFileSync(outputPath, JSON.stringify(resolved, null, 2));

console.log("\n✅ Test completed!");
console.log(`📁 Resolved data saved to: ${outputPath}`);
console.log(
  "\n💡 Tip: Compare data-example.json with data-resolved.json to see the difference"
);
