// reducers/appConfigReducer.js - VERSIÓN OPTIMIZADA
import { types } from "../types/types";

// 🔥 OPTIMIZACIÓN: Centralizar valores por defecto
const DEFAULT_CONFIG = {
  app_name: "Cruz Market",
  app_description: "🛒 Tu tienda de confianza",
  theme: "blue",
  whatsapp_number: "+5491112345678",
  business_hours: "Lun-Vie: 8:00 - 20:00",
  business_address: "Av. Principal 123",
  initialinfo:
    "🌟 **Bienvenido a nuestro Minimarket Digital** 🌟\n\n¡Estamos encantados de tenerte aquí! En nuestro minimarket encontrarás productos de calidad, horario extendido y servicio personalizado.",
  show_initialinfo: true,
  logo_url: null,
  currency: "CUP",
  language: "es",
  marquee_text:
    "🚚 Envíos a domicilio — Calculamos el costo según tu ubicación — ¡Recibe tus productos sin salir de casa! 🚚",
};

const initialState = {
  config: { ...DEFAULT_CONFIG },
  loading: false,
};

export const appConfigReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.appConfigLoad:
      return {
        ...state,
        config: { ...DEFAULT_CONFIG, ...action.payload }, // ✅ Fusionar con defaults
      };

    case types.appConfigUpdate:
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };

    default:
      return state;
  }
};
