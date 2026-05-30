// components/common/Header/Header.jsx - VERSIÓN OPTIMIZADA
import { useState, useEffect } from "react";
import { HiOutlineInformationCircle, HiOutlineX } from "react-icons/hi";
import { FiShoppingCart } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCartItemsCount,
  selectIsCartOpen,
} from "../../../selectors/cartSelectors";
import { toggleCartModal } from "../../../actions/cartActions";
import "./Header.css";

const Header = ({ title, children, onInfoClick, showInfoButton = false }) => {
  const dispatch = useDispatch();
  const cartItemsCount = useSelector(selectCartItemsCount);
  const isCartOpen = useSelector(selectIsCartOpen);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleCartClick = () => {
    dispatch(toggleCartModal());
  };

  const handleInfoClick = () => {
    setShowHelpModal(true);
  };

  const closeHelpModal = () => {
    setShowHelpModal(false);
  };

  useEffect(() => {
    const handleOpenHelpModal = () => {
      setShowHelpModal(true);
    };

    window.addEventListener("open-help-modal", handleOpenHelpModal);
    return () =>
      window.removeEventListener("open-help-modal", handleOpenHelpModal);
  }, []);

  return (
    <>
      <header className="header">
        <div className="header__container">
          <div className="header__left">{title}</div>

          <div className="header__center">
            <div className="online-status">
              <div className="online-status__indicator">
                <span className="online-status__pulse"></span>
                <span className="online-status__dot"></span>
              </div>
              <div className="online-status__text">
                <span className="online-status__label">En línea</span>
                <span className="online-status__description">
                  Listo para atenderte
                </span>
              </div>
              <div className="online-status__glow"></div>
            </div>
          </div>

          <div className="header__right">
            <button
              className="header__cart-btn header-action header-action--icon"
              onClick={handleCartClick}
              title="Ver carrito"
            >
              <FiShoppingCart className="header__cart-icon header-action__icon" />
              {cartItemsCount > 0 && (
                <span className="cart-badge">{cartItemsCount}</span>
              )}
            </button>

            {showInfoButton && (
              <button
                className="header__info-btn"
                onClick={handleInfoClick}
                title="Ayuda - Configuración de ubicación"
              >
                <HiOutlineInformationCircle className="header__info-icon" />
              </button>
            )}

            {children && <div className="header__actions">{children}</div>}
          </div>
        </div>
      </header>

      {showHelpModal && (
        <div className="help-modal-overlay" onClick={closeHelpModal}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-modal__header">
              <div className="help-modal__title">
                <span className="help-modal__icon">📍</span>
                <h3>Configura tu ubicación para mejores entregas</h3>
              </div>
              <button className="help-modal__close" onClick={closeHelpModal}>
                <HiOutlineX size={20} />
              </button>
            </div>

            <div className="help-modal__content">
              <div className="help-card help-card--gps">
                <div className="help-card__icon">🎯</div>
                <div className="help-card__content">
                  <h4>¿Por qué usar el GPS?</h4>
                  <p>
                    Registrar tu ubicación exacta nos permite calcular el costo
                    de envío de forma precisa y agilizar tus entregas.
                  </p>
                </div>
              </div>

              <div className="help-card help-card--warning">
                <div className="help-card__icon">⚠️</div>
                <div className="help-card__content">
                  <h4>¿Qué pasa si no tengo ubicación?</h4>
                  <p>
                    Al hacer un pedido sin ubicación registrada, deberás
                    contactar con soporte para coordinar manualmente la entrega,
                    lo que puede generar demoras.
                  </p>
                </div>
              </div>

              <div className="help-card help-card--success">
                <div className="help-card__icon">✅</div>
                <div className="help-card__content">
                  <h4>Con ubicación GPS</h4>
                  <p>
                    Tus entregas serán más rápidas, el costo de envío se calcula
                    automáticamente y no necesitas contacto manual con soporte.
                  </p>
                </div>
              </div>

              <div className="help-steps">
                <h4>📋 ¿Cómo configurar tu ubicación?</h4>
                <div className="help-steps__list">
                  <div className="help-step">
                    <div className="help-step__number">1</div>
                    <div className="help-step__text">
                      Ve a <strong>Mi Perfil</strong> en el menú inferior
                    </div>
                  </div>
                  <div className="help-step">
                    <div className="help-step__number">2</div>
                    <div className="help-step__text">
                      Haz clic en <strong>"Editar Perfil"</strong>
                    </div>
                  </div>
                  <div className="help-step">
                    <div className="help-step__number">3</div>
                    <div className="help-step__text">
                      Usa el botón{" "}
                      <strong>"📍 Usar mi ubicación actual"</strong> o escribe
                      tu dirección manualmente
                    </div>
                  </div>
                  <div className="help-step">
                    <div className="help-step__number">4</div>
                    <div className="help-step__text">
                      Guarda los cambios y ¡listo!
                    </div>
                  </div>
                </div>
              </div>

              <div className="help-contact">
                <div className="help-contact__icon">💬</div>
                <div className="help-contact__content">
                  <h4>¿Necesitas ayuda?</h4>
                  <p>
                    Si tienes problemas con tu ubicación o prefieres coordinar
                    manualmente, contacta con nuestro soporte.
                  </p>
                  <button
                    className="help-contact__btn"
                    onClick={() => {
                      closeHelpModal();
                      window.dispatchEvent(
                        new CustomEvent("open-chat-from-help"),
                      );
                    }}
                  >
                    <span>📞</span> Contactar a Soporte
                  </button>
                </div>
              </div>

              <div className="help-tip">
                <span className="help-tip__icon">💡</span>
                <p>
                  <strong>Consejo:</strong> Activa el GPS de tu teléfono para
                  una experiencia más rápida y precisa.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
