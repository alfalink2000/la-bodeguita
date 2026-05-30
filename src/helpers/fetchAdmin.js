// helpers/fetchAdmin.js - VERSIÓN LIMPIA Y OPTIMIZADA
const baseUrl =
  (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api";
const isDevelopment = import.meta.env.VITE_NODE_ENV === "development";

// 🔥 TIMEOUT GLOBAL
const DEFAULT_TIMEOUT = 30000; // 30 segundos

const fetchWithTimeout = async (url, options, timeout = DEFAULT_TIMEOUT) => {
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

export const fetchSinToken = async (endpoint, data, method = "GET") => {
  const url = `${baseUrl}/${endpoint}`;

  try {
    const response = await fetchWithTimeout(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseText = await response.text();

    let body;
    try {
      body = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError);
      throw new Error("La respuesta del servidor no es JSON válido");
    }

    return body;
  } catch (error) {
    console.error("❌ Error en fetchSinToken:", error);
    throw error;
  }
};

export const fetchConToken = async (endpoint, data, method = "GET") => {
  const url = `${baseUrl}/${endpoint}`;
  const token = localStorage.getItem("token") || "";

  try {
    const response = await fetchWithTimeout(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseText = await response.text();

    let body;
    try {
      body = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError);
      throw new Error("La respuesta del servidor no es JSON válido");
    }

    return body;
  } catch (error) {
    console.error("❌ Error en fetchConToken:", error);
    throw error;
  }
};
