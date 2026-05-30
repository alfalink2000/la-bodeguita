// actions/cartActions.js - VERSIÓN OPTIMIZADA
import { types } from "../types/types";

export const addToCart = (product) => ({
  type: types.cartAddItem,
  payload: product,
});

export const removeFromCart = (productId) => ({
  type: types.cartRemoveItem,
  payload: productId,
});

export const updateCartQuantity = (productId, quantity) => ({
  type: types.cartUpdateQuantity,
  payload: { id: productId, quantity },
});

export const clearCart = () => ({
  type: types.cartClear,
});

export const toggleCartModal = () => ({
  type: types.cartToggleModal,
});

// 🔥 OPTIMIZACIÓN: Unificar limpieza de carrito
export const resetCart = () => (dispatch) => {
  try {
    // Limpiar localStorage específico del carrito
    const storageKeys = ["persist:root", "cart", "reduxPersist:cart"];
    storageKeys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    dispatch({ type: types.cartReset });
    dispatch(clearCart());
  } catch (error) {
    console.error("❌ Error limpiando carrito:", error);
  }
};
