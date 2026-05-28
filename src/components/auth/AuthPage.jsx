// components/auth/AuthPage.jsx
import { useState } from "react";
import Swal from "sweetalert2";
import {
  FaUser,
  FaLock,
  FaUserPlus,
  FaPhone,
  FaMapMarkerAlt,
  FaLocationArrow,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import { HiShoppingBag } from "react-icons/hi";
import "./Auth.css";
import "./Auth.desktop.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const AuthPage = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [error, setError] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressError, setAddressError] = useState("");

  // Formulario login
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  // Formulario registro
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    phone: "",
    address: "",
    lat: null,
    lng: null,
  });

  // ✅ VALIDACIÓN DE DIRECCIÓN
  const validateAddress = (address, lat, lng) => {
    if (!address || address.trim() === "") {
      setAddressError(
        "📝 ¡Necesitamos tu dirección! Por favor, ingresa dónde vives para poder entregarte tus pedidos.",
      );
      return false;
    }

    const trimmedAddress = address.trim();

    if (trimmedAddress.length < 10) {
      setAddressError(
        `📍 "${trimmedAddress}" es muy corto. Una dirección debe tener al menos 10 caracteres.`,
      );
      return false;
    }

    const coordinatesPattern = /^-?\d+\.\d+,\s*-?\d+\.\d+$/;
    if (coordinatesPattern.test(trimmedAddress)) {
      setAddressError(
        "🌍 Solo ingresaste coordenadas. Por favor, escribe una dirección completa.",
      );
      return false;
    }

    const hasNumbers = /\d/.test(trimmedAddress);
    const hasLetters = /[a-zA-Záéíóúñ]/i.test(trimmedAddress);

    if (!hasNumbers || !hasLetters) {
      setAddressError(
        "🏠 La dirección debe incluir el número de la casa y el nombre de la calle.",
      );
      return false;
    }

    if (gpsActive && (!lat || !lng)) {
      setAddressError(
        "📡 No pudimos obtener tu ubicación GPS. Activa la ubicación o escribe tu dirección manualmente.",
      );
      return false;
    }

    if (!gpsActive && (!lat || !lng)) {
      const commonWords =
        /(calle|avenida|av|carrera|cr|transversal|entre|#|no|numero|km|sector|reparto|barrio|urbanización)/i;

      if (!commonWords.test(trimmedAddress)) {
        setAddressError(
          "🔍 Sé más específico. Incluye calle, número y referencia.",
        );
        return false;
      }

      if (!/\d/.test(trimmedAddress)) {
        setAddressError(
          "🔢 ¿Cuál es el número de tu casa? Por favor, incluye el número.",
        );
        return false;
      }
    }

    setAddressError("");
    return true;
  };

  const showSuccessAlertAndRedirect = async (title, message, userData) => {
    await Swal.fire({
      title: title,
      text: message,
      icon: "success",
      confirmButtonText: "¡Continuar!",
      confirmButtonColor: "#059669",
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    onLoginSuccess(userData);
  };

  const showErrorAlert = (message, title = "¡Oops! Algo salió mal") => {
    Swal.fire({
      title: title,
      html: `<div style="text-align: left;">
               <p>${message}</p>
               <hr />
               <p style="font-size: 0.9rem; color: #6b7280;">
                 💡 Revisa el campo en rojo para más detalles.
               </p>
             </div>`,
      icon: "error",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#ef4444",
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginForm.username,
          password_hash: loginForm.password,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        localStorage.setItem("token", data.token);
        await showSuccessAlertAndRedirect(
          "¡Bienvenido!",
          `Has iniciado sesión correctamente`,
          data,
        );
      } else {
        const errorMsg = data.msg || "Error al iniciar sesión";
        setError(errorMsg);
        showErrorAlert(errorMsg, "Error de autenticación");
      }
    } catch (err) {
      const errorMsg = "Error de conexión con el servidor";
      setError(errorMsg);
      showErrorAlert(errorMsg, "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setAddressError("");

    const isValidAddress = validateAddress(
      registerForm.address,
      registerForm.lat,
      registerForm.lng,
    );

    if (!isValidAddress) {
      Swal.fire({
        title: "📝 Dirección incompleta",
        html: `<div style="text-align: left;">
                 <div style="background: #fef2f2; padding: 12px; border-radius: 8px; margin: 10px 0;">
                   <p style="color: #dc2626; margin: 0;">${addressError}</p>
                 </div>
                 <p style="margin-top: 15px;">💡 Ejemplo: "Calle 23 #456 entre L y M, Vedado"</p>
               </div>`,
        icon: "warning",
        confirmButtonText: "Corregir dirección",
        confirmButtonColor: "#f59e0b",
        showCancelButton: true,
        cancelButtonText: "Usar GPS",
        cancelButtonColor: "#10b981",
      }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
          getGPSLocation();
        }
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerForm.username,
          password_hash: registerForm.password,
          full_name: registerForm.username,
          phone: registerForm.phone,
          address: registerForm.address.trim(),
          lat: registerForm.lat,
          lng: registerForm.lng,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        localStorage.setItem("token", data.token);
        await showSuccessAlertAndRedirect(
          "¡Registro exitoso! 🎊",
          `¡Bienvenido/a ${registerForm.username}!`,
          data,
        );
      } else {
        const errorMsg = data.msg || "Error al registrarse";
        setError(errorMsg);
        showErrorAlert(errorMsg, "Error de registro");
      }
    } catch (err) {
      const errorMsg = "Error de conexión con el servidor";
      setError(errorMsg);
      showErrorAlert(errorMsg, "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSearch = async (address) => {
    if (gpsActive) return;

    setRegisterForm({ ...registerForm, address });

    if (address && address.length >= 5) {
      validateAddress(address, registerForm.lat, registerForm.lng);
    } else if (address && address.length > 0 && address.length < 5) {
      setAddressError("✏️ Sigue escribiendo... Mínimo 10 caracteres.");
    } else if (!address) {
      setAddressError("");
    }

    if (address.length < 5) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/geocoding/geocode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, city: "La Habana" }),
      });
      const data = await res.json();

      if (data.ok) {
        setAddressSuggestions([data]);
      } else {
        setAddressSuggestions([]);
      }
    } catch (err) {
      console.error("Error buscando dirección:", err);
    }
  };

  const selectAddress = (suggestion) => {
    if (gpsActive) return;

    setRegisterForm({
      ...registerForm,
      address: suggestion.display_name,
      lat: suggestion.lat,
      lng: suggestion.lng,
    });
    setAddressSuggestions([]);
    setAddressError("");
    setError(null);
    validateAddress(suggestion.display_name, suggestion.lat, suggestion.lng);

    Swal.fire({
      title: "✅ ¡Dirección válida!",
      text: "Tu dirección ha sido reconocida correctamente.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const getGPSLocation = () => {
    setGpsLoading(true);
    setError(null);
    setAddressError("");
    setGpsActive(true);

    if (!navigator.geolocation) {
      showErrorAlert(
        "Tu navegador no soporta geolocalización.",
        "GPS no soportado",
      );
      setGpsLoading(false);
      setGpsActive(false);
      return;
    }

    Swal.fire({
      title: "📍 Obteniendo tu ubicación",
      text: "Por favor espera...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(`${API_URL}/api/geocoding/reverse`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          const data = await res.json();

          let addressText =
            data.ok && data.display_name
              ? data.display_name
              : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          setRegisterForm({
            ...registerForm,
            lat: latitude,
            lng: longitude,
            address: addressText,
          });

          validateAddress(addressText, latitude, longitude);

          Swal.fire({
            title: "📍 ¡Ubicación registrada!",
            text:
              addressText.length > 80
                ? addressText.substring(0, 80) + "..."
                : addressText,
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (err) {
          const coordText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setRegisterForm({
            ...registerForm,
            lat: latitude,
            lng: longitude,
            address: coordText,
          });
          setAddressError(
            "⚠️ No pudimos obtener una dirección clara. Por favor, escribe tu dirección manualmente.",
          );

          Swal.fire({
            title: "📍 Ubicación obtenida",
            text: "Por favor, completa tu dirección manualmente.",
            icon: "info",
            confirmButtonText: "Entendido",
          });
        }
        setGpsLoading(false);
        Swal.close();
      },
      (err) => {
        let errorMsg = "";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg =
              "Permiso de ubicación denegado. Escribe tu dirección manualmente.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg =
              "Ubicación no disponible. Escribe tu dirección manualmente.";
            break;
          case err.TIMEOUT:
            errorMsg =
              "Tiempo de espera agotado. Escribe tu dirección manualmente.";
            break;
          default:
            errorMsg =
              "Error obteniendo ubicación. Escribe tu dirección manualmente.";
        }

        showErrorAlert(errorMsg, "Error de GPS");
        setGpsLoading(false);
        setGpsActive(false);
        Swal.close();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
      </div>

      <div className="auth-card" data-tab={activeTab}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <HiShoppingBag size={28} />
          </div>
          <h1>FarmaExpress</h1>
          <p>Tu salud, nuestra prioridad</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("login");
              setError(null);
              setAddressError("");
            }}
          >
            <FaUser size={12} /> Iniciar
          </button>
          <button
            className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("register");
              setError(null);
              setAddressError("");
            }}
          >
            <FaUserPlus size={12} /> Registrarse
          </button>
        </div>

        {error && (
          <div className="form-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {activeTab === "login" && (
          <form className="auth-form auth-form--login" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">
                <FaUser size={10} /> Usuario
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Usuario"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaLock size={10} /> Contraseña
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Contraseña"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                required
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="auth-spinner"></span> : "Ingresar"}
            </button>
          </form>
        )}

        {activeTab === "register" && (
          <form
            className="auth-form auth-form--register"
            onSubmit={handleRegister}
          >
            {/* Fila 1: Usuario y Contraseña */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FaUser size={10} /> Usuario *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nombre de usuario"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      username: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FaLock size={10} /> Contraseña *
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      password: e.target.value,
                    })
                  }
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Fila 2: Teléfono y Dirección (solo campo) */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <FaPhone size={10} /> Teléfono
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+53 5XXXXXXXX"
                  value={registerForm.phone}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, phone: e.target.value })
                  }
                />
              </div>

              <div className="form-group full-width-on-mobile">
                <label className="form-label">
                  <FaMapMarkerAlt size={10} /> Dirección Habitual *
                  <span className="required-badge">Obligatorio</span>
                </label>
              </div>
            </div>

            {/* Sección de dirección completa (ocupa ancho completo) */}
            <div className="form-full-width">
              <div className="location-section">
                <button
                  type="button"
                  className="gps-main-btn"
                  onClick={getGPSLocation}
                  disabled={gpsLoading}
                >
                  {gpsLoading ? (
                    <>
                      <div className="gps-spinner"></div>
                      <span>Obteniendo ubicación...</span>
                    </>
                  ) : gpsActive ? (
                    <>
                      <FaLocationArrow size={18} />
                      <span>✓ Ubicación GPS activa</span>
                    </>
                  ) : (
                    <>
                      <FaLocationArrow size={18} />
                      <span>Usar mi ubicación actual</span>
                    </>
                  )}
                </button>

                {!gpsActive && (
                  <div className="gps-info-card">
                    <div className="gps-info-icon">📍</div>
                    <div className="gps-info-text">
                      <strong>¡Mejor experiencia con GPS!</strong>
                      <p>Entregas más rápidas y precisas.</p>
                    </div>
                  </div>
                )}

                {gpsActive && (
                  <div className="gps-active-indicator">
                    <span>📍</span>
                    <strong>Usando ubicación GPS</strong>
                    <p>Tu dirección ha sido obtenida automáticamente.</p>
                  </div>
                )}

                {!gpsActive && (
                  <div className="location-divider">
                    <span>o escribe tu dirección manualmente</span>
                  </div>
                )}

                <div className="address-input-wrapper">
                  <input
                    type="text"
                    className={`form-input ${addressError ? "form-input--error" : registerForm.address && !addressError && registerForm.address.length >= 10 ? "form-input--success" : ""}`}
                    placeholder={
                      gpsActive
                        ? "Dirección obtenida por GPS"
                        : "Ej: Calle 23 #456 entre L y M, Vedado"
                    }
                    value={registerForm.address}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                    disabled={gpsActive}
                    required
                  />

                  {addressError && (
                    <div className="input-status-icon error">
                      <FaExclamationTriangle />
                    </div>
                  )}
                  {registerForm.address &&
                    !addressError &&
                    registerForm.address.length >= 10 && (
                      <div className="input-status-icon success">
                        <FaCheckCircle />
                      </div>
                    )}
                </div>

                {addressError && (
                  <div className="address-error-message">
                    <div className="error-icon">⚠️</div>
                    <div className="error-content">
                      <strong>¡Dirección incompleta!</strong>
                      <p>{addressError}</p>
                    </div>
                  </div>
                )}

                {!addressError && !registerForm.address && !gpsActive && (
                  <div className="address-helper">
                    <div className="helper-icon">📝</div>
                    <div className="helper-content">
                      <strong>Ejemplo:</strong>
                      <small>
                        "Calle 23 #456 entre L y M, Vedado, La Habana"
                      </small>
                    </div>
                  </div>
                )}

                {registerForm.address &&
                  !addressError &&
                  registerForm.address.length >= 10 && (
                    <div className="address-success-message">
                      <FaCheckCircle />
                      <div>
                        <strong>¡Dirección válida!</strong>
                      </div>
                    </div>
                  )}

                {!gpsActive && addressSuggestions.length > 0 && (
                  <div className="address-suggestions">
                    {addressSuggestions.map((suggestion, i) => (
                      <div
                        key={i}
                        className="address-suggestion-item"
                        onClick={() => selectAddress(suggestion)}
                      >
                        📍 {suggestion.display_name.substring(0, 60)}
                      </div>
                    ))}
                  </div>
                )}

                {gpsActive && (
                  <button
                    type="button"
                    className="unlock-manual-btn"
                    onClick={() => {
                      Swal.fire({
                        title: "¿Usar dirección manual?",
                        text: "La ubicación GPS será ignorada.",
                        icon: "question",
                        showCancelButton: true,
                        confirmButtonColor: "#059669",
                        cancelButtonColor: "#ef4444",
                        confirmButtonText: "Sí",
                        cancelButtonText: "Cancelar",
                      }).then((result) => {
                        if (result.isConfirmed) {
                          setGpsActive(false);
                          setRegisterForm({
                            ...registerForm,
                            lat: null,
                            lng: null,
                          });
                          setAddressError("");
                        }
                      });
                    }}
                  >
                    ✏️ Usar dirección manual
                  </button>
                )}
              </div>
            </div>

            <div className="auth-terms">
              <span>Al registrarte aceptas nuestros términos</span>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading || (!gpsActive && !registerForm.address)}
            >
              {loading ? (
                <span className="auth-spinner"></span>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            {activeTab === "login" ? "¿Sin cuenta? " : "¿Ya tienes cuenta? "}
            <button
              className="auth-switch-btn"
              onClick={() => {
                setActiveTab(activeTab === "login" ? "register" : "login");
                setError(null);
                setAddressError("");
              }}
            >
              {activeTab === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
