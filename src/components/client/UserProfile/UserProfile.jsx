// components/client/UserProfile/UserProfile.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  HiOutlineX,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiOutlineShoppingBag,
  HiOutlineLogout,
  HiOutlineIdentification,
  HiOutlineAtSymbol,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from "react-icons/hi";
import Swal from "sweetalert2";
import { startLogout } from "../../../actions/authActions";
import { resetCart } from "../../../actions/cartActions";
import "./UserProfile.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const UserProfile = ({
  userData,
  onClose,
  onOrdersViewed,
  unreadOrdersCount: initialUnreadOrders = 0,
}) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("profile");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    full_name: "",
    phone: "",
    address: "",
    lat: null,
    lng: null,
  });
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [unreadOrdersCount, setUnreadOrdersCount] =
    useState(initialUnreadOrders);
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [expandedOrders, setExpandedOrders] = useState({});
  const appConfig = useSelector((state) => state.appConfig.config);
  const currency = appConfig?.currency || "CUP";

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

  const toggleExpandOrder = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  useEffect(() => {
    if (userData) {
      setEditForm({
        username: userData.username || userData.name || "",
        email: userData.email || "",
        full_name: userData.full_name || "",
        phone: userData.phone || "",
        address: userData.address || "",
        lat: userData.lat || null,
        lng: userData.lng || null,
      });
    }
  }, [userData]);

  useEffect(() => {
    if (unreadOrdersCount > 0 && onOrdersViewed) {
      onOrdersViewed();
      setUnreadOrdersCount(0);
      localStorage.setItem("unread_orders_count", "0");
    }
  }, [unreadOrdersCount, onOrdersViewed]);

  const loadOrders = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/mine`, {
        headers: { "x-token": token },
      });
      const data = await res.json();

      if (data.ok) {
        setOrders(data.pedidos || []);
      }
    } catch (err) {
      console.error("Error cargando pedidos:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders();
    }
  }, [activeTab, loadOrders]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "open":
        return {
          label: "Abierto",
          color: "#3b82f6",
          bg: "#dbeafe",
          icon: "🆕",
        };
      case "pending":
        return {
          label: "En Proceso",
          color: "#f59e0b",
          bg: "#fef3c7",
          icon: "⏳",
        };
      case "completed":
        return {
          label: "Completado",
          color: "#10b981",
          bg: "#d1fae5",
          icon: "✅",
        };
      case "cancelled":
        return {
          label: "Cancelado",
          color: "#ef4444",
          bg: "#fee2e2",
          icon: "❌",
        };
      default:
        return { label: status, color: "#6b7280", bg: "#f3f4f6", icon: "📦" };
    }
  };

  const validateEmail = (email) => {
    if (!email || email.trim() === "") {
      setEmailError("");
      return true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Formato de email inválido");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateUsername = (username) => {
    if (!username || username.trim() === "") {
      setUsernameError("El nombre de usuario es obligatorio");
      return false;
    }
    if (username.trim().length < 3) {
      setUsernameError("Mínimo 3 caracteres");
      return false;
    }
    if (username.trim().length > 50) {
      setUsernameError("Máximo 50 caracteres");
      return false;
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameError("Solo letras, números y guiones bajos");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({
        username: userData?.username || userData?.name || "",
        email: userData?.email || "",
        full_name: userData?.full_name || "",
        phone: userData?.phone || "",
        address: userData?.address || "",
        lat: userData?.lat || null,
        lng: userData?.lng || null,
      });
      setEmailError("");
      setUsernameError("");
    }
    setIsEditing(!isEditing);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: "error",
        title: "GPS no disponible",
        text: "Tu dispositivo no soporta geolocalización",
        confirmButtonColor: "#059669",
      });
      return;
    }

    setGettingLocation(true);

    Swal.fire({
      title: "Obteniendo ubicación...",
      text: "Por favor permite el acceso a tu ubicación",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(`${API_URL}/api/geocoding/reverse`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          const data = await res.json();

          let addressText;

          if (data.ok && data.display_name) {
            addressText = data.display_name;
          } else {
            addressText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          }

          setEditForm((prev) => ({
            ...prev,
            lat: latitude,
            lng: longitude,
            address: addressText,
          }));

          setGettingLocation(false);

          Swal.fire({
            icon: "success",
            title: "¡Ubicación obtenida!",
            text:
              addressText.length > 60
                ? addressText.substring(0, 60) + "..."
                : addressText,
            timer: 2500,
            showConfirmButton: false,
          });
        } catch (err) {
          console.error("❌ Error en reverse geocoding:", err);
          const coordText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setEditForm((prev) => ({
            ...prev,
            lat: latitude,
            lng: longitude,
            address: coordText,
          }));

          setGettingLocation(false);

          Swal.fire({
            icon: "success",
            title: "¡Ubicación obtenida!",
            text: "Coordenadas GPS registradas correctamente",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      },
      (error) => {
        console.error("❌ Error GPS:", error);
        setGettingLocation(false);

        let errorMsg = "No se pudo obtener tu ubicación.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg =
              "Permiso de ubicación denegado. Actívalo en la configuración de tu navegador.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Información de ubicación no disponible.";
            break;
          case error.TIMEOUT:
            errorMsg = "Tiempo de espera agotado al obtener ubicación.";
            break;
        }

        Swal.fire({
          icon: "error",
          title: "Error de ubicación",
          text: errorMsg,
          confirmButtonColor: "#059669",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const handleSaveProfile = async () => {
    if (!editForm.username || editForm.username.trim() === "") {
      Swal.fire({
        icon: "error",
        title: "Campo requerido",
        text: "El nombre de usuario es obligatorio",
        confirmButtonColor: "#059669",
      });
      return;
    }

    if (!validateUsername(editForm.username)) {
      Swal.fire({
        icon: "error",
        title: "Usuario inválido",
        text: usernameError,
        confirmButtonColor: "#059669",
      });
      return;
    }

    if (editForm.email && editForm.email.trim() !== "") {
      if (!validateEmail(editForm.email)) {
        Swal.fire({
          icon: "error",
          title: "Email inválido",
          text: emailError,
          confirmButtonColor: "#059669",
        });
        return;
      }
    }

    setSaving(true);
    const token = localStorage.getItem("token");

    const bodyData = {
      username: editForm.username.trim(),
      full_name: editForm.full_name?.trim() || "",
      phone: editForm.phone?.trim() || "",
      address: editForm.address?.trim() || "",
    };

    if (editForm.email && editForm.email.trim() !== "") {
      bodyData.email = editForm.email.trim();
    }

    if (
      editForm.lat !== null &&
      editForm.lat !== undefined &&
      !isNaN(parseFloat(editForm.lat))
    ) {
      bodyData.lat = parseFloat(editForm.lat);
    }
    if (
      editForm.lng !== null &&
      editForm.lng !== undefined &&
      !isNaN(parseFloat(editForm.lng))
    ) {
      bodyData.lng = parseFloat(editForm.lng);
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (data.ok) {
        Swal.fire({
          icon: "success",
          title: "Perfil actualizado",
          text: "Tus datos han sido actualizados correctamente.",
          confirmButtonColor: "#059669",
        });

        setIsEditing(false);

        if (data.user) {
          Object.assign(userData, data.user);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg || "No se pudo actualizar el perfil",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Se cerrará tu sesión actual",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(resetCart());
        localStorage.clear();
        sessionStorage.clear();
        dispatch(startLogout());
        onClose();
        window.location.reload();
      }
    });
  };

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="up-header">
          <button className="up-close" onClick={onClose}>
            <HiOutlineX size={20} />
          </button>
          <div className="up-avatar">
            <HiOutlineUser size={32} />
          </div>
          <h3 className="up-name">
            {userData?.full_name || userData?.username || "Usuario"}
          </h3>
          <p className="up-role">@{userData?.username || userData?.name}</p>
        </div>

        {/* Tabs */}
        <div className="up-tabs">
          <button
            className={`up-tab ${activeTab === "profile" ? "up-tab--active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <HiOutlineUser size={16} />
            <span>Perfil</span>
          </button>
          <button
            className={`up-tab ${activeTab === "orders" ? "up-tab--active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <HiOutlineClipboardList size={16} />
            <span>Pedidos</span>
            {unreadOrdersCount > 0 && (
              <span className="up-tab-badge">{unreadOrdersCount}</span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="up-content-wrapper">
          {activeTab === "profile" ? (
            <div className="up-profile-section">
              {/* Campo: Nombre de usuario */}
              <div className="up-field">
                <label>
                  <HiOutlineIdentification size={14} /> Usuario de acceso
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => {
                        setEditForm({ ...editForm, username: e.target.value });
                        validateUsername(e.target.value);
                      }}
                      onBlur={(e) => validateUsername(e.target.value)}
                      placeholder="Tu usuario para iniciar sesión"
                      className={usernameError ? "up-input-error" : ""}
                    />
                    {usernameError && (
                      <span className="up-error-text">{usernameError}</span>
                    )}
                    <small className="up-hint">
                      Este es el nombre que usas para iniciar sesión
                    </small>
                  </div>
                ) : (
                  <span>
                    @{userData?.username || userData?.name || "No registrado"}
                  </span>
                )}
              </div>

              {/* Campo: Email */}
              <div className="up-field">
                <label>
                  <HiOutlineAtSymbol size={14} /> Correo electrónico
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => {
                        setEditForm({ ...editForm, email: e.target.value });
                        if (e.target.value.trim() !== "") {
                          validateEmail(e.target.value);
                        } else {
                          setEmailError("");
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value.trim() !== "") {
                          validateEmail(e.target.value);
                        }
                      }}
                      placeholder="ejemplo@correo.com"
                      className={emailError ? "up-input-error" : ""}
                    />
                    {emailError && (
                      <span className="up-error-text">{emailError}</span>
                    )}
                  </div>
                ) : (
                  <span>{userData?.email || "No registrado"}</span>
                )}
              </div>

              {/* Campo: Nombre completo */}
              <div className="up-field">
                <label>
                  <HiOutlineUser size={14} /> Nombre completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, full_name: e.target.value })
                    }
                    placeholder="Tu nombre completo"
                  />
                ) : (
                  <span>{userData?.full_name || "No registrado"}</span>
                )}
              </div>

              {/* Campo: Teléfono */}
              <div className="up-field">
                <label>
                  <HiOutlinePhone size={14} /> Teléfono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    placeholder="+53 5XXXXXXXX"
                  />
                ) : (
                  <span>{userData?.phone || "No registrado"}</span>
                )}
              </div>

              {/* Campo: Dirección con GPS */}
              <div className="up-field">
                <label>
                  <HiOutlineLocationMarker size={14} /> Dirección
                </label>
                {isEditing ? (
                  <>
                    <textarea
                      rows="2"
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                      placeholder="Tu dirección de entrega"
                    />
                    <button
                      type="button"
                      className="up-gps-btn"
                      onClick={handleGetLocation}
                      disabled={gettingLocation}
                    >
                      <HiOutlineLocationMarker size={14} />
                      {gettingLocation
                        ? "Obteniendo ubicación..."
                        : "Usar mi ubicación actual GPS"}
                    </button>
                    {editForm.lat && editForm.lng && (
                      <div className="up-coords-info">
                        📍 Lat: {Number(editForm.lat).toFixed(6)}, Lng:{" "}
                        {Number(editForm.lng).toFixed(6)}
                      </div>
                    )}
                  </>
                ) : (
                  <span>
                    {userData?.address || "No registrada"}
                    {userData?.lat && userData?.lng && (
                      <div className="up-coords-info">
                        📍 Ubicación GPS registrada
                      </div>
                    )}
                  </span>
                )}
              </div>

              {/* Botones de acción */}
              <div className="up-actions">
                {isEditing ? (
                  <>
                    <button
                      className="up-btn up-btn--save"
                      onClick={handleSaveProfile}
                      disabled={saving || !!usernameError || !!emailError}
                    >
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                    <button
                      className="up-btn up-btn--cancel"
                      onClick={handleEditToggle}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="up-btn up-btn--edit"
                      onClick={handleEditToggle}
                    >
                      <HiOutlineUser size={16} />
                      Editar Perfil
                    </button>
                    <button
                      className="up-btn up-btn--cancel"
                      onClick={handleLogout}
                    >
                      <HiOutlineLogout size={16} />
                      Cerrar Sesión
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="up-orders-section">
              {loadingOrders ? (
                <div className="up-empty">
                  <div className="spinning">🌀</div>
                  <p>Cargando tus pedidos...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="up-empty">
                  <HiOutlineShoppingBag className="up-empty-icon" />
                  <h4>No tienes pedidos</h4>
                  <p>Realiza tu primer pedido para verlo aquí</p>
                </div>
              ) : (
                <div className="up-orders-list">
                  {orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const items = order.items || [];
                    const isExpanded = expandedOrders[order.id];

                    return (
                      <div key={order.id} className="up-order-card">
                        <div className="up-order-header">
                          <span className="up-order-id">
                            Pedido #{order.id}
                          </span>
                          <span
                            className="up-order-status"
                            style={{
                              background: statusConfig.bg,
                              color: statusConfig.color,
                            }}
                          >
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                        </div>

                        <div className="up-order-time">
                          <HiOutlineClock size={12} />{" "}
                          {formatDate(order.created_at)}
                        </div>

                        <div className="up-order-details">
                          {order.wants_delivery ? (
                            <span className="up-order-delivery">
                              <HiOutlineTruck size={12} />
                              {order.delivery_needs_manual_contact
                                ? "Delivery (Pendiente contacto)"
                                : `Delivery: ${getCurrencySymbol()}${order.delivery_price || 0}`}
                            </span>
                          ) : (
                            <span className="up-order-pickup">
                              <HiOutlineShoppingBag size={12} />
                              Retiro en tienda
                            </span>
                          )}
                          <span className="up-order-total">
                            <HiOutlineCurrencyDollar size={12} />
                            Total: {getCurrencySymbol()}
                            {parseFloat(order.total_amount).toFixed(2)}
                          </span>
                        </div>

                        {/* ===== PRODUCTOS - SOLO AL EXPANDIR ===== */}
                        <div className="up-order-products">
                          <button
                            className="up-products-toggle-btn"
                            onClick={() => toggleExpandOrder(order.id)}
                          >
                            {isExpanded ? (
                              <>
                                <HiOutlineChevronUp size={16} />
                                <span>Ocultar productos ({items.length})</span>
                              </>
                            ) : (
                              <>
                                <HiOutlineChevronDown size={16} />
                                <span>Ver productos ({items.length})</span>
                              </>
                            )}
                          </button>

                          {isExpanded && (
                            <div className="up-products-list">
                              {items.map((item, idx) => (
                                <div key={idx} className="up-product-item">
                                  <span className="up-product-name">
                                    {item.name}
                                  </span>
                                  <div className="up-product-details">
                                    <span className="up-product-quantity">
                                      x{item.quantity}
                                    </span>
                                    <span className="up-product-price">
                                      {getCurrencySymbol()}
                                      {(parseFloat(item.price) * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {order.status === "open" && (
                          <button
                            className="up-order-cancel"
                            onClick={() => {
                              Swal.fire({
                                title: "¿Cancelar pedido?",
                                text: "Esta acción no se puede deshacer",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#ef4444",
                                cancelButtonColor: "#6b7280",
                                confirmButtonText: "Sí, cancelar",
                                cancelButtonText: "Cancelar",
                              }).then(async (result) => {
                                if (result.isConfirmed) {
                                  const token = localStorage.getItem("token");
                                  const res = await fetch(
                                    `${API_URL}/api/orders/cancel/${order.id}`,
                                    {
                                      method: "PUT",
                                      headers: { "x-token": token },
                                    }
                                  );
                                  const data = await res.json();
                                  if (data.ok) {
                                    Swal.fire(
                                      "Pedido cancelado",
                                      "",
                                      "success"
                                    );
                                    loadOrders();
                                  } else {
                                    Swal.fire("Error", data.msg, "error");
                                  }
                                }
                              });
                            }}
                          >
                            Cancelar Pedido
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;