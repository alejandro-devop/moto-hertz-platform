#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const bannerDir = path.join(__dirname, "../public/assets/banner-gallery");
const outputDir = bannerDir;

async function convertToWebP() {
  console.log("🖼️  Convirtiendo imágenes a WebP...");

  try {
    const files = fs.readdirSync(bannerDir);
    const jpgFiles = files.filter(
      (file) => file.endsWith(".jpg") || file.endsWith(".jpeg")
    );

    for (const file of jpgFiles) {
      const inputPath = path.join(bannerDir, file);
      const outputPath = path.join(
        outputDir,
        file.replace(/\.jpe?g$/, ".webp")
      );

      console.log(`Converting ${file} to WebP...`);

      await sharp(inputPath)
        .webp({
          quality: 85,
          effort: 6, // Máxima compresión
        })
        .toFile(outputPath);

      // También crear versión AVIF para navegadores más modernos
      const avifPath = path.join(outputDir, file.replace(/\.jpe?g$/, ".avif"));

      await sharp(inputPath)
        .avif({
          quality: 80,
          effort: 9, // Máxima compresión
        })
        .toFile(avifPath);

      console.log(`✅ ${file} → WebP & AVIF`);
    }

    console.log("🎉 Conversión completada!");

    // Mostrar estadísticas de tamaño
    console.log("\n📊 Estadísticas de compresión:");
    for (const file of jpgFiles) {
      const originalPath = path.join(bannerDir, file);
      const webpPath = path.join(outputDir, file.replace(/\.jpe?g$/, ".webp"));
      const avifPath = path.join(outputDir, file.replace(/\.jpe?g$/, ".avif"));

      if (fs.existsSync(originalPath) && fs.existsSync(webpPath)) {
        const originalSize = fs.statSync(originalPath).size;
        const webpSize = fs.statSync(webpPath).size;
        const avifSize = fs.statSync(avifPath).size;

        const webpSavings = (
          ((originalSize - webpSize) / originalSize) *
          100
        ).toFixed(1);
        const avifSavings = (
          ((originalSize - avifSize) / originalSize) *
          100
        ).toFixed(1);

        console.log(`${file}:`);
        console.log(`  Original: ${(originalSize / 1024).toFixed(1)}KB`);
        console.log(
          `  WebP: ${(webpSize / 1024).toFixed(1)}KB (-${webpSavings}%)`
        );
        console.log(
          `  AVIF: ${(avifSize / 1024).toFixed(1)}KB (-${avifSavings}%)`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

convertToWebP();
