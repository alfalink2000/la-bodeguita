// src/config/env.js
export const getApiBaseUrl = () => {
  // Detectar si estamos en GitHub Pages
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // GitHub Pages
    if (hostname.includes("github.io")) {
      return "https://minimarket-backend-6z9m.onrender.com";
    }

    // Desarrollo local
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000";
    }
  }

  // Fallback: intentar variable de entorno, luego producción
  return (
    import.meta.env.VITE_API_URL ||
    "https://minimarket-backend-6z9m.onrender.com"
  );
};

export const API_BASE_URL = getApiBaseUrl();
export const IS_DEVELOPMENT =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
