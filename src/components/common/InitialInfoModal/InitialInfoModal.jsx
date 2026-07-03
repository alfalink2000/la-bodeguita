import "./InitialInfoModal.css";

const InitialInfoModal = ({ isOpen, onClose, initialInfo }) => {
  const formatInitialInfo = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, index) => {
      if (line.trim() === "") return <br key={index} />;
      if (line.includes("**")) {
        const cleanLine = line.replace(/\*\*/g, "");
        return (
          <h3 key={index} className="info-modal__section-title">
            {cleanLine}
          </h3>
        );
      }
      const cleanLine = line.replace(/^[🛒⏰🚚💬📍🕒🎯🌟⭐✨]\s*/g, "").trim();
      if (cleanLine.length > 0 && cleanLine !== line.trim()) {
        return (
          <div key={index} className="info-modal__bullet">
            <span className="info-modal__bullet-icon material-symbols-outlined">check_circle</span>
            <span className="info-modal__bullet-text">
              {cleanLine}
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
    <div
      className={`info-modal ${isOpen ? "info-modal--visible" : "info-modal--hidden"}`}
      role="dialog"
      aria-modal="true"
      aria-label="Información de la Tienda"
    >
      <div className="info-modal__overlay" onClick={onClose} />
      <div className="info-modal__container">
        {/* Header */}
        <header className="info-modal__header">
          <div className="info-modal__header-left">
            <div className="info-modal__header-icon-wrapper">
              <span className="info-modal__header-icon material-symbols-outlined">
                info
              </span>
            </div>
            <h2 className="info-modal__title">Información de la Tienda</h2>
          </div>
          <button
            onClick={onClose}
            className="info-modal__close-btn"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Body */}
        <div className="info-modal__body">
          {initialInfo ? (
            <div className="info-modal__content">
              {formatInitialInfo(initialInfo)}
            </div>
          ) : (
            <div className="info-modal__default">
              <span className="info-modal__default-icon material-symbols-outlined">
                storefront
              </span>
              <h3 className="info-modal__default-title">
                Bienvenido a nuestro Minimarket
              </h3>
              <p className="info-modal__default-text">
                Ofrecemos productos de calidad con el mejor servicio. ¡Estamos
                aquí para ayudarte!
              </p>

              <div className="info-modal__features">
                <div className="info-modal__feature-item">
                  <span className="info-modal__feature-icon material-symbols-outlined">
                    verified
                  </span>
                  <span className="info-modal__feature-text">
                    Productos de Calidad
                  </span>
                </div>
                <div className="info-modal__feature-item">
                  <span className="info-modal__feature-icon material-symbols-outlined">
                    schedule
                  </span>
                  <span className="info-modal__feature-text">
                    Horario Extendido
                  </span>
                </div>
                <div className="info-modal__feature-item">
                  <span className="info-modal__feature-icon material-symbols-outlined">
                    support_agent
                  </span>
                  <span className="info-modal__feature-text">
                    Atención Personalizada
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="info-modal__footer">
          <button onClick={onClose} className="info-modal__action-btn">
            Entendido
          </button>
        </footer>
      </div>
    </div>
  );
};

export default InitialInfoModal;
