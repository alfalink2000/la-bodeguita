import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetCart } from "../../../actions/cartActions";
import { selectCartItemsCount } from "../../../selectors/cartSelectors";
import Swal from "sweetalert2";
import "./SideMenu.css";
import "./RightSidebar.css";

const SideMenu = ({
  isOpen,
  onClose,
  isLoggedIn,
  userData,
  onLogout,
  onShowLogin,
  onProfileClick,
}) => {
  const dispatch = useDispatch();
  const cartItemsCount = useSelector(selectCartItemsCount);
  const orders = useSelector((state) => state.orders.orders);
  const appConfig = useSelector((state) => state.appConfig.config);

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

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleLogout = () => {
    Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Se cerrará tu sesión actual",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0b4f37",
      cancelButtonColor: "#e8edea",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
      background: "#ffffff",
      color: "#1a1a1a",
      iconColor: "#c8963e",
      buttonsStyling: true,
      customClass: {
        container: "swal-custom-container",
        popup: "swal-custom-popup",
        confirmButton: "swal-custom-confirm",
        cancelButton: "swal-custom-cancel",
        title: "swal-custom-title",
        htmlContainer: "swal-custom-text",
        icon: "swal-custom-icon",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        onClose();
        onLogout();
      }
    });
  };

  return (
    <>
      <div
        className={`client-overlay ${isOpen ? "client-overlay--visible" : "client-overlay--hidden"}`}
        onClick={handleOverlayClick}
      />
      <div
        className={`client-sidebar ${isOpen ? "client-sidebar--open" : "client-sidebar--closed"}`}
      >
        <div className="client-sidebar__header">
          <div className="client-sidebar__header-left">
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--color-primary)", fontSize: "24px" }}
            >
              storefront
            </span>
            <h2 className="client-sidebar__title">
              {appConfig?.app_name || "La Bodeguita"}
            </h2>
          </div>
          <button
            className="client-sidebar__close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {isLoggedIn && userData && (
          <div className="client-sidebar__user-card">
            <div className="client-sidebar__avatar">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "24px", color: "var(--color-primary)" }}
              >
                account_circle
              </span>
            </div>
            <div className="client-sidebar__user-info">
              <span className="client-sidebar__user-name">
                {userData.full_name || userData.username || "Usuario"}
              </span>
              <span className="client-sidebar__user-role">Cliente</span>
            </div>
          </div>
        )}

        {isLoggedIn && (
          <div className="client-sidebar__stats">
            <div className="client-sidebar__stat">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px", color: "var(--color-primary)" }}
              >
                shopping_cart
              </span>
              <div>
                <p className="client-sidebar__stat-number">{cartItemsCount}</p>
                <p className="client-sidebar__stat-label">Carrito</p>
              </div>
            </div>
            <div className="client-sidebar__stat">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px", color: "var(--color-primary)" }}
              >
                receipt_long
              </span>
              <div>
                <p className="client-sidebar__stat-number">{orders.length}</p>
                <p className="client-sidebar__stat-label">Pedidos</p>
              </div>
            </div>
          </div>
        )}

        <nav className="client-sidebar__nav">
          <button className="client-sidebar__nav-item" onClick={onClose}>
            <span className="material-symbols-outlined client-sidebar__nav-icon">
              home
            </span>
            <span>Inicio</span>
          </button>
          <button className="client-sidebar__nav-item" onClick={onClose}>
            <span className="material-symbols-outlined client-sidebar__nav-icon">
              category
            </span>
            <span>Categorías</span>
          </button>
          <button className="client-sidebar__nav-item" onClick={onClose}>
            <span className="material-symbols-outlined client-sidebar__nav-icon">
              local_offer
            </span>
            <span>Ofertas</span>
          </button>

          <div className="client-sidebar__divider" />

          {isLoggedIn ? (
            <>
              <button
                className="client-sidebar__nav-item"
                onClick={() => {
                  onClose();
                  onProfileClick();
                }}
              >
                <span className="material-symbols-outlined client-sidebar__nav-icon">
                  person
                </span>
                <span>Mi Perfil</span>
              </button>
              <button
                className="client-sidebar__nav-item client-sidebar__nav-item--danger"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined client-sidebar__nav-icon">
                  logout
                </span>
                <span>Cerrar Sesión</span>
              </button>
            </>
          ) : (
            <button
              className="client-sidebar__nav-item client-sidebar__nav-item--primary"
              onClick={() => {
                onClose();
                onShowLogin();
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: "var(--color-on-primary)" }}
              >
                person
              </span>
              <span>Iniciar Sesión</span>
            </button>
          )}
        </nav>

        <div className="client-sidebar__footer">
          <span className="client-sidebar__footer-text">
            v2.0.0 — Soporte por chat
          </span>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
