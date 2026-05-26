// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Mover todas las dependencias de node_modules a un chunk "vendor"
          if (id.includes("node_modules")) {
            // Opcional: dividir librerías más pesadas en chunks individuales
            if (id.includes("react-dom") || id.includes("react-router-dom")) {
              return "react-vendor";
            }
            if (
              id.includes("redux") ||
              id.includes("react-redux") ||
              id.includes("redux-persist")
            ) {
              return "redux-vendor";
            }
            if (
              id.includes("sweetalert2") ||
              id.includes("lucide-react") ||
              id.includes("react-icons")
            ) {
              return "ui-vendor";
            }
            // Resto de node_modules (más pequeño)
            return "vendor";
          }
          // Opcional: separar tu propio código por rutas (pero no necesario)
        },
      },
    },
    chunkSizeWarningLimit: 600, // Opcional: aumenta el límite de advertencia (por defecto 500 kB)
  },
  server: {
    port: 3000,
  },
});
