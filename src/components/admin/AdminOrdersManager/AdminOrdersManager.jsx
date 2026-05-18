// components/admin/AdminOrdersManager/AdminOrdersManager.jsx
import { useState, useEffect, useCallback } from "react";
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
} from "react-icons/hi";
import "./AdminOrdersManager.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const AdminOrdersManager = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar pedidos
  const loadOrders = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterDate !== "all") params.append("fecha", filterDate);

      const res = await fetch(`${API_URL}/api/orders/admin/all?${params}`, {
        headers: { "x-token": token },
      });
      const data = await res.json();

      if (data.ok) {
        setOrders(data.pedidos || []);
      }
    } catch (err) {
      console.error("Error cargando pedidos:", err);
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus, filterDate]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Cambiar estado
  const handleChangeStatus = async (orderId, newStatus) => {
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
        loadOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.pedido);
        }
      }
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  };

  // Formatear fecha
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

  // Estados y colores
  const statusConfig = {
    open: { label: "Abierto", color: "#3b82f6", bg: "#dbeafe" },
    pending: { label: "En Proceso", color: "#f59e0b", bg: "#fef3c7" },
    completed: { label: "Completado", color: "#10b981", bg: "#d1fae5" },
    cancelled: { label: "Cancelado", color: "#ef4444", bg: "#fee2e2" },
  };

  // Filtrar por búsqueda
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      String(order.id).includes(search) ||
      (order.customer_name || "").toLowerCase().includes(search) ||
      (order.customer_phone || "").includes(search)
    );
  });

  // Contar por estado
  const counts = {
    all: orders.length,
    open: orders.filter((o) => o.status === "open").length,
    pending: orders.filter((o) => o.status === "pending").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return (
    <div className="admin-orders">
      {!selectedOrder ? (
        <>
          {/* Header */}
          <div className="ao-header">
            <h2 className="ao-title">
              <HiOutlineClipboardList /> Gestión de Pedidos
            </h2>
            <span className="ao-count">{orders.length} pedidos</span>
          </div>

          {/* Filtros */}
          <div className="ao-filters">
            <div className="ao-search">
              <HiOutlineSearch />
              <input
                type="text"
                placeholder="Buscar por #ID, nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="ao-filter-tabs">
              {Object.entries(counts).map(([key, count]) => (
                <button
                  key={key}
                  className={`ao-filter-tab ${filterStatus === key ? "active" : ""}`}
                  onClick={() => setFilterStatus(key)}
                >
                  {key === "all" ? "Todos" : statusConfig[key]?.label}
                  <span className="ao-filter-count">{count}</span>
                </button>
              ))}
            </div>

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

          {/* Lista de pedidos */}
          <div className="ao-list">
            {loading && orders.length === 0 ? (
              <div className="ao-loading">
                <div className="ao-spinner"></div>
                Cargando pedidos...
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
                return (
                  <div
                    key={order.id}
                    className="ao-card"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="ao-card-header">
                      <span className="ao-card-id">Pedido #{order.id}</span>
                      <span
                        className="ao-card-status"
                        style={{ background: config.bg, color: config.color }}
                      >
                        {config.label}
                      </span>
                    </div>

                    <div className="ao-card-body">
                      <div className="ao-card-info">
                        <span>
                          <HiOutlineUser /> {order.customer_name || "Cliente"}
                        </span>
                        <span>
                          <HiOutlinePhone /> {order.customer_phone || "—"}
                        </span>
                        <span>
                          <HiOutlineCalendar /> {formatDate(order.created_at)}
                        </span>
                      </div>
                      <div className="ao-card-amounts">
                        <span className="ao-card-total">
                          ${order.total_amount}
                        </span>
                        <span className="ao-card-items">
                          {(order.items || []).length} productos
                        </span>
                      </div>
                    </div>

                    <div className="ao-card-actions">
                      <button
                        className="ao-action-btn ao-action--view"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        <HiOutlineEye /> Ver
                      </button>
                      {order.status === "open" && (
                        <button
                          className="ao-action-btn ao-action--pending"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChangeStatus(order.id, "pending");
                          }}
                        >
                          <HiOutlineClock /> En Proceso
                        </button>
                      )}
                      {order.status === "pending" && (
                        <button
                          className="ao-action-btn ao-action--complete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChangeStatus(order.id, "completed");
                          }}
                        >
                          <HiOutlineCheck /> Completar
                        </button>
                      )}
                      {(order.status === "open" ||
                        order.status === "pending") && (
                        <button
                          className="ao-action-btn ao-action--cancel"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChangeStatus(order.id, "cancelled");
                          }}
                        >
                          <HiOutlineX /> Cancelar
                        </button>
                      )}
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
              {statusConfig[selectedOrder.status]?.label}
            </span>
          </div>

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
                <span>{selectedOrder.customer_address || "—"}</span>
              </div>
              <div className="ao-detail-field">
                <label>Fecha</label>
                <span>{formatDate(selectedOrder.created_at)}</span>
              </div>
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
                    handleChangeStatus(selectedOrder.id, "pending")
                  }
                >
                  <HiOutlineClock /> Marcar En Proceso
                </button>
                <button
                  className="ao-detail-btn ao-detail-btn--cancel"
                  onClick={() =>
                    handleChangeStatus(selectedOrder.id, "cancelled")
                  }
                >
                  <HiOutlineX /> Cancelar Pedido
                </button>
              </>
            )}
            {selectedOrder.status === "pending" && (
              <button
                className="ao-detail-btn ao-detail-btn--complete"
                onClick={() =>
                  handleChangeStatus(selectedOrder.id, "completed")
                }
              >
                <HiOutlineCheck /> Completar Pedido
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersManager;
