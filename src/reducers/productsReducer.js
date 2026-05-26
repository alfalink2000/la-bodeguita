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
      console.log("📦 [Reducer] Cargando productos:", action.payload.length);
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
      console.log("➕ [Reducer] Agregando nuevo producto:", action.payload);
      console.log("📊 [Reducer] Productos antes:", state.products.length);

      const newState = {
        ...state,
        products: [...state.products, action.payload],
      };

      console.log("📊 [Reducer] Productos después:", newState.products.length);
      return newState;

    case types.productUpdated:
      console.log("✏️ [Reducer] Actualizando producto:", action.payload.id);
      return {
        ...state,
        products: state.products.map((product) =>
          parseInt(product.id) === parseInt(action.payload.id)
            ? { ...product, ...action.payload }
            : product,
        ),
      };

    case types.productDeleted:
      const deletedId = parseInt(action.payload);
      console.log("🗑️ [Reducer] Eliminando producto ID:", deletedId);
      return {
        ...state,
        products: state.products.filter(
          (product) => parseInt(product.id) !== deletedId,
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
