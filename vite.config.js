// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    base: "/la-bodeguita/",
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
