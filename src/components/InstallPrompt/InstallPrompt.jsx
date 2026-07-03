import { useState, useEffect } from "react";
import "./InstallPrompt.css";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installSupported, setInstallSupported] = useState(true);

  const checkIfAppWasInstalled = () => {
    const wasInstalled = localStorage.getItem("app_was_installed") === "true";
    if (wasInstalled) {
      setIsInstalled(true);
      return true;
    }
    return false;
  };

  const checkStandaloneMode = () => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (checkStandaloneMode()) return;
    if (checkIfAppWasInstalled()) return;

    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallSupported(true);

      if (!checkStandaloneMode() && !checkIfAppWasInstalled()) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      localStorage.setItem("app_was_installed", "true");
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    const timeout = setTimeout(() => {
      if (
        !deferredPrompt &&
        !checkStandaloneMode() &&
        !checkIfAppWasInstalled()
      ) {
        setInstallSupported(false);
        setShowPrompt(true);
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      if (isIOS) {
        alert(
          "Para instalar en iOS: toca Compartir → 'Agregar a pantalla de inicio'",
        );
      } else {
        alert(
          "Abre el menú del navegador (tres puntos) y selecciona 'Instalar aplicación' o 'Agregar a pantalla de inicio'.",
        );
      }
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem("installPromptClosed", "true");
  };

  if (isInstalled) return null;
  if (!showPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt__container">
        <button
          className="install-prompt__close"
          onClick={handleClose}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="install-prompt__icon-wrap">
          <span className="material-symbols-outlined install-prompt__icon">{isIOS ? "phone_iphone" : "rocket_launch"}</span>
        </div>

        <h3 className="install-prompt__title">
          {isIOS ? "Instalar App" : "¡Instala nuestra App!"}
        </h3>

        <p className="install-prompt__text">
          {installSupported
            ? "Haz clic en 'Instalar ahora' para agregar el icono a tu pantalla de inicio."
            : "Para acceder rápidamente, instala esta app en tu dispositivo:"}
        </p>

        {!installSupported && !isIOS && (
          <div className="install-prompt__manual">
            <p className="install-prompt__manual-title">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", verticalAlign: "middle" }}>build</span> <strong>Instalación manual:</strong>
            </p>
            <ol className="install-prompt__list">
              <li>Abre el menú del navegador (⋮)</li>
              <li>Selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"</li>
            </ol>
          </div>
        )}

        {isIOS && (
          <ol className="install-prompt__manual">
            {[
              ['Toca', 'Compartir', '⎙'],
              ['Desplázate y toca', 'Agregar a pantalla de inicio', ''],
              ['Toca', 'Agregar', ''],
            ].map(([before, bold, icon], i) => (
              <li key={i}>
                {i + 1}. {before} <strong>{bold}</strong> {icon && <span>{icon}</span>}
              </li>
            ))}
          </ol>
        )}

        <div className="install-prompt__actions">
          <button
            className="install-prompt__btn install-prompt__btn--primary"
            onClick={handleInstallClick}
          >
            Instalar ahora
          </button>
          <button
            className="install-prompt__btn install-prompt__btn--secondary"
            onClick={handleClose}
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
