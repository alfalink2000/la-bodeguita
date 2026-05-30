// reducers/cartReducer.js - VERSIÓN OPTIMIZADA
import { types } from "../types/types";

const initialState = {
  items: [],
  isCartOpen: false,
  total: 0,
  itemsCount: 0,
  selectedAddressId: null,
};

export const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.cartAddItem: {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id,
      );

      if (existingItem) {
        const updatedItems = state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
        return calculateTotals({ ...state, items: updatedItems });
      }

      const newItem = { ...action.payload, quantity: 1 };
      return calculateTotals({
        ...state,
        items: [...state.items, newItem],
      });
    }

    case types.cartRemoveItem:
      return calculateTotals({
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      });

    case types.cartUpdateQuantity:
      return calculateTotals({
        ...state,
        items: state.items
          .map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: Math.max(0, action.payload.quantity) }
              : item,
          )
          .filter((item) => item.quantity > 0),
      });

    case types.cartClear:
      return { ...initialState, selectedAddressId: state.selectedAddressId }; // ✅ Preservar dirección si existe

    case types.cartReset:
      return initialState;

    case types.cartToggleModal:
      return {
        ...state,
        isCartOpen: !state.isCartOpen,
      };

    case types.cartSetSelectedAddress:
      return {
        ...state,
        selectedAddressId: action.payload,
      };

    default:
      return state;
  }
};

// Helper para calcular totales
const calculateTotals = (state) => {
  const itemsCount = state.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const total = state.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0,
  );

  return {
    ...state,
    itemsCount,
    total: parseFloat(total.toFixed(2)),
  };
};
