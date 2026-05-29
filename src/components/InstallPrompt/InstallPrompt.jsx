// components/InstallPrompt/InstallPrompt.jsx
import { useState, useEffect } from "react";
import "./InstallPrompt.css";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installSupported, setInstallSupported] = useState(true);

  // ✅ Verificar si ya fue instalada (desde localStorage)
  const checkIfAppWasInstalled = () => {
    const wasInstalled = localStorage.getItem("app_was_installed") === "true";
    if (wasInstalled) {
      console.log("✅ App ya fue instalada previamente (desde localStorage)");
      setIsInstalled(true);
      return true;
    }
    return false;
  };

  // ✅ Verificar modo standalone (abierto desde el icono)
  const checkStandaloneMode = () => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      console.log("✅ App abierta en modo standalone");
      setIsInstalled(true);
      return true;
    }
    return false;
  };

  useEffect(() => {
    // 1. Verificar si está abierta en modo standalone
    if (checkStandaloneMode()) {
      return;
    }

    // 2. Verificar si ya fue instalada en el pasado
    if (checkIfAppWasInstalled()) {
      return;
    }

    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Escuchar evento de instalación (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      console.log("✅ beforeinstallprompt capturado");
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallSupported(true);

      // Verificar nuevamente antes de mostrar
      if (!checkStandaloneMode() && !checkIfAppWasInstalled()) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // ✅ Cuando se instala la app, guardar en localStorage
    const handleAppInstalled = () => {
      console.log("✅ App instalada exitosamente - guardando en localStorage");
      localStorage.setItem("app_was_installed", "true");
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Si después de 5 segundos no se disparó el evento
    const timeout = setTimeout(() => {
      if (
        !deferredPrompt &&
        !checkStandaloneMode() &&
        !checkIfAppWasInstalled()
      ) {
        console.warn(
          "⚠️ beforeinstallprompt no se disparó. PWA no instalable automáticamente.",
        );
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

  // ✅ No mostrar si ya está instalada (modo standalone o por localStorage)
  if (isInstalled) {
    console.log("🔒 App ya instalada, no mostrar prompt");
    return null;
  }

  if (!showPrompt) return null;

  return (
    <div className={`install-prompt ${isIOS ? "ios" : ""}`}>
      <div className="install-prompt__content">
        <button className="install-prompt__close" onClick={handleClose}>
          ×
        </button>
        <div className="install-prompt__icon">{isIOS ? "📱" : "🚀"}</div>
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
            <p>
              🔧 <strong>Instalación manual:</strong>
            </p>
            <ol>
              <li>Abre el menú del navegador (⋮)</li>
              <li>
                Selecciona "Instalar aplicación" o "Agregar a pantalla de
                inicio"
              </li>
            </ol>
          </div>
        )}

        {isIOS && (
          <ol className="install-prompt__steps">
            <li>
              Toca <strong>Compartir</strong>{" "}
              <span className="ios-icon">⎙</span>
            </li>
            <li>
              Desplázate y toca <strong>Agregar a pantalla de inicio</strong>
            </li>
            <li>
              Toca <strong>Agregar</strong>
            </li>
          </ol>
        )}

        <div className="install-prompt__buttons">
          <button
            className="install-prompt__button--primary"
            onClick={handleInstallClick}
          >
            Instalar ahora
          </button>
          <button
            className="install-prompt__button--secondary"
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
