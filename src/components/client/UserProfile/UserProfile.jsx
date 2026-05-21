// components/client/UserProfile/UserProfile.jsx
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Swal from "sweetalert2";
import {
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineSave,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineX,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiOutlineRefresh,
} from "react-icons/hi";
import {
  startLoadMyOrders,
  startCancelOrder,
} from "../../../actions/ordersActions";
import { startLoadUserProfile } from "../../../actions/authActions";
import "./UserProfile.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const UserProfile = ({ onClose }) => {
  const dispatch = useDispatch();
  const orders = useSelector((state) => state.orders.orders);
  const appConfig = useSelector((state) => state.appConfig.config);
  const auth = useSelector((state) => state.auth);
  const currency = appConfig?.currency || "CUP";

  const [activeTab, setActiveTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // ✅ Estados para badge de pedidos no leídos
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [hasViewedOrders, setHasViewedOrders] = useState(false);

  // ✅ Estado para el formulario de edición (usando datos de auth)
  const [formData, setFormData] = useState({
    full_name: auth?.full_name || "",
    phone: auth?.phone || "",
    address: auth?.address || "",
    lat: auth?.lat || null,
    lng: auth?.lng || null,
  });

  // ✅ Calcular pedidos no leídos cuando cambian los pedidos
  useEffect(() => {
    if (orders.length > 0 && !hasViewedOrders) {
      // Obtener la última vez que el usuario vio sus pedidos
      const lastViewed = localStorage.getItem(
        `orders_last_viewed_${auth?.uid}`,
      );

      if (!lastViewed) {
        // Nunca ha visto sus pedidos, todos son nuevos
        setUnreadOrdersCount(orders.length);
      } else {
        // Contar pedidos creados después de la última vista
        const lastViewedDate = new Date(parseInt(lastViewed));
        const newOrders = orders.filter(
          (order) => new Date(order.created_at) > lastViewedDate,
        );
        setUnreadOrdersCount(newOrders.length);
      }
    }
  }, [orders, auth?.uid, hasViewedOrders]);

  // ✅ Marcar pedidos como vistos cuando se abre la pestaña
  useEffect(() => {
    if (activeTab === "orders" && orders.length > 0 && !hasViewedOrders) {
      // Guardar timestamp de última vista
      localStorage.setItem(`orders_last_viewed_${auth?.uid}`, Date.now());
      setHasViewedOrders(true);
      setUnreadOrdersCount(0);
    }
  }, [activeTab, orders.length, hasViewedOrders, auth?.uid]);

  // ✅ Cargar perfil desde el backend
  const loadProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoadingProfile(false);
      return;
    }

    try {
      console.log("🔄 Cargando perfil desde:", `${API_URL}/api/auth/profile`);
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { "x-token": token },
      });
      const data = await res.json();
      console.log("📦 Respuesta del perfil:", data);

      if (data.ok && data.user) {
        setFormData({
          full_name: data.user.full_name || "",
          phone: data.user.phone || "",
          address: data.user.address || "",
          lat: data.user.lat || null,
          lng: data.user.lng || null,
        });
      }
    } catch (err) {
      console.error("❌ Error en petición:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // ✅ Actualizar formData cuando auth cambie
  useEffect(() => {
    if (auth) {
      setFormData({
        full_name: auth.full_name || "",
        phone: auth.phone || "",
        address: auth.address || "",
        lat: auth.lat || null,
        lng: auth.lng || null,
      });
    }
  }, [auth]);

  // ✅ Cargar datos al abrir
  useEffect(() => {
    dispatch(startLoadUserProfile());
    dispatch(startLoadMyOrders());
    loadProfile();
  }, [dispatch]);

  // ✅ Función segura para formatear números
  const formatPrice = (value) => {
    if (value === null || value === undefined) return "0.00";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // ✅ Actualizar perfil
  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const userId = auth?.uid;

      console.log("🔄 Actualizando perfil:", {
        id: userId,
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
      });

      const res = await fetch(`${API_URL}/api/auth/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify({
          id: userId,
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          lat: formData.lat,
          lng: formData.lng,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setEditing(false);
        await loadProfile();
        dispatch(startLoadUserProfile());

        Swal.fire({
          icon: "success",
          title: "¡Perfil actualizado!",
          text: "Tus datos han sido guardados correctamente",
          confirmButtonColor: "#059669",
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg || "No se pudo actualizar el perfil",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err) {
      console.error("Error actualizando perfil:", err);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Obtener ubicación GPS
  const getGPSLocation = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      Swal.fire({
        icon: "error",
        title: "GPS no disponible",
        text: "Tu navegador no soporta geolocalización",
        confirmButtonColor: "#ef4444",
      });
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

          Swal.fire({
            icon: "success",
            title: "Ubicación obtenida",
            text: "Tu dirección ha sido actualizada",
            confirmButtonColor: "#059669",
            timer: 1500,
            timerProgressBar: true,
          });
        } catch (err) {
          setFormData((prev) => ({ ...prev, lat: latitude, lng: longitude }));
        }
        setGpsLoading(false);
      },
      (err) => {
        console.error("GPS Error:", err);
        Swal.fire({
          icon: "error",
          title: "Error de GPS",
          text: "No se pudo obtener tu ubicación. Verifica los permisos.",
          confirmButtonColor: "#ef4444",
        });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ✅ Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ Estado del pedido en español
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

  // ✅ Calcular tiempo restante estimado
  const getTimeRemaining = (order) => {
    if (order.status !== "open" && order.status !== "pending") return null;
    if (!order.created_at) return null;

    const created = new Date(order.created_at);
    const hours = order.estimated_completion_hours || 1;
    const estimated = new Date(created.getTime() + hours * 3600000);
    const now = new Date();
    const diff = estimated - now;

    if (diff <= 0) return "Tiempo cumplido";
    const hoursLeft = Math.floor(diff / 3600000);
    const minutesLeft = Math.floor((diff % 3600000) / 60000);
    return `${hoursLeft}h ${minutesLeft}min restantes`;
  };

  // ✅ Cancelar pedido con confirmación
  const handleCancelOrder = async (orderId) => {
    const result = await Swal.fire({
      title: "¿Cancelar pedido?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, mantener",
    });

    if (result.isConfirmed) {
      dispatch(startCancelOrder(orderId));
    }
  };

  // Mostrar loading mientras se cargan los datos
  if (isLoadingProfile && !auth?.uid) {
    return (
      <div
        className="user-profile-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="user-profile-modal">
          <div className="up-loading">
            <div className="up-spinner"></div>
            <p>Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="user-profile-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="user-profile-modal">
        {/* Header Fijo */}
        <div className="up-header">
          <button className="up-close" onClick={onClose}>
            <HiOutlineX />
          </button>
          <div className="up-avatar">
            <HiOutlineUser />
          </div>
          <h2 className="up-name">
            {formData.full_name || auth?.name || "Usuario"}
          </h2>
          <p className="up-role">
            {auth?.role === "admin" ? "Administrador" : "Cliente"}
          </p>
        </div>

        {/* Tabs Fijos - con badge de pedidos no leídos */}
        <div className="up-tabs">
          <button
            className={`up-tab ${activeTab === "profile" ? "up-tab--active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <HiOutlineUser /> Perfil
          </button>
          <button
            className={`up-tab ${activeTab === "orders" ? "up-tab--active" : ""}`}
            onClick={() => {
              setActiveTab("orders");
              // Al hacer clic, marcar como vistos si no lo estaban
              if (!hasViewedOrders && orders.length > 0) {
                localStorage.setItem(
                  `orders_last_viewed_${auth?.uid}`,
                  Date.now(),
                );
                setHasViewedOrders(true);
                setUnreadOrdersCount(0);
              }
            }}
          >
            <HiOutlineClipboardList /> Mis Pedidos
            {/* ✅ Badge solo se muestra si hay pedidos no leídos */}
            {unreadOrdersCount > 0 && (
              <span className="up-tab-badge">{unreadOrdersCount}</span>
            )}
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="up-content-wrapper">
          {activeTab === "profile" && (
            <div className="up-profile-section">
              <div className="up-field">
                <label>
                  <HiOutlineUser /> Nombre completo
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
                    placeholder="Tu nombre completo"
                  />
                ) : (
                  <span>{formData.full_name || "No especificado"}</span>
                )}
              </div>

              <div className="up-field">
                <label>
                  <HiOutlineMail /> Usuario
                </label>
                <span>{auth?.name || "—"}</span>
              </div>

              <div className="up-field">
                <label>
                  <HiOutlinePhone /> Teléfono
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Ej: +53 5XXXXXXXX"
                  />
                ) : (
                  <span>{formData.phone || "No especificado"}</span>
                )}
              </div>

              <div className="up-field">
                <label>
                  <HiOutlineLocationMarker /> Dirección de entrega
                </label>
                {editing ? (
                  <>
                    <textarea
                      value={formData.address || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Tu dirección completa"
                      rows="3"
                      style={{ resize: "vertical" }}
                    />
                    <button
                      className="up-gps-btn"
                      onClick={getGPSLocation}
                      disabled={gpsLoading}
                    >
                      {gpsLoading ? (
                        <>
                          <HiOutlineRefresh className="spinning" />{" "}
                          Obteniendo...
                        </>
                      ) : (
                        <>
                          <HiOutlineLocationMarker /> Usar mi ubicación actual
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <span>{formData.address || "No especificada"}</span>
                )}
              </div>

              {formData.lat && formData.lng && editing && (
                <div className="up-coords-info">
                  📍 Coordenadas: {formData.lat.toFixed(6)},{" "}
                  {formData.lng.toFixed(6)}
                </div>
              )}

              <div className="up-actions">
                {editing ? (
                  <>
                    <button
                      className="up-btn up-btn--save"
                      onClick={handleUpdateProfile}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <HiOutlineRefresh className="spinning" /> Guardando...
                        </>
                      ) : (
                        <>
                          <HiOutlineSave /> Guardar Cambios
                        </>
                      )}
                    </button>
                    <button
                      className="up-btn up-btn--cancel"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          full_name: auth?.full_name || "",
                          phone: auth?.phone || "",
                          address: auth?.address || "",
                          lat: auth?.lat || null,
                          lng: auth?.lng || null,
                        });
                      }}
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
              {!orders || orders.length === 0 ? (
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
                          {formatPrice(order.total_amount)} {currency}
                        </span>
                        {order.delivery_price > 0 && (
                          <span>
                            <HiOutlineTruck /> Delivery: $
                            {formatPrice(order.delivery_price)} {currency}
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

                      {(order.status === "open" ||
                        order.status === "pending") && (
                        <button
                          className="up-order-cancel"
                          onClick={() => handleCancelOrder(order.id)}
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
