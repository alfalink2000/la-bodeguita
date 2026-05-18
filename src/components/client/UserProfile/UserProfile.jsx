// components/client/UserProfile/UserProfile.jsx
import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineCamera,
  HiOutlineSave,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
} from "react-icons/hi";
import {
  startLoadMyOrders,
  startCancelOrder,
} from "../../../actions/ordersActions";
import "./UserProfile.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const UserProfile = ({ userData, onClose }) => {
  const dispatch = useDispatch();
  const orders = useSelector((state) => state.orders.orders);
  const appConfig = useSelector((state) => state.appConfig.config);
  const currency = appConfig?.currency || "CUP";

  const [activeTab, setActiveTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: userData?.full_name || "",
    phone: userData?.phone || "",
    address: userData?.address || "",
    lat: userData?.lat || null,
    lng: userData?.lng || null,
  });

  useEffect(() => {
    dispatch(startLoadMyOrders());
  }, [dispatch]);

  // Actualizar perfil
  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/auth/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify({
          id: userData?.id || userData?.uid,
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setEditing(false);
      }
    } catch (err) {
      console.error("Error actualizando perfil:", err);
    }
  };

  // Obtener ubicación GPS
  const getGPSLocation = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      setGpsLoading(false);
      return;
    }
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
          setFormData((prev) => ({
            ...prev,
            lat: latitude,
            lng: longitude,
            address: data.display_name || `${latitude}, ${longitude}`,
          }));
        } catch (err) {
          setFormData((prev) => ({ ...prev, lat: latitude, lng: longitude }));
        }
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Formatear fecha
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

  // Estado del pedido en español
  const statusLabels = {
    open: "Abierto",
    pending: "En Proceso",
    completed: "Completado",
    cancelled: "Cancelado",
  };

  const statusColors = {
    open: "#3b82f6",
    pending: "#f59e0b",
    completed: "#10b981",
    cancelled: "#ef4444",
  };

  // Calcular tiempo restante estimado
  const getTimeRemaining = (order) => {
    if (order.status !== "open" && order.status !== "pending") return null;
    const created = new Date(order.created_at);
    const estimated = new Date(
      created.getTime() + order.estimated_completion_hours * 3600000,
    );
    const now = new Date();
    const diff = estimated - now;

    if (diff <= 0) return "Tiempo cumplido";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}min restantes`;
  };

  return (
    <div
      className="user-profile-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="user-profile-modal">
        {/* Header */}
        <div className="up-header">
          <button className="up-close" onClick={onClose}>
            <HiOutlineX />
          </button>
          <div className="up-avatar">
            <HiOutlineUser />
          </div>
          <h2 className="up-name">
            {userData?.full_name || userData?.username || "Usuario"}
          </h2>
          <p className="up-role">Cliente</p>
        </div>

        {/* Tabs */}
        <div className="up-tabs">
          <button
            className={`up-tab ${activeTab === "profile" ? "up-tab--active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <HiOutlineUser /> Perfil
          </button>
          <button
            className={`up-tab ${activeTab === "orders" ? "up-tab--active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <HiOutlineClipboardList /> Mis Pedidos
            {orders.length > 0 && (
              <span className="up-tab-badge">{orders.length}</span>
            )}
          </button>
        </div>

        {/* Contenido */}
        <div className="up-content">
          {activeTab === "profile" && (
            <div className="up-profile-section">
              <div className="up-field">
                <label>
                  <HiOutlineUser /> Nombre
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <span>{userData?.full_name || "No especificado"}</span>
                )}
              </div>

              <div className="up-field">
                <label>
                  <HiOutlineMail /> Usuario
                </label>
                <span>{userData?.username || "—"}</span>
              </div>

              <div className="up-field">
                <label>
                  <HiOutlinePhone /> Teléfono
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <span>{userData?.phone || "No especificado"}</span>
                )}
              </div>

              <div className="up-field">
                <label>
                  <HiOutlineLocationMarker /> Dirección
                </label>
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                    />
                    <button
                      className="up-gps-btn"
                      onClick={getGPSLocation}
                      disabled={gpsLoading}
                    >
                      {gpsLoading ? "⏳" : "📍"} Usar GPS
                    </button>
                  </>
                ) : (
                  <span>{userData?.address || "No especificada"}</span>
                )}
              </div>

              <div className="up-actions">
                {editing ? (
                  <>
                    <button
                      className="up-btn up-btn--save"
                      onClick={handleUpdateProfile}
                    >
                      <HiOutlineSave /> Guardar
                    </button>
                    <button
                      className="up-btn up-btn--cancel"
                      onClick={() => setEditing(false)}
                    >
                      <HiOutlineX /> Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    className="up-btn up-btn--edit"
                    onClick={() => setEditing(true)}
                  >
                    ✏️ Editar Perfil
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="up-orders-section">
              {orders.length === 0 ? (
                <div className="up-empty">
                  <HiOutlineClipboardList className="up-empty-icon" />
                  <h3>No tienes pedidos</h3>
                  <p>Realiza tu primer pedido desde el carrito de compras</p>
                </div>
              ) : (
                <div className="up-orders-list">
                  {orders.map((order) => (
                    <div key={order.id} className="up-order-card">
                      <div className="up-order-header">
                        <span className="up-order-id">Pedido #{order.id}</span>
                        <span
                          className="up-order-status"
                          style={{ background: statusColors[order.status] }}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </div>

                      <div className="up-order-items">
                        {(order.items || []).slice(0, 3).map((item, i) => (
                          <span key={i} className="up-order-item">
                            {item.name} x{item.quantity}
                          </span>
                        ))}
                        {(order.items || []).length > 3 && (
                          <span className="up-order-more">
                            +{order.items.length - 3} más
                          </span>
                        )}
                      </div>

                      <div className="up-order-details">
                        <span>
                          <HiOutlineCurrencyDollar /> Total: $
                          {order.total_amount} {currency}
                        </span>
                        {order.delivery_price > 0 && (
                          <span>
                            <HiOutlineTruck /> Delivery: ${order.delivery_price}{" "}
                            {currency}
                          </span>
                        )}
                        <span>
                          <HiOutlineClock /> {formatDate(order.created_at)}
                        </span>
                      </div>

                      {order.status === "open" && (
                        <div className="up-order-time">
                          ⏳ {getTimeRemaining(order)}
                        </div>
                      )}

                      {order.status === "open" && (
                        <button
                          className="up-order-cancel"
                          onClick={() => dispatch(startCancelOrder(order.id))}
                        >
                          Cancelar Pedido
                        </button>
                      )}
                    </div>
                  ))}
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
