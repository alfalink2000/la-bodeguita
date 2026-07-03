import { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const AdminOrdersManager = ({
  token,
  onOpenChatWithUser,
  onOrderStatusChange,
}) => {
  const [allOrders, setAllOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  const loadAllOrders = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDate !== "all") params.append("fecha", filterDate);
      const res = await fetch(`${API_URL}/api/orders/admin/all?${params}`, {
        headers: { "x-token": token },
      });
      const data = await res.json();
      if (data.ok) setAllOrders(data.pedidos || []);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
    } finally {
      setLoading(false);
    }
  }, [token, filterDate]);

  const refreshOrdersAndNotify = useCallback(async () => {
    await loadAllOrders();
    if (onOrderStatusChange) await onOrderStatusChange();
  }, [loadAllOrders, onOrderStatusChange]);

  useEffect(() => {
    loadAllOrders();
    const interval = setInterval(loadAllOrders, 10000);
    return () => clearInterval(interval);
  }, [loadAllOrders]);

  const filteredOrders = useMemo(() => {
    let result = allOrders;
    if (filterStatus !== "all")
      result = result.filter((order) => order.status === filterStatus);
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      const searchNumber = parseInt(searchTerm);
      const isNumberSearch = !isNaN(searchNumber) && searchTerm.trim() !== "";
      result = result.filter((order) => {
        if (isNumberSearch) return order.id === searchNumber;
        const customerName = (order.customer_name || "").toLowerCase();
        const customerPhone = (order.customer_phone || "").toLowerCase();
        return customerName.includes(searchLower) || customerPhone.includes(searchLower);
      });
    }
    return result;
  }, [allOrders, filterStatus, searchTerm]);

  const counts = useMemo(() => ({
    all: allOrders.length,
    open: allOrders.filter((o) => o.status === "open").length,
    pending: allOrders.filter((o) => o.status === "pending").length,
    completed: allOrders.filter((o) => o.status === "completed").length,
    cancelled: allOrders.filter((o) => o.status === "cancelled").length,
    needsContact: allOrders.filter(
      (o) => o.delivery_needs_manual_contact === true && o.status !== "cancelled" && o.status !== "completed",
    ).length,
  }), [allOrders]);

  const toggleCardExpand = (orderId) =>
    setExpandedCards((prev) => ({ ...prev, [orderId]: !prev[orderId] }));

  const handleChangeStatus = async (orderId, newStatus) => {
    const confirmMessage = {
      pending: "El cliente recibirá una notificación de que su pedido está siendo preparado.",
      completed: "El cliente recibirá una notificación de que su pedido fue entregado.",
      cancelled: "Esta acción no se puede deshacer.",
    };
    const result = await Swal.fire({
      title: newStatus === "pending" ? "¿Marcar como 'En Proceso'?" : newStatus === "completed" ? "¿Marcar como 'Completado'?" : "¿Cancelar pedido?",
      text: confirmMessage[newStatus],
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: newStatus === "cancelled" ? "var(--color-error)" : "var(--color-primary)",
      cancelButtonColor: "var(--color-on-surface-variant)",
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API_URL}/api/orders/admin/status/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-token": token },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        await refreshOrdersAndNotify();
        window.dispatchEvent(new CustomEvent("admin:refresh-chats"));
        if (selectedOrder?.id === orderId)
          setSelectedOrder(allOrders.find((o) => o.id === orderId) || null);
        Swal.fire({ icon: "success", title: "¡Estado actualizado!", text: `Pedido ${newStatus === "pending" ? "en proceso" : newStatus}`, timer: 2000, showConfirmButton: false });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: data.msg || "No se pudo cambiar el estado" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error de conexión", text: "No se pudo conectar con el servidor" });
    }
  };

  const handleOpenChat = (userId, userName) => {
    if (onOpenChatWithUser) onOpenChatWithUser(userId, userName);
    else Swal.fire({ icon: "info", title: "Chat no disponible", text: "Ve a la sección de Chats para hablar con este cliente" });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const statusConfig = {
    open: { label: "Abierto", icon: "fiber_new" },
    pending: { label: "En Proceso", icon: "hourglass_bottom" },
    completed: { label: "Completado", icon: "check_circle" },
    cancelled: { label: "Cancelado", icon: "cancel" },
  };

  const statusList = [
    { key: "all", label: "Todos", count: counts.all },
    { key: "open", label: "Abiertos", count: counts.open },
    { key: "pending", label: "En Proceso", count: counts.pending },
    { key: "completed", label: "Completados", count: counts.completed },
    { key: "cancelled", label: "Cancelados", count: counts.cancelled },
  ];

  if (selectedOrder) {
    const statusKey = selectedOrder.status || "open";
    return (
      <div className="admin-order-detail">
        <div className="admin-order-detail__header">
          <button className="admin-order-detail__back" onClick={() => setSelectedOrder(null)}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h3 className="admin-order-detail__id">Pedido #{selectedOrder.id}</h3>
          <span className={"admin-order-status admin-order-status--" + statusKey}>
            <span className="material-symbols-outlined">{statusConfig[statusKey]?.icon}</span>
            {statusConfig[statusKey]?.label}
          </span>
        </div>

        {selectedOrder.delivery_needs_manual_contact && (
          <div className="admin-alert admin-alert--warning">
            <span className="material-symbols-outlined admin-alert__icon">warning</span>
            <div className="admin-alert__content">
              <strong className="admin-alert__title">Atención: Este pedido requiere contacto manual</strong>
              <p className="admin-alert__text">El cliente no tiene ubicación GPS registrada. Debes contactarlo para coordinar el envío.</p>
            </div>
            <button
              className="admin-btn admin-btn--sm"
              style={{ backgroundColor: "var(--color-secondary)", color: "var(--color-on-secondary)" }}
              onClick={() => handleOpenChat(selectedOrder.user_id, selectedOrder.customer_name)}
            >
              <span className="material-symbols-outlined admin-btn__icon admin-btn__icon--sm">chat</span>
              Abrir chat
            </button>
          </div>
        )}

        {/* Customer info */}
        <div className="admin-order-detail__section">
          <h4 className="admin-order-detail__section-title">
            <span className="material-symbols-outlined">person</span>
            Datos del Cliente
          </h4>
          <div className="admin-order-detail__grid">
            <div>
              <label className="admin-order-detail__field-label">Nombre</label>
              <p className="admin-order-detail__field-value">{selectedOrder.customer_name || "—"}</p>
            </div>
            <div>
              <label className="admin-order-detail__field-label">Teléfono</label>
              <p className="admin-order-detail__field-value">{selectedOrder.customer_phone || "—"}</p>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="admin-order-detail__field-label">Dirección</label>
              <p className="admin-order-detail__field-value">
                {selectedOrder.customer_address ? (
                  <>
                    {selectedOrder.customer_address}
                    {selectedOrder.distance_km != null && (
                      <small style={{ display: "block", fontSize: "var(--text-label-sm)", color: "var(--color-primary)", marginTop: "4px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "12px", verticalAlign: "middle" }}>location_on</span>
                        {" "}Distancia: {selectedOrder.distance_km} km
                      </small>
                    )}
                  </>
                ) : (
                  <span style={{ color: "var(--color-error)" }}>— Sin dirección registrada</span>
                )}
              </p>
            </div>
            <div>
              <label className="admin-order-detail__field-label">Fecha</label>
              <p className="admin-order-detail__field-value">{formatDate(selectedOrder.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="admin-order-detail__section">
          <h4 className="admin-order-detail__section-title">
            <span className="material-symbols-outlined">local_shipping</span>
            Información de Entrega
          </h4>
          <div className="admin-order-detail__totals">
            <div className="admin-order-detail__total-row">
              <span className="admin-order-detail__total-label">Tipo de entrega:</span>
              <strong className="admin-order-detail__total-value">
                {selectedOrder.wants_delivery ? (
                  selectedOrder.delivery_needs_manual_contact ? (
                    <span style={{ color: "var(--color-secondary)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "14px", verticalAlign: "middle" }}>phone_in_talk</span>
                      {" "}Delivery - Pendiente de contacto manual
                    </span>
                  ) : (
                    <span style={{ color: "var(--color-primary)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "14px", verticalAlign: "middle" }}>local_shipping</span>
                      {" "}Delivery - Envío a domicilio
                    </span>
                  )
                ) : (
                  <span style={{ color: "var(--color-primary)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px", verticalAlign: "middle" }}>inventory</span>
                    {" "}Retiro en tienda
                  </span>
                )}
              </strong>
            </div>
            {selectedOrder.wants_delivery && !selectedOrder.delivery_needs_manual_contact && (
              <>
                <div className="admin-order-detail__total-row">
                  <span className="admin-order-detail__total-label">Distancia:</span>
                  <strong className="admin-order-detail__total-value">{selectedOrder.distance_km != null ? `${selectedOrder.distance_km} km` : "No calculada"}</strong>
                </div>
                <div className="admin-order-detail__total-row">
                  <span className="admin-order-detail__total-label">Costo de envío:</span>
                  <strong className="admin-order-detail__total-value">${selectedOrder.delivery_price || 0}</strong>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="admin-order-detail__section">
          <h4 className="admin-order-detail__section-title">
            <span className="material-symbols-outlined">orders</span>
            Productos
          </h4>
          <div className="admin-order-detail__items">
            {(selectedOrder.items || []).map((item, i) => (
              <div key={i} className="admin-order-detail__item">
                <span className="admin-order-detail__item-name">{item.name}</span>
                <div className="admin-order-detail__item-details">
                  <span className="admin-order-detail__item-qty">x{item.quantity}</span>
                  <span className="admin-order-detail__item-total">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="admin-order-detail__section">
          <h4 className="admin-order-detail__section-title">
            <span className="material-symbols-outlined">payments</span>
            Totales
          </h4>
          <div className="admin-order-detail__totals">
            <div className="admin-order-detail__total-row">
              <span className="admin-order-detail__total-label">Subtotal</span>
              <span className="admin-order-detail__total-value">${selectedOrder.subtotal}</span>
            </div>
            <div className="admin-order-detail__total-row">
              <span className="admin-order-detail__total-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>local_shipping</span>
                Delivery
              </span>
              <span className="admin-order-detail__total-value">${selectedOrder.delivery_price || 0}</span>
            </div>
            <div className="admin-order-detail__total-row admin-order-detail__total-row--grand" style={{ borderTop: "1px solid var(--color-outline-variant)", paddingTop: "8px" }}>
              <span className="admin-order-detail__total-label">Total</span>
              <span className="admin-order-detail__total-value">${selectedOrder.total_amount}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="admin-order-detail__actions">
          {selectedOrder.status === "open" && (
            <>
              <button
                className="admin-btn admin-btn--primary"
                onClick={() => handleChangeStatus(selectedOrder.id, "pending")}
              >
                <span className="material-symbols-outlined admin-btn__icon">schedule</span>
                En Proceso
              </button>
              <button
                className="admin-btn admin-btn--danger"
                onClick={() => handleChangeStatus(selectedOrder.id, "cancelled")}
              >
                <span className="material-symbols-outlined admin-btn__icon">close</span>
                Cancelar
              </button>
            </>
          )}
          {selectedOrder.status === "pending" && (
            <>
              <button
                className="admin-btn admin-btn--primary"
                onClick={() => handleChangeStatus(selectedOrder.id, "completed")}
              >
                <span className="material-symbols-outlined admin-btn__icon">check</span>
                Completar
              </button>
              <button
                className="admin-btn admin-btn--danger"
                onClick={() => handleChangeStatus(selectedOrder.id, "cancelled")}
              >
                <span className="material-symbols-outlined admin-btn__icon">close</span>
                Cancelar
              </button>
            </>
          )}
          <button
            className="admin-btn admin-btn--secondary"
            onClick={() => handleOpenChat(selectedOrder.user_id, selectedOrder.customer_name)}
          >
            <span className="material-symbols-outlined admin-btn__icon">chat</span>
            Hablar con cliente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div className="admin-page-header" style={{ padding: "16px", borderBottom: "1px solid var(--color-outline-variant)", backgroundColor: "var(--color-surface-bright)", margin: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <h2 className="admin-page-header__title">
            <span className="material-symbols-outlined">orders</span>
            Gestión de Pedidos
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="admin-page-header__subtitle">{allOrders.length} pedidos</span>
            {counts.needsContact > 0 && (
              <span className="admin-badge admin-badge--warning" style={{ gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>warning</span>
                {counts.needsContact} requieren contacto
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters toggle */}
      <button
        className="admin-mobile-filter-btn"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>filter_alt</span>
        <span className="admin-mobile-filter-btn__label">Filtros</span>
        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{showMobileFilters ? "expand_less" : "expand_more"}</span>
      </button>

      {/* Filters */}
      <div className={"admin-mobile-filter-body" + (showMobileFilters ? " admin-mobile-filter-body--open" : "")} style={{ padding: "16px", borderBottom: "1px solid var(--color-outline-variant)", backgroundColor: "var(--color-surface-bright)" }}>
        <div className="admin-input-wrapper">
          <span className="material-symbols-outlined admin-input-wrapper__icon">search</span>
          <input
            type="text"
            className="admin-input"
            placeholder="Buscar por #ID (ej: 1, 2, 3) o por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="admin-input-wrapper__clear" onClick={() => setSearchTerm("")}>
              <span className="material-symbols-outlined admin-input-wrapper__clear-icon">close</span>
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="admin-filter-group">
          <span className="admin-filter-group__label">Estado:</span>
          <div className="admin-pills">
            {statusList.map(({ key, label, count }) => (
              <button
                key={key}
                className={"admin-pill" + (filterStatus === key ? " admin-pill--active" : "")}
                onClick={() => setFilterStatus(key)}
              >
                {label} <span className="admin-pill__count">({count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date filter */}
        <div className="admin-filter-group">
          <span className="admin-filter-group__label">Fecha:</span>
          <div className="admin-pills">
            {[
              { key: "all", label: "Todas" },
              { key: "today", label: "Hoy" },
              { key: "week", label: "Semana" },
              { key: "month", label: "Mes" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={"admin-pill" + (filterDate === key ? " admin-pill--active" : "")}
                onClick={() => setFilterDate(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search results info */}
      {searchTerm && (
        <div className="admin-results-info" style={{ padding: "8px 16px", backgroundColor: "color-mix(in srgb, var(--color-surface-container) 50%, transparent)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>search</span>
            Resultados para: <strong>"{searchTerm}"</strong>
          </span>
          <span style={{ marginLeft: "auto" }}>{filteredOrders.length} pedido{filteredOrders.length !== 1 ? "s" : ""} encontrado{filteredOrders.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Orders list */}
      <div className="ao-list" style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading && allOrders.length === 0 ? (
          <div className="admin-loading">
            <div style={{ textAlign: "center" }}>
              <div className="admin-spinner" style={{ margin: "0 auto 12px" }} />
              <p className="admin-loading__text">Cargando pedidos...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-empty">
            <span className="material-symbols-outlined admin-empty__icon">orders</span>
            <h3 className="admin-empty__title">No hay pedidos</h3>
            <p className="admin-empty__text">
              {searchTerm ? `No se encontraron pedidos que coincidan con "${searchTerm}"` : "Los pedidos de los clientes aparecerán aquí"}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const config = statusConfig[order.status];
            const isExpanded = expandedCards[order.id];
            const needsManualContact = order.delivery_needs_manual_contact === true;
            const wantsDelivery = order.wants_delivery === true;
            const borderColor = needsManualContact ? "var(--color-secondary)" : wantsDelivery && !needsManualContact ? "var(--color-primary)" : "var(--color-outline-variant)";
            return (
              <div
                key={order.id}
                className="admin-mobile-card"
                style={{ borderColor }}
              >
                {/* Card header */}
                <div className="admin-mobile-card__header" onClick={() => setSelectedOrder(order)}>
                  <div className="admin-mobile-card__title">
                    <span className="admin-mobile-card__name">Pedido #{order.id}</span>
                    <span className={"admin-order-status admin-order-status--" + order.status}>
                      <span className="material-symbols-outlined">{config.icon}</span>
                      {config.label}
                    </span>
                    {needsManualContact && (
                      <span className="admin-badge admin-badge--warning" style={{ gap: "8px", padding: "2px 8px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>warning</span>
                        Requiere contacto
                      </span>
                    )}
                  </div>
                  <button
                    className="admin-btn admin-btn--icon admin-btn--ghost"
                    style={{ padding: "4px", minWidth: "32px", minHeight: "32px" }}
                    onClick={(e) => { e.stopPropagation(); toggleCardExpand(order.id); }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{isExpanded ? "expand_less" : "expand_more"}</span>
                  </button>
                </div>

                <div className="admin-mobile-card__meta" style={{ padding: "0 16px 12px", marginTop: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>person</span>
                    {order.customer_name || "Cliente"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>calendar_today</span>
                    {formatDate(order.created_at).split(",")[0]}
                  </span>
                  <span className="admin-mobile-card__detail-value" style={{ fontWeight: "var(--text-label-md--font-weight)" }}>${order.total_amount}</span>
                </div>

                {/* Expanded info */}
                {isExpanded && (
                  <div className="admin-mobile-card__body">
                    <div className="admin-mobile-card__details">
                      <div className="admin-mobile-card__detail">
                        <span className="admin-mobile-card__detail-label">
                          <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>phone</span>
                          Teléfono
                        </span>
                        <span className="admin-mobile-card__detail-value">{order.customer_phone || "—"}</span>
                      </div>
                      <div className="admin-mobile-card__detail">
                        <span className="admin-mobile-card__detail-label">
                          <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>payments</span>
                          Total
                        </span>
                        <span className="admin-mobile-card__detail-value">${order.total_amount}</span>
                      </div>
                      <div className="admin-mobile-card__detail">
                        <span className="admin-mobile-card__detail-label">
                          <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>orders</span>
                          Productos
                        </span>
                        <span className="admin-mobile-card__detail-value">{(order.items || []).length} productos</span>
                      </div>
                      {wantsDelivery && !needsManualContact && (
                        <div className="admin-mobile-card__detail" style={{ color: "var(--color-primary)" }}>
                          <span className="admin-mobile-card__detail-label" style={{ color: "inherit" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>local_shipping</span>
                            Delivery
                          </span>
                          <span className="admin-mobile-card__detail-value" style={{ color: "inherit" }}>${order.delivery_price || 0} ({order.distance_km != null ? `${order.distance_km} km` : "distancia no calculada"})</span>
                        </div>
                      )}
                      {wantsDelivery && needsManualContact && (
                        <div className="admin-mobile-card__detail">
                          <span className="admin-mobile-card__detail-label" style={{ color: "var(--color-secondary)" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>phone_in_talk</span>
                            Sin ubicación GPS - Contactar al cliente
                          </span>
                        </div>
                      )}
                      {!wantsDelivery && (
                        <div className="admin-mobile-card__detail">
                          <span className="admin-mobile-card__detail-label" style={{ color: "var(--color-primary)" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>inventory</span>
                            Retiro en tienda
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="admin-mobile-card__actions">
                      <button className="admin-btn admin-btn--sm admin-btn--secondary" onClick={() => setSelectedOrder(order)}>
                        <span className="material-symbols-outlined admin-btn__icon admin-btn__icon--sm">visibility</span>
                        Ver detalle
                      </button>
                      <button className="admin-btn admin-btn--sm admin-btn--secondary" onClick={() => handleOpenChat(order.user_id, order.customer_name)}>
                        <span className="material-symbols-outlined admin-btn__icon admin-btn__icon--sm">chat</span>
                        Chat
                      </button>
                      {order.status === "open" && (
                        <>
                          <button className="admin-btn admin-btn--sm admin-btn--primary" onClick={(e) => { e.stopPropagation(); handleChangeStatus(order.id, "pending"); }}>
                            <span className="material-symbols-outlined admin-btn__icon admin-btn__icon--sm">schedule</span>
                            En Proceso
                          </button>
                          <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={(e) => { e.stopPropagation(); handleChangeStatus(order.id, "cancelled"); }}>
                            <span className="material-symbols-outlined admin-btn__icon admin-btn__icon--sm">close</span>
                            Cancelar
                          </button>
                        </>
                      )}
                      {order.status === "pending" && (
                        <>
                          <button className="admin-btn admin-btn--sm admin-btn--primary" onClick={(e) => { e.stopPropagation(); handleChangeStatus(order.id, "completed"); }}>
                            <span className="material-symbols-outlined admin-btn__icon admin-btn__icon--sm">check</span>
                            Completar
                          </button>
                          <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={(e) => { e.stopPropagation(); handleChangeStatus(order.id, "cancelled"); }}>
                            <span className="material-symbols-outlined admin-btn__icon admin-btn__icon--sm">close</span>
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminOrdersManager;
