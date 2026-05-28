// src/actions/appConfigActions.js
import { fetchAPIConfig } from "../helpers/fetchAPIConfig";
import { fetchPublic } from "../helpers/fetchPublic";
import { types } from "../types/types";
import { applyTheme } from "../utils/themeManager";
import Swal from "sweetalert2";

// ✅ EXPORTAR CORRECTAMENTE loadAppConfig
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
        console.error("❌ Error en respuesta de configuración:", body.msg);
        throw new Error(body.msg || "Error cargando configuración");
      }
    } catch (error) {
      console.error("❌ Error de conexión cargando configuración:", error);
      return Promise.reject(error);
    }
  };
};

// ✅ EXPORTAR loadDefaultConfig
export const loadDefaultConfig = () => {
  return (dispatch) => {
    const defaultConfig = {
      app_name: "Minimarket Digital",
      app_description: "Tu tienda de confianza",
      theme: "blue",
      whatsapp_number: "+5491112345678",
      business_hours: "Lun-Vie: 8:00 - 20:00",
      business_address: "Av. Principal 123",
      initialinfo:
        "🌟 **Bienvenido a nuestro Minimarket Digital** 🌟\n\n¡Estamos encantados de tenerte aquí!",
      show_initialinfo: true,
      currency: "USD",
      language: "es",
      marquee_text:
        "🚚 Envíos a domicilio — Calculamos el costo según tu ubicación — ¡Recibe tus productos sin salir de casa! 🚚",
    };

    console.log("🔄 Usando configuración local:", defaultConfig.app_name);

    dispatch({
      type: types.appConfigLoad,
      payload: defaultConfig,
    });

    applyTheme(defaultConfig.theme);
    return Promise.resolve(defaultConfig);
  };
};

// ✅ EXPORTAR updateAppConfig
export const updateAppConfig = (configData) => {
  return async (dispatch) => {
    try {
      console.log("💾 Actualizando configuración...", configData);

      Swal.fire({
        title: "Guardando configuración...",
        text: "Por favor espera",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const body = await fetchAPIConfig("app-config", configData, "PUT");

      Swal.close();

      if (body.ok) {
        console.log("✅ Configuración actualizada exitosamente");

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
        console.error("Error en respuesta de actualización:", body.msg);
        Swal.fire(
          "Error",
          body.msg || "Error al guardar la configuración",
          "error",
        );
        return false;
      }
    } catch (error) {
      console.error("Error actualizando configuración:", error);
      Swal.fire(
        "Error",
        "Error de conexión al guardar la configuración",
        "error",
      );
      return false;
    }
  };
};

// ✅ EXPORTAR previewTheme
export const previewTheme = (themeName) => {
  return () => {
    console.log(`🎨 Aplicando vista previa del tema: ${themeName}`);
    applyTheme(themeName);
  };
};

// ✅ EXPORTAR resetTheme
export const resetTheme = () => {
  return (dispatch, getState) => {
    const currentTheme = getState().appConfig.config.theme;
    console.log(`🎨 Restableciendo al tema guardado: ${currentTheme}`);
    applyTheme(currentTheme);
  };
};

// ✅ EXPORTAR setAppConfig
export const setAppConfig = (config) => ({
  type: types.appConfigLoad,
  payload: config,
});
