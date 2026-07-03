// src/config/env.js
export const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname.includes("github.io")) {
      return "https://minimarket-backend-6z9m.onrender.com";
    }
  }

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
