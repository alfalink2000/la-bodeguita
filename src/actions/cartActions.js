// actions/cartActions.js
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

// ✅ Limpiar completamente el carrito (para logout/reset)
export const resetCart = () => {
  return (dispatch) => {
    // Limpiar localStorage específico del carrito
    try {
      // Si usas redux-persist, limpiar el estado persistido
      localStorage.removeItem("persist:root");
      localStorage.removeItem("cart");
      localStorage.removeItem("reduxPersist:cart");

      // También limpiar sessionStorage por si acaso
      sessionStorage.removeItem("cart");
      sessionStorage.removeItem("reduxPersist:cart");
    } catch (error) {
      console.error("Error limpiando localStorage:", error);
    }

    // Disparar acción de limpieza
    dispatch({ type: types.cartReset });
    dispatch(clearCart());
  };
};
