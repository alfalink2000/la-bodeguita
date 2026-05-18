// reducers/ordersReducer.js
import { types } from "../types/types";

const initialState = {
  orders: [],
  activeOrder: null,
  loading: false,
};

export const ordersReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.ordersStartLoading:
      return { ...state, loading: true };

    case types.ordersFinishLoading:
      return { ...state, loading: false };

    case types.ordersLoad:
      return { ...state, orders: action.payload, loading: false };

    case types.orderAddNew:
      return {
        ...state,
        orders: [action.payload, ...state.orders],
      };

    case types.orderStatusChanged:
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.id ? action.payload : order,
        ),
        activeOrder:
          state.activeOrder?.id === action.payload.id
            ? action.payload
            : state.activeOrder,
      };

    case types.orderSetActive:
      return { ...state, activeOrder: action.payload };

    case types.orderClearActive:
      return { ...state, activeOrder: null };

    default:
      return state;
  }
};
