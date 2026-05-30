// reducers/productsReducer.js - VERSIÓN OPTIMIZADA
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
      // 🔥 OPTIMIZACIÓN: Log solo en desarrollo
      if (process.env.NODE_ENV === "development") {
        console.log("📦 [Reducer] Cargando productos:", action.payload.length);
      }
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
      if (process.env.NODE_ENV === "development") {
        console.log("➕ [Reducer] Agregando nuevo producto");
      }
      return {
        ...state,
        products: [...state.products, action.payload],
      };

    case types.productUpdated:
      if (process.env.NODE_ENV === "development") {
        console.log("✏️ [Reducer] Actualizando producto:", action.payload.id);
      }
      return {
        ...state,
        products: state.products.map((product) =>
          parseInt(product.id) === parseInt(action.payload.id)
            ? { ...product, ...action.payload }
            : product,
        ),
      };

    case types.productDeleted:
      if (process.env.NODE_ENV === "development") {
        console.log("🗑️ [Reducer] Eliminando producto ID:", action.payload);
      }
      return {
        ...state,
        products: state.products.filter(
          (product) => parseInt(product.id) !== parseInt(action.payload),
        ),
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

    case types.productTogglePopular: {
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
    }

    case types.productToggleOnSale: {
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
    }

    default:
      return state;
  }
};
