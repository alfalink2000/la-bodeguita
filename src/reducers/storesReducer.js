// reducers/storesReducer.js - VERSIÓN OPTIMIZADA (sin cambios)
import { types } from "../types/types";

const initialState = {
  stores: [],
  activeStore: null,
  loading: false,
};

export const storesReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.storesStartLoading:
      return { ...state, loading: true };
    case types.storesFinishLoading:
      return { ...state, loading: false };
    case types.storesLoad:
      return { ...state, stores: action.payload, loading: false };
    case types.storeAddNew:
      return { ...state, stores: [...state.stores, action.payload] };
    case types.storeUpdated:
      return {
        ...state,
        stores: state.stores.map((s) =>
          s.id === action.payload.id ? action.payload : s,
        ),
      };
    case types.storeDeleted:
      return {
        ...state,
        stores: state.stores.filter((s) => s.id !== action.payload),
      };
    case types.storeSetActive:
      return { ...state, activeStore: action.payload };
    default:
      return state;
  }
};
