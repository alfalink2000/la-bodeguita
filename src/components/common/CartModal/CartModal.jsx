// components/client/CartModal/CartModal.jsx - VERSIÓN OPTIMIZADA
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingCart } from "react-icons/fi";
import {
  HiOutlineClipboardCheck,
  HiOutlineTruck,
  HiOutlineLocationMarker,
  HiOutlineRefresh,
} from "react-icons/hi";
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
import { startLoadUserAddresses } from "../../../actions/authActions";
import Swal from "sweetalert2";
import AddressSelector from "./AddressSelector";
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

  const userAddresses = useSelector((state) => state.auth.userAddresses || []);
  const authUser = useSelector((state) => state.auth);

  const [creatingOrder, setCreatingOrder] = useState(false);
  const [validatingStock, setValidatingStock] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);
  const [deliveryConfig, setDeliveryConfig] = useState(null);
  const [needsManualContact, setNeedsManualContact] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [addressSelectedByUser, setAddressSelectedByUser] = useState(false);

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

  useEffect(() => {
    if (isOpen && isLoggedIn && userAddresses.length === 0) {
      dispatch(startLoadUserAddresses());
    }
  }, [isOpen, isLoggedIn, userAddresses.length, dispatch]);

  useEffect(() => {
    if (userAddresses.length > 0 && !selectedAddress) {
      const defaultAddress = userAddresses.find((addr) => addr.is_default);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
        setAddressSelectedByUser(true);
        if (defaultAddress.lat && defaultAddress.lng) {
          calculateDeliveryWithAddress(defaultAddress);
        } else {
          setNeedsManualContact(true);
        }
      } else if (userAddresses.length > 0 && !selectedAddress) {
        setSelectedAddress(userAddresses[0]);
        setAddressSelectedByUser(true);
        if (userAddresses[0].lat && userAddresses[0].lng) {
          calculateDeliveryWithAddress(userAddresses[0]);
        } else {
          setNeedsManualContact(true);
        }
      }
    }
  }, [userAddresses, selectedAddress]);

  const validateCartStock = async () => {
    if (cartItems.length === 0) return;
    setValidatingStock(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setValidatingStock(false);
        return;
      }
      const itemsToValidate = cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));
      const res = await fetch(`${API_URL}/api/products/validate-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-token": token },
        body: JSON.stringify({ items: itemsToValidate }),
      });
      const data = await res.json();
      if (data.ok && !data.allAvailable) {
        const outOfStockItems = data.validation.filter((v) => !v.available);
        if (outOfStockItems.length > 0) {
          let hasChanges = false;
          for (const item of outOfStockItems) {
            if (item.currentStock === 0) {
              dispatch(removeFromCart(item.id));
              hasChanges = true;
            } else if (item.currentStock < item.requested) {
              dispatch(updateCartQuantity(item.id, item.currentStock));
              hasChanges = true;
            }
          }
          if (hasChanges) {
            Swal.fire({
              icon: "warning",
              title: "Stock actualizado",
              html: `<p>Algunos productos han cambiado su disponibilidad. Hemos actualizado tu carrito automáticamente.</p>`,
              confirmButtonColor: "#059669",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error validando stock:", error);
    } finally {
      setValidatingStock(false);
    }
  };

  useEffect(() => {
    if (isOpen && cartItems.length > 0) {
      validateCartStock();
    }
  }, [isOpen, cartItems.length]);

  const calculateDeliveryWithAddress = async (address) => {
    if (!address || !address.lat || !address.lng) {
      setNeedsManualContact(true);
      setDeliveryInfo(null);
      return;
    }
    setCalculatingDelivery(true);
    setDeliveryInfo(null);
    setNeedsManualContact(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/calculate-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-token": token },
        body: JSON.stringify({
          subtotal: total,
          lat: address.lat,
          lng: address.lng,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setDeliveryInfo({
          price: data.price,
          distance: data.distance,
          isAvailable: data.isAvailable,
          config: data.config,
        });
      } else if (data.needsManualContact) {
        setNeedsManualContact(true);
        setDeliveryInfo(null);
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

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setAddressSelectedByUser(true);
    setShowAddressSelector(false);
    if (address && address.lat && address.lng) {
      calculateDeliveryWithAddress(address);
    } else {
      setNeedsManualContact(true);
      setDeliveryInfo(null);
    }
  };

  const handleAddressAdded = async () => {
    await dispatch(startLoadUserAddresses());
  };

  const handleAddressDeleted = () => {
    dispatch(startLoadUserAddresses());
  };

  useEffect(() => {
    const loadDeliveryConfig = async () => {
      try {
        const token = localStorage.getItem("token");
        const configRes = await fetch(`${API_URL}/api/delivery/config`, {
          headers: token ? { "x-token": token } : {},
        });
        const configData = await configRes.json();
        if (configData.ok && configData.config) {
          setDeliveryConfig({
            isConfigured: !!(
              configData.config.origin_lat &&
              configData.config.origin_lng &&
              configData.config.price_per_km
            ),
            pricePerKm: parseFloat(configData.config.price_per_km),
            minimumPrice: parseFloat(configData.config.minimum_price),
            maxDistance: parseFloat(configData.config.max_distance_km),
            originAddress: configData.config.origin_address,
          });
        } else {
          setDeliveryConfig({ isConfigured: false });
        }
      } catch (err) {
        console.error("Error cargando delivery config:", err);
        setDeliveryConfig({ isConfigured: false });
      }
    };
    if (isOpen && cartItems.length > 0) {
      loadDeliveryConfig();
    } else if (isOpen && cartItems.length === 0) {
      setDeliveryInfo(null);
      setNeedsManualContact(false);
      setSelectedAddress(null);
      setAddressSelectedByUser(false);
    }
  }, [isOpen, cartItems.length]);

  useEffect(() => {
    if (
      isOpen &&
      cartItems.length > 0 &&
      selectedAddress &&
      deliveryConfig?.isConfigured &&
      !calculatingDelivery &&
      !needsManualContact
    ) {
      calculateDeliveryWithAddress(selectedAddress);
    }
  }, [total]);

  const handleClose = () => dispatch(toggleCartModal());

  const handleQuantityChange = (productId, change) => {
    const item = cartItems.find((item) => item.id === productId);
    const newQuantity = Math.max(0, (item?.quantity || 0) + change);
    if (newQuantity === 0) {
      dispatch(removeFromCart(productId));
    } else {
      dispatch(updateCartQuantity(productId, newQuantity));
    }
  };

  const handleRemoveItem = (productId) => dispatch(removeFromCart(productId));

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
      if (result.isConfirmed) dispatch(clearCart());
    });
  };

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
    if (!selectedAddress) {
      Swal.fire({
        icon: "warning",
        title: "Dirección requerida",
        text: "Por favor selecciona una dirección de entrega antes de continuar",
        confirmButtonColor: "#059669",
      });
      return;
    }
    const subtotal = total;
    const currencySymbol = getCurrencySymbol();

    if (!deliveryConfig?.isConfigured) {
      const result = await Swal.fire({
        title: "📦 Retiro en tienda",
        html: `<div style="text-align: center;"><p>Retirarás tu pedido en nuestra tienda.</p><p style="font-weight: 700; color: #059669;">Total: ${currencySymbol} ${subtotal.toFixed(2)}</p></div>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#059669",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "✅ Confirmar pedido",
      });
      if (result.isConfirmed) await submitOrder(false, false, null, null);
      return;
    }

    if (needsManualContact) {
      const result = await Swal.fire({
        title: "📍 Entrega a domicilio",
        html: `<div><p>Solicitud de <strong>envío a domicilio</strong>.</p><div style="background: #fef3c7; padding: 0.5rem; border-radius: 8px;"><p>⚠️ Dirección: <strong>${selectedAddress.address.substring(0, 50)}</strong></p><p>Soporte te contactará para calcular el costo de envío.</p></div><p style="font-weight: 700; color: #f59e0b;">Total (sin envío): ${currencySymbol} ${subtotal.toFixed(2)}</p></div>`,
        icon: "warning",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: "#f59e0b",
        cancelButtonColor: "#6b7280",
        denyButtonColor: "#059669",
        confirmButtonText: "📞 Continuar",
        denyButtonText: "📍 Cambiar dirección",
      });
      if (result.isDenied) {
        setShowAddressSelector(true);
        return;
      }
      if (result.isConfirmed) await submitOrder(true, true, null, null);
      return;
    }

    if (deliveryInfo && deliveryInfo.isAvailable) {
      const deliveryPrice = deliveryInfo.price || 0;
      const finalTotal = subtotal + deliveryPrice;
      const result = await Swal.fire({
        title: "🚚 Confirmar pedido",
        html: `<div><div style="background: #f0fdf4; padding: 0.6rem; border-radius: 8px;"><p>Subtotal: ${currencySymbol} ${subtotal.toFixed(2)}</p><p>🚚 Delivery: ${currencySymbol} ${deliveryPrice.toFixed(2)}</p><p style="font-weight: 700; color: #059669;">TOTAL: ${currencySymbol} ${finalTotal.toFixed(2)}</p></div><p style="font-size: 0.7rem;">📍 Enviando a: ${selectedAddress.address.substring(0, 60)}</p></div>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#059669",
        confirmButtonText: "✅ Confirmar pedido",
      });
      if (result.isConfirmed)
        await submitOrder(true, false, deliveryInfo.distance, deliveryPrice);
      return;
    }

    if (calculatingDelivery) {
      Swal.fire({
        icon: "info",
        title: "Calculando envío",
        text: "Espera un momento",
        confirmButtonColor: "#059669",
      });
      return;
    }

    if (deliveryInfo && !deliveryInfo.isAvailable) {
      Swal.fire({
        icon: "error",
        title: "Delivery no disponible",
        text: deliveryInfo.error,
        confirmButtonColor: "#059669",
      });
      return;
    }
  };

  const submitOrder = async (
    wantsDeliveryFlag,
    needsManualContactFlag,
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
      const addressToUse = selectedAddress || {
        address: "",
        lat: null,
        lng: null,
      };
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
        delivery_needs_manual_contact: needsManualContactFlag || false,
        customer_address: addressToUse.address,
        customer_lat: addressToUse.lat,
        customer_lng: addressToUse.lng,
        notes: needsManualContactFlag
          ? "Requiere contacto manual para dirección"
          : `Dirección: ${addressToUse.address}`,
      };
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-token": token },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (data.ok) {
        if (onOrderCreated) onOrderCreated();
        dispatch(clearCart());
        dispatch(toggleCartModal());
        setCreatingOrder(false);
        const finalTotal =
          wantsDeliveryFlag && deliveryPrice ? total + deliveryPrice : total;
        const currencySymbol = getCurrencySymbol();
        if (needsManualContactFlag) {
          try {
            await fetch(`${API_URL}/api/chat/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-token": token },
              body: JSON.stringify({
                message: `🛒 Pedido #${data.pedido.id} con envío a domicilio.\n📍 Dirección: ${addressToUse.address}\n💰 Total (sin envío): ${currencySymbol} ${total.toFixed(2)}`,
              }),
            });
          } catch (err) {
            console.error("Error enviando mensaje:", err);
          }
        }
        let message = needsManualContactFlag
          ? "📞 Un asesor te contactará para coordinar el envío."
          : wantsDeliveryFlag
            ? "🚚 Recibirás tu pedido en tu domicilio."
            : "📦 Retira tu pedido en nuestra tienda.";
        await Swal.fire({
          title: "✅ ¡Pedido realizado!",
          html: `<div style="text-align: center;"><p><strong>Pedido #${data.pedido.id}</strong></p><p>${message}</p><p style="font-weight: 700; color: #059669;">Total: ${currencySymbol} ${finalTotal.toFixed(2)}</p></div>`,
          icon: "success",
          confirmButtonColor: "#059669",
        });
      } else {
        setCreatingOrder(false);
        if (data.outOfStock && data.outOfStock.length > 0) {
          Swal.fire({
            icon: "error",
            title: "Stock insuficiente",
            html: `<p>No se pudo completar el pedido. Por favor, actualiza tu carrito e intenta de nuevo.</p>`,
            confirmButtonColor: "#059669",
          });
          validateCartStock();
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: data.msg || "No se pudo crear el pedido",
            confirmButtonColor: "#059669",
          });
        }
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
            {validatingStock && (
              <span className="stock-validating">🔄 Verificando stock...</span>
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
                      <p className="cart-item__stock">
                        Stock disponible: {item.stock_quantity || 0}
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
                          disabled={item.quantity >= (item.stock_quantity || 0)}
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

                {deliveryConfig && deliveryConfig.isConfigured && (
                  <div className="cart-delivery-section">
                    <div className="delivery-header">
                      <HiOutlineTruck className="delivery-header-icon" />
                      <span className="delivery-header-title">
                        🚚 Envío a domicilio
                      </span>
                    </div>
                    <div className="delivery-address-selector">
                      <button
                        className={`select-address-btn ${selectedAddress ? "has-address" : ""}`}
                        onClick={() =>
                          setShowAddressSelector(!showAddressSelector)
                        }
                      >
                        <HiOutlineLocationMarker />
                        <span>
                          {selectedAddress
                            ? selectedAddress.nickname
                              ? `📍 ${selectedAddress.nickname} - ${selectedAddress.address.substring(0, 40)}...`
                              : `📍 ${selectedAddress.address.substring(0, 50)}`
                            : "📌 Selecciona una dirección de entrega"}
                        </span>
                        <svg
                          className={`arrow-icon ${showAddressSelector ? "rotate" : ""}`}
                          viewBox="0 0 20 20"
                          width="16"
                          height="16"
                        >
                          <path fill="currentColor" d="M5 8l5 5 5-5H5z" />
                        </svg>
                      </button>
                      {showAddressSelector && (
                        <div className="address-selector-container">
                          <AddressSelector
                            selectedAddress={selectedAddress}
                            onAddressSelect={handleAddressSelect}
                            onAddressesLoaded={() => {}}
                            onAddressAdded={handleAddressAdded}
                            onAddressDeleted={handleAddressDeleted}
                            token={localStorage.getItem("token")}
                          />
                        </div>
                      )}
                    </div>

                    {!addressSelectedByUser ? (
                      <div className="cart-delivery-info cart-delivery-info--warning">
                        <div className="delivery-warning">
                          <span>⚠️ Selecciona una dirección de entrega</span>
                          <p>
                            Elige una dirección de tu lista o agrega una nueva
                            para continuar
                          </p>
                        </div>
                      </div>
                    ) : calculatingDelivery ? (
                      <div className="cart-delivery-loading">
                        <HiOutlineRefresh className="spinning" />
                        <span>Calculando costo de envío...</span>
                      </div>
                    ) : needsManualContact ? (
                      <div className="cart-delivery-info cart-delivery-info--manual">
                        <div className="delivery-manual-message">
                          <span>
                            📞{" "}
                            <strong>
                              Esta dirección requiere verificación
                            </strong>
                          </span>
                          <p>
                            No es posible calcular automáticamente el costo de
                            envío. Un asesor te contactará.
                          </p>
                        </div>
                      </div>
                    ) : deliveryInfo && deliveryInfo.isAvailable ? (
                      <div className="cart-delivery-info cart-delivery-info--success">
                        <div className="delivery-price-info">
                          <span className="delivery-price-label">
                            🚚 Costo de envío:
                          </span>
                          <span className="delivery-price-value">
                            {getCurrencySymbol()}
                            {deliveryInfo.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="delivery-note">
                          <small>
                            📍 Distancia:{" "}
                            {(deliveryInfo.distance || 0).toFixed(1)} km
                          </small>
                        </div>
                      </div>
                    ) : deliveryInfo && !deliveryInfo.isAvailable ? (
                      <div className="cart-delivery-info cart-delivery-info--error">
                        <div className="delivery-error">
                          <span>
                            ⚠️{" "}
                            {deliveryInfo.error ||
                              "No es posible realizar el envío"}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {deliveryInfo &&
                  deliveryInfo.isAvailable &&
                  !calculatingDelivery &&
                  selectedAddress &&
                  addressSelectedByUser && (
                    <div className="cart-total cart-total-final">
                      <span>Total a pagar:</span>
                      <span className="total-amount">
                        {getCurrencySymbol()}
                        {(total + deliveryInfo.price).toFixed(2)}
                      </span>
                    </div>
                  )}
                {(!deliveryInfo?.isAvailable || needsManualContact) &&
                  !calculatingDelivery &&
                  deliveryConfig?.isConfigured &&
                  addressSelectedByUser && (
                    <div className="cart-total cart-total-final">
                      <span>Total:</span>
                      <span className="total-amount">
                        {getCurrencySymbol()}
                        {total.toFixed(2)}
                      </span>
                    </div>
                  )}

                <div className="cart-actions">
                  <button className="clear-cart-btn" onClick={handleClearCart}>
                    <FiTrash2 size={14} /> Vaciar Carrito
                  </button>
                  <button
                    className="order-btn"
                    onClick={handleCreateOrder}
                    disabled={
                      creatingOrder ||
                      calculatingDelivery ||
                      !addressSelectedByUser ||
                      validatingStock
                    }
                  >
                    {creatingOrder ? (
                      <>
                        <span className="spinner"></span> Creando...
                      </>
                    ) : (
                      <>
                        <HiOutlineClipboardCheck size={18} /> Realizar Pedido
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
