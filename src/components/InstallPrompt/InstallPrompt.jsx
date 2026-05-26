// components/InstallPrompt/InstallPrompt.jsx
import { useState, useEffect } from "react";
import "./InstallPrompt.css";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installSupported, setInstallSupported] = useState(true);

  useEffect(() => {
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Verificar si ya está instalada
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Escuchar evento de instalación (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      console.log("✅ beforeinstallprompt capturado");
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallSupported(true);
      // Mostrar el botón personalizado inmediatamente
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Si después de 5 segundos no se disparó el evento, asumimos que no es instalable
    const timeout = setTimeout(() => {
      if (!deferredPrompt && !isStandalone) {
        console.warn(
          "⚠️ beforeinstallprompt no se disparó. PWA no instalable automáticamente.",
        );
        setInstallSupported(false);
        // Mostrar el botón de todos modos con instrucciones manuales
        setShowPrompt(true);
      }
    }, 5000);

    // Detectar instalación exitosa
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
    });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Instalación automática
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Si no hay deferredPrompt, mostrar instrucciones manuales
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

  if (isInstalled || !showPrompt) return null;

  // Estilos y estructura (similar a la tuya, pero con mensajes adaptados)
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
