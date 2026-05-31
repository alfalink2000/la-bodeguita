// components/auth/RoleSelector.jsx - VERSIÓN ORIGINAL
import {
  HiOutlineEye,
  HiOutlineCog,
  HiOutlineUserCircle,
} from "react-icons/hi";
import "./RoleSelector.css";

const RoleSelector = ({ userData, onSelectClient, onSelectAdmin }) => {
  return (
    <div className="role-selector-overlay">
      <div className="role-selector-card">
        {/* Header */}
        <div className="role-selector__header">
          <div className="role-selector__avatar">
            <HiOutlineUserCircle className="role-selector__avatar-icon" />
          </div>
          <h2 className="role-selector__greeting">
            ¡Hola, {userData?.full_name || userData?.username || "Admin"}!
          </h2>
          <p className="role-selector__subtitle">
            Selecciona a dónde deseas acceder
          </p>
          <div className="role-selector__badge">
            <span className="role-selector__badge-dot"></span>
            Administrador
          </div>
        </div>

        {/* Opciones */}
        <div className="role-selector__options">
          {/* Opción: Vista Cliente */}
          <button
            className="role-selector__option role-selector__option--client"
            onClick={onSelectClient}
          >
            <div className="role-selector__option-icon role-selector__option-icon--client">
              <HiOutlineEye />
            </div>
            <div className="role-selector__option-content">
              <h3 className="role-selector__option-title">Vista Cliente</h3>
              <p className="role-selector__option-desc">
                Ver el catálogo como lo ven tus clientes
              </p>
            </div>
            <div className="role-selector__option-arrow">→</div>
          </button>

          {/* Opción: Panel Admin */}
          <button
            className="role-selector__option role-selector__option--admin"
            onClick={onSelectAdmin}
          >
            <div className="role-selector__option-icon role-selector__option-icon--admin">
              <HiOutlineCog />
            </div>
            <div className="role-selector__option-content">
              <h3 className="role-selector__option-title">
                Panel de Administración
              </h3>
              <p className="role-selector__option-desc">
                Gestionar productos, configuraciones y más
              </p>
            </div>
            <div className="role-selector__option-arrow">→</div>
          </button>
        </div>

        {/* Footer */}
        <div className="role-selector__footer">
          <span className="role-selector__footer-text">
            Puedes cambiar entre vistas en cualquier momento
          </span>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
