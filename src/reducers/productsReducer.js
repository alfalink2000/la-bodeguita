// reducers/productsReducer.js
import { types } from "../types/types";

const initialState = {
  products: [],
  featuredProducts: {
    popular: [],
    onSale: [],
  },
  loading: false,
  lastUpdate: null,
};

export const productsReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.productsLoad:
      return {
        ...state,
        products: [...action.payload],
        lastUpdate: Date.now(),
      };

    case types.productStartLoading:
      return {
        ...state,
        loading: true,
      };

    case types.productFinishLoading:
      return {
        ...state,
        loading: false,
      };

    case types.productAddNew:
      return {
        ...state,
        products: [...state.products, action.payload],
      };

    case types.productUpdated:
      return {
        ...state,
        products: state.products.map((product) =>
          parseInt(product.id) === parseInt(action.payload.id)
            ? { ...product, ...action.payload }
            : product,
        ),
      };

    // ✅ CORREGIDO: ELIMINACIÓN INMEDIATA CON COMPARACIÓN CORRECTA
    case types.productDeleted:
      const deletedId = parseInt(action.payload);
      console.log("🗑️ [Reducer] Eliminando producto ID:", deletedId);
      console.log("📊 [Reducer] Productos antes:", state.products.length);

      const updatedProducts = state.products.filter(
        (product) => parseInt(product.id) !== deletedId,
      );

      console.log("📊 [Reducer] Productos después:", updatedProducts.length);

      if (updatedProducts.length === state.products.length) {
        console.warn(
          "⚠️ [Reducer] No se eliminó ningún producto - ID no encontrado:",
          deletedId,
        );
        console.log(
          "📋 [Reducer] IDs disponibles:",
          state.products.map((p) => p.id),
        );
      }

      return {
        ...state,
        products: updatedProducts,
      };

    case types.productSetActive:
      return {
        ...state,
        activeProduct: action.payload,
      };

    case types.productSetPopular:
      return {
        ...state,
        featuredProducts: {
          ...state.featuredProducts,
          popular: action.payload,
        },
      };

    case types.productSetOnSale:
      return {
        ...state,
        featuredProducts: {
          ...state.featuredProducts,
          onSale: action.payload,
        },
      };

    case types.productTogglePopular:
      const isPopular = state.featuredProducts.popular.includes(action.payload);
      return {
        ...state,
        featuredProducts: {
          ...state.featuredProducts,
          popular: isPopular
            ? state.featuredProducts.popular.filter(
                (id) => id !== action.payload,
              )
            : [...state.featuredProducts.popular, action.payload],
        },
      };

    case types.productToggleOnSale:
      const isOnSale = state.featuredProducts.onSale.includes(action.payload);
      return {
        ...state,
        featuredProducts: {
          ...state.featuredProducts,
          onSale: isOnSale
            ? state.featuredProducts.onSale.filter(
                (id) => id !== action.payload,
              )
            : [...state.featuredProducts.onSale, action.payload],
        },
      };

    default:
      return state;
  }
};
