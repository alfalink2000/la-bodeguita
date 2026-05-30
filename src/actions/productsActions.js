// actions/productsActions.js - VERSIÓN OPTIMIZADA
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
        console.log("🔄 Productos ya cargados recientemente");
        return Promise.resolve();
      }
    }

    dispatch(startLoading());

    try {
      const body = await fetchPublic("products/getProducts");

      if (body.ok) {
        dispatch(loadProducts(body.products));
        return Promise.resolve();
      } else {
        return Promise.reject(
          new Error(body.msg || "Error cargando productos"),
        );
      }
    } catch (error) {
      console.error("❌ Error en getProducts:", error);
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
        title: "Creando producto...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const body = await fetchAPIConfig("products/new", formData, "POST", true);

      Swal.close();

      if (body.ok) {
        dispatch(addNewProduct(body.product));
        await dispatch(getProducts(true));

        Swal.fire({
          icon: "success",
          title: "¡Producto agregado!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", body.msg, "error");
      }
    } catch (error) {
      console.error("❌ Error insertando producto:", error);
      Swal.close();
      Swal.fire("Error", error.message || "Error de conexión", "error");
    }
  };
};

export const updateProduct = (formData) => {
  return async (dispatch) => {
    try {
      Swal.fire({
        title: "Actualizando producto...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
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
        await dispatch(getProducts(true));

        Swal.fire({
          icon: "success",
          title: "¡Actualización exitosa!",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", body.msg, "error");
      }
    } catch (error) {
      console.error("❌ Error actualizando producto:", error);
      Swal.close();
      Swal.fire("Error", error.message || "Error de conexión", "error");
    }
  };
};

export const deleteProduct = (id) => {
  return async (dispatch) => {
    if (!id) {
      Swal.fire("Error", "ID de producto inválido", "error");
      return;
    }

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Eliminando producto...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const body = await fetchAPIConfig(`products/delete/${id}`, {}, "DELETE");

      Swal.close();

      if (body.ok) {
        dispatch(deleteProductAction(id));
        await dispatch(getProducts(true));

        Swal.fire({
          icon: "success",
          title: "¡Eliminado!",
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
      console.error("❌ Error eliminando producto:", error);
      Swal.close();
      Swal.fire("Error", "Error de conexión", "error");
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
