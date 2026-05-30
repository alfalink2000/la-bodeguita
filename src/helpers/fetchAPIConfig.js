// helpers/fetchAPIConfig.js - VERSIÓN LIMPIA
const baseUrl =
  (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api";
const isDevelopment = import.meta.env.VITE_NODE_ENV === "development";
const TIMEOUT = 60000; // 60 segundos para imágenes grandes

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

export const fetchAPIConfig = async (
  endpoint,
  data,
  method = "GET",
  isFormData = false,
) => {
  const url = `${baseUrl}/${endpoint}`;
  const token = localStorage.getItem("token") || "";

  if (isDevelopment) {
    console.log("🌐 Petición a:", url);
  }

  const config = {
    method,
    headers: {
      "x-token": token,
    },
  };

  if (!isFormData && method !== "GET") {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(data);
  } else if (isFormData && method !== "GET") {
    config.body = data;
  }

  try {
    const response = await fetchWithTimeout(url, config);
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.msg || `HTTP error! status: ${response.status}`);
    }

    return body;
  } catch (error) {
    if (isDevelopment) {
      console.error("❌ Error en fetchAPIConfig:", error);
    }
    throw error;
  }
};
