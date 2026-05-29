// utils/deliveryCalculator.js
// Utilidad para calcular distancias y precios de delivery

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud punto 1
 * @param {number} lon1 - Longitud punto 1
 * @param {number} lat2 - Latitud punto 2
 * @param {number} lon2 - Longitud punto 2
 * @returns {number} Distancia en kilómetros
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg) => deg * (Math.PI / 180);

/**
 * Obtiene la configuración de delivery desde el servidor
 */
export const getDeliveryConfig = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/delivery/config`, {
      headers: token ? { "x-token": token } : {},
    });
    const data = await res.json();

    if (data.ok && data.config) {
      return {
        originLat: parseFloat(data.config.origin_lat) || null,
        originLng: parseFloat(data.config.origin_lng) || null,
        originAddress: data.config.origin_address || "",
        originName: data.config.origin_name || "",
        pricePerKm: parseFloat(data.config.price_per_km) || 0,
        minimumPrice: parseFloat(data.config.minimum_price) || 0,
        freeFrom: parseFloat(data.config.free_delivery_from) || 0,
        maxDistance: parseFloat(data.config.max_distance_km) || 0,
        isConfigured: !!(
          data.config.origin_lat &&
          data.config.origin_lng &&
          data.config.price_per_km
        ),
      };
    }
    return null;
  } catch (err) {
    console.error("Error obteniendo configuración de delivery:", err);
    return null;
  }
};

/**
 * Calcula el precio de envío basado en distancia y configuración
 * @param {number} distance - Distancia en km
 * @param {object} config - Configuración de delivery
 * @param {number} subtotal - Subtotal del pedido (para free delivery)
 * @returns {object} { price, distance, isFree, isAvailable }
 */
export const calculateDeliveryPrice = (distance, config, subtotal = 0) => {
  if (!config || !config.isConfigured) {
    return {
      price: 0,
      distance: 0,
      isFree: false,
      isAvailable: false,
      error: "Delivery no configurado",
    };
  }

  if (!distance || distance <= 0) {
    return {
      price: config.minimumPrice || 0,
      distance: 0,
      isFree: false,
      isAvailable: true,
    };
  }

  // Verificar si supera la distancia máxima
  if (config.maxDistance > 0 && distance > config.maxDistance) {
    return {
      price: 0,
      distance,
      isFree: false,
      isAvailable: false,
      error: `Distancia excede el máximo de ${config.maxDistance} km`,
    };
  }

  // Delivery gratis si supera el monto
  if (config.freeFrom > 0 && subtotal >= config.freeFrom) {
    return { price: 0, distance, isFree: true, isAvailable: true };
  }

  // Calcular precio normal
  let price = distance * config.pricePerKm;

  // Aplicar precio mínimo si corresponde
  if (config.minimumPrice > 0 && price < config.minimumPrice) {
    price = config.minimumPrice;
  }

  return { price, distance, isFree: false, isAvailable: true };
};

/**
 * Obtiene la ubicación del usuario desde el backend
 */
export const getUserLocation = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const res = await fetch(`${API_URL}/api/auth/profile`, {
      headers: { "x-token": token },
    });
    const data = await res.json();

    if (data.ok && data.user) {
      const { lat, lng, address } = data.user;
      if (lat && lng) {
        return {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          address,
          hasGps: true,
        };
      }
      return { address, hasGps: false };
    }
    return null;
  } catch (err) {
    console.error("Error obteniendo ubicación del usuario:", err);
    return null;
  }
};

/**
 * Calcula todo el delivery (distancia + precio)
 */

export const calculateDelivery = async (subtotal = 0) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return {
        success: false,
        error: "Debes iniciar sesión para calcular el delivery",
        needsLogin: true,
      };
    }

    // Usar el nuevo endpoint del backend
    const res = await fetch(`${API_URL}/api/orders/calculate-delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
      body: JSON.stringify({ subtotal }),
    });

    const data = await res.json();

    if (data.ok) {
      return {
        success: true,
        distance: data.distance,
        price: data.price,
        isFree: data.isFree,
        isAvailable: data.isAvailable,
        config: data.config,
      };
    } else if (data.needsManualContact) {
      return {
        success: false,
        needsManualContact: true,
        error: data.msg,
        userAddress: data.userAddress,
      };
    } else {
      return {
        success: false,
        error: data.msg || "Error al calcular el delivery",
      };
    }
  } catch (err) {
    console.error("Error calculando delivery:", err);
    return {
      success: false,
      error: "Error de conexión al calcular el delivery",
    };
  }
};
