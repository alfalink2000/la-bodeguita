import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import {
  updateAdminUser,
  toggleUserStatus,
  deleteAdminUser,
  setActiveAdminUser,
} from "../../../actions/adminUsersActions";
import AdminUserForm from "../AdminUserForm/AdminUserForm";

const AdminUsersManager = ({ users = [] }) => {
  const dispatch = useDispatch();
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  const adminUsers = useMemo(
    () => users.filter((u) => u.role === "admin"),
    [users],
  );
  const customerUsers = useMemo(
    () => users.filter((u) => u.role === "customer" || u.role === "cliente"),
    [users],
  );

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: adminUsers.length,
      customers: customerUsers.length,
      activeAdmins: adminUsers.filter((u) => u.is_active).length,
      activeCustomers: customerUsers.filter((u) => u.is_active).length,
      activeTotal: users.filter((u) => u.is_active).length,
      inactiveTotal: users.filter((u) => !u.is_active).length,
      isLastAdmin: adminUsers.filter((u) => u.is_active).length <= 1,
      isLastUser: users.length <= 1,
    }),
    [users, adminUsers, customerUsers],
  );

  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (roleFilter === "admin") {
      result = result.filter((u) => u.role === "admin");
    } else if (roleFilter === "customer") {
      result = result.filter(
        (u) => u.role === "customer" || u.role === "cliente",
      );
    }
    if (statusFilter === "active") {
      result = result.filter((u) => u.is_active);
    } else if (statusFilter === "inactive") {
      result = result.filter((u) => !u.is_active);
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          (u.username || "").toLowerCase().includes(search) ||
          (u.email || "").toLowerCase().includes(search) ||
          (u.full_name || "").toLowerCase().includes(search),
      );
    }
    return result;
  }, [users, roleFilter, statusFilter, searchTerm]);

  const toggleExpand = (userId) => {
    setExpandedCards((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowEditForm(true);
    dispatch(setActiveAdminUser(user));
  };

  const handleToggleStatus = (user) => {
    if (user.role === "admin" && user.is_active && stats.activeAdmins <= 1) {
      Swal.fire({
        icon: "error",
        title: "Acción no permitida",
        text: "No se puede desactivar al último administrador activo. Debe existir al menos un administrador para gestionar el sistema.",
        confirmButtonColor: "var(--color-error)",
      });
      return;
    }
    const actionText = user.is_active ? "desactivar" : "activar";
    Swal.fire({
      title: `¿${actionText === "desactivar" ? "Desactivar" : "Activar"} usuario?`,
      text: `¿Estás seguro de que quieres ${actionText} a "${user.username}"?${user.is_active ? " No podrá acceder al sistema." : ""}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: user.is_active ? "var(--color-secondary)" : "var(--color-primary)",
      cancelButtonColor: "var(--color-on-surface-variant)",
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(toggleUserStatus(user.id, user.is_active));
      }
    });
  };

  const handleDelete = (user) => {
    if (user.role === "admin" && stats.admins <= 1) {
      Swal.fire({
        icon: "error",
        title: "Acción no permitida",
        text: "No se puede eliminar al único administrador. Debe existir al menos un administrador en el sistema.",
        confirmButtonColor: "var(--color-error)",
      });
      return;
    }
    if (stats.isLastUser) {
      Swal.fire({
        icon: "error",
        title: "Acción no permitida",
        text: "No se puede eliminar el último usuario del sistema.",
        confirmButtonColor: "var(--color-error)",
      });
      return;
    }
    Swal.fire({
      title: "¿Eliminar usuario?",
      html: `
        <p>¿Estás seguro de que quieres eliminar a <strong>"${user.username}"</strong>?</p>
        <p style="color: var(--color-error); font-size: 0.85rem;">Esta acción no se puede deshacer.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--color-error)",
      cancelButtonColor: "var(--color-on-surface-variant)",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteAdminUser(user.id));
      }
    });
  };

  const handleSubmit = async (userData) => {
    try {
      console.log("Enviando datos del formulario:", userData);
      const result = await dispatch(updateAdminUser(userData));
      if (result) {
        setShowEditForm(false);
        setEditingUser(null);
      }
    } catch (error) {
      console.error("Error en submit:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar el usuario",
      });
    }
  };

  const handleCancel = () => {
    setShowEditForm(false);
    setEditingUser(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters =
    searchTerm || roleFilter !== "all" || statusFilter !== "all";

  return (
    <div>
      {/* Stats */}
      <div className="admin-stat-grid">
        <div className="admin-stat">
          <span className="material-symbols-outlined admin-stat__icon">people</span>
          <div>
            <p className="admin-stat__value">{stats.total}</p>
            <p className="admin-stat__label">Total Usuarios</p>
          </div>
        </div>
        <div className="admin-stat">
          <span className="material-symbols-outlined admin-stat__icon">admin_panel</span>
          <div>
            <p className="admin-stat__value">{stats.admins}</p>
            <p className="admin-stat__label">Administradores</p>
            <p className="admin-stat__label">{stats.activeAdmins} activo{stats.activeAdmins !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="admin-stat">
          <span className="material-symbols-outlined admin-stat__icon">person</span>
          <div>
            <p className="admin-stat__value">{stats.customers}</p>
            <p className="admin-stat__label">Clientes</p>
            <p className="admin-stat__label">{stats.activeCustomers} activo{stats.activeCustomers !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="admin-stat">
          <span className="material-symbols-outlined admin-stat__icon">visibility_off</span>
          <div>
            <p className="admin-stat__value">{stats.inactiveTotal}</p>
            <p className="admin-stat__label">Inactivos</p>
          </div>
        </div>
      </div>

      {/* Last admin alert */}
      {stats.isLastAdmin && stats.activeAdmins === 1 && (
        <div className="admin-alert admin-alert--info">
          <span className="material-symbols-outlined admin-alert__icon">admin_panel</span>
          <div className="admin-alert__content">
            <strong className="admin-alert__title">Administrador único</strong>
            <p className="admin-alert__text">Solo existe un administrador activo en el sistema. No puede ser desactivado ni eliminado por seguridad.</p>
          </div>
        </div>
      )}

      {/* Mobile filters button */}
      <button
        className="admin-mobile-filter-btn"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <span className="material-symbols-outlined">filter_alt</span>
        <span className="admin-mobile-filter-btn__label">Filtros {hasActiveFilters && "(Activos)"}</span>
        <span className="material-symbols-outlined">
          {showMobileFilters ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Filters */}
      <div className={`admin-mobile-filter-body ${showMobileFilters ? "admin-mobile-filter-body--open" : ""}`}>
        {/* Search */}
        <div className="admin-input-wrapper">
          <span className="material-symbols-outlined admin-input-wrapper__icon">search</span>
          <input
            type="text"
            placeholder="Buscar por nombre, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input"
          />
          {searchTerm && (
            <button
              className="admin-input-wrapper__clear"
              onClick={() => setSearchTerm("")}
              aria-label="Limpiar búsqueda"
            >
              <span className="material-symbols-outlined admin-input-wrapper__clear-icon">close</span>
            </button>
          )}
        </div>

        {/* Role filter */}
        <div className="admin-filter-group">
          <span className="admin-filter-group__label">Tipo:</span>
          <div className="admin-pills">
            <button
              className={`admin-pill ${roleFilter === "all" ? "admin-pill--active" : ""}`}
              onClick={() => setRoleFilter("all")}
            >
              Todos
            </button>
            <button
              className={`admin-pill ${roleFilter === "admin" ? "admin-pill--active" : ""}`}
              onClick={() => setRoleFilter("admin")}
            >
              <span className="material-symbols-outlined">admin_panel</span>
              Admin<span className="admin-pill__count">({stats.admins})</span>
            </button>
            <button
              className={`admin-pill ${roleFilter === "customer" ? "admin-pill--active" : ""}`}
              onClick={() => setRoleFilter("customer")}
            >
              <span className="material-symbols-outlined">person</span>
              Clientes<span className="admin-pill__count">({stats.customers})</span>
            </button>
          </div>
        </div>

        {/* Status filter */}
        <div className="admin-filter-group">
          <span className="admin-filter-group__label">Estado:</span>
          <div className="admin-pills">
            <button
              className={`admin-pill ${statusFilter === "all" ? "admin-pill--active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              Todos
            </button>
            <button
              className={`admin-pill ${statusFilter === "active" ? "admin-pill--active" : ""}`}
              onClick={() => setStatusFilter("active")}
            >
              Activos<span className="admin-pill__count">({stats.activeTotal})</span>
            </button>
            <button
              className={`admin-pill ${statusFilter === "inactive" ? "admin-pill--active" : ""}`}
              onClick={() => setStatusFilter("inactive")}
            >
              Inactivos<span className="admin-pill__count">({stats.inactiveTotal})</span>
            </button>
          </div>
        </div>

        {hasActiveFilters && (
          <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={clearFilters}>
            <span className="material-symbols-outlined admin-btn__icon--sm">refresh</span>
            Limpiar todos los filtros
          </button>
        )}
      </div>

      {/* Results info */}
      <div className="admin-results-info">
        <div className="admin-results-info__tags">
          <span>
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </span>
          {roleFilter !== "all" && (
            <span className="admin-results-info__tag">
              {roleFilter === "admin" ? "Administradores" : "Clientes"}
            </span>
          )}
          {statusFilter !== "all" && (
            <span className="admin-results-info__tag">
              {statusFilter === "active" ? "Activos" : "Inactivos"}
            </span>
          )}
          {searchTerm && (
            <span className="admin-results-info__tag">"{searchTerm}"</span>
          )}
        </div>
      </div>

      {/* User list */}
      {filteredUsers.length === 0 ? (
        <div className="admin-empty">
          <span className="material-symbols-outlined admin-empty__icon">people</span>
          <h3 className="admin-empty__title">No se encontraron usuarios</h3>
          <p className="admin-empty__text">Intenta ajustar los filtros de búsqueda</p>
          {hasActiveFilters && (
            <button className="admin-btn admin-btn--primary" onClick={clearFilters}>
              <span className="material-symbols-outlined admin-btn__icon">refresh</span>
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="admin-hide-mobile">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-table__th">Usuario</th>
                  <th className="admin-table__th">Email</th>
                  <th className="admin-table__th">Rol</th>
                  <th className="admin-table__th">Estado</th>
                  <th className="admin-table__th">Fecha</th>
                  <th className="admin-table__th">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isProtected = user.role === "admin" && user.is_active && stats.activeAdmins <= 1;
                  return (
                    <tr key={user.id} className={`admin-table__row ${!user.is_active ? "admin-table__row--muted" : ""}`}>
                      <td className="admin-table__td">
                        <div className="admin-mobile-card__header" style={{ padding: 0, cursor: "default" }}>
                          <span className="material-symbols-outlined admin-mobile-card__avatar">
                            {user.role === "admin" ? "admin_panel" : "person"}
                          </span>
                          <div className="admin-mobile-card__info">
                            <div className="admin-mobile-card__title">
                              <span className="admin-mobile-card__name">
                                {user.full_name || user.username}
                              </span>
                              {isProtected && (
                                <span className="admin-badge admin-badge--primary">Único admin</span>
                              )}
                            </div>
                            <span className="admin-mobile-card__meta">@{user.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="admin-table__td">{user.email || "—"}</td>
                      <td className="admin-table__td">
                        <span className={`admin-badge ${
                          user.role === "admin"
                            ? "admin-badge--primary"
                            : "admin-badge--neutral"
                        }`}>
                          {user.role === "admin" ? "Admin" : "Cliente"}
                        </span>
                      </td>
                      <td className="admin-table__td">
                        <span className={`admin-badge ${
                          user.is_active
                            ? "admin-badge--success"
                            : "admin-badge--error"
                        }`}>
                          {user.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="admin-table__td">
                        {new Date(user.createdAt || user.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                        })}
                      </td>
                      <td className="admin-table__td">
                        <div className="admin-table__actions">
                          <button onClick={() => handleEdit(user)} className="admin-btn admin-btn--icon admin-btn--ghost">
                            <span className="material-symbols-outlined admin-btn__icon--sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`admin-btn admin-btn--icon ${user.is_active ? "admin-btn--danger" : "admin-btn--ghost"}`}
                            disabled={user.role === "admin" && user.is_active && stats.activeAdmins <= 1}
                          >
                            <span className="material-symbols-outlined admin-btn__icon--sm">
                              {user.is_active ? "visibility_off" : "visibility"}
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="admin-btn admin-btn--icon admin-btn--danger"
                            disabled={(user.role === "admin" && stats.admins <= 1) || stats.isLastUser}
                          >
                            <span className="material-symbols-outlined admin-btn__icon--sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="admin-mobile-cards">
            {filteredUsers.map((user) => {
              const isExpanded = expandedCards[user.id];
              const isProtected = user.role === "admin" && user.is_active && stats.activeAdmins <= 1;
              return (
                <div key={user.id} className={`admin-mobile-card ${!user.is_active ? "admin-mobile-card--muted" : ""}`}>
                  <div className="admin-mobile-card__header" onClick={() => toggleExpand(user.id)}>
                    <span className="material-symbols-outlined admin-mobile-card__avatar">
                      {user.role === "admin" ? "admin_panel" : "person"}
                    </span>
                    <div className="admin-mobile-card__info">
                      <div className="admin-mobile-card__title">
                        <span className="admin-mobile-card__name">{user.full_name || user.username}</span>
                        {isProtected && <span className="admin-badge admin-badge--primary">Protegido</span>}
                      </div>
                      <span className="admin-mobile-card__meta">@{user.username}</span>
                      <div className="admin-mobile-card__meta">
                        <span className={`admin-badge ${
                          user.role === "admin" ? "admin-badge--primary" : "admin-badge--neutral"
                        }`}>
                          {user.role === "admin" ? "Admin" : "Cliente"}
                        </span>
                        <span className={`admin-badge ${
                          user.is_active ? "admin-badge--success" : "admin-badge--error"
                        }`}>
                          {user.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined admin-mobile-card__expand">
                      {isExpanded ? "expand_less" : "expand_more"}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="admin-mobile-card__body">
                      <div className="admin-mobile-card__details">
                        <div className="admin-mobile-card__detail">
                          <span className="admin-mobile-card__detail-label">Email</span>
                          <span className="admin-mobile-card__detail-value">{user.email || "—"}</span>
                        </div>
                        <div className="admin-mobile-card__detail">
                          <span className="admin-mobile-card__detail-label">Fecha registro</span>
                          <span className="admin-mobile-card__detail-value">
                            {new Date(user.createdAt || user.created_at).toLocaleDateString("es-ES", {
                              day: "2-digit", month: "long", year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="admin-mobile-card__actions">
                        <button onClick={() => handleEdit(user)} className="admin-btn admin-btn--secondary admin-btn--sm admin-btn--full">
                          <span className="material-symbols-outlined admin-btn__icon--sm">edit</span>
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`admin-btn admin-btn--sm admin-btn--full ${user.is_active ? "admin-btn--danger" : "admin-btn--secondary"}`}
                          disabled={user.role === "admin" && user.is_active && stats.activeAdmins <= 1}
                        >
                          <span className="material-symbols-outlined admin-btn__icon--sm">{user.is_active ? "visibility_off" : "visibility"}</span>
                          {user.is_active ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="admin-btn admin-btn--danger admin-btn--sm admin-btn--full"
                          disabled={(user.role === "admin" && stats.admins <= 1) || stats.isLastUser}
                        >
                          <span className="material-symbols-outlined admin-btn__icon--sm">delete</span>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {showEditForm && (
        <AdminUserForm
          user={editingUser}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default AdminUsersManager;
