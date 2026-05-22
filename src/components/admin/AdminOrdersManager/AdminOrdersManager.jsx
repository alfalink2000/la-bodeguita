// components/admin/AdminOrdersManager/AdminOrdersManager.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  HiOutlineClipboardList,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineX,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineArrowLeft,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineChat,
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import Swal from "sweetalert2";
import "./AdminOrdersManager.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const AdminOrdersManager = ({ token, onOpenChatWithUser }) => {
  const [allOrders, setAllOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  // Cargar TODOS los pedidos
  const loadAllOrders = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDate !== "all") params.append("fecha", filterDate);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`${API_URL}/api/orders/admin/all?${params}`, {
        headers: { "x-token": token },
      });
      const data = await res.json();

      if (data.ok) {
        setAllOrders(data.pedidos || []);
      }
    } catch (err) {
      console.error("Error cargando pedidos:", err);
    } finally {
      setLoading(false);
    }
  }, [token, filterDate, searchTerm]);

  useEffect(() => {
    loadAllOrders();
    const interval = setInterval(loadAllOrders, 10000);
    return () => clearInterval(interval);
  }, [loadAllOrders]);

  // Pedidos filtrados
  const filteredOrders = useMemo(() => {
    let result = allOrders;

    if (filterStatus !== "all") {
      result = result.filter((order) => order.status === filterStatus);
    }

    return result;
  }, [allOrders, filterStatus]);

  // Contar por estado
  const counts = useMemo(
    () => ({
      all: allOrders.length,
      open: allOrders.filter((o) => o.status === "open").length,
      pending: allOrders.filter((o) => o.status === "pending").length,
      completed: allOrders.filter((o) => o.status === "completed").length,
      cancelled: allOrders.filter((o) => o.status === "cancelled").length,
      needsContact: allOrders.filter(
        (o) =>
          o.delivery_needs_manual_contact === true && o.status !== "cancelled",
      ).length,
    }),
    [allOrders],
  );

  const toggleCardExpand = (orderId) => {
    setExpandedCards((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Función mejorada para cambiar estado con confirmación
  const handleChangeStatus = async (orderId, newStatus, orderData = null) => {
    let confirmMessage = "";
    let confirmTitle = "";

    switch (newStatus) {
      case "pending":
        confirmTitle = "¿Marcar como 'En Proceso'?";
        confirmMessage =
          "El cliente recibirá una notificación de que su pedido está siendo preparado.";
        break;
      case "completed":
        confirmTitle = "¿Marcar como 'Completado'?";
        confirmMessage =
          "El cliente recibirá una notificación de que su pedido fue entregado.";
        break;
      case "cancelled":
        confirmTitle = "¿Cancelar pedido?";
        confirmMessage =
          "Esta acción no se puede deshacer. El cliente recibirá una notificación.";
        break;
      default:
        confirmTitle = "¿Cambiar estado?";
        confirmMessage = "¿Estás seguro de realizar esta acción?";
    }

    const result = await Swal.fire({
      title: confirmTitle,
      text: confirmMessage,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: newStatus === "cancelled" ? "#ef4444" : "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/api/orders/admin/status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (data.ok) {
        await loadAllOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.pedido);
        }

        Swal.fire({
          icon: "success",
          title: "¡Estado actualizado!",
          text: `Pedido ${newStatus === "pending" ? "en proceso" : newStatus}`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg || "No se pudo cambiar el estado",
        });
      }
    } catch (err) {
      console.error("Error cambiando estado:", err);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor",
      });
    }
  };

  // Función para abrir chat con el usuario
  const handleOpenChat = (userId, userName) => {
    if (onOpenChatWithUser) {
      onOpenChatWithUser(userId, userName);
    } else {
      Swal.fire({
        icon: "info",
        title: "Chat no disponible",
        text: "Ve a la sección de Chats para hablar con este cliente",
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusConfig = {
    open: { label: "Abierto", color: "#3b82f6", bg: "#dbeafe", icon: "🆕" },
    pending: {
      label: "En Proceso",
      color: "#f59e0b",
      bg: "#fef3c7",
      icon: "⏳",
    },
    completed: {
      label: "Completado",
      color: "#10b981",
      bg: "#d1fae5",
      icon: "✅",
    },
    cancelled: {
      label: "Cancelado",
      color: "#ef4444",
      bg: "#fee2e2",
      icon: "❌",
    },
  };

  const statusList = [
    { key: "all", label: "Todos", count: counts.all },
    { key: "open", label: "Abiertos", count: counts.open },
    { key: "pending", label: "En Proceso", count: counts.pending },
    { key: "completed", label: "Completados", count: counts.completed },
    { key: "cancelled", label: "Cancelados", count: counts.cancelled },
  ];

  return (
    <div className="admin-orders">
      {!selectedOrder ? (
        <>
          {/* Header */}
          <div className="ao-header">
            <h2 className="ao-title">
              <HiOutlineClipboardList /> Gestión de Pedidos
            </h2>
            <div className="ao-header-stats">
              <span className="ao-count">{allOrders.length} pedidos</span>
              {counts.needsContact > 0 && (
                <span className="ao-needs-contact-badge">
                  <HiOutlineExclamationCircle />
                  {counts.needsContact} requieren contacto
                </span>
              )}
            </div>
          </div>

          {/* Botón de filtros móvil */}
          <button
            className="ao-mobile-filters-btn"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <HiOutlineFilter />
            <span>Filtros</span>
            {showMobileFilters ? (
              <HiOutlineChevronUp />
            ) : (
              <HiOutlineChevronDown />
            )}
          </button>

          {/* Filtros */}
          <div
            className={`ao-filters ${showMobileFilters ? "ao-filters--mobile-open" : ""}`}
          >
            <div className="ao-search">
              <HiOutlineSearch />
              <input
                type="text"
                placeholder="Buscar por #ID, nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="ao-status-filters">
              <span className="ao-filter-label">Estado:</span>
              <div className="ao-filter-tabs">
                {statusList.map(({ key, label, count }) => (
                  <button
                    key={key}
                    className={`ao-filter-tab ${filterStatus === key ? "active" : ""}`}
                    onClick={() => setFilterStatus(key)}
                  >
                    {label}
                    <span className="ao-filter-count">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="ao-date-filters-wrapper">
              <span className="ao-filter-label">Fecha:</span>
              <div className="ao-date-filters">
                <button
                  className={`ao-date-btn ${filterDate === "all" ? "active" : ""}`}
                  onClick={() => setFilterDate("all")}
                >
                  Todas
                </button>
                <button
                  className={`ao-date-btn ${filterDate === "today" ? "active" : ""}`}
                  onClick={() => setFilterDate("today")}
                >
                  Hoy
                </button>
                <button
                  className={`ao-date-btn ${filterDate === "week" ? "active" : ""}`}
                  onClick={() => setFilterDate("week")}
                >
                  Semana
                </button>
                <button
                  className={`ao-date-btn ${filterDate === "month" ? "active" : ""}`}
                  onClick={() => setFilterDate("month")}
                >
                  Mes
                </button>
              </div>
            </div>
          </div>

          {/* Lista de pedidos */}
          <div className="ao-list">
            {loading && allOrders.length === 0 ? (
              <div className="ao-loading">
                <div className="ao-spinner"></div>
                <p>Cargando pedidos...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="ao-empty">
                <HiOutlineClipboardList className="ao-empty-icon" />
                <h3>No hay pedidos</h3>
                <p>Los pedidos de los clientes aparecerán aquí</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const config = statusConfig[order.status];
                const isExpanded = expandedCards[order.id];
                const needsManualContact =
                  order.delivery_needs_manual_contact === true;
                const wantsDelivery = order.wants_delivery === true;

                return (
                  <div
                    key={order.id}
                    className={`ao-card ${needsManualContact ? "ao-card--needs-contact" : ""} ${wantsDelivery && !needsManualContact ? "ao-card--has-delivery" : ""}`}
                  >
                    <div
                      className="ao-card-header"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="ao-card-header-left">
                        <span className="ao-card-id">Pedido #{order.id}</span>
                        <span
                          className="ao-card-status"
                          style={{ background: config.bg, color: config.color }}
                        >
                          {config.icon} {config.label}
                        </span>
                        {needsManualContact && (
                          <span className="ao-needs-contact-tag">
                            <HiOutlineExclamationCircle /> Requiere contacto
                          </span>
                        )}
                      </div>
                      <button
                        className="ao-card-expand-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCardExpand(order.id);
                        }}
                      >
                        {isExpanded ? (
                          <HiOutlineChevronUp />
                        ) : (
                          <HiOutlineChevronDown />
                        )}
                      </button>
                    </div>

                    {/* Información compacta siempre visible */}
                    <div className="ao-card-info-compact">
                      <span>
                        <HiOutlineUser /> {order.customer_name || "Cliente"}
                      </span>
                      <span>
                        <HiOutlineCalendar />{" "}
                        {formatDate(order.created_at).split(",")[0]}
                      </span>
                      <span className="ao-card-total-mobile">
                        ${order.total_amount}
                      </span>
                    </div>

                    {/* Contenido expandible */}
                    <div
                      className={`ao-card-expandable ${isExpanded ? "expanded" : ""}`}
                    >
                      <div className="ao-card-info-full">
                        <span>
                          <HiOutlinePhone /> {order.customer_phone || "—"}
                        </span>
                        <span>
                          <HiOutlineCurrencyDollar /> Total: $
                          {order.total_amount}
                        </span>
                        <span>
                          <HiOutlineClipboardList />{" "}
                          {(order.items || []).length} productos
                        </span>
                        {wantsDelivery && !needsManualContact && (
                          <span className="delivery-info-tag">
                            <HiOutlineTruck /> Delivery: $
                            {order.delivery_price || 0}
                            {/* ✅ CORREGIDO: usar distance_km */}(
                            {order.distance_km != null
                              ? `${order.distance_km} km`
                              : "distancia no calculada"}
                            )
                          </span>
                        )}
                        {wantsDelivery && needsManualContact && (
                          <span className="manual-contact-tag">
                            📞 Sin ubicación GPS - Contactar al cliente
                          </span>
                        )}
                        {!wantsDelivery && (
                          <span className="pickup-tag">
                            📦 Retiro en tienda
                          </span>
                        )}
                      </div>

                      <div className="ao-card-actions">
                        <button
                          className="ao-action-btn ao-action--view"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <HiOutlineEye /> Ver detalle
                        </button>

                        <button
                          className="ao-action-btn ao-action--chat"
                          onClick={() =>
                            handleOpenChat(order.user_id, order.customer_name)
                          }
                        >
                          <HiOutlineChat /> Chat
                        </button>

                        {order.status === "open" && (
                          <>
                            <button
                              className="ao-action-btn ao-action--pending"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangeStatus(order.id, "pending", order);
                              }}
                            >
                              <HiOutlineClock /> En Proceso
                            </button>
                            <button
                              className="ao-action-btn ao-action--cancel"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangeStatus(
                                  order.id,
                                  "cancelled",
                                  order,
                                );
                              }}
                            >
                              <HiOutlineX /> Cancelar
                            </button>
                          </>
                        )}
                        {order.status === "pending" && (
                          <>
                            <button
                              className="ao-action-btn ao-action--complete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangeStatus(
                                  order.id,
                                  "completed",
                                  order,
                                );
                              }}
                            >
                              <HiOutlineCheck /> Completar
                            </button>
                            <button
                              className="ao-action-btn ao-action--cancel"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangeStatus(
                                  order.id,
                                  "cancelled",
                                  order,
                                );
                              }}
                            >
                              <HiOutlineX /> Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Vista detalle de pedido */
        <div className="ao-detail">
          <div className="ao-detail-header">
            <button
              className="ao-back-btn"
              onClick={() => setSelectedOrder(null)}
            >
              <HiOutlineArrowLeft /> Volver
            </button>
            <h3>Pedido #{selectedOrder.id}</h3>
            <span
              className="ao-detail-status"
              style={{
                background: statusConfig[selectedOrder.status]?.bg,
                color: statusConfig[selectedOrder.status]?.color,
              }}
            >
              {statusConfig[selectedOrder.status]?.icon}{" "}
              {statusConfig[selectedOrder.status]?.label}
            </span>
          </div>

          {/* Alerta de contacto manual */}
          {selectedOrder.delivery_needs_manual_contact && (
            <div className="ao-alert ao-alert--warning">
              <HiOutlineExclamationCircle />
              <div>
                <strong>
                  ⚠️ Atención: Este pedido requiere contacto manual
                </strong>
                <p>
                  El cliente no tiene ubicación GPS registrada. Debes
                  contactarlo para coordinar el envío.
                </p>
              </div>
              <button
                className="ao-alert-btn"
                onClick={() =>
                  handleOpenChat(
                    selectedOrder.user_id,
                    selectedOrder.customer_name,
                  )
                }
              >
                <HiOutlineChat /> Abrir chat
              </button>
            </div>
          )}

          {/* Datos del cliente */}
          <div className="ao-detail-section">
            <h4>
              <HiOutlineUser /> Datos del Cliente
            </h4>
            <div className="ao-detail-grid">
              <div className="ao-detail-field">
                <label>Nombre</label>
                <span>{selectedOrder.customer_name || "—"}</span>
              </div>
              <div className="ao-detail-field">
                <label>Teléfono</label>
                <span>{selectedOrder.customer_phone || "—"}</span>
              </div>
              <div className="ao-detail-field">
                <label>Dirección</label>
                <span>
                  {selectedOrder.customer_address ? (
                    <>
                      {selectedOrder.customer_address}
                      {selectedOrder.distance_km != null && (
                        <small
                          style={{
                            display: "block",
                            color: "#10b981",
                            marginTop: "0.25rem",
                          }}
                        >
                          📍 Distancia: {selectedOrder.distance_km} km
                        </small>
                      )}
                    </>
                  ) : (
                    <span style={{ color: "#ef4444" }}>
                      — Sin dirección registrada
                    </span>
                  )}
                </span>
              </div>
              <div className="ao-detail-field">
                <label>Fecha</label>
                <span>{formatDate(selectedOrder.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Información de delivery */}
          <div className="ao-detail-section">
            <h4>
              <HiOutlineTruck /> Información de Entrega
            </h4>
            <div className="ao-delivery-info">
              <div className="ao-delivery-row">
                <span>Tipo de entrega:</span>
                <strong>
                  {selectedOrder.wants_delivery ? (
                    selectedOrder.delivery_needs_manual_contact ? (
                      <span style={{ color: "#f59e0b" }}>
                        📞 Delivery - Pendiente de contacto manual
                      </span>
                    ) : (
                      <span style={{ color: "#10b981" }}>
                        🚚 Delivery - Envío a domicilio
                      </span>
                    )
                  ) : (
                    <span style={{ color: "#3b82f6" }}>
                      📦 Retiro en tienda
                    </span>
                  )}
                </strong>
              </div>
              {selectedOrder.wants_delivery &&
                !selectedOrder.delivery_needs_manual_contact && (
                  <>
                    <div className="ao-delivery-row">
                      <span>Distancia:</span>
                      <strong>
                        {/* ✅ CORREGIDO: usar distance_km */}
                        {selectedOrder.distance_km != null
                          ? `${selectedOrder.distance_km} km`
                          : "No calculada"}
                      </strong>
                    </div>
                    <div className="ao-delivery-row">
                      <span>Costo de envío:</span>
                      <strong>${selectedOrder.delivery_price || 0}</strong>
                    </div>
                  </>
                )}
            </div>
          </div>

          {/* Productos */}
          <div className="ao-detail-section">
            <h4>
              <HiOutlineClipboardList /> Productos
            </h4>
            <div className="ao-detail-items">
              {(selectedOrder.items || []).map((item, i) => (
                <div key={i} className="ao-detail-item">
                  <span className="ao-item-name">{item.name}</span>
                  <span className="ao-item-qty">x{item.quantity}</span>
                  <span className="ao-item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="ao-detail-section">
            <h4>
              <HiOutlineCurrencyDollar /> Totales
            </h4>
            <div className="ao-detail-totals">
              <div className="ao-total-row">
                <span>Subtotal</span>
                <span>${selectedOrder.subtotal}</span>
              </div>
              <div className="ao-total-row">
                <span>
                  <HiOutlineTruck /> Delivery
                </span>
                <span>${selectedOrder.delivery_price || 0}</span>
              </div>
              <div className="ao-total-row ao-total-row--final">
                <span>Total</span>
                <span>${selectedOrder.total_amount}</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="ao-detail-actions">
            {selectedOrder.status === "open" && (
              <>
                <button
                  className="ao-detail-btn ao-detail-btn--pending"
                  onClick={() =>
                    handleChangeStatus(
                      selectedOrder.id,
                      "pending",
                      selectedOrder,
                    )
                  }
                >
                  <HiOutlineClock /> En Proceso
                </button>
                <button
                  className="ao-detail-btn ao-detail-btn--cancel"
                  onClick={() =>
                    handleChangeStatus(
                      selectedOrder.id,
                      "cancelled",
                      selectedOrder,
                    )
                  }
                >
                  <HiOutlineX /> Cancelar
                </button>
              </>
            )}
            {selectedOrder.status === "pending" && (
              <>
                <button
                  className="ao-detail-btn ao-detail-btn--complete"
                  onClick={() =>
                    handleChangeStatus(
                      selectedOrder.id,
                      "completed",
                      selectedOrder,
                    )
                  }
                >
                  <HiOutlineCheck /> Completar
                </button>
                <button
                  className="ao-detail-btn ao-detail-btn--cancel"
                  onClick={() =>
                    handleChangeStatus(
                      selectedOrder.id,
                      "cancelled",
                      selectedOrder,
                    )
                  }
                >
                  <HiOutlineX /> Cancelar
                </button>
              </>
            )}
            <button
              className="ao-detail-btn ao-detail-btn--chat"
              onClick={() =>
                handleOpenChat(
                  selectedOrder.user_id,
                  selectedOrder.customer_name,
                )
              }
            >
              <HiOutlineChat /> Hablar con cliente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersManager;
