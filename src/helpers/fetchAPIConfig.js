// src/helpers/fetchAPIConfig.js
import { API_BASE_URL, IS_DEVELOPMENT } from "../config/env";

const baseUrl = `${API_BASE_URL}/api`;
const TIMEOUT = 60000;

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

  if (IS_DEVELOPMENT) {
    console.log("🌐 [fetchAPIConfig]", method, url);
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
    if (IS_DEVELOPMENT) {
      console.error("❌ Error en fetchAPIConfig:", error);
    }
    throw error;
  }
};
