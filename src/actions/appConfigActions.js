// actions/appConfigActions.js - VERSIÓN OPTIMIZADA
import { fetchAPIConfig } from "../helpers/fetchAPIConfig";
import { fetchPublic } from "../helpers/fetchPublic";
import { types } from "../types/types";
import { applyTheme } from "../utils/themeManager";
import Swal from "sweetalert2";

// 🔥 OPTIMIZACIÓN: Constante para configuración por defecto
const DEFAULT_CONFIG = {
  app_name: "La Bodeguita",
  app_description: "🍽️ Tradición culinaria cubana — Pinar del Río",
  theme: "bodeguita",
  whatsapp_number: "+5354123456",
  business_hours: "Lun-Dom: 9:00 - 1:00",
  business_address: "Pinar del Río, Cuba",
  initialinfo:
    "🇨🇺 **Bienvenido a La Bodeguita** 🇨🇺\n\nUn proyecto de realce de la tradición culinaria cubana en Pinar del Río.",
  show_initialinfo: true,
  currency: "CUP",
  language: "es",
  marquee_text:
    "🇨🇺 La Bodeguita — Tradición culinaria cubana — 🚚 Envíos gratis en Pinar del Río — 🌿 Opciones vegetarianas disponibles — 🐕 Pet friendly — ¡Te esperamos!",
};

export const loadAppConfig = () => {
  return async (dispatch) => {
    try {
      console.log("🔄 Cargando configuración de la app...");

      const body = await fetchPublic("app-config/public");

      if (body.ok) {
        console.log("✅ Configuración cargada:", body.config);

        dispatch({
          type: types.appConfigLoad,
          payload: body.config,
        });

        applyTheme(body.config.theme);
        return Promise.resolve(body.config);
      } else {
        console.error("❌ Error en respuesta:", body.msg);
        throw new Error(body.msg || "Error cargando configuración");
      }
    } catch (error) {
      console.error("❌ Error de conexión:", error);
      return Promise.reject(error);
    }
  };
};

export const loadDefaultConfig = () => {
  return (dispatch) => {
    console.log("🔄 Usando configuración local:", DEFAULT_CONFIG.app_name);

    dispatch({
      type: types.appConfigLoad,
      payload: DEFAULT_CONFIG,
    });

    applyTheme(DEFAULT_CONFIG.theme);
    return Promise.resolve(DEFAULT_CONFIG);
  };
};

export const updateAppConfig = (configData) => {
  return async (dispatch) => {
    try {
      console.log("💾 Actualizando configuración...", configData);

      Swal.fire({
        title: "Guardando configuración...",
        text: "Por favor espera",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const body = await fetchAPIConfig("app-config", configData, "PUT");

      Swal.close();

      if (body.ok) {
        await Swal.fire({
          icon: "success",
          title: "¡Configuración guardada!",
          text: "Los cambios se han aplicado correctamente",
          showConfirmButton: false,
          timer: 2000,
        });

        dispatch({
          type: types.appConfigUpdate,
          payload: body.config,
        });

        applyTheme(body.config.theme);
        return true;
      } else {
        console.error("Error en respuesta:", body.msg);
        Swal.fire(
          "Error",
          body.msg || "Error al guardar la configuración",
          "error",
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Error actualizando configuración:", error);
      Swal.fire(
        "Error",
        "Error de conexión al guardar la configuración",
        "error",
      );
      return false;
    }
  };
};

export const previewTheme = (themeName) => () => {
  console.log(`🎨 Aplicando vista previa del tema: ${themeName}`);
  applyTheme(themeName);
};

export const resetTheme = () => (dispatch, getState) => {
  const currentTheme = getState().appConfig.config.theme;
  console.log(`🎨 Restableciendo al tema guardado: ${currentTheme}`);
  applyTheme(currentTheme);
};

export const setAppConfig = (config) => ({
  type: types.appConfigLoad,
  payload: config,
});
