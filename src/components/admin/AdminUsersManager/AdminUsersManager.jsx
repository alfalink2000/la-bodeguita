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
} from "react-icons/hi";
import {
  updateAdminUser,
  toggleUserStatus,
  deleteAdminUser,
  setActiveAdminUser,
} from "../../../actions/adminUsersActions";
import AdminUserForm from "../AdminUserForm/AdminUserForm";
import "./AdminUsersManager.css";

const AdminUsersManager = ({ users }) => {
  const dispatch = useDispatch();
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  // Calcular estadísticas
  const activeUsersCount = users.filter((user) => user.is_active).length;
  const inactiveUsersCount = users.length - activeUsersCount;
  const canDeactivate = activeUsersCount > 1;
  const canDelete = users.length > 1;

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    let result = users;

    // Filtrar por estado
    if (statusFilter === "active") {
      result = result.filter((user) => user.is_active);
    } else if (statusFilter === "inactive") {
      result = result.filter((user) => !user.is_active);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.username.toLowerCase().includes(search) ||
          (user.email || "").toLowerCase().includes(search),
      );
    }

    return result;
  }, [users, statusFilter, searchTerm]);

  const toggleExpand = (userId) => {
    setExpandedCards((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowEditForm(true);
    dispatch(setActiveAdminUser(user));
  };

  const handleToggleStatus = (user) => {
    if (!user.is_active && !canDeactivate) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se puede desactivar el último usuario activo",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    const actionText = user.is_active ? "desactivar" : "activar";
    Swal.fire({
      title: `¿${actionText === "desactivar" ? "Desactivar" : "Activar"} usuario?`,
      text: `¿Estás seguro de que quieres ${actionText} a ${user.username}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: user.is_active ? "#ef4444" : "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(toggleUserStatus(user.id, user.is_active));
      }
    });
  };

  const handleDelete = (userId, username) => {
    if (!canDelete) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se puede eliminar el último usuario",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    Swal.fire({
      title: "¿Eliminar usuario?",
      text: `¿Estás seguro de que quieres eliminar a ${username}? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteAdminUser(userId));
      }
    });
  };

  const handleSubmit = (userData) => {
    dispatch(updateAdminUser(userData)).then((success) => {
      if (success) {
        setShowEditForm(false);
        setEditingUser(null);
      }
    });
  };

  const handleCancel = () => {
    setShowEditForm(false);
    setEditingUser(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  return (
    <div className="admin-users-manager">
      {/* Estadísticas */}
      <div className="admin-users__stats">
        <div className="admin-users__stat">
          <span className="admin-users__stat-number">{users.length}</span>
          <span className="admin-users__stat-label">Usuarios Totales</span>
        </div>
        <div className="admin-users__stat">
          <span className="admin-users__stat-number">{activeUsersCount}</span>
          <span className="admin-users__stat-label">Usuarios Activos</span>
        </div>
        <div className="admin-users__stat">
          <span className="admin-users__stat-number">{inactiveUsersCount}</span>
          <span className="admin-users__stat-label">Usuarios Inactivos</span>
        </div>
      </div>

      {/* Botón de filtros móvil */}
      <button
        className="admin-users__mobile-filters"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <HiOutlineFilter />
        <span>Filtros</span>
        {showMobileFilters ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
      </button>

      {/* Filtros */}
      <div
        className={`admin-users__filters ${showMobileFilters ? "admin-users__filters--open" : ""}`}
      >
        <div className="admin-users__search">
          <HiOutlineSearch className="admin-users__search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-users__search-input"
          />
          {searchTerm && (
            <button
              className="admin-users__search-clear"
              onClick={() => setSearchTerm("")}
            >
              <HiOutlineX />
            </button>
          )}
        </div>

        <div className="admin-users__status-filter">
          <button
            className={`status-filter-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            Todos ({users.length})
          </button>
          <button
            className={`status-filter-btn ${statusFilter === "active" ? "active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Activos ({activeUsersCount})
          </button>
          <button
            className={`status-filter-btn ${statusFilter === "inactive" ? "active" : ""}`}
            onClick={() => setStatusFilter("inactive")}
          >
            Inactivos ({inactiveUsersCount})
          </button>
        </div>

        {(searchTerm || statusFilter !== "all") && (
          <button className="admin-users__clear-filters" onClick={clearFilters}>
            <HiOutlineX size={14} />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="admin-users__info">
        <span className="admin-users__count">
          {filteredUsers.length} de {users.length} usuarios
          {searchTerm && (
            <span className="admin-users__search-badge">
              Búsqueda: "{searchTerm}"
            </span>
          )}
          {statusFilter !== "all" && (
            <span className="admin-users__filter-badge">
              {statusFilter === "active" ? "Activos" : "Inactivos"}
            </span>
          )}
        </span>
      </div>

      {/* Lista de usuarios */}
      <div className="admin-users__list">
        {filteredUsers.length === 0 ? (
          <div className="admin-users__empty">
            <HiOutlineUsers className="admin-users__empty-icon" />
            <h3>No hay usuarios</h3>
            <p>No se encontraron usuarios con los filtros aplicados</p>
            {(searchTerm || statusFilter !== "all") && (
              <button className="admin-users__reset-btn" onClick={clearFilters}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isExpanded = expandedCards[user.id];

            return (
              <div key={user.id} className="admin-user-card">
                <div className="admin-user-card__content">
                  <div className="admin-user-card__header">
                    <div className="admin-user-card__info">
                      <div className="admin-user-card__title">
                        <h4 className="admin-user-card__name">
                          {user.username}
                          {user.id === 1 && (
                            <span className="admin-user-card__badge">
                              Principal
                            </span>
                          )}
                        </h4>
                        <button
                          className="admin-user-card__expand-btn"
                          onClick={() => toggleExpand(user.id)}
                        >
                          {isExpanded ? (
                            <HiOutlineChevronUp />
                          ) : (
                            <HiOutlineChevronDown />
                          )}
                        </button>
                      </div>

                      <div className="admin-user-card__email">
                        {user.email || "Sin email"}
                      </div>

                      <div className="admin-user-card__status-badge">
                        <span
                          className={`status-badge ${user.is_active ? "active" : "inactive"}`}
                        >
                          {user.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>

                    {/* Contenido expandible en móvil */}
                    <div
                      className={`admin-user-card__expandable ${isExpanded ? "expanded" : ""}`}
                    >
                      <div className="admin-user-card__meta">
                        <span className="meta-item">
                          Rol:{" "}
                          {user.role === "admin" ? "Administrador" : "Cliente"}
                        </span>
                        <span className="meta-item">
                          Creado:{" "}
                          {new Date(
                            user.createdAt || user.created_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="admin-user-card__actions">
                      <button
                        onClick={() => handleEdit(user)}
                        className="admin-user-card__button admin-user-card__button--edit"
                        title="Editar usuario"
                      >
                        <HiOutlinePencil />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`admin-user-card__button ${
                          user.is_active
                            ? "admin-user-card__button--deactivate"
                            : "admin-user-card__button--activate"
                        }`}
                        title={
                          user.is_active
                            ? "Desactivar usuario"
                            : "Activar usuario"
                        }
                        disabled={user.is_active && !canDeactivate}
                      >
                        {user.is_active ? (
                          <HiOutlineEyeOff />
                        ) : (
                          <HiOutlineEye />
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="admin-user-card__button admin-user-card__button--delete"
                        title="Eliminar usuario"
                        disabled={!canDelete}
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de edición */}
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
