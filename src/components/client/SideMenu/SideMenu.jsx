// components/client/SideMenu/SideMenu.jsx
import React, { useEffect, useCallback } from "react";
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineHome,
  HiOutlineQuestionMarkCircle,
  HiOutlineUserCircle,
  HiOutlineChat,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import Swal from "sweetalert2";
import "./SideMenu.css";

const SideMenu = ({
  isOpen,
  onClose,
  isLoggedIn,
  userData,
  onLogout,
  onShowLogin,
  onProfileClick,
}) => {
  // Cerrar con tecla Escape
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

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

  // Mostrar ayuda informativa
  const showHelpInfo = () => {
    onClose();
    Swal.fire({
      title: "📱 Ayuda y Navegación",
      html: `
        <div style="text-align: left; line-height: 1.6;">
          <p style="margin-bottom: 1rem;"><strong>🔍 Búsqueda:</strong> Usa el buscador para encontrar productos rápidamente.</p>
          <p style="margin-bottom: 1rem;"><strong>🏪 Tiendas:</strong> Selecciona una tienda para ver sus productos específicos.</p>
          <p style="margin-bottom: 1rem;"><strong>📂 Categorías:</strong> Filtra productos por categoría para una mejor experiencia.</p>
          <p style="margin-bottom: 1rem;"><strong>🛒 Carrito:</strong> Agrega productos y realiza tu pedido fácilmente.</p>
          <p style="margin-bottom: 1rem;"><strong>💬 Soporte:</strong> Usa el botón flotante de chat (💬) para contactar con soporte.</p>
          <p style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #059669;">
            ✅ ¿Necesitas ayuda adicional? ¡Contáctanos por chat!
          </p>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#059669",
      background: "#ffffff",
      iconColor: "#059669",
    });
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
          <button
            className="sidemenu__close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
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
            {/* ✅ Inicio - solo cierra el menú (ya estamos en la página de inicio) */}
            <li className="sidemenu__item">
              <button className="sidemenu__link" onClick={onClose}>
                <HiOutlineHome className="sidemenu__link-icon" />
                <span className="sidemenu__link-text">Inicio</span>
              </button>
            </li>

            {/* ✅ ELIMINADO: Productos (es la misma vista que Inicio) */}

            {/* ✅ Ayuda - muestra información de navegación */}
            <li className="sidemenu__item">
              <button className="sidemenu__link" onClick={showHelpInfo}>
                <HiOutlineQuestionMarkCircle className="sidemenu__link-icon" />
                <span className="sidemenu__link-text">Ayuda</span>
              </button>
            </li>

            {/* ✅ Información - muestra información de la tienda */}
            <li className="sidemenu__item">
              <button
                className="sidemenu__link"
                onClick={() => {
                  onClose();
                  // Puedes abrir el modal de información aquí si lo tienes disponible
                  Swal.fire({
                    title: "ℹ Información",
                    html: `
                     <div style="text-align: left;">                 
                      <hr style="margin: 1rem 0;">
                      <p>💬 ¿Necesitas ayuda? Usa el botón flotante de chat (💬) en la esquina inferior derecha para contactar con soporte.</p>
                    </div>
                  `,
                    icon: "info",
                    confirmButtonText: "Cerrar",
                    confirmButtonColor: "#059669",
                  });
                }}
              >
                <HiOutlineInformationCircle className="sidemenu__link-icon" />
                <span className="sidemenu__link-text">Información</span>
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
                  <button
                    className="sidemenu__link"
                    onClick={() => {
                      onClose();
                      if (onProfileClick) {
                        onProfileClick();
                      }
                    }}
                  >
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
          <span className="sidemenu__footer-text">
            💬 Soporte disponible por chat
          </span>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
