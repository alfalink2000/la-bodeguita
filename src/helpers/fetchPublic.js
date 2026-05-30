// helpers/fetchPublic.js - VERSIÓN LIMPIA
const baseUrl =
  (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api";
const isDevelopment = import.meta.env.VITE_NODE_ENV === "development";
const TIMEOUT = 10000; // 10 segundos

const fetchWithTimeout = async (url, options, timeout = TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Timeout: La petición tardó demasiado");
    }
    throw error;
  }
};

export const fetchPublic = async (endpoint, data, method = "GET") => {
  const url = `${baseUrl}/${endpoint}`;

  if (isDevelopment) {
    console.log("🌐 [fetchPublic] Conectando a:", url);
  }

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (method !== "GET") {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetchWithTimeout(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (isDevelopment) {
      console.error("❌ [fetchPublic] Error:", error);
    }
    throw error;
  }
};
