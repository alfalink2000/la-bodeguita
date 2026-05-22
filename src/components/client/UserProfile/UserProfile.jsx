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
    full_name: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [unreadOrdersCount, setUnreadOrdersCount] =
    useState(initialUnreadOrders);
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

  // Inicializar formulario de edición
  useEffect(() => {
    if (userData) {
      setEditForm({
        full_name: userData.full_name || "",
        phone: userData.phone || "",
        address: userData.address || "",
      });
    }
  }, [userData]);

  // ✅ Al abrir el perfil, marcar pedidos como vistos
  useEffect(() => {
    console.log("👤 [UserProfile] useEffect de unreadOrdersCount ejecutado");
    console.log("👤 [UserProfile] unreadOrdersCount:", unreadOrdersCount);
    console.log("👤 [UserProfile] onOrdersViewed existe:", !!onOrdersViewed);

    if (unreadOrdersCount > 0 && onOrdersViewed) {
      console.log(
        "👤 [UserProfile] 🎯 Resetando contador de pedidos no leídos",
      );
      onOrdersViewed();
      setUnreadOrdersCount(0);
      localStorage.setItem("unread_orders_count", "0");
    }
  }, [unreadOrdersCount, onOrdersViewed]);

  // Cargar pedidos del usuario
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

  useEffect(() => {
    console.log("👤 [UserProfile] Tab cambiada a:", activeTab);
  }, [activeTab]);

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

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({
        full_name: userData?.full_name || "",
        phone: userData?.phone || "",
        address: userData?.address || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (data.ok) {
        Swal.fire({
          icon: "success",
          title: "Perfil actualizado",
          text: "Tus datos han sido actualizados correctamente",
          confirmButtonColor: "#059669",
          timer: 2000,
          showConfirmButton: false,
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
          <p className="up-role">@{userData?.username}</p>
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

              <div className="up-field">
                <label>
                  <HiOutlineMail size={14} /> Email
                </label>
                <span>{userData?.email || "No registrado"}</span>
              </div>

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

              <div className="up-field">
                <label>
                  <HiOutlineLocationMarker size={14} /> Dirección
                </label>
                {isEditing ? (
                  <textarea
                    rows="2"
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                    placeholder="Tu dirección de entrega"
                  />
                ) : (
                  <span>{userData?.address || "No registrada"}</span>
                )}
              </div>

              <div className="up-actions">
                {isEditing ? (
                  <>
                    <button
                      className="up-btn up-btn--save"
                      onClick={handleSaveProfile}
                      disabled={saving}
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

                        <div className="up-order-items">
                          {order.items?.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="up-order-item">
                              {item.name} x{item.quantity}
                            </span>
                          ))}
                          {order.items?.length > 3 && (
                            <span className="up-order-more">
                              +{order.items.length - 3} más
                            </span>
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
                                    },
                                  );
                                  const data = await res.json();
                                  if (data.ok) {
                                    Swal.fire(
                                      "Pedido cancelado",
                                      "",
                                      "success",
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
