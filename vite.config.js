// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno según el modo
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    base: "/la-bodeguita/",
    build: {
      outDir: "dist",
      sourcemap: false,
    },
    define: {
      // FORZAR la URL de producción en el build
      "import.meta.env.VITE_API_URL": JSON.stringify(
        mode === "production"
          ? "https://minimarket-backend-6z9m.onrender.com"
          : env.VITE_API_URL || "http://localhost:4000",
      ),
    },
    server: {
      port: 5173,
    },
  };
});
