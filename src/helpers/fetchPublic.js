// src/helpers/fetchPublic.js
import { API_BASE_URL, IS_DEVELOPMENT } from "../config/env";

const baseUrl = `${API_BASE_URL}/api`;
const TIMEOUT = 10000;

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

  if (IS_DEVELOPMENT) {
    console.log("🌐 [fetchPublic]", method, url);
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
    if (IS_DEVELOPMENT) {
      console.error("❌ [fetchPublic] Error:", error);
    }
    throw error;
  }
};
