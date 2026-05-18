// components/common/CartModal/CartModal.jsx
import React, { useState } from "react";
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingCart } from "react-icons/fi";
import { HiOutlineClipboardCheck } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCartItems,
  selectCartTotal,
  selectIsCartOpen,
} from "../../../selectors/cartSelectors";
import {
  updateCartQuantity,
  removeFromCart,
  toggleCartModal,
  clearCart,
} from "../../../actions/cartActions";
import Swal from "sweetalert2";
import "./CartModal.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const CartModal = ({ isLoggedIn, onShowLogin }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsCartOpen);
  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const appConfig = useSelector((state) => state.appConfig.config);
  const currency = appConfig?.currency || "CUP";
  const [creatingOrder, setCreatingOrder] = useState(false);

  const getCurrencySymbol = () => {
    switch (currency) {
      case "USD":
        return "US$";
      case "EUR":
        return "€";
      default:
        return "$";
    }
  };

  const handleClose = () => {
    dispatch(toggleCartModal());
  };

  const handleQuantityChange = (productId, change) => {
    const item = cartItems.find((item) => item.id === productId);
    const newQuantity = Math.max(0, (item?.quantity || 0) + change);
    if (newQuantity === 0) {
      dispatch(removeFromCart(productId));
    } else {
      dispatch(updateCartQuantity(productId, newQuantity));
    }
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleClearCart = () => {
    Swal.fire({
      title: "¿Vaciar carrito?",
      text: "Se eliminarán todos los productos",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, vaciar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(clearCart());
      }
    });
  };

  // ✅ CREAR PEDIDO (NUEVO - Reemplaza WhatsApp)
  const handleCreateOrder = async () => {
    if (!isLoggedIn) {
      // Si no está logueado, cerrar carrito y mostrar login
      dispatch(toggleCartModal());
      onShowLogin?.();
      return;
    }

    if (cartItems.length === 0) return;

    setCreatingOrder(true);

    try {
      const token = localStorage.getItem("token");
      const orderData = {
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: item.quantity,
          image_url: item.image_url || "",
        })),
        subtotal: total,
        notes: "",
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (data.ok) {
        dispatch(clearCart());
        dispatch(toggleCartModal());

        Swal.fire({
          icon: "success",
          title: "¡Pedido creado exitosamente!",
          html: `
            <p>Tu pedido <strong>#${data.pedido.id}</strong> ha sido registrado.</p>
            <p style="margin-top: 0.5rem; color: #6b7280; font-size: 0.9rem;">
              Puedes ver el estado en <strong>Mi Perfil → Mis Pedidos</strong>
            </p>
          `,
          confirmButtonColor: "#10b981",
          confirmButtonText: "Entendido",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error al crear pedido",
          text: data.msg || "Intenta nuevamente",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err) {
      console.error("Error creando pedido:", err);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className={`cart-modal ${isOpen ? "cart-modal--open" : ""}`}>
      <div className="cart-modal__overlay" onClick={handleClose} />

      <div className="cart-modal__content">
        {/* Header */}
        <div className="cart-modal__header">
          <div className="cart-modal__title">
            <FiShoppingCart className="cart-modal__icon" />
            <h2>Mi Carrito</h2>
            {cartItems.length > 0 && (
              <span className="cart-modal__count">({cartItems.length})</span>
            )}
          </div>
          <button className="cart-modal__close" onClick={handleClose}>
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="cart-modal__body">
          {cartItems.length === 0 ? (
            <div className="cart-modal__empty">
              <FiShoppingCart size={48} className="empty-icon" />
              <h3>Tu carrito está vacío</h3>
              <p>Agrega algunos productos para continuar</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="cart-item__image"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/60x60?text=Prod";
                      }}
                    />

                    <div className="cart-item__info">
                      <h4 className="cart-item__name">{item.name}</h4>
                      <p className="cart-item__price">
                        {getCurrencySymbol()}
                        {parseFloat(item.price).toFixed(2)} c/u
                      </p>
                    </div>

                    <div className="cart-item__controls">
                      <div className="quantity-controls">
                        <button
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.id, -1)}
                        >
                          <FiMinus size={12} />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          <FiPlus size={12} />
                        </button>
                      </div>

                      <div className="cart-item__total">
                        {getCurrencySymbol()}
                        {(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Eliminar producto"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="cart-modal__footer">
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="total-amount">
                    {getCurrencySymbol()}
                    {total.toFixed(2)}
                  </span>
                </div>

                <div className="cart-actions">
                  <button className="clear-cart-btn" onClick={handleClearCart}>
                    <FiTrash2 size={14} />
                    Vaciar Carrito
                  </button>

                  {/* ✅ BOTÓN DE REALIZAR PEDIDO (Reemplaza WhatsApp) */}
                  <button
                    className="order-btn"
                    onClick={handleCreateOrder}
                    disabled={creatingOrder}
                  >
                    {creatingOrder ? (
                      <>
                        <span className="spinner"></span>
                        Creando...
                      </>
                    ) : (
                      <>
                        <HiOutlineClipboardCheck size={18} />
                        Realizar Pedido
                      </>
                    )}
                  </button>
                </div>

                {/* Aviso si no está logueado */}
                {!isLoggedIn && (
                  <p className="login-notice">
                    🔒{" "}
                    <button
                      className="login-link"
                      onClick={() => {
                        dispatch(toggleCartModal());
                        onShowLogin?.();
                      }}
                    >
                      Inicia sesión
                    </button>{" "}
                    para realizar pedidos
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartModal;
