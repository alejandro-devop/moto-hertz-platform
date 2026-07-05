#!/usr/bin/env node

/**
 * Script para verificar que las variables de entorno de Contentful están configuradas correctamente
 * Ejecutar: node scripts/verify-env.mjs
 */

console.log(
  "\n🔍 Verificando configuración de variables de entorno de Contentful...\n"
);

const requiredVars = {
  SPACE_ID: process.env.SPACE_ID,
  API_KEY: process.env.API_KEY,
};

const optionalVars = {
  PREVIEW_API_KEY: process.env.PREVIEW_API_KEY,
};

let hasErrors = false;

// Verificar variables requeridas
console.log("📋 Variables Requeridas:");
console.log("========================");
for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    console.log(`✅ ${key}: Configurada (${value.substring(0, 8)}...)`);
  } else {
    console.log(`❌ ${key}: NO configurada`);
    hasErrors = true;
  }
}

console.log("\n📋 Variables Opcionales:");
console.log("========================");
for (const [key, value] of Object.entries(optionalVars)) {
  if (value) {
    console.log(`✅ ${key}: Configurada (${value.substring(0, 8)}...)`);
  } else {
    console.log(`⚠️  ${key}: No configurada (opcional)`);
  }
}

console.log("\n📊 Resumen:");
console.log("===========");

if (hasErrors) {
  console.log("❌ FALTAN VARIABLES REQUERIDAS");
  console.log("\n💡 Solución:");
  console.log(
    "   1. LOCAL: Crea un archivo .env.local en la raíz del proyecto:"
  );
  console.log("      SPACE_ID=tu_space_id");
  console.log("      API_KEY=tu_api_key");
  console.log(
    "\n   2. VERCEL: Ve a Settings > Environment Variables y agrega:"
  );
  console.log("      - SPACE_ID");
  console.log("      - API_KEY");
  console.log("      Luego haz REDEPLOY del proyecto");
  console.log("\n   3. Obtén las credenciales en: https://app.contentful.com");
  console.log("      Settings > API keys\n");
  process.exit(1);
} else {
  console.log("✅ Todas las variables requeridas están configuradas");
  console.log("✅ El servicio de Contentful debería funcionar correctamente");

  // Intentar crear una instancia del servicio
  console.log("\n🧪 Probando instancia del servicio...");
  try {
    // Importación dinámica para Node.js
    const { contentfulService } = await import("../src/services/contentful.ts");
    console.log("✅ Servicio de Contentful inicializado correctamente\n");
    process.exit(0);
  } catch (error) {
    console.log(`❌ Error al inicializar servicio: ${error.message}\n`);
    process.exit(1);
  }
}
