// components/admin/AdminUsersManager/AdminUsersManager.jsx
import React, { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineUsers,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineX,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineRefresh,
} from "react-icons/hi";
import {
  updateAdminUser,
  toggleUserStatus,
  deleteAdminUser,
  setActiveAdminUser,
} from "../../../actions/adminUsersActions";
import AdminUserForm from "../AdminUserForm/AdminUserForm";
import "./AdminUsersManager.css";

const AdminUsersManager = ({ users = [] }) => {
  const dispatch = useDispatch();
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // all | admin | customer
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  // Separar usuarios por rol
  const adminUsers = useMemo(
    () => users.filter((u) => u.role === "admin"),
    [users],
  );
  const customerUsers = useMemo(
    () => users.filter((u) => u.role === "customer" || u.role === "cliente"),
    [users],
  );

  // Calcular estadísticas
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

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Filtrar por rol
    if (roleFilter === "admin") {
      result = result.filter((u) => u.role === "admin");
    } else if (roleFilter === "customer") {
      result = result.filter(
        (u) => u.role === "customer" || u.role === "cliente",
      );
    }

    // Filtrar por estado
    if (statusFilter === "active") {
      result = result.filter((u) => u.is_active);
    } else if (statusFilter === "inactive") {
      result = result.filter((u) => !u.is_active);
    }

    // Filtrar por búsqueda
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
    // Proteger: no desactivar el último admin activo
    if (user.role === "admin" && user.is_active && stats.activeAdmins <= 1) {
      Swal.fire({
        icon: "error",
        title: "Acción no permitida",
        text: "No se puede desactivar al último administrador activo. Debe existir al menos un administrador para gestionar el sistema.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    const actionText = user.is_active ? "desactivar" : "activar";
    Swal.fire({
      title: `¿${actionText === "desactivar" ? "Desactivar" : "Activar"} usuario?`,
      text: `¿Estás seguro de que quieres ${actionText} a "${user.username}"?${user.is_active ? " No podrá acceder al sistema." : ""}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: user.is_active ? "#f59e0b" : "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(toggleUserStatus(user.id, user.is_active));
      }
    });
  };

  const handleDelete = (user) => {
    // Proteger: no eliminar el último admin
    if (user.role === "admin" && stats.admins <= 1) {
      Swal.fire({
        icon: "error",
        title: "Acción no permitida",
        text: "No se puede eliminar al único administrador. Debe existir al menos un administrador en el sistema.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    // Proteger: no eliminar el último usuario del sistema
    if (stats.isLastUser) {
      Swal.fire({
        icon: "error",
        title: "Acción no permitida",
        text: "No se puede eliminar el último usuario del sistema.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    Swal.fire({
      title: "¿Eliminar usuario?",
      html: `
        <p>¿Estás seguro de que quieres eliminar a <strong>"${user.username}"</strong>?</p>
        <p style="color: #ef4444; font-size: 0.85rem;">Esta acción no se puede deshacer.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
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
      console.log("📤 Enviando datos del formulario:", userData);

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
    <div className="admin-users-manager">
      {/* ===== ESTADÍSTICAS ===== */}
      <div className="aum-stats">
        <div className="aum-stat aum-stat--total">
          <div className="aum-stat__icon">
            <HiOutlineUsers />
          </div>
          <div className="aum-stat__content">
            <span className="aum-stat__number">{stats.total}</span>
            <span className="aum-stat__label">Total Usuarios</span>
          </div>
        </div>

        <div className="aum-stat aum-stat--admins">
          <div className="aum-stat__icon">
            <HiOutlineShieldCheck />
          </div>
          <div className="aum-stat__content">
            <span className="aum-stat__number">{stats.admins}</span>
            <span className="aum-stat__label">Administradores</span>
            <span className="aum-stat__sublabel">
              {stats.activeAdmins} activo{stats.activeAdmins !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="aum-stat aum-stat--customers">
          <div className="aum-stat__icon">
            <HiOutlineUserGroup />
          </div>
          <div className="aum-stat__content">
            <span className="aum-stat__number">{stats.customers}</span>
            <span className="aum-stat__label">Clientes</span>
            <span className="aum-stat__sublabel">
              {stats.activeCustomers} activo
              {stats.activeCustomers !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="aum-stat aum-stat--inactive">
          <div className="aum-stat__icon">
            <HiOutlineEyeOff />
          </div>
          <div className="aum-stat__content">
            <span className="aum-stat__number">{stats.inactiveTotal}</span>
            <span className="aum-stat__label">Inactivos</span>
          </div>
        </div>
      </div>

      {/* ===== ALERTA ÚLTIMO ADMIN ===== */}
      {stats.isLastAdmin && stats.activeAdmins === 1 && (
        <div className="aum-alert">
          <HiOutlineShieldCheck />
          <div className="aum-alert__content">
            <strong>Administrador único</strong>
            <p>
              Solo existe un administrador activo en el sistema. No puede ser
              desactivado ni eliminado por seguridad.
            </p>
          </div>
        </div>
      )}

      {/* ===== BOTÓN FILTROS MÓVIL ===== */}
      <button
        className="aum-mobile-filters-btn"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <HiOutlineFilter />
        <span>Filtros {hasActiveFilters && "(Activos)"}</span>
        {showMobileFilters ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
      </button>

      {/* ===== FILTROS ===== */}
      <div
        className={`aum-filters ${showMobileFilters ? "aum-filters--open" : ""}`}
      >
        {/* Búsqueda */}
        <div className="aum-search">
          <HiOutlineSearch className="aum-search__icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="aum-search__input"
          />
          {searchTerm && (
            <button
              className="aum-search__clear"
              onClick={() => setSearchTerm("")}
              aria-label="Limpiar búsqueda"
            >
              <HiOutlineX />
            </button>
          )}
        </div>

        {/* Filtro por tipo de usuario */}
        <div className="aum-filter-group">
          <span className="aum-filter-label">Tipo:</span>
          <div className="aum-filter-chips">
            <button
              className={`aum-chip ${roleFilter === "all" ? "aum-chip--active" : ""}`}
              onClick={() => setRoleFilter("all")}
            >
              Todos
            </button>
            <button
              className={`aum-chip aum-chip--admin ${roleFilter === "admin" ? "aum-chip--active" : ""}`}
              onClick={() => setRoleFilter("admin")}
            >
              <HiOutlineShieldCheck size={12} /> Admin ({stats.admins})
            </button>
            <button
              className={`aum-chip aum-chip--customer ${roleFilter === "customer" ? "aum-chip--active" : ""}`}
              onClick={() => setRoleFilter("customer")}
            >
              <HiOutlineUser size={12} /> Clientes ({stats.customers})
            </button>
          </div>
        </div>

        {/* Filtro por estado */}
        <div className="aum-filter-group">
          <span className="aum-filter-label">Estado:</span>
          <div className="aum-filter-chips">
            <button
              className={`aum-chip ${statusFilter === "all" ? "aum-chip--active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              Todos
            </button>
            <button
              className={`aum-chip aum-chip--active-status ${statusFilter === "active" ? "aum-chip--active" : ""}`}
              onClick={() => setStatusFilter("active")}
            >
              Activos ({stats.activeTotal})
            </button>
            <button
              className={`aum-chip aum-chip--inactive-status ${statusFilter === "inactive" ? "aum-chip--active" : ""}`}
              onClick={() => setStatusFilter("inactive")}
            >
              Inactivos ({stats.inactiveTotal})
            </button>
          </div>
        </div>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <button className="aum-clear-filters" onClick={clearFilters}>
            <HiOutlineRefresh size={14} />
            Limpiar todos los filtros
          </button>
        )}
      </div>

      {/* ===== INFO RESULTADOS ===== */}
      <div className="aum-results-info">
        <span>
          Mostrando {filteredUsers.length} de {users.length} usuarios
          {roleFilter !== "all" && (
            <span className="aum-tag">
              {roleFilter === "admin" ? "Administradores" : "Clientes"}
            </span>
          )}
          {statusFilter !== "all" && (
            <span className="aum-tag">
              {statusFilter === "active" ? "Activos" : "Inactivos"}
            </span>
          )}
          {searchTerm && (
            <span className="aum-tag aum-tag--search">"{searchTerm}"</span>
          )}
        </span>
      </div>

      {/* ===== LISTA DE USUARIOS ===== */}
      <div className="aum-list">
        {filteredUsers.length === 0 ? (
          <div className="aum-empty">
            <HiOutlineUsers className="aum-empty__icon" />
            <h3>No se encontraron usuarios</h3>
            <p>Intenta ajustar los filtros de búsqueda</p>
            {hasActiveFilters && (
              <button className="aum-empty__btn" onClick={clearFilters}>
                <HiOutlineRefresh /> Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ===== VISTA DESKTOP: TABLA ===== */}
            <div className="aum-table-wrapper">
              <table className="aum-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`aum-row ${!user.is_active ? "aum-row--inactive" : ""}`}
                    >
                      <td className="aum-row__user">
                        <div className="aum-row__avatar">
                          {user.role === "admin" ? (
                            <HiOutlineShieldCheck />
                          ) : (
                            <HiOutlineUser />
                          )}
                        </div>
                        <div className="aum-row__user-info">
                          <span className="aum-row__name">
                            {user.full_name || user.username}
                            {user.role === "admin" &&
                              stats.activeAdmins <= 1 &&
                              user.is_active && (
                                <span className="aum-badge aum-badge--primary">
                                  Único admin
                                </span>
                              )}
                          </span>
                          <span className="aum-row__username">
                            @{user.username}
                          </span>
                        </div>
                      </td>
                      <td className="aum-row__email">{user.email || "—"}</td>
                      <td>
                        <span
                          className={`aum-role-badge ${
                            user.role === "admin"
                              ? "aum-role-badge--admin"
                              : "aum-role-badge--customer"
                          }`}
                        >
                          {user.role === "admin" ? "Admin" : "Cliente"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`aum-status-badge ${
                            user.is_active
                              ? "aum-status-badge--active"
                              : "aum-status-badge--inactive"
                          }`}
                        >
                          {user.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="aum-row__date">
                        {new Date(
                          user.createdAt || user.created_at,
                        ).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="aum-row__actions">
                        <button
                          onClick={() => handleEdit(user)}
                          className="aum-btn aum-btn--edit"
                          title="Editar usuario"
                        >
                          <HiOutlinePencil />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`aum-btn ${
                            user.is_active
                              ? "aum-btn--deactivate"
                              : "aum-btn--activate"
                          }`}
                          title={
                            user.is_active
                              ? "Desactivar usuario"
                              : "Activar usuario"
                          }
                          disabled={
                            user.role === "admin" &&
                            user.is_active &&
                            stats.activeAdmins <= 1
                          }
                        >
                          {user.is_active ? (
                            <HiOutlineEyeOff />
                          ) : (
                            <HiOutlineEye />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="aum-btn aum-btn--delete"
                          title="Eliminar usuario"
                          disabled={
                            (user.role === "admin" && stats.admins <= 1) ||
                            stats.isLastUser
                          }
                        >
                          <HiOutlineTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ===== VISTA MÓVIL: TARJETAS ===== */}
            <div className="aum-cards">
              {filteredUsers.map((user) => {
                const isExpanded = expandedCards[user.id];
                const isProtected =
                  user.role === "admin" &&
                  user.is_active &&
                  stats.activeAdmins <= 1;

                return (
                  <div
                    key={user.id}
                    className={`aum-card ${!user.is_active ? "aum-card--inactive" : ""} ${isProtected ? "aum-card--protected" : ""}`}
                  >
                    <div
                      className="aum-card__main"
                      onClick={() => toggleExpand(user.id)}
                    >
                      <div className="aum-card__avatar">
                        {user.role === "admin" ? (
                          <HiOutlineShieldCheck />
                        ) : (
                          <HiOutlineUser />
                        )}
                      </div>
                      <div className="aum-card__info">
                        <div className="aum-card__name-row">
                          <span className="aum-card__name">
                            {user.full_name || user.username}
                          </span>
                          {isProtected && (
                            <span className="aum-badge aum-badge--primary aum-badge--sm">
                              Protegido
                            </span>
                          )}
                        </div>
                        <span className="aum-card__username">
                          @{user.username}
                        </span>
                        <div className="aum-card__tags">
                          <span
                            className={`aum-role-badge ${
                              user.role === "admin"
                                ? "aum-role-badge--admin"
                                : "aum-role-badge--customer"
                            }`}
                          >
                            {user.role === "admin" ? "Admin" : "Cliente"}
                          </span>
                          <span
                            className={`aum-status-badge ${
                              user.is_active
                                ? "aum-status-badge--active"
                                : "aum-status-badge--inactive"
                            }`}
                          >
                            {user.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                      <button
                        className="aum-card__expand"
                        aria-label={isExpanded ? "Colapsar" : "Expandir"}
                      >
                        {isExpanded ? (
                          <HiOutlineChevronUp />
                        ) : (
                          <HiOutlineChevronDown />
                        )}
                      </button>
                    </div>

                    {/* Contenido expandible */}
                    <div
                      className={`aum-card__details ${isExpanded ? "aum-card__details--open" : ""}`}
                    >
                      <div className="aum-card__detail-row">
                        <span className="aum-card__detail-label">Email</span>
                        <span className="aum-card__detail-value">
                          {user.email || "—"}
                        </span>
                      </div>
                      <div className="aum-card__detail-row">
                        <span className="aum-card__detail-label">
                          Fecha registro
                        </span>
                        <span className="aum-card__detail-value">
                          {new Date(
                            user.createdAt || user.created_at,
                          ).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="aum-card__actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(user);
                          }}
                          className="aum-btn aum-btn--edit"
                        >
                          <HiOutlinePencil /> Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(user);
                          }}
                          className={`aum-btn ${
                            user.is_active
                              ? "aum-btn--deactivate"
                              : "aum-btn--activate"
                          }`}
                          disabled={
                            user.role === "admin" &&
                            user.is_active &&
                            stats.activeAdmins <= 1
                          }
                        >
                          {user.is_active ? (
                            <>
                              <HiOutlineEyeOff /> Desactivar
                            </>
                          ) : (
                            <>
                              <HiOutlineEye /> Activar
                            </>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(user);
                          }}
                          className="aum-btn aum-btn--delete"
                          disabled={
                            (user.role === "admin" && stats.admins <= 1) ||
                            stats.isLastUser
                          }
                        >
                          <HiOutlineTrash /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ===== MODAL DE EDICIÓN ===== */}
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
