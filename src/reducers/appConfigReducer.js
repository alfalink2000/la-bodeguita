// reducers/appConfigReducer.js - VERSIÓN OPTIMIZADA
import { types } from "../types/types";

// 🔥 OPTIMIZACIÓN: Centralizar valores por defecto
const DEFAULT_CONFIG = {
  app_name: "La Bodeguita",
  app_description: "🍽️ Tradición culinaria cubana — Pinar del Río",
  theme: "bodeguita",
  whatsapp_number: "+5354123456",
  business_hours: "Lun-Dom: 9:00 - 1:00",
  business_address: "Pinar del Río, Cuba",
  initialinfo:
    "🇨🇺 **Bienvenido a La Bodeguita** 🇨🇺\n\nUn proyecto de realce de la tradición culinaria cubana en Pinar del Río. Aquí encontrarás alimentos, bebidas y productos de calidad con el sabor auténtico de Cuba.\n\n✅ Envíos gratis en la ciudad\n🚚 Te llevamos tu pedido sin costo adicional\n🎶 Vive una experiencia inolvidable",
  show_initialinfo: true,
  logo_url: null,
  currency: "CUP",
  language: "es",
  marquee_text:
    "🇨🇺 La Bodeguita — Tradición culinaria cubana — 🚚 Envíos gratis en Pinar del Río — 🌿 Opciones vegetarianas disponibles — 🐕 Pet friendly — ¡Te esperamos!",
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
        config: { ...DEFAULT_CONFIG, ...action.payload, app_name: "La Bodeguita" }, // ✅ Forzar nombre de la tienda
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
