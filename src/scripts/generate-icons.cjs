// src/scripts/generate-icons.cjs
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Configuración
const SOURCE_IMAGE = path.join(__dirname, "../../public/icons/icon.png");
const OUTPUT_DIR = path.join(__dirname, "../../public/icons/");

// Tamaños necesarios para PWA
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Asegurar que el directorio existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Creado directorio: ${OUTPUT_DIR}`);
}

// Verificar que la imagen original existe
if (!fs.existsSync(SOURCE_IMAGE)) {
  console.error(`❌ Error: No se encuentra la imagen en ${SOURCE_IMAGE}`);
  console.log("💡 Asegúrate de tener tu icon.png en la carpeta public/icon/");
  process.exit(1);
}

// Generar iconos
async function generateIcons() {
  try {
    console.log("🎨 Generando iconos desde:", SOURCE_IMAGE);
    console.log("📏 Tamaños a generar:", SIZES.join(", "));
    console.log("📁 Destino:", OUTPUT_DIR);
    console.log("...");

    for (const size of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

      await sharp(SOURCE_IMAGE)
        .resize(size, size, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generado: icon-${size}x${size}.png`);
    }

    // También generar apple-touch-icon
    await sharp(SOURCE_IMAGE)
      .resize(180, 180, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(path.join(OUTPUT_DIR, "apple-touch-icon.png"));

    console.log("✅ Generado: apple-touch-icon.png");
    console.log("🎉 ¡Todos los iconos generados exitosamente!");
  } catch (error) {
    console.error("❌ Error generando iconos:", error.message);
  }
}

// Ejecutar
generateIcons();
