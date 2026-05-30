// actions/ordersActions.js - VERSIÓN OPTIMIZADA
import { types } from "../types/types";
import Swal from "sweetalert2";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

// Cargar mis pedidos (cliente)
export const startLoadMyOrders = () => {
  return async (dispatch) => {
    dispatch({ type: types.ordersStartLoading });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/mine`, {
        headers: { "x-token": token },
      });
      const data = await res.json();

      if (data.ok) {
        dispatch({ type: types.ordersLoad, payload: data.pedidos });
      }
    } catch (error) {
      console.error("❌ Error cargando pedidos:", error);
    } finally {
      dispatch({ type: types.ordersFinishLoading });
    }
  };
};

// Crear pedido (cliente)
export const startCreateOrder = (orderData) => {
  return async (dispatch) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();

      if (data.ok) {
        dispatch({ type: types.orderAddNew, payload: data.pedido });
        Swal.fire({
          icon: "success",
          title: "¡Pedido creado!",
          text: "Tu pedido ha sido registrado exitosamente",
          timer: 2000,
        });
        return true;
      } else {
        Swal.fire("Error", data.msg || "No se pudo crear el pedido", "error");
        return false;
      }
    } catch (error) {
      console.error("❌ Error creando pedido:", error);
      Swal.fire("Error", "Error de conexión", "error");
      return false;
    }
  };
};

// Cancelar pedido (cliente)
export const startCancelOrder = (orderId) => {
  return async (dispatch) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/cancel/${orderId}`, {
        method: "PUT",
        headers: { "x-token": token },
      });
      const data = await res.json();

      if (data.ok) {
        dispatch({ type: types.orderStatusChanged, payload: data.pedido });
        Swal.fire("Pedido cancelado", "", "success");
      }
    } catch (error) {
      console.error("❌ Error cancelando pedido:", error);
    }
  };
};

// Admin: Cargar todos los pedidos
export const startLoadAllOrders = (filters = {}) => {
  return async (dispatch) => {
    dispatch({ type: types.ordersStartLoading });

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_URL}/api/orders/admin/all?${params}`, {
        headers: { "x-token": token },
      });
      const data = await res.json();

      if (data.ok) {
        dispatch({ type: types.ordersLoad, payload: data.pedidos });
      }
    } catch (error) {
      console.error("❌ Error cargando pedidos:", error);
    } finally {
      dispatch({ type: types.ordersFinishLoading });
    }
  };
};

// Admin: Cambiar estado de pedido
export const startChangeOrderStatus = (orderId, status) => {
  return async (dispatch) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/admin/status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();

      if (data.ok) {
        dispatch({ type: types.orderStatusChanged, payload: data.pedido });
        Swal.fire(
          `Pedido ${status === "pending" ? "en proceso" : status}`,
          "",
          "success",
        );
      }
    } catch (error) {
      console.error("❌ Error cambiando estado:", error);
    }
  };
};
