import "./InitialInfoModal.css";

const InitialInfoModal = ({ isOpen, onClose, initialInfo }) => {
  // FORZAMOS el texto correcto aquí
  const DEFAULT_INFO = `**¡Bienvenido a La Bodeguita!** 🌟

🛒 Productos frescos y de calidad
🚚 Envíos a domicilio
💬 Atención personalizada
📍 Envíos a toda la ciudad
⏰ Horario extendido para tu comodidad`;

  const formatInitialInfo = (text) => {
    // Si no hay texto o es el texto de FarmaExpress, usamos el nuestro
    const finalText =
      !text || text.includes("FarmaExpress") ? DEFAULT_INFO : text;

    return finalText.split("\n").map((line, index) => {
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
            <span className="info-modal__bullet-icon material-symbols-outlined">
              check_circle
            </span>
            <span className="info-modal__bullet-text">{cleanLine}</span>
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
          <div className="info-modal__content">
            {formatInitialInfo(initialInfo)}
          </div>
        </div>

        {/* Footer */}
        <footer className="info-modal__footer">
          <button onClick={onClose} className="info-modal__action-btn">
            ¡Entendido!
          </button>
        </footer>
      </div>
    </div>
  );
};

export default InitialInfoModal;
