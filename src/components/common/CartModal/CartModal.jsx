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

const CartModal = ({ isLoggedIn, onShowLogin, onOpenChat, onOrderCreated }) => {
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

  // ✅ CORREGIDO: handleDeliveryToggle SIN Swal de "Abrir chat"
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
        setDeliveryInfo({
          price: data.price,
          distance: data.distance,
          isFree: data.isFree,
          isAvailable: data.isAvailable,
          config: data.config,
        });
      } else if (data.needsManualContact) {
        // ✅ SOLO marcar que necesita contacto, SIN mostrar Swal
        setNeedsManualContact(true);
        setDeliveryInfo(null);
        // ❌ ELIMINADO: Swal.fire de "Abrir chat"
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

  // ✅ CORREGIDO: SweetAlerts compactos - sin datos personales
  const handleCreateOrder = async () => {
    if (!isLoggedIn) {
      dispatch(toggleCartModal());
      onShowLogin?.();
      return;
    }

    if (cartItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Carrito vacío",
        text: "Agrega productos antes de hacer el pedido",
        confirmButtonColor: "#059669",
      });
      return;
    }

    const subtotal = total;
    const currencySymbol = getCurrencySymbol();

    // ============================================
    // CASO 1: NO QUIERE DELIVERY (RETIRO EN TIENDA)
    // ============================================
    if (!wantsDelivery) {
      const result = await Swal.fire({
        title: "📦 Retiro en tienda",
        html: `
        <div style="text-align: center; font-size: 0.95rem;">
          <p style="margin-bottom: 0.5rem;">Retirarás tu pedido en nuestra tienda.</p>
          <p style="color: #f59e0b; font-size: 0.85rem;">📞 Soporte te contactará para coordinar el retiro.</p>
          <p style="font-weight: 700; font-size: 1.1rem; margin-top: 0.75rem; color: #059669;">
            Total: ${currencySymbol} ${subtotal.toFixed(2)}
          </p>
        </div>
      `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#059669",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "✅ Confirmar pedido",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        await submitOrder(false, false, null, null);
      }
      return;
    }

    // ============================================
    // SI QUIERE DELIVERY: CALCULAR AHORA
    // ============================================
    Swal.fire({
      title: "Calculando delivery...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/calculate-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-token": token },
        body: JSON.stringify({ subtotal }),
      });

      const data = await res.json();
      Swal.close();

      // ============================================
      // CASO 2: DELIVERY PERO SIN UBICACIÓN GPS
      // ============================================
      if (data.needsManualContact || !data.ok) {
        const result = await Swal.fire({
          title: "📍 Entrega a domicilio",
          html: `
          <div style="text-align: center; font-size: 0.95rem;">
            <p style="margin-bottom: 0.5rem;">Solicitaste <strong>envío a domicilio</strong>.</p>
            <div style="background: #fef3c7; padding: 0.5rem; border-radius: 8px; margin: 0.5rem 0;">
              <p style="margin: 0; font-size: 0.85rem;">⚠️ No tienes ubicación GPS. Soporte te contactará para calcular el costo.</p>
            </div>
            <p style="font-weight: 700; font-size: 1.1rem; margin-top: 0.5rem; color: #f59e0b;">
              Total (sin envío): ${currencySymbol} ${subtotal.toFixed(2)}
            </p>
            <p style="font-size: 0.75rem; color: #6b7280;">El costo del delivery será informado por soporte.</p>
          </div>
        `,
          icon: "warning",
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonColor: "#f59e0b",
          cancelButtonColor: "#6b7280",
          denyButtonColor: "#059669",
          confirmButtonText: "📞 Continuar (soporte me contacta)",
          denyButtonText: "📍 Configurar GPS",
          cancelButtonText: "Cancelar",
        });

        if (result.isDenied) {
          dispatch(toggleCartModal());
          window.dispatchEvent(new CustomEvent("open-profile"));
          return;
        }

        if (result.isConfirmed) {
          await submitOrder(true, true, null, null);
        }
        return;
      }

      // ============================================
      // CASO 3: DELIVERY CON GPS - TODO CALCULADO
      // ============================================
      const { distance, price, isFree, isAvailable } = data;

      if (!isAvailable) {
        Swal.fire({
          icon: "error",
          title: "Delivery no disponible",
          text: data.msg || "No se puede realizar el envío a tu ubicación",
          confirmButtonColor: "#059669",
        });
        return;
      }

      const finalTotal = isFree ? subtotal : subtotal + price;
      const deliveryText = isFree
        ? "🚚 ¡Delivery GRATIS!"
        : `🚚 Delivery: ${currencySymbol} ${price?.toFixed(2)} (${distance?.toFixed(1)} km)`;

      const result = await Swal.fire({
        title: "🚚 Confirmar pedido",
        html: `
        <div style="text-align: center; font-size: 0.95rem;">
          <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">
            ${
              isFree
                ? '<span style="color: #059669; font-weight: 600;">🎉 ¡Delivery GRATIS!</span>'
                : `<span style="color: #2563eb;">📏 ${distance?.toFixed(1)} km · ${currencySymbol} ${price?.toFixed(2)}</span>`
            }
          </p>
          <div style="background: #f0fdf4; padding: 0.6rem; border-radius: 8px; margin: 0.5rem 0;">
            <p style="margin: 0; font-size: 0.85rem;">Subtotal: ${currencySymbol} ${subtotal.toFixed(2)}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.85rem;">${deliveryText}</p>
            <p style="margin: 0.5rem 0 0; font-weight: 700; font-size: 1.15rem; color: #059669;">
              TOTAL: ${currencySymbol} ${finalTotal.toFixed(2)}
            </p>
          </div>
        </div>
      `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#059669",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "✅ Confirmar pedido",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        await submitOrder(true, false, distance, price);
      }
    } catch (err) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo calcular el envío. Intenta de nuevo.",
        confirmButtonColor: "#059669",
      });
    }
  };

  // ✅ Función submitOrder - SweetAlert de éxito COMPACTO
  // ✅ Función submitOrder - SIN mensaje previo, solo mensaje DESPUÉS del pedido
  const submitOrder = async (
    wantsDeliveryFlag,
    needsManualContact,
    distance,
    deliveryPrice,
  ) => {
    setCreatingOrder(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Debes iniciar sesión",
        });
        setCreatingOrder(false);
        return;
      }

      const orderData = {
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: item.quantity,
          image_url: item.image_url || "",
        })),
        subtotal: total,
        wants_delivery: wantsDeliveryFlag,
        delivery_price: deliveryPrice || 0,
        delivery_distance: distance || null,
        delivery_needs_manual_contact: needsManualContact || false,
        notes: needsManualContact
          ? "Requiere contacto manual para dirección"
          : "",
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-token": token },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (data.ok) {
        // window.dispatchEvent(
        //   new CustomEvent("order-created", {
        //     detail: { orderId: data.pedido.id },
        //   }),
        // );
        if (onOrderCreated) onOrderCreated();

        dispatch(clearCart());
        dispatch(toggleCartModal());
        setCreatingOrder(false);

        const finalTotal =
          wantsDeliveryFlag && deliveryPrice ? total + deliveryPrice : total;
        const currencySymbol = getCurrencySymbol();

        // ✅ ENVIAR MENSAJE AL CHAT SOLO SI NECESITA CONTACTO MANUAL
        if (needsManualContact) {
          try {
            await fetch(`${API_URL}/api/chat/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-token": token,
              },
              body: JSON.stringify({
                message: `🛒 He realizado el pedido #${data.pedido.id} con envío a domicilio.\n\n📋 Necesito que un asesor me contacte para coordinar la dirección de entrega y el costo del envío.\n\n💰 Total del pedido (sin envío): ${currencySymbol} ${total.toFixed(2)}\n\n⏳ Quedo a la espera de su mensaje. Gracias.`,
              }),
            });
            console.log("✅ Mensaje automático enviado al chat");
          } catch (err) {
            console.error("Error enviando mensaje automático:", err);
          }
        }

        // ✅ SweetAlert de éxito COMPACTO
        let message = "";
        if (needsManualContact) {
          message = "📞 Un asesor te contactará para coordinar el envío.";
        } else if (wantsDeliveryFlag) {
          message = "🚚 Recibirás tu pedido en tu domicilio.";
        } else {
          message = "📦 Retira tu pedido en nuestra tienda.";
        }

        await Swal.fire({
          title: "✅ ¡Pedido realizado!",
          html: `
          <div style="text-align: center;">
            <p style="font-size: 1.1rem; margin-bottom: 0.25rem;"><strong>Pedido #${data.pedido.id}</strong></p>
            <p style="margin-bottom: 0.5rem;">${message}</p>
            <p style="font-weight: 700; color: #059669;">Total: ${currencySymbol} ${finalTotal.toFixed(2)}</p>
            <p style="font-size: 0.8rem; color: #6b7280; margin-top: 0.5rem;">📋 Ver estado en <strong>Perfil > Mis Pedidos</strong></p>
            ${needsManualContact ? '<p style="font-size: 0.8rem; color: #f59e0b; margin-top: 0.25rem;">💬 También puedes usar el chat de soporte</p>' : ""}
          </div>
        `,
          icon: "success",
          confirmButtonColor: "#059669",
          confirmButtonText: "Entendido",
        });

        // ✅ NO abrir chat automáticamente, solo si el usuario quiere
        // (eliminado: if (needsManualContact && onOpenChat) onOpenChat();)
      } else {
        setCreatingOrder(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg || "No se pudo crear el pedido",
          confirmButtonColor: "#059669",
        });
      }
    } catch (err) {
      setCreatingOrder(false);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor",
        confirmButtonColor: "#059669",
      });
    }
  };

  return (
    <div className={`cart-modal ${isOpen ? "cart-modal--open" : ""}`}>
      <div className="cart-modal__overlay" onClick={handleClose} />

      <div className="cart-modal__content">
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

              <div className="cart-modal__footer">
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
                                    {getCurrencySymbol()}
                                    {deliveryInfo.price.toFixed(2)}
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
