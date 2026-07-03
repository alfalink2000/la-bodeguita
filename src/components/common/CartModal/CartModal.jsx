import React, { useState, useEffect } from "react";
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
      } else if (userAddresses.length > 0) {
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
              text: "Algunos productos han cambiado su disponibilidad.",
              confirmButtonColor: "var(--color-primary)",
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
          });
        } else {
          setDeliveryConfig({ isConfigured: false });
        }
      } catch (err) {
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
      confirmButtonColor: "var(--color-error)",
      cancelButtonColor: "var(--color-on-surface-variant)",
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
        confirmButtonColor: "var(--color-primary)",
      });
      return;
    }
    if (!selectedAddress) {
      Swal.fire({
        icon: "warning",
        title: "Dirección requerida",
        text: "Selecciona una dirección de entrega",
        confirmButtonColor: "var(--color-primary)",
      });
      return;
    }
    const subtotal = total;
    const currencySymbol = getCurrencySymbol();

    if (!deliveryConfig?.isConfigured) {
      const result = await Swal.fire({
        title: "Retiro en tienda",
        html: `<p>Total: ${currencySymbol} ${subtotal.toFixed(2)}</p>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "var(--color-primary)",
        confirmButtonText: "Confirmar pedido",
      });
      if (result.isConfirmed) await submitOrder(false, false, null, null);
      return;
    }

    if (needsManualContact) {
      const result = await Swal.fire({
        title: "Entrega a domicilio",
        text: "Soporte te contactará para calcular el costo de envío.",
        icon: "warning",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: "var(--color-warning)",
        denyButtonColor: "var(--color-primary)",
        confirmButtonText: "Continuar",
        denyButtonText: "Cambiar dirección",
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
        title: "Confirmar pedido",
        html: `<p>Total: ${currencySymbol} ${finalTotal.toFixed(2)}</p>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "var(--color-primary)",
        confirmButtonText: "Confirmar pedido",
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
        confirmButtonColor: "var(--color-primary)",
      });
      return;
    }
    if (deliveryInfo && !deliveryInfo.isAvailable) {
      Swal.fire({
        icon: "error",
        title: "Delivery no disponible",
        text: deliveryInfo.error,
        confirmButtonColor: "var(--color-primary)",
      });
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
          ? "Requiere contacto manual"
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
        await Swal.fire({
          title: "¡Pedido realizado!",
          html: `<p><strong>Pedido #${data.pedido.id}</strong></p>`,
          icon: "success",
          confirmButtonColor: "var(--color-primary)",
        });
      } else {
        setCreatingOrder(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg || "No se pudo crear el pedido",
          confirmButtonColor: "var(--color-primary)",
        });
      }
    } catch (err) {
      setCreatingOrder(false);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor",
        confirmButtonColor: "var(--color-primary)",
      });
    }
  };

  return (
    <div
      className={`cart-modal ${isOpen ? "cart-modal--visible" : "cart-modal--hidden"}`}
    >
      <div className="cart-modal__overlay" onClick={handleClose} />
      <div className="cart-modal__container">
        {/* Header */}
        <div className="cart-modal__header">
          <div className="cart-modal__header-left">
            <span className="cart-modal__header-icon material-symbols-outlined">
              shopping_cart
            </span>
            <h2 className="cart-modal__title">Mi Carrito</h2>
            {cartItems.length > 0 && (
              <span className="cart-modal__count">({cartItems.length})</span>
            )}
            {validatingStock && (
              <span className="cart-modal__stock-checking">
                <span className="cart-modal__stock-spinner material-symbols-outlined">
                  sync
                </span>
                Verificando stock...
              </span>
            )}
          </div>
          <button onClick={handleClose} className="cart-modal__close-btn">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="cart-modal__body">
          {cartItems.length === 0 ? (
            <div className="cart-modal__empty">
              <span className="cart-modal__empty-icon material-symbols-outlined">
                shopping_cart
              </span>
              <h3 className="cart-modal__empty-title">Tu carrito está vacío</h3>
              <p className="cart-modal__empty-text">
                Agrega algunos productos para continuar
              </p>
            </div>
          ) : (
            <div className="cart-modal__items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-modal__item">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="cart-modal__item-image"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/60x60?text=Prod";
                    }}
                  />
                  <div className="cart-modal__item-info">
                    <h4 className="cart-modal__item-name">{item.name}</h4>
                    <p className="cart-modal__item-price">
                      {getCurrencySymbol()}
                      {parseFloat(item.price).toFixed(2)} c/u
                    </p>
                    <p className="cart-modal__item-stock">
                      Stock: {item.stock_quantity || 0}
                    </p>
                    <div className="cart-modal__item-controls">
                      <div className="cart-modal__quantity">
                        <button
                          className="cart-modal__quantity-btn"
                          onClick={() => handleQuantityChange(item.id, -1)}
                        >
                          <span className="material-symbols-outlined">
                            remove
                          </span>
                        </button>
                        <span className="cart-modal__quantity-value">
                          {item.quantity}
                        </span>
                        <button
                          className="cart-modal__quantity-btn"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          disabled={item.quantity >= (item.stock_quantity || 0)}
                        >
                          <span className="material-symbols-outlined">add</span>
                        </button>
                      </div>
                      <span className="cart-modal__item-total">
                        {getCurrencySymbol()}
                        {(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="cart-modal__item-remove"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="cart-modal__footer">
            <div className="cart-modal__subtotal">
              <span className="cart-modal__subtotal-label">Subtotal</span>
              <span className="cart-modal__subtotal-value">
                {getCurrencySymbol()}
                {total.toFixed(2)}
              </span>
            </div>

            {deliveryConfig && deliveryConfig.isConfigured && (
              <div className="cart-modal__delivery">
                <div className="cart-modal__delivery-header">
                  <span className="cart-modal__delivery-header-icon material-symbols-outlined">
                    local_shipping
                  </span>
                  <span className="cart-modal__delivery-header-text">
                    Envío a domicilio
                  </span>
                </div>
                <button
                  className={`cart-modal__address-btn ${selectedAddress ? "cart-modal__address-btn--selected" : ""}`}
                  onClick={() => setShowAddressSelector(!showAddressSelector)}
                >
                  <span className="cart-modal__address-btn-icon material-symbols-outlined">
                    location_on
                  </span>
                  <span className="cart-modal__address-btn-text">
                    {selectedAddress
                      ? selectedAddress.address.substring(0, 50)
                      : "Selecciona una dirección de entrega"}
                  </span>
                  <span
                    className={`cart-modal__address-btn-arrow material-symbols-outlined ${showAddressSelector ? "cart-modal__address-btn-arrow--open" : ""}`}
                  >
                    expand_more
                  </span>
                </button>
                {showAddressSelector && (
                  <div className="cart-modal__address-selector-container">
                    <AddressSelector
                      selectedAddress={selectedAddress}
                      onAddressSelect={handleAddressSelect}
                      onAddressAdded={handleAddressAdded}
                      onAddressDeleted={handleAddressDeleted}
                    />
                  </div>
                )}
              </div>
            )}

            {deliveryInfo &&
              deliveryInfo.isAvailable &&
              !calculatingDelivery && (
                <div className="cart-modal__delivery-price">
                  <span className="cart-modal__delivery-price-label">
                    Costo de envío:
                  </span>
                  <div className="cart-modal__delivery-price-value">
                    <span className="cart-modal__delivery-price-amount">
                      {getCurrencySymbol()}
                      {deliveryInfo.price.toFixed(2)}
                    </span>
                    <span className="cart-modal__delivery-price-distance">
                      Distancia: {(deliveryInfo.distance || 0).toFixed(1)} km
                    </span>
                  </div>
                </div>
              )}

            <div className="cart-modal__total">
              <span className="cart-modal__total-label">Total a pagar</span>
              <span className="cart-modal__total-value">
                {getCurrencySymbol()}
                {(total + (deliveryInfo?.price || 0)).toFixed(2)}
              </span>
            </div>

            <div className="cart-modal__actions">
              <button
                onClick={handleClearCart}
                className="cart-modal__clear-btn"
              >
                <span className="material-symbols-outlined">delete</span>
                Vaciar
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={
                  creatingOrder ||
                  calculatingDelivery ||
                  !addressSelectedByUser ||
                  validatingStock
                }
                className="cart-modal__order-btn"
              >
                {creatingOrder ? (
                  <>Creando...</>
                ) : (
                  <>
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                    Realizar Pedido
                  </>
                )}
              </button>
            </div>

            {!isLoggedIn && (
              <p className="cart-modal__login-notice">
                <button
                  className="cart-modal__login-link"
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
        )}
      </div>
    </div>
  );
};

export default CartModal;
