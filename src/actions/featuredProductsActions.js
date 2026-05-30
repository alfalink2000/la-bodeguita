// actions/featuredProductsActions.js - VERSIÓN OPTIMIZADA
import { fetchAPIConfig } from "../helpers/fetchAPIConfig";
import { fetchPublic } from "../helpers/fetchPublic";
import { types } from "../types/types";
import Swal from "sweetalert2";

// Obtener productos destacados (ADMIN)
export const getFeaturedProducts = () => {
  return async (dispatch) => {
    try {
      const body = await fetchAPIConfig("featured-products");

      if (body.ok) {
        dispatch(setPopularProducts(body.popular || []));
        dispatch(setOnSaleProducts(body.onSale || []));
      } else {
        dispatch(setPopularProducts([]));
        dispatch(setOnSaleProducts([]));
      }
    } catch (error) {
      console.error("❌ Error cargando destacados:", error);
      dispatch(setPopularProducts([]));
      dispatch(setOnSaleProducts([]));
    }
  };
};

// Guardar productos destacados
export const saveFeaturedProducts = (featuredData) => {
  return async (dispatch) => {
    try {
      Swal.fire({
        title: "Guardando...",
        text: "Actualizando productos destacados",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const body = await fetchAPIConfig(
        "featured-products",
        featuredData,
        "POST",
      );

      Swal.close();

      if (body.ok) {
        Swal.fire({
          icon: "success",
          title: "¡Guardado!",
          text: "Productos destacados actualizados",
          timer: 2000,
          showConfirmButton: false,
        });

        dispatch(setPopularProducts(body.popular || []));
        dispatch(setOnSaleProducts(body.onSale || []));
      } else {
        Swal.fire("Error", body.msg || "Error al guardar", "error");
      }
    } catch (error) {
      console.error("❌ Error guardando destacados:", error);
      Swal.close();
      Swal.fire("Error", "Error de conexión al guardar", "error");
    }
  };
};

// Toggle individual (frontend)
export const toggleProductPopular = (productId) => ({
  type: types.productTogglePopular,
  payload: productId,
});

export const toggleProductOnSale = (productId) => ({
  type: types.productToggleOnSale,
  payload: productId,
});

// Guardar automáticamente después de cambios
export const toggleProductPopularAndSave = (productId) => {
  return async (dispatch, getState) => {
    dispatch(toggleProductPopular(productId));
    setTimeout(() => {
      const state = getState();
      dispatch(
        saveFeaturedProducts({
          popular: state.products.featuredProducts.popular,
          onSale: state.products.featuredProducts.onSale,
        }),
      );
    }, 300);
  };
};

export const toggleProductOnSaleAndSave = (productId) => {
  return async (dispatch, getState) => {
    dispatch(toggleProductOnSale(productId));
    setTimeout(() => {
      const state = getState();
      dispatch(
        saveFeaturedProducts({
          popular: state.products.featuredProducts.popular,
          onSale: state.products.featuredProducts.onSale,
        }),
      );
    }, 300);
  };
};

// Setters
export const setPopularProducts = (productIds) => ({
  type: types.productSetPopular,
  payload: productIds,
});

export const setOnSaleProducts = (productIds) => ({
  type: types.productSetOnSale,
  payload: productIds,
});

// Cargar productos destacados (PÚBLICO)
export const loadFeaturedProducts = () => {
  return async (dispatch) => {
    try {
      const body = await fetchPublic("featured-products/public");

      if (body.ok) {
        dispatch(setPopularProducts(body.popular));
        dispatch(setOnSaleProducts(body.onSale));
      }
    } catch (error) {
      console.error("❌ Error cargando destacados públicos:", error);
    }
  };
};
