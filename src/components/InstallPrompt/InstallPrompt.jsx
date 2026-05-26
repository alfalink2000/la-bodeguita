// components/InstallPrompt/InstallPrompt.jsx - VERSIÓN MEJORADA
import { useState, useEffect } from "react";
import "./InstallPrompt.css";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Verificar si ya está instalada
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      console.log("✅ App ya está instalada");
      return;
    }

    // Escuchar evento de instalación (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      console.log("🎯 Evento beforeinstallprompt detectado");
      e.preventDefault();
      setDeferredPrompt(e);

      // Mostrar prompt después de 3 segundos
      setTimeout(() => {
        if (!isInstalled && !localStorage.getItem("installPromptClosed")) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Detectar instalación exitosa
    window.addEventListener("appinstalled", () => {
      console.log("✅ App instalada exitosamente");
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    // Verificar si es la primera visita
    const hasVisited = localStorage.getItem("hasVisited");
    if (!hasVisited) {
      localStorage.setItem("hasVisited", "true");
      // Mostrar mensaje de bienvenida para iOS después de 5 segundos
      if (isIOSDevice) {
        setTimeout(() => {
          if (!localStorage.getItem("installPromptClosed")) {
            setShowPrompt(true);
          }
        }, 5000);
      }
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("✅ Usuario aceptó la instalación");
      setShowPrompt(false);
    } else {
      console.log("❌ Usuario rechazó la instalación");
    }

    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem("installPromptClosed", "true");
  };

  // No mostrar si ya está instalado
  if (isInstalled) return null;

  // iOS
  if (isIOS && showPrompt) {
    return (
      <div className="install-prompt ios">
        <div className="install-prompt__content">
          <button className="install-prompt__close" onClick={handleClose}>
            ×
          </button>
          <div className="install-prompt__icon">📱</div>
          <h3 className="install-prompt__title">Instalar App</h3>
          <p className="install-prompt__text">
            Instala nuestra app para acceder más rápido:
          </p>
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
          <button className="install-prompt__button" onClick={handleClose}>
            Entendido
          </button>
        </div>
      </div>
    );
  }

  // Android/Desktop
  if (showPrompt) {
    return (
      <div className="install-prompt">
        <div className="install-prompt__content">
          <button className="install-prompt__close" onClick={handleClose}>
            ×
          </button>
          <div className="install-prompt__icon">🚀</div>
          <h3 className="install-prompt__title">¡Instala nuestra App!</h3>
          <p className="install-prompt__text">
            Accede más rápido y no pierdas el enlace
          </p>
          <div className="install-prompt__benefits">
            <span>⚡ Más rápido</span>
            <span>📌 Icono en pantalla</span>
            <span>💾 Sin perder el acceso</span>
          </div>
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
  }

  return null;
};

export default InstallPrompt;
