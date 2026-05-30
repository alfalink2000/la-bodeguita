// components/common/InitialInfoModal/InitialInfoModal.jsx - VERSIÓN OPTIMIZADA
import {
  HiX,
  HiInformationCircle,
  HiStar,
  HiShoppingCart,
  HiClock,
  HiPhone,
} from "react-icons/hi";
import "./InitialInfoModal.css";

const InitialInfoModal = ({ isOpen, onClose, initialInfo }) => {
  const formatInitialInfo = (text) => {
    if (!text) return null;

    return text.split("\n").map((line, index) => {
      if (line.trim() === "") return <br key={index} />;

      if (line.includes("**")) {
        const cleanLine = line.replace(/\*\*/g, "");
        return (
          <h3 key={index} className="info-modal__title">
            {cleanLine}
          </h3>
        );
      }

      if (line.match(/^[🛒⏰🚚💬📍🕒🎯🌟⭐✨]/)) {
        return (
          <div key={index} className="info-modal__bullet">
            <span className="info-modal__emoji">{line.charAt(0)}</span>
            <span className="info-modal__bullet-text">
              {line.slice(1).trim()}
            </span>
          </div>
        );
      }

      return (
        <p key={index} className="info-modal__paragraph">
          {line}
        </p>
      );
    });
  };

  return (
    <div className={`info-modal ${isOpen ? "info-modal--open" : ""}`}>
      <div className="info-modal__overlay" onClick={onClose} />

      <div className="info-modal__content">
        <div className="info-modal__header">
          <div className="info-modal__icon">
            <HiInformationCircle />
          </div>
          <h2 className="info-modal__heading">Información de la Tienda</h2>
          <button className="info-modal__close" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <div className="info-modal__body">
          {initialInfo ? (
            <div className="info-modal__text">
              {formatInitialInfo(initialInfo)}
            </div>
          ) : (
            <div className="info-modal__default">
              <HiStar className="info-modal__default-icon" />
              <h3>Bienvenido a nuestro Minimarket</h3>
              <p>
                Ofrecemos productos de calidad con el mejor servicio. ¡Estamos
                aquí para ayudarte!
              </p>

              <div className="info-modal__features">
                <div className="feature-item">
                  <HiShoppingCart className="feature-icon" />
                  <span>Productos de Calidad</span>
                </div>
                <div className="feature-item">
                  <HiClock className="feature-icon" />
                  <span>Horario Extendido</span>
                </div>
                <div className="feature-item">
                  <HiPhone className="feature-icon" />
                  <span>Atención Personalizada</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="info-modal__footer">
          <button className="info-modal__action-btn" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitialInfoModal;
