// components/client/SideMenu/SideMenu.jsx
import React, { useEffect, useCallback } from "react";
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlinePhone,
  HiOutlineQuestionMarkCircle,
  HiOutlineUserCircle,
} from "react-icons/hi";
import "./SideMenu.css";

const SideMenu = ({ isOpen, onClose, isLoggedIn, userData, onLogout, onShowLogin }) => {
  // Cerrar con tecla Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  // Cerrar al hacer clic fuera del menú
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`sidemenu-overlay ${isOpen ? "sidemenu-overlay--visible" : ""}`}
        onClick={handleOverlayClick}
      />

      {/* Menú lateral */}
      <div className={`sidemenu ${isOpen ? "sidemenu--open" : ""}`}>
        {/* Header del menú */}
        <div className="sidemenu__header">
          <div className="sidemenu__header-content">
            <div className="sidemenu__header-icon">
              <HiOutlineMenu className="sidemenu__header-icon-svg" />
            </div>
            <h2 className="sidemenu__title">Menú</h2>
          </div>
          <button className="sidemenu__close" onClick={onClose} aria-label="Cerrar menú">
            <HiOutlineX className="sidemenu__close-icon" />
          </button>
        </div>

        {/* Información del usuario (si está logueado) */}
        {isLoggedIn && userData && (
          <div className="sidemenu__user-info">
            <div className="sidemenu__user-avatar">
              <HiOutlineUserCircle className="sidemenu__user-avatar-icon" />
            </div>
            <div className="sidemenu__user-details">
              <span className="sidemenu__user-name">
                {userData.full_name || userData.username || "Usuario"}
              </span>
              <span className="sidemenu__user-role">
                {userData.role === "admin" ? "Administrador" : "Cliente"}
              </span>
            </div>
          </div>
        )}

        {/* Items del menú */}
        <nav className="sidemenu__nav">
          <ul className="sidemenu__list">
            <li className="sidemenu__item">
              <button className="sidemenu__link" onClick={onClose}>
                <HiOutlineHome className="sidemenu__link-icon" />
                <span className="sidemenu__link-text">Inicio</span>
              </button>
            </li>

            <li className="sidemenu__item">
              <button className="sidemenu__link" onClick={onClose}>
                <HiOutlineShoppingBag className="sidemenu__link-icon" />
                <span className="sidemenu__link-text">Productos</span>
              </button>
            </li>

            <li className="sidemenu__item">
              <button className="sidemenu__link" onClick={onClose}>
                <HiOutlinePhone className="sidemenu__link-icon" />
                <span className="sidemenu__link-text">Contacto</span>
              </button>
            </li>

            <li className="sidemenu__item">
              <button className="sidemenu__link" onClick={onClose}>
                <HiOutlineQuestionMarkCircle className="sidemenu__link-icon" />
                <span className="sidemenu__link-text">Ayuda</span>
              </button>
            </li>
          </ul>

          {/* Separador */}
          <div className="sidemenu__divider" />

          {/* Botones de sesión */}
          <ul className="sidemenu__list">
            {isLoggedIn ? (
              <>
                <li className="sidemenu__item">
                  <button className="sidemenu__link" onClick={onClose}>
                    <HiOutlineUser className="sidemenu__link-icon" />
                    <span className="sidemenu__link-text">Mi Perfil</span>
                  </button>
                </li>
                <li className="sidemenu__item">
                  <button
                    className="sidemenu__link sidemenu__link--logout"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                  >
                    <HiOutlineLogout className="sidemenu__link-icon" />
                    <span className="sidemenu__link-text">Cerrar Sesión</span>
                  </button>
                </li>
              </>
            ) : (
              <li className="sidemenu__item">
                <button
                  className="sidemenu__link sidemenu__link--login"
                  onClick={() => {
                    onClose();
                    onShowLogin();
                  }}
                >
                  <HiOutlineUser className="sidemenu__link-icon" />
                  <span className="sidemenu__link-text">Iniciar Sesión</span>
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* Footer del menú */}
        <div className="sidemenu__footer">
          <span className="sidemenu__version">v1.0.0</span>
        </div>
      </div>
    </>
  );
};

export default SideMenu;