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
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Estados para delivery
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);
  const [deliveryConfig, setDeliveryConfig] = useState(null);
  const [needsManualContact, setNeedsManualContact] = useState(false);
  
  // Estados para selector de direcciones
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
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

  // Función para calcular delivery con dirección específica
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
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify({ 
          subtotal: total,
          lat: address.lat,
          lng: address.lng
        }),
      });
      
      const data = await res.json();
      console.log("📦 Respuesta cálculo con dirección:", data);
      
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

  // Seleccionar dirección
  const handleAddressSelect = (address) => {
    console.log("📍 Usuario seleccionó dirección:", address);
    setSelectedAddress(address);
    setAddressSelectedByUser(true);
    setShowAddressSelector(false);
    
    // Verificar si la dirección tiene GPS
    if (address && address.lat && address.lng) {
      calculateDeliveryWithAddress(address);
    } else {
      setNeedsManualContact(true);
      setDeliveryInfo(null);
    }
  };

  // Manejar dirección agregada desde AddressSelector
  const handleAddressAdded = async () => {
    try {
      const token = localStorage.getItem("token");
      const addressesRes = await fetch(`${API_URL}/api/users/addresses`, {
        headers: { "x-token": token }
      });
      const addressesData = await addressesRes.json();
      
      if (addressesData.ok && addressesData.addresses) {
        setUserAddresses(addressesData.addresses);
        if (onAddressesLoaded) onAddressesLoaded(addressesData.addresses);
        
        // Seleccionar la nueva dirección (la última agregada)
        const newAddress = addressesData.addresses[addressesData.addresses.length - 1];
        if (newAddress) {
          handleAddressSelect(newAddress);
        }
      }
    } catch (err) {
      console.error("Error recargando direcciones:", err);
    }
  };

  // Cargar configuración de delivery y direcciones
  useEffect(() => {
    const loadDeliveryConfigAndAddresses = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Cargar configuración de delivery
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

        // Cargar direcciones del usuario si está logueado
        if (token && cartItems.length > 0) {
          const addressesRes = await fetch(`${API_URL}/api/users/addresses`, {
            headers: { "x-token": token }
          });
          const addressesData = await addressesRes.json();
          
          if (addressesData.ok && addressesData.addresses) {
            setUserAddresses(addressesData.addresses);
            // NO seleccionar ninguna dirección por defecto
            setSelectedAddress(null);
            setAddressSelectedByUser(false);
            setDeliveryInfo(null);
            setNeedsManualContact(false);
          }
        }
        
      } catch (err) {
        console.error("Error cargando configuración:", err);
        setDeliveryConfig({ isConfigured: false });
      }
    };

    if (isOpen && cartItems.length > 0) {
      console.log("🔄 Carrito abierto, cargando direcciones...");
      loadDeliveryConfigAndAddresses();
    } else if (isOpen && cartItems.length === 0) {
      setDeliveryInfo(null);
      setNeedsManualContact(false);
      setSelectedAddress(null);
      setAddressSelectedByUser(false);
    }
  }, [isOpen, cartItems.length]);

  // Si el total cambia mientras el carrito está abierto, recalcular delivery
  useEffect(() => {
    if (isOpen && cartItems.length > 0 && selectedAddress && deliveryConfig?.isConfigured && !calculatingDelivery && !needsManualContact) {
      console.log("🔄 Total cambiado, recalculando delivery...");
      calculateDeliveryWithAddress(selectedAddress);
    }
  }, [total]);

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

    // Verificar que haya seleccionado una dirección
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

    // Caso 1: Sin configuración de delivery
    if (!deliveryConfig?.isConfigured) {
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

    // Caso 2: Necesita contacto manual (sin GPS)
    if (needsManualContact) {
      const result = await Swal.fire({
        title: "📍 Entrega a domicilio",
        html: `
        <div style="text-align: center; font-size: 0.95rem;">
          <p style="margin-bottom: 0.5rem;">Solicitud de <strong>envío a domicilio</strong>.</p>
          <div style="background: #fef3c7; padding: 0.5rem; border-radius: 8px; margin: 0.5rem 0;">
            <p style="margin: 0; font-size: 0.85rem;">⚠️ No tenemos coordenadas GPS para tu dirección: <strong>${selectedAddress.address.substring(0, 50)}</strong></p>
            <p style="margin: 0.5rem 0 0; font-size: 0.85rem;">Soporte te contactará para calcular el costo de envío.</p>
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
        denyButtonText: "📍 Cambiar dirección",
        cancelButtonText: "Cancelar",
      });

      if (result.isDenied) {
        setShowAddressSelector(true);
        return;
      }

      if (result.isConfirmed) {
        await submitOrder(true, true, null, null);
      }
      return;
    }

    // Caso 3: Delivery con GPS - cálculo exitoso
    if (deliveryInfo && deliveryInfo.isAvailable) {
      const deliveryPrice = deliveryInfo.price || 0;
      const finalTotal = subtotal + deliveryPrice;

      const result = await Swal.fire({
        title: "🚚 Confirmar pedido",
        html: `
        <div style="text-align: center; font-size: 0.95rem;">
          <div style="background: #f0fdf4; padding: 0.6rem; border-radius: 8px; margin: 0.5rem 0;">
            <p style="margin: 0; font-size: 0.85rem;">Subtotal: ${currencySymbol} ${subtotal.toFixed(2)}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.85rem; color: #2563eb;">
              🚚 Delivery: ${currencySymbol} ${deliveryPrice.toFixed(2)}
            </p>
            <p style="margin: 0.5rem 0 0; font-weight: 700; font-size: 1.15rem; color: #059669;">
              TOTAL: ${currencySymbol} ${finalTotal.toFixed(2)}
            </p>
          </div>
          <p style="font-size: 0.7rem; color: #6b7280;">📍 Enviando a: ${selectedAddress.address.substring(0, 60)}${selectedAddress.address.length > 60 ? "..." : ""}</p>
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
        await submitOrder(true, false, deliveryInfo.distance, deliveryPrice);
      }
      return;
    }

    // Caso 4: Delivery no disponible o aún calculando
    if (calculatingDelivery) {
      Swal.fire({
        icon: "info",
        title: "Calculando envío",
        text: "Espera un momento mientras calculamos el costo de envío",
        confirmButtonColor: "#059669",
      });
      return;
    }

    if (deliveryInfo && !deliveryInfo.isAvailable) {
      Swal.fire({
        icon: "error",
        title: "Delivery no disponible",
        text: deliveryInfo.error || "No se puede realizar el envío a esta dirección",
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

      const addressToUse = selectedAddress || { address: "", lat: null, lng: null };

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
          : `Dirección seleccionada: ${addressToUse.address}`,
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

        const finalTotal = wantsDeliveryFlag && deliveryPrice ? total + deliveryPrice : total;
        const currencySymbol = getCurrencySymbol();

        if (needsManualContactFlag) {
          try {
            await fetch(`${API_URL}/api/chat/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-token": token,
              },
              body: JSON.stringify({
                message: `🛒 He realizado el pedido #${data.pedido.id} con envío a domicilio.\n\n📍 Dirección: ${addressToUse.address}\n\n📋 Necesito que un asesor me contacte para coordinar el costo del envío.\n\n💰 Total del pedido (sin envío): ${currencySymbol} ${total.toFixed(2)}\n\n⏳ Quedo a la espera de su mensaje. Gracias.`,
              }),
            });
            console.log("✅ Mensaje automático enviado al chat");
          } catch (err) {
            console.error("Error enviando mensaje automático:", err);
          }
        }

        let message = "";
        if (needsManualContactFlag) {
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
            ${needsManualContactFlag ? '<p style="font-size: 0.8rem; color: #f59e0b; margin-top: 0.25rem;">💬 También puedes usar el chat de soporte</p>' : ""}
          </div>
        `,
          icon: "success",
          confirmButtonColor: "#059669",
          confirmButtonText: "Entendido",
        });
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

                {/* SECCIÓN DE DELIVERY CON SELECTOR DE DIRECCIONES */}
                {deliveryConfig && deliveryConfig.isConfigured && (
                  <div className="cart-delivery-section">
                    <div className="delivery-header">
                      <HiOutlineTruck className="delivery-header-icon" />
                      <span className="delivery-header-title">🚚 Envío a domicilio</span>
                    </div>

                    {/* Selector de dirección - OBLIGATORIO */}
                    <div className="delivery-address-selector">
                      <button 
                        className={`select-address-btn ${selectedAddress ? "has-address" : ""}`}
                        onClick={() => setShowAddressSelector(!showAddressSelector)}
                      >
                        <HiOutlineLocationMarker />
                        <span>
                          {selectedAddress 
                            ? (selectedAddress.nickname 
                                ? `📍 ${selectedAddress.nickname} - ${selectedAddress.address.substring(0, 40)}...`
                                : `📍 ${selectedAddress.address.substring(0, 50)}${selectedAddress.address.length > 50 ? "..." : ""}`)
                            : "📌 Selecciona una dirección de entrega"}
                        </span>
                        <svg className={`arrow-icon ${showAddressSelector ? "rotate" : ""}`} viewBox="0 0 20 20" width="16" height="16">
                          <path fill="currentColor" d="M5 8l5 5 5-5H5z"/>
                        </svg>
                      </button>
                      
                      {showAddressSelector && (
                        <div className="address-selector-container">
                          <AddressSelector
                            selectedAddress={selectedAddress}
                            onAddressSelect={handleAddressSelect}
                            onAddressesLoaded={setUserAddresses}
                            onAddressAdded={handleAddressAdded}
                            token={localStorage.getItem("token")}
                          />
                        </div>
                      )}
                    </div>

                    {/* Mostrar estado según la dirección seleccionada */}
                    {!addressSelectedByUser ? (
                      <div className="cart-delivery-info cart-delivery-info--warning">
                        <div className="delivery-warning">
                          <span>⚠️ Selecciona una dirección de entrega</span>
                          <p>Elige una dirección de tu lista o agrega una nueva para continuar</p>
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
                          <span>📞 <strong>Esta dirección requiere verificación</strong></span>
                          <p>
                            No es posible calcular automáticamente el costo de envío para esta dirección porque no tiene coordenadas GPS.
                          </p>
                          <p className="delivery-manual-detail">
                            💡 <strong>¿Qué significa esto?</strong><br/>
                            Un asesor se pondrá en contacto contigo para confirmar la dirección y calcular el costo del delivery.
                          </p>
                          <small>⏳ Una vez confirmes el pedido, soporte te contactará para coordinar el envío</small>
                        </div>
                      </div>
                    ) : deliveryInfo && deliveryInfo.isAvailable ? (
                      <div className="cart-delivery-info cart-delivery-info--success">
                        <div className="delivery-price-info">
                          <span className="delivery-price-label">🚚 Costo de envío calculado:</span>
                          <span className="delivery-price-value">
                            {getCurrencySymbol()}{deliveryInfo.price.toFixed(2)}
                          </span>
                        </div>
                        <div className="delivery-note">
                          <small>📍 Distancia: {(deliveryInfo.distance || 0).toFixed(1)} km</small>
                        </div>
                      </div>
                    ) : deliveryInfo && !deliveryInfo.isAvailable ? (
                      <div className="cart-delivery-info cart-delivery-info--error">
                        <div className="delivery-error">
                          <span>⚠️ {deliveryInfo.error || "No es posible realizar el envío a esta dirección"}</span>
                          <p className="delivery-error-hint">
                            Por favor selecciona otra dirección o contacta a soporte
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Mostrar total con delivery si está disponible */}
                {deliveryInfo && deliveryInfo.isAvailable && !calculatingDelivery && selectedAddress && addressSelectedByUser && (
                  <div className="cart-total cart-total-final">
                    <span>Total a pagar:</span>
                    <span className="total-amount">
                      {getCurrencySymbol()}
                      {(total + deliveryInfo.price).toFixed(2)}
                    </span>
                  </div>
                )}

                {(!deliveryInfo?.isAvailable || needsManualContact) && !calculatingDelivery && deliveryConfig?.isConfigured && addressSelectedByUser && (
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
                    <FiTrash2 size={14} />
                    Vaciar Carrito
                  </button>

                  <button
                    className="order-btn"
                    onClick={handleCreateOrder}
                    disabled={creatingOrder || calculatingDelivery || !addressSelectedByUser}
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