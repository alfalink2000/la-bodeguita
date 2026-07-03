import { useState } from "react";
import Swal from "sweetalert2";
import "./AuthPage.css";

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

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    phone: "",
    address: "",
    lat: null,
    lng: null,
  });

  const validateAddress = (address, lat, lng) => {
    if (!address || address.trim() === "") {
      setAddressError(
        "Ingresa tu dirección para poder entregarte tus pedidos.",
      );
      return false;
    }
    const trimmedAddress = address.trim();
    if (trimmedAddress.length < 10) {
      setAddressError(
        `"${trimmedAddress}" es muy corto. La dirección debe tener al menos 10 caracteres.`,
      );
      return false;
    }
    const coordinatesPattern = /^-?\d+\.\d+,\s*-?\d+\.\d+$/;
    if (coordinatesPattern.test(trimmedAddress)) {
      setAddressError(
        "Solo ingresaste coordenadas. Escribe una dirección completa.",
      );
      return false;
    }
    const hasNumbers = /\d/.test(trimmedAddress);
    const hasLetters = /[a-zA-Záéíóúñ]/i.test(trimmedAddress);
    if (!hasNumbers || !hasLetters) {
      setAddressError(
        "La dirección debe incluir el número de casa y el nombre de la calle.",
      );
      return false;
    }
    if (gpsActive && (!lat || !lng)) {
      setAddressError(
        "No pudimos obtener tu ubicación GPS. Activa la ubicación o escribe tu dirección manualmente.",
      );
      return false;
    }
    setAddressError("");
    return true;
  };

  const showSuccessAlertAndRedirect = async (title, message, userData) => {
    await Swal.fire({
      title,
      text: message,
      icon: "success",
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    onLoginSuccess(userData);
  };

  const showErrorAlert = (message, title = "Algo salió mal") => {
    Swal.fire({
      title,
      text: message,
      icon: "error",
      confirmButtonText: "Entendido",
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
          "Has iniciado sesión correctamente",
          data,
        );
      } else {
        setError(data.msg || "Error al iniciar sesión");
        showErrorAlert(
          data.msg || "Error al iniciar sesión",
          "Error de autenticación",
        );
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
      showErrorAlert("Error de conexión con el servidor", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setAddressError("");
    if (
      !validateAddress(registerForm.address, registerForm.lat, registerForm.lng)
    ) {
      Swal.fire({
        title: "Dirección incompleta",
        html: `<p>${addressError}</p>`,
        icon: "warning",
        confirmButtonText: "Corregir dirección",
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
          "¡Registro exitoso!",
          `¡Bienvenido/a ${registerForm.username}!`,
          data,
        );
      } else {
        setError(data.msg || "Error al registrarse");
        showErrorAlert(data.msg || "Error al registrarse", "Error de registro");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
      showErrorAlert("Error de conexión con el servidor", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSearch = async (address) => {
    if (gpsActive) return;
    setRegisterForm({ ...registerForm, address });
    if (address && address.length >= 5)
      validateAddress(address, registerForm.lat, registerForm.lng);
    else if (address && address.length > 0 && address.length < 5)
      setAddressError("Sigue escribiendo... Mínimo 10 caracteres.");
    else if (!address) setAddressError("");
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
      if (data.ok) setAddressSuggestions([data]);
      else setAddressSuggestions([]);
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
      title: "¡Dirección válida!",
      text: "Tu dirección ha sido reconocida.",
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
      title: "Obteniendo tu ubicación",
      text: "Por favor espera...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
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
          const addressText =
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
            title: "¡Ubicación registrada!",
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
            "No pudimos obtener una dirección clara. Por favor, escribe tu dirección manualmente.",
          );
          Swal.fire({
            title: "Ubicación obtenida",
            text: "Completa tu dirección manualmente.",
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
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return (
    <div className="auth-page" role="main">
      {/* ============================================ */}
      {/* HERO - Imagen decorativa (Desktop)             */}
      {/* ============================================ */}
      <div
        className="auth-page__hero"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCIsgbu1zT3oCLZvFRE3mJ6DtuxMs0mKb5kNtW1Q5RQT8PCX-frDts15SRV3L6-f1O93EKVlfXbyMmH_wFvuW34DtqxGWheeHpD7qgO_YvzuVC2mNtqShlNs-Fe0AL9H2vybG_9aOBQq7_z6m_hqw6rkQjtwmRoWydOFhAsXP1OD9F7dMx_kaT_wLT1_uLnUsce3hbKe5CVa3GN4lW0It4mQD9S7fbVxNWCrNvxGHQNOC7ODH0iqN0e')",
        }}
        role="img"
        aria-label="Productos frescos del mercado"
      >
        <div className="auth-page__hero-overlay" aria-hidden="true" />
        <div className="auth-page__hero-content">
          <h2 className="auth-page__hero-title">
            Frescura y calidad
            <br />
            en tu vecindario
          </h2>
          <p className="auth-page__hero-text">
            Descubre los mejores productos frescos, directamente desde el
            mercado a tu mesa.
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* PANEL DEL FORMULARIO                          */}
      {/* ============================================ */}
      <div className="auth-page__form-panel">
        <div className="auth-page__form-container">
          {/* ============================================ */}
          {/* HEADER - Logo y título                       */}
          {/* ============================================ */}
          <header className="auth-page__header">
            <div className="auth-page__logo">
              <span className="auth-page__logo-icon material-symbols-outlined">
                storefront
              </span>
            </div>
            <div>
              <h1 className="auth-page__title">
                Bienvenido a
                <br />
                La Bodeguita
              </h1>
              <p className="auth-page__subtitle">
                Ingresa tus datos para continuar.
              </p>
            </div>
          </header>
          {/* ============================================ */}
          {/* TABS - Login / Registro                      */}
          {/* ============================================ */}
          <nav className="auth-page__tabs" role="tablist">
            <div
              className={`auth-page__tabs-slider ${activeTab === "register" ? "auth-page__tabs-slider--register" : ""}`}
              aria-hidden="true"
            />
            <button
              className={`auth-page__tab ${activeTab === "login" ? "auth-page__tab--active" : ""}`}
              onClick={() => {
                setActiveTab("login");
                setError(null);
                setAddressError("");
              }}
              role="tab"
              aria-selected={activeTab === "login"}
              type="button"
            >
              Iniciar Sesión
            </button>
            <button
              className={`auth-page__tab ${activeTab === "register" ? "auth-page__tab--active" : ""}`}
              onClick={() => {
                setActiveTab("register");
                setError(null);
                setAddressError("");
              }}
              role="tab"
              aria-selected={activeTab === "register"}
              type="button"
            >
              Registrarse
            </button>
          </nav>
          {/* ============================================ */}
          {/* MENSAJE DE ERROR                             */}
          {/* ============================================ */}
          {error && (
            <div className="auth-page__error" role="alert">
              <span className="auth-page__error-icon material-symbols-outlined">
                error
              </span>
              {error}
            </div>
          )}
          {/* ============================================ */}
          {/* FORMULARIO LOGIN                             */}
          {/* ============================================ */}
          {activeTab === "login" && (
            <form
              onSubmit={handleLogin}
              className="auth-page__form auth-page__form-enter"
              noValidate
            >
              {/* Campo Usuario */}
              <div className="auth-page__field">
                <label className="auth-page__label" htmlFor="login-username">
                  Usuario
                </label>
                <div className="auth-page__input-wrapper">
                  <span className="auth-page__input-icon material-symbols-outlined">
                    person
                  </span>
                  <input
                    id="login-username"
                    type="text"
                    className="auth-page__input"
                    placeholder="tu_usuario"
                    value={loginForm.username}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, username: e.target.value })
                    }
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="auth-page__field">
                <label className="auth-page__label" htmlFor="login-password">
                  Contraseña
                </label>
                <div className="auth-page__input-wrapper">
                  <span className="auth-page__input-icon material-symbols-outlined">
                    lock
                  </span>
                  <input
                    id="login-password"
                    type="password"
                    className="auth-page__input"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                className="auth-page__submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-page__spinner" aria-hidden="true" />
                    <span className="sr-only">Ingresando...</span>
                  </>
                ) : (
                  "Entrar a mi cuenta"
                )}
              </button>
            </form>
          )}
          {/* ============================================ */}
          {/* FORMULARIO REGISTRO                          */}
          {/* ============================================ */}
          {activeTab === "register" && (
            <form
              onSubmit={handleRegister}
              className="auth-page__form auth-page__form-enter"
              noValidate
            >
              {/* Campo Nombre Completo */}
              <div className="auth-page__field">
                <label className="auth-page__label" htmlFor="reg-name">
                  Nombre Completo
                </label>
                <div className="auth-page__input-wrapper">
                  <span className="auth-page__input-icon material-symbols-outlined">
                    person
                  </span>
                  <input
                    id="reg-name"
                    type="text"
                    className="auth-page__input"
                    placeholder="Juan Pérez"
                    value={registerForm.username}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        username: e.target.value,
                      })
                    }
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Campo Teléfono */}
              <div className="auth-page__field">
                <label className="auth-page__label" htmlFor="reg-phone">
                  Teléfono (Opcional)
                </label>
                <div className="auth-page__input-wrapper">
                  <span className="auth-page__input-icon material-symbols-outlined">
                    phone
                  </span>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="auth-page__input"
                    placeholder="+53 5 123 4567"
                    value={registerForm.phone}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        phone: e.target.value,
                      })
                    }
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="auth-page__field">
                <label className="auth-page__label" htmlFor="reg-password">
                  Contraseña
                </label>
                <div className="auth-page__input-wrapper">
                  <span className="auth-page__input-icon material-symbols-outlined">
                    lock
                  </span>
                  <input
                    id="reg-password"
                    type="password"
                    className="auth-page__input"
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
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Campo Dirección */}
              <div className="auth-page__field">
                <label className="auth-page__label">
                  Dirección <span aria-hidden="true">*</span>
                  <span className="sr-only">(obligatorio)</span>
                </label>

                <div className="auth-page__address-row">
                  {/* Botón GPS */}
                  <button
                    type="button"
                    onClick={getGPSLocation}
                    disabled={gpsLoading}
                    className={`auth-page__gps-btn ${gpsActive ? "auth-page__gps-btn--active" : ""}`}
                    aria-label={
                      gpsLoading
                        ? "Obteniendo ubicación GPS"
                        : gpsActive
                          ? "Ubicación GPS activa"
                          : "Usar mi ubicación actual"
                    }
                  >
                    <span className="auth-page__gps-icon material-symbols-outlined">
                      my_location
                    </span>
                  </button>

                  {/* Input Dirección */}
                  <div className="auth-page__input-wrapper" style={{ flex: 1 }}>
                    <span className="auth-page__input-icon material-symbols-outlined">
                      location_on
                    </span>
                    <input
                      type="text"
                      className={`auth-page__input ${addressError ? "auth-page__input--error" : ""}`}
                      placeholder={
                        gpsActive
                          ? "Dirección obtenida por GPS"
                          : "Calle 23 #456, Vedado"
                      }
                      value={registerForm.address}
                      onChange={(e) => handleAddressSearch(e.target.value)}
                      disabled={gpsActive}
                      required
                      autoComplete="street-address"
                    />
                  </div>
                </div>

                {/* Error de dirección */}
                {addressError && (
                  <p className="auth-page__address-error">
                    <span className="auth-page__address-error-icon material-symbols-outlined">
                      warning
                    </span>
                    {addressError}
                  </p>
                )}

                {/* Sugerencias de dirección */}
                {addressSuggestions.length > 0 && (
                  <div className="auth-page__suggestions">
                    {addressSuggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="auth-page__suggestion-item"
                        onClick={() => selectAddress(s)}
                      >
                        <span className="auth-page__suggestion-icon material-symbols-outlined">
                          location_on
                        </span>
                        {s.display_name.substring(0, 60)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Link para dirección manual */}
                {gpsActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setGpsActive(false);
                      setRegisterForm({
                        ...registerForm,
                        lat: null,
                        lng: null,
                      });
                      setAddressError("");
                    }}
                    className="auth-page__manual-link"
                  >
                    <span className="auth-page__manual-link-icon material-symbols-outlined">
                      edit
                    </span>
                    Usar dirección manual
                  </button>
                )}
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                className="auth-page__submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-page__spinner" aria-hidden="true" />
                    <span className="sr-only">Registrando...</span>
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </button>
            </form>
          )}
          {/* ============================================ */}
          {/* DIVISOR "O continuar con"                     */}
          {/* ============================================ */}
          <div className="auth-page__divider">
            <div className="auth-page__divider-line" aria-hidden="true" />
            <span className="auth-page__divider-text">@</span>
            <div className="auth-page__divider-line" aria-hidden="true" />
          </div>

          {/* BOTÓN GOOGLE                                 */}
          {/* ============================================ */}
          {/* <button type="button" className="auth-page__google-btn">
            <svg
              className="auth-page__google-icon"
              fill="none"
              height="16"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.72 17.57V20.35H19.28C21.36 18.43 22.56 15.6 22.56 12.25Z"
                fill="#4285F4"
              />
              <path
                d="M12 23C14.97 23 17.46 22.02 19.28 20.35L15.72 17.57C14.74 18.23 13.48 18.63 12 18.63C9.14 18.63 6.72 16.7 5.85 14.11H2.18V16.96C3.99 20.53 7.7 23 12 23Z"
                fill="#34A853"
              />
              <path
                d="M5.85 14.11C5.62 13.45 5.5 12.74 5.5 12C5.5 11.26 5.62 10.55 5.85 9.89V7.04H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.96L5.85 14.11Z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38C13.62 5.38 15.06 5.93 16.21 7.02L19.35 3.88C17.45 2.11 14.97 1 12 1C7.7 1 3.99 3.47 2.18 7.04L5.85 9.89C6.72 7.3 9.14 5.38 12 5.38Z"
                fill="#EA4335"
              />
            </svg>
            Continuar con Google
          </button> */}
          {/* ============================================ */}
          {/* FOOTER - Cambiar entre Login/Registro        */}
          {/* ============================================ */}
          <p className="auth-page__footer">
            {activeTab === "login" ? "¿Sin cuenta? " : "¿Ya tienes cuenta? "}
            <button
              type="button"
              className="auth-page__switch-btn"
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
