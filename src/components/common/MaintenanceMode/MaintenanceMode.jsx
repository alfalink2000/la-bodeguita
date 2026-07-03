import { useState, useEffect } from "react";
import "./MaintenanceMode.css";

const MaintenanceMode = ({ onRetry }) => {
  const [countdown, setCountdown] = useState(30);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (countdown === 0) {
      if (navigator.onLine) {
        onRetry();
      } else {
        setIsOnline(false);
        setCountdown(10);
      }
    }
  };

  return (
    <div className="maintenance">
      <div className="maintenance__container">
        {/* Icono */}
        <div className="maintenance__icon-wrapper">
          <div className="maintenance__wifi">
            <div className="maintenance__wifi-bar maintenance__wifi-bar--1" />
            <div className="maintenance__wifi-bar maintenance__wifi-bar--2" />
            <div className="maintenance__wifi-bar maintenance__wifi-bar--3" />
            <div className="maintenance__wifi-dot" />
          </div>
          <span className="maintenance__emoji material-symbols-outlined">language</span>
        </div>

        {/* Código 404 */}
        <div className="maintenance__code">
          <span className="maintenance__code-digit maintenance__code-digit--error">
            4
          </span>
          <span className="maintenance__code-digit maintenance__code-digit--primary">
            0
          </span>
          <span className="maintenance__code-digit maintenance__code-digit--error">
            4
          </span>
        </div>

        {/* Título */}
        <h1 className="maintenance__title">Error de Conexión</h1>
        <p className="maintenance__subtitle">
          {isOnline
            ? "No se pudo conectar con el servidor"
            : "Sin conexión a internet"}
        </p>

        {/* Mensaje */}
        <div className="maintenance__message">
          <p className="maintenance__message-text">
            {isOnline
              ? "El servidor no está respondiendo. Esto puede ser temporal."
              : "Verifica tu conexión a internet e intenta nuevamente."}
          </p>
          <div className="maintenance__status">
            <div
              className={`maintenance__status-dot ${isOnline ? "maintenance__status-dot--warning" : "maintenance__status-dot--error"}`}
            />
            <p className="maintenance__status-text">
              {isOnline ? "Servidor no disponible" : "Sin conexión a internet"}
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="maintenance__tips">
          <h3 className="maintenance__tips-title">Solución rápida:</h3>
          <ul className="maintenance__tips-list">
            <li className="maintenance__tip-item">
              Verifica tu conexión Wi-Fi o datos móviles
            </li>
            <li className="maintenance__tip-item">Reinicia tu router/módem</li>
            <li className="maintenance__tip-item">
              Desactiva temporalmente el VPN
            </li>
            <li className="maintenance__tip-item">
              Verifica la señal de tu conexión
            </li>
          </ul>
        </div>

        {/* Botón reintentar */}
        <button
          onClick={handleRetry}
          disabled={countdown > 0}
          className={`maintenance__retry-btn ${countdown > 0 ? "maintenance__retry-btn--disabled" : "maintenance__retry-btn--active"}`}
        >
          {countdown > 0 ? (
            <span className="maintenance__retry-content">
              <svg className="maintenance__spinner" viewBox="0 0 24 24">
                <circle
                  className="maintenance__spinner-track"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="maintenance__spinner-head"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Reintentar en {countdown}s
            </span>
          ) : (
            <span className="maintenance__retry-content">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>refresh</span>
              Reintentar Conexión
            </span>
          )}
        </button>

        {/* Barra de progreso */}
        <div className="maintenance__progress">
          <div
            className="maintenance__progress-bar"
            style={{ width: `${((30 - countdown) / 30) * 100}%` }}
          />
        </div>

        {/* Estado de red */}
        <div className="maintenance__network">
          <div className="maintenance__network-status">
            <span className="maintenance__network-label">Estado de red:</span>
            <span
              className={`maintenance__network-value ${isOnline ? "maintenance__network-value--online" : "maintenance__network-value--offline"}`}
            >
              {isOnline ? "Conectado" : "Desconectado"}
            </span>
          </div>
          <p className="maintenance__network-help">
            Si el problema persiste, contacta a tu proveedor de internet
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
