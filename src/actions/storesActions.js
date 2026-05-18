// actions/storesActions.js - COMPLETO
import { fetchPublic } from "../helpers/fetchPublic";
import { fetchAPIConfig } from "../helpers/fetchAPIConfig";
import { types } from "../types/types";
import Swal from "sweetalert2";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

export const getStores = () => {
  return async (dispatch) => {
    dispatch({ type: types.storesStartLoading });
    try {
      const body = await fetchPublic("stores");
      if (body.ok) {
        dispatch({ type: types.storesLoad, payload: body.stores });
      }
    } catch (error) {
      console.error("Error cargando tiendas:", error);
    } finally {
      dispatch({ type: types.storesFinishLoading });
    }
  };
};

export const insertStore = (storeData) => {
  return async (dispatch) => {
    try {
      const body = await fetchAPIConfig("stores", storeData, "POST");
      if (body.ok) {
        dispatch({ type: types.storeAddNew, payload: body.store });
        Swal.fire({
          icon: "success",
          title: "Tienda creada",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: body.msg });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Error de conexión" });
    }
  };
};

export const updateStore = (id, storeData) => {
  return async (dispatch) => {
    try {
      const body = await fetchAPIConfig(`stores/${id}`, storeData, "PUT");
      if (body.ok) {
        dispatch({ type: types.storeUpdated, payload: body.store });
        Swal.fire({
          icon: "success",
          title: "Tienda actualizada",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Error de conexión" });
    }
  };
};

export const deleteStore = (id) => {
  return async (dispatch) => {
    try {
      const result = await Swal.fire({
        title: "¿Eliminar tienda?",
        text: "Las categorías asociadas también se eliminarán",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Sí, eliminar",
      });
      if (!result.isConfirmed) return;

      const body = await fetchAPIConfig(`stores/${id}`, {}, "DELETE");
      if (body.ok) {
        dispatch({ type: types.storeDeleted, payload: id });
        Swal.fire({
          icon: "success",
          title: "Tienda eliminada",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: body.msg });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "Error de conexión" });
    }
  };
};

export const getCategoriesByStore = async (storeId) => {
  try {
    const res = await fetch(`${API_URL}/api/stores/${storeId}/categories`);
    const data = await res.json();
    return data.ok ? data.categories : [];
  } catch (error) {
    console.error("Error cargando categorías por tienda:", error);
    return [];
  }
};
