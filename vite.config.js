import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".", // ← Fuerza que la raíz sea la actual
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: "index.html", // ← Asegura que use este index.html
    },
  },
  server: {
    port: 3000,
  },
});
