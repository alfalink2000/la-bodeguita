// components/common/CartModal/CartModal.jsx
import React, { useState, useEffect } from "react";
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingCart } from "react-icons/fi";
import {
  HiOutlineClipboardCheck,
  HiOutlineTruck,
  HiOutlineLocationMarker,
  HiOutlineRefresh,
} from "react-icons/hi";
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

const CartModal = ({ isLoggedIn, onShowLogin, onOpenChat }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsCartOpen);
  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const appConfig = useSelector((state) => state.appConfig.config);
  const currency = appConfig?.currency || "CUP";
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Estados para delivery
  const [wantsDelivery, setWantsDelivery] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);
  const [deliveryConfig, setDeliveryConfig] = useState(null);
  const [needsManualContact, setNeedsManualContact] = useState(false);

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

  // Cargar configuración de delivery al abrir el carrito
  useEffect(() => {
    const loadDeliveryConfig = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/delivery/config`, {
          headers: token ? { "x-token": token } : {},
        });
        const data = await res.json();

        if (data.ok && data.config) {
          setDeliveryConfig({
            isConfigured: !!(
              data.config.origin_lat &&
              data.config.origin_lng &&
              data.config.price_per_km
            ),
            pricePerKm: parseFloat(data.config.price_per_km),
            minimumPrice: parseFloat(data.config.minimum_price),
            freeFrom: parseFloat(data.config.free_delivery_from),
            maxDistance: parseFloat(data.config.max_distance_km),
            originAddress: data.config.origin_address,
          });
        } else {
          setDeliveryConfig({ isConfigured: false });
        }
      } catch (err) {
        console.error("Error cargando configuración de delivery:", err);
        setDeliveryConfig({ isConfigured: false });
      }
    };

    if (isOpen) {
      loadDeliveryConfig();
      // Resetear estados de delivery al abrir el carrito
      setWantsDelivery(false);
      setDeliveryInfo(null);
      setNeedsManualContact(false);
    }
  }, [isOpen]);

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

  // Manejar toggle de delivery
  const handleDeliveryToggle = async (checked) => {
    setWantsDelivery(checked);

    if (!checked) {
      setDeliveryInfo(null);
      setNeedsManualContact(false);
      return;
    }

    setCalculatingDelivery(true);
    setDeliveryInfo(null);
    setNeedsManualContact(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire({
          icon: "warning",
          title: "Inicia sesión",
          text: "Debes iniciar sesión para calcular el delivery",
          confirmButtonColor: "#059669",
        }).then(() => {
          onShowLogin?.();
        });
        setWantsDelivery(false);
        setCalculatingDelivery(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/orders/calculate-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify({ subtotal: total }),
      });

      const data = await res.json();

      if (data.ok) {
        // ✅ TIENE GPS - Mostrar precio normal
        setDeliveryInfo({
          price: data.price,
          distance: data.distance,
          isFree: data.isFree,
          isAvailable: data.isAvailable,
          config: data.config,
        });
      } else if (data.needsManualContact) {
        // ❌ NO TIENE GPS - Marcar para contacto manual
        setNeedsManualContact(true);
        setDeliveryInfo(null);

        // Mostrar alerta
        Swal.fire({
          icon: "info",
          title: "📍 Necesitamos tu ubicación exacta",
          html: `
            <p>No tenemos tu ubicación exacta registrada.</p>
            <p style="margin-top: 0.5rem;">Por favor, abre el <strong>chat de soporte</strong> para coordinar tu entrega.</p>
            <p style="margin-top: 0.5rem; font-size: 0.85rem; color: #6b7280;">Un asesor te contactará para confirmar tu dirección.</p>
          `,
          confirmButtonText: "Abrir chat",
          confirmButtonColor: "#059669",
        }).then((result) => {
          if (result.isConfirmed && onOpenChat) {
            onOpenChat();
          }
        });
      } else {
        setDeliveryInfo({
          error: data.msg || "No es posible realizar el envío",
          isAvailable: false,
        });
      }
    } catch (err) {
      console.error("Error calculando delivery:", err);
      setDeliveryInfo({
        error: "Error al calcular el envío",
        isAvailable: false,
      });
    } finally {
      setCalculatingDelivery(false);
    }
  };

  // Crear pedido
  const handleCreateOrder = async () => {
    if (!isLoggedIn) {
      dispatch(toggleCartModal());
      onShowLogin?.();
      return;
    }

    if (cartItems.length === 0) return;

    // Validar delivery
    if (
      wantsDelivery &&
      (!deliveryInfo || !deliveryInfo.isAvailable) &&
      !needsManualContact
    ) {
      Swal.fire({
        icon: "warning",
        title: "Delivery no disponible",
        text:
          deliveryInfo?.error || "No se puede realizar el envío a tu ubicación",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

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
        wants_delivery: wantsDelivery,
        delivery_price: wantsDelivery && deliveryInfo ? deliveryInfo.price : 0,
        delivery_distance:
          wantsDelivery && deliveryInfo ? deliveryInfo.distance : null,
        delivery_needs_manual_contact: wantsDelivery && needsManualContact,
        notes:
          wantsDelivery && needsManualContact
            ? "Requiere contacto manual para dirección"
            : "",
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

        const totalWithDelivery =
          wantsDelivery && deliveryInfo ? total + deliveryInfo.price : total;

        Swal.fire({
          icon: "success",
          title: "¡Pedido creado exitosamente!",
          html: `
            <p>Tu pedido <strong>#${data.pedido.id}</strong> ha sido registrado.</p>
            ${wantsDelivery ? `<p style="margin-top: 0.5rem;">🚚 <strong>Delivery: ${deliveryInfo?.isFree ? "GRATIS" : `$${deliveryInfo?.price?.toFixed(2)}`}</strong></p>` : "<p>📦 Retiro en tienda</p>"}
            ${needsManualContact ? '<p style="margin-top: 0.5rem; color: #f59e0b;">📞 Un asesor se pondrá en contacto contigo para coordinar el envío.</p>' : ""}
            <p style="margin-top: 0.5rem; color: #6b7280; font-size: 0.9rem;">
              Total: ${getCurrencySymbol()}${totalWithDelivery.toFixed(2)}
            </p>
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
                {/* Totales */}
                <div className="cart-total">
                  <span>Subtotal:</span>
                  <span className="total-amount">
                    {getCurrencySymbol()}
                    {total.toFixed(2)}
                  </span>
                </div>

                {wantsDelivery &&
                  deliveryInfo &&
                  deliveryInfo.isAvailable &&
                  !needsManualContact && (
                    <div className="cart-total-delivery">
                      <span>Delivery:</span>
                      <span className="delivery-amount">
                        {deliveryInfo.isFree
                          ? "GRATIS"
                          : `${getCurrencySymbol()}${deliveryInfo.price.toFixed(2)}`}
                      </span>
                    </div>
                  )}

                {wantsDelivery &&
                  deliveryInfo &&
                  deliveryInfo.isAvailable &&
                  !needsManualContact && (
                    <div className="cart-total cart-total-final">
                      <span>Total a pagar:</span>
                      <span className="total-amount">
                        {getCurrencySymbol()}
                        {(total + deliveryInfo.price).toFixed(2)}
                      </span>
                    </div>
                  )}

                {/* Delivery Section */}
                {deliveryConfig && deliveryConfig.isConfigured && (
                  <div className="cart-delivery-section">
                    <label className="cart-delivery-checkbox">
                      <input
                        type="checkbox"
                        checked={wantsDelivery}
                        onChange={(e) => handleDeliveryToggle(e.target.checked)}
                        disabled={calculatingDelivery}
                      />
                      <span className="checkbox-icon">
                        <HiOutlineTruck />
                      </span>
                      <span className="checkbox-text">
                        Quiero delivery a domicilio
                      </span>
                    </label>

                    {calculatingDelivery && (
                      <div className="cart-delivery-loading">
                        <HiOutlineRefresh className="spinning" />
                        <span>Calculando distancia y costo de envío...</span>
                      </div>
                    )}

                    {wantsDelivery && !calculatingDelivery && deliveryInfo && (
                      <div
                        className={`cart-delivery-info ${deliveryInfo.isFree ? "cart-delivery-info--free" : ""} ${!deliveryInfo.isAvailable ? "cart-delivery-info--error" : ""}`}
                      >
                        {deliveryInfo.isAvailable ? (
                          <>
                            <div className="delivery-distance">
                              <HiOutlineLocationMarker />
                              <span>
                                Distancia: {deliveryInfo.distance.toFixed(1)} km
                              </span>
                            </div>
                            <div className="delivery-price">
                              {deliveryInfo.isFree ? (
                                <span className="free-delivery-badge">
                                  🚚 ¡ENVÍO GRATIS!
                                </span>
                              ) : (
                                <span>
                                  Costo de envío:{" "}
                                  <strong>
                                    ${deliveryInfo.price.toFixed(2)}
                                  </strong>
                                </span>
                              )}
                            </div>
                            {deliveryInfo.distance > 0 &&
                              deliveryConfig.pricePerKm > 0 &&
                              !deliveryInfo.isFree && (
                                <div className="delivery-calculation">
                                  <small>
                                    {deliveryInfo.distance.toFixed(1)} km × $
                                    {deliveryConfig.pricePerKm}/km = $
                                    {(
                                      deliveryInfo.distance *
                                      deliveryConfig.pricePerKm
                                    ).toFixed(2)}
                                  </small>
                                  {deliveryConfig.minimumPrice > 0 &&
                                    deliveryInfo.price ===
                                      deliveryConfig.minimumPrice &&
                                    deliveryInfo.distance *
                                      deliveryConfig.pricePerKm <
                                      deliveryConfig.minimumPrice && (
                                      <small className="minimum-note">
                                        {" "}
                                        (Aplicado precio mínimo de $
                                        {deliveryConfig.minimumPrice})
                                      </small>
                                    )}
                                </div>
                              )}
                          </>
                        ) : (
                          <div className="delivery-error">
                            <span>
                              ⚠️{" "}
                              {deliveryInfo.error ||
                                "No es posible realizar el envío a esta ubicación"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {wantsDelivery &&
                      !calculatingDelivery &&
                      needsManualContact && (
                        <div className="cart-delivery-info cart-delivery-info--manual">
                          <div className="delivery-manual-message">
                            <span>
                              📞 <strong>Necesitamos contactarte</strong>
                            </span>
                            <p>
                              No tenemos tu ubicación exacta registrada. Un
                              asesor se pondrá en contacto contigo para
                              coordinar el envío.
                            </p>
                            <small>
                              Tu pedido será registrado y te contactaremos al
                              número registrado.
                            </small>
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Botones de acción */}
                <div className="cart-actions">
                  <button className="clear-cart-btn" onClick={handleClearCart}>
                    <FiTrash2 size={14} />
                    Vaciar Carrito
                  </button>

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
