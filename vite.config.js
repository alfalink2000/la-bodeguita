// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    base: "/la-bodeguita/",
    build: {
      outDir: "dist",
      sourcemap: false,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: false, // Mantener console.log para debug
          drop_debugger: true,
        },
      },
    },
    define: {
      // Asegurar que las variables estén disponibles globalmente
      "import.meta.env.VITE_API_URL": JSON.stringify(
        process.env.VITE_API_URL ||
          "https://minimarket-backend-6z9m.onrender.com",
      ),
    },
  };
});
