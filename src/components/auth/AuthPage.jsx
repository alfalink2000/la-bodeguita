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
} from "react-icons/fa";
import { HiShoppingBag } from "react-icons/hi";
import "./Auth.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const AuthPage = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);

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

  const showSuccessAlertAndRedirect = async (title, message, userData) => {
    await Swal.fire({
      title: title,
      text: message,
      icon: "success",
      confirmButtonText: "¡Continuar!",
      confirmButtonColor: "#059669",
      background: "#ffffff",
      iconColor: "#059669",
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    onLoginSuccess(userData);
  };

  const showErrorAlert = (message) => {
    Swal.fire({
      title: "¡Error!",
      text: message,
      icon: "error",
      confirmButtonText: "Intentar de nuevo",
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
        showErrorAlert(errorMsg);
      }
    } catch (err) {
      const errorMsg = "Error de conexión con el servidor";
      setError(errorMsg);
      showErrorAlert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
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
          address: registerForm.address || "",
          lat: registerForm.lat,
          lng: registerForm.lng,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        localStorage.setItem("token", data.token);

        // Mostrar mensaje diferente si no tiene ubicación
        const successMessage =
          registerForm.lat && registerForm.lng
            ? `Bienvenido/a ${registerForm.username}. Tu ubicación ha sido registrada.`
            : `Bienvenido/a ${registerForm.username}. Recuerda que puedes agregar tu dirección de entrega en tu perfil.`;

        await showSuccessAlertAndRedirect(
          "¡Registro exitoso! 🎊",
          successMessage,
          data,
        );
      } else {
        const errorMsg = data.msg || "Error al registrarse";
        setError(errorMsg);
        showErrorAlert(errorMsg);
      }
    } catch (err) {
      const errorMsg = "Error de conexión con el servidor";
      setError(errorMsg);
      showErrorAlert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSearch = async (address) => {
    setRegisterForm({ ...registerForm, address });

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
    setRegisterForm({
      ...registerForm,
      address: suggestion.display_name,
      lat: suggestion.lat,
      lng: suggestion.lng,
    });
    setAddressSuggestions([]);
    setError(null);
  };

  const getGPSLocation = () => {
    setGpsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      const errorMsg =
        "Tu navegador no soporta geolocalización. Puedes escribir tu dirección manualmente o agregarla después en tu perfil.";
      setError(errorMsg);
      showErrorAlert(errorMsg);
      setGpsLoading(false);
      return;
    }

    Swal.fire({
      title: "Obteniendo ubicación",
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

          setRegisterForm({
            ...registerForm,
            lat: latitude,
            lng: longitude,
            address:
              data.display_name ||
              `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });

          Swal.fire({
            title: "📍 Ubicación agregada",
            text: "Tu dirección ha sido registrada. Puedes cambiarla después en tu perfil.",
            icon: "success",
            confirmButtonColor: "#059669",
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (err) {
          setRegisterForm({
            ...registerForm,
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });

          Swal.fire({
            title: "📍 Ubicación registrada",
            text: "Coordenadas guardadas. Puedes editar la dirección después.",
            icon: "success",
            confirmButtonColor: "#059669",
            timer: 2000,
            showConfirmButton: false,
          });
        }
        setGpsLoading(false);
      },
      (err) => {
        let errorMsg = "No se pudo obtener tu ubicación. ";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg =
              "Permiso denegado. Puedes escribir tu dirección manualmente o agregarla después en tu perfil.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg =
              "Ubicación no disponible. Puedes escribir tu dirección manualmente o agregarla después en tu perfil.";
            break;
          case err.TIMEOUT:
            errorMsg =
              "Tiempo de espera agotado. Puedes escribir tu dirección manualmente o agregarla después en tu perfil.";
            break;
          default:
            errorMsg =
              "Error obteniendo ubicación. Puedes agregar tu dirección después en tu perfil.";
        }
        setError(errorMsg);
        showErrorAlert(errorMsg);
        setGpsLoading(false);
        Swal.close();
      },
      { enableHighAccuracy: true, timeout: 10000 },
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

      <div className="auth-card">
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
            }}
          >
            <FaUser size={12} /> Iniciar
          </button>
          <button
            className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("register");
              setError(null);
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
          <form className="auth-form" onSubmit={handleLogin}>
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
              {loading ? (
                <span className="auth-loading">
                  <span className="auth-spinner"></span>
                </span>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>
        )}

        {activeTab === "register" && (
          <form className="auth-form" onSubmit={handleRegister}>
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
                  setRegisterForm({ ...registerForm, username: e.target.value })
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
                  setRegisterForm({ ...registerForm, password: e.target.value })
                }
                required
                minLength={6}
              />
            </div>

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

            {/* SECCIÓN DE UBICACIÓN MEJORADA */}
            <div className="form-group location-section">
              <label className="form-label">
                <FaMapMarkerAlt size={10} /> Dirección de entrega
                <span className="optional-badge">Opcional</span>
              </label>

              {/* Botón GPS grande y visible */}
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
                ) : (
                  <>
                    <FaLocationArrow size={18} />
                    <span>Usar mi ubicación actual</span>
                  </>
                )}
              </button>

              {/* Info de beneficios */}
              <div className="gps-info-card">
                <div className="gps-info-icon">📍</div>
                <div className="gps-info-text">
                  <strong>¡Mejor experiencia con GPS!</strong>
                  <p>
                    Usar tu ubicación actual permite entregas más rápidas y
                    precisas. Las direcciones manuales pueden generar demoras y
                    necesitan verificación por soporte.
                  </p>
                </div>
              </div>

              {/* Separador o */}
              <div className="location-divider">
                <span>o escribe tu dirección manualmente</span>
              </div>

              {/* Campo de dirección manual */}
              <div className="address-input-wrapper">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Calle 23 #456, Vedado, La Habana"
                  value={registerForm.address}
                  onChange={(e) => handleAddressSearch(e.target.value)}
                />
              </div>

              {/* Sugerencias */}
              {addressSuggestions.length > 0 && (
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

              {/* Indicador de ubicación registrada */}
              {registerForm.lat && registerForm.lng && (
                <div className="location-confirmed">
                  <span>✅</span> Ubicación registrada correctamente
                </div>
              )}
            </div>

            <div className="auth-terms">
              <span>Al registrarte aceptas nuestros términos</span>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span className="auth-loading">
                  <span className="auth-spinner"></span>
                </span>
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
