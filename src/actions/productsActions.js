// actions/productsActions.js
import { fetchAPIConfig } from "../helpers/fetchAPIConfig";
import { fetchPublic } from "../helpers/fetchPublic";
import { types } from "../types/types";
import Swal from "sweetalert2";

export const getProducts = (forceRefresh = false) => {
  return async (dispatch, getState) => {
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
  return async (dispatch, getState) => {
    try {
      Swal.fire({
        title: "Creando producto...",
        text: "Por favor espera mientras se procesa",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const body = await fetchAPIConfig("products/new", formData, "POST", true);

      Swal.close();

      if (body.ok) {
        console.log(
          "✅ [insertProduct] Producto recibido del backend:",
          body.product,
        );

        // ✅ Agregar al estado
        dispatch(addNewProduct(body.product));

        // ✅ VERIFICAR que se agregó
        const currentState = getState();
        console.log(
          "📊 [insertProduct] Productos en estado después de agregar:",
          currentState.products.products.length,
        );
        console.log(
          "📋 [insertProduct] Último producto:",
          currentState.products.products[
            currentState.products.products.length - 1
          ],
        );

        Swal.fire({
          icon: "success",
          title: "¡Producto agregado!",
          text: body.msg || "Producto registrado correctamente",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", body.msg, "error");
      }
    } catch (error) {
      console.error("Error insertando producto:", error);
      Swal.close();

      if (
        error.message.includes("Timeout") ||
        error.message.includes("tardó demasiado")
      ) {
        Swal.fire({
          icon: "warning",
          title: "Producto posiblemente creado",
          text: "Verificando...",
          timer: 2000,
          showConfirmButton: false,
        });

        setTimeout(() => {
          dispatch(getProducts(true));
        }, 1500);
      } else {
        Swal.fire(
          "Error",
          error.message || "Error de conexión al crear el producto",
          "error",
        );
      }
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
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const productId = formData.get("id");

      const body = await fetchAPIConfig(
        `products/update/${productId}`,
        formData,
        "PUT",
        true,
      );

      Swal.close();

      if (body.ok) {
        dispatch(updateProductAction(body.product));

        Swal.fire({
          icon: "success",
          title: "¡Actualización exitosa!",
          text: "Producto actualizado correctamente",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", body.msg, "error");
      }
    } catch (error) {
      console.error("Error actualizando producto:", error);
      Swal.close();

      if (
        error.message.includes("Timeout") ||
        error.message.includes("tardó demasiado")
      ) {
        Swal.fire({
          icon: "warning",
          title: "Producto posiblemente actualizado",
          text: "Recargando productos...",
          timer: 3000,
          showConfirmButton: false,
        });

        setTimeout(() => {
          dispatch(getProducts(true));
        }, 2000);
      } else {
        Swal.fire(
          "Error",
          error.message || "Error de conexión al actualizar el producto",
          "error",
        );
      }
    }
  };
};

export const deleteProduct = (id) => {
  return async (dispatch, getState) => {
    console.log("🚀 [deleteProduct] INICIANDO con ID:", id);

    try {
      if (!id) {
        Swal.fire("Error", "ID de producto inválido", "error");
        return;
      }

      const productId = parseInt(id);

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

      if (!result.isConfirmed) return;

      Swal.fire({
        title: "Eliminando producto...",
        text: "Por favor espera",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const body = await fetchAPIConfig(
        `products/delete/${productId}`,
        {},
        "DELETE",
      );

      Swal.close();

      if (body.ok) {
        dispatch(deleteProductAction(productId));

        Swal.fire({
          icon: "success",
          title: "¡Eliminado!",
          text: "Producto eliminado correctamente",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire(
          "Error",
          body.msg || "Error al eliminar el producto",
          "error",
        );
      }
    } catch (error) {
      console.error("❌ [deleteProduct] Error:", error);
      Swal.close();
      Swal.fire("Error", "Error de conexión al eliminar el producto", "error");
    }
  };
};

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
  payload: parseInt(id),
});
