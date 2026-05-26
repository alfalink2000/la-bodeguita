// actions/productsActions.js - MEJORADO
import { fetchAPIConfig } from "../helpers/fetchAPIConfig";
import { fetchPublic } from "../helpers/fetchPublic";
import { types } from "../types/types";
import Swal from "sweetalert2";

export const getProducts = (forceRefresh = false) => {
  return async (dispatch, getState) => {
    // ✅ SI YA TENEMOS PRODUCTOS Y NO ES FORZADO, NO RECARGAR
    if (!forceRefresh && getState().products.products.length > 0) {
      const lastUpdate = getState().products.lastUpdate;
      const now = Date.now();
      if (lastUpdate && now - lastUpdate < 10000) {
        console.log("🔄 Productos ya cargados recientemente, omitiendo...");
        return Promise.resolve();
      }
    }

    console.log("📦 Cargando productos...");
    dispatch(startLoading());

    try {
      const body = await fetchPublic("products/getProducts");

      if (body.ok) {
        console.log(
          `✅ ${body.products.length} productos cargados exitosamente`,
        );
        dispatch(loadProducts(body.products));
        return Promise.resolve();
      } else {
        console.error("❌ Error en respuesta de productos:", body.msg);
        return Promise.reject(
          new Error(body.msg || "Error cargando productos"),
        );
      }
    } catch (error) {
      console.error("❌ Error de conexión en getProducts:", error);
      return Promise.reject(error);
    } finally {
      dispatch(finishLoading());
    }
  };
};

export const insertProduct = (formData) => {
  return async (dispatch) => {
    try {
      Swal.fire({
        title: "Subiendo imagen...",
        text: "Por favor espera",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const body = await fetchAPIConfig("products/new", formData, "POST", true);

      Swal.close();

      if (body.ok) {
        dispatch(addNewProduct(body.product));
        Swal.fire({
          icon: "success",
          title: "¡Producto agregado!",
          text: "Producto registrado correctamente",
        });
      } else {
        Swal.fire("Error", body.msg, "error");
      }
    } catch (error) {
      console.error("Error insertando producto:", error);
      Swal.fire("Error", "Error de conexión al crear el producto", "error");
    }
  };
};

export const updateProduct = (formData) => {
  return async (dispatch) => {
    try {
      Swal.fire({
        title: "Actualizando producto...",
        text: "Por favor espera",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const productId = formData.get("id");

      console.log("🚀 Enviando al servidor:", {
        id: productId,
        status: formData.get("status"),
        stock_quantity: formData.get("stock_quantity"),
      });

      const body = await fetchAPIConfig(
        `products/update/${productId}`,
        formData,
        "PUT",
        true,
      );

      console.log("📥 Respuesta del servidor:", body);

      Swal.close();

      if (body.ok) {
        dispatch(updateProductAction(body.product));

        setTimeout(() => {
          console.log("🔄 Forzando refresh de productos...");
          dispatch(getProducts(true));
        }, 1000);

        Swal.fire(
          "¡Actualización exitosa!",
          "Producto actualizado correctamente",
          "success",
        );
      } else {
        Swal.fire("Error", body.msg, "error");
      }
    } catch (error) {
      console.error("Error actualizando producto:", error);
      Swal.fire(
        "Error",
        "Error de conexión al actualizar el producto",
        "error",
      );
    }
  };
};

export const refreshProductsIfNeeded = () => {
  return async (dispatch, getState) => {
    const lastUpdate = getState().products.lastUpdate;
    const now = Date.now();

    if (!lastUpdate || now - lastUpdate > 30000) {
      dispatch(getProducts());
    }
  };
};

export const deleteProduct = (id) => {
  return async (dispatch, getState) => {
    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "¡No podrás revertir esta acción!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (!result.isConfirmed) {
        return;
      }

      Swal.fire({
        title: "Eliminando producto...",
        text: "Por favor espera",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // ✅ PRIMERO: Eliminar del backend
      const body = await fetchAPIConfig(`products/delete/${id}`, {}, "DELETE");

      if (body.ok) {
        // ✅ SEGUNDO: Eliminar del estado local INMEDIATAMENTE
        dispatch(deleteProductAction(id));

        // ✅ TERCERO: Forzar recarga para asegurar sincronización
        setTimeout(async () => {
          console.log("🔄 Verificando sincronización con backend...");
          await dispatch(getProducts(true));
        }, 500);

        Swal.fire({
          icon: "success",
          title: "¡Eliminado!",
          text: "Producto eliminado correctamente",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // Si hay error en el backend, mostrar mensaje
        Swal.fire({
          icon: "error",
          title: "Error",
          text: body.msg || "Error al eliminar el producto",
        });
      }
    } catch (error) {
      console.error("❌ Error eliminando producto:", error);
      Swal.close();

      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo eliminar el producto. Intenta nuevamente.",
        confirmButtonText: "Entendido",
      });
    }
  };
};

export const setActiveProduct = (product) => ({
  type: types.productSetActive,
  payload: product,
});

// Action creators sincrónicos
const startLoading = () => ({ type: types.productStartLoading });
const finishLoading = () => ({ type: types.productFinishLoading });
const loadProducts = (products) => ({
  type: types.productsLoad,
  payload: products,
});

const addNewProduct = (product) => ({
  type: types.productAddNew,
  payload: product,
});

const updateProductAction = (product) => ({
  type: types.productUpdated,
  payload: product,
});

const deleteProductAction = (id) => ({
  type: types.productDeleted,
  payload: id,
});
