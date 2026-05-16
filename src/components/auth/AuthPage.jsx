// components/auth/AuthPage.jsx
import { useState } from "react";
import "./Auth.css";

const API_URL = import.meta.env.VITE_API_URL || "https://minimarket-backend-6z9m.onrender.com";

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
    full_name: "",
    phone: "",
    address: "",
    lat: null,
    lng: null,
  });

  // Manejar login
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
        onLoginSuccess(data);
      } else {
        setError(data.msg || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // Manejar registro
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
          full_name: registerForm.full_name,
          phone: registerForm.phone,
          address: registerForm.address,
          lat: registerForm.lat,
          lng: registerForm.lng,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        localStorage.setItem("token", data.token);
        onLoginSuccess(data);
      } else {
        setError(data.msg || "Error al registrarse");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // Buscar dirección (geocodificación)
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

  // Seleccionar sugerencia de dirección
  const selectAddress = (suggestion) => {
    setRegisterForm({
      ...registerForm,
      address: suggestion.display_name,
      lat: suggestion.lat,
      lng: suggestion.lng,
    });
    setAddressSuggestions([]);
  };

  // Obtener ubicación GPS
  const getGPSLocation = () => {
    setGpsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Obtener dirección desde coordenadas
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
            address: data.display_name || `Lat: ${latitude}, Lng: ${longitude}`,
          });
        } catch (err) {
          setRegisterForm({
            ...registerForm,
            lat: latitude,
            lng: longitude,
          });
        }

        setGpsLoading(false);
      },
      (err) => {
        setError("Error obteniendo ubicación: " + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">💊</div>
          <h1>FarmaExpress</h1>
          <p>Tu farmacia de confianza</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
            onClick={() => { setActiveTab("login"); setError(null); }}
          >
            Iniciar Sesión
          </button>
          <button
            className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => { setActiveTab("register"); setError(null); }}
          >
            Registrarse
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="form-error" style={{ marginBottom: "1rem", justifyContent: "center" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Formulario Login */}
        {activeTab === "login" && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Usuario</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ingresa tu usuario"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                placeholder="Ingresa tu contraseña"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span className="auth-loading">
                  <span className="auth-spinner"></span> Iniciando sesión...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
        )}

        {/* Formulario Registro */}
        {activeTab === "register" && (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Usuario *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Elige un nombre de usuario"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Mínimo 6 caracteres"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input
                type="text"
                className="form-input"
                placeholder="Tu nombre y apellidos"
                value={registerForm.full_name}
                onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+53 5XXXXXXXX"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
              />
            </div>

            {/* Dirección */}
            <div className="form-group address-search-group">
              <label className="form-label">Dirección de entrega *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Calle 23 #456, Vedado, La Habana"
                value={registerForm.address}
                onChange={(e) => handleAddressSearch(e.target.value)}
                required
              />

              {/* Sugerencias */}
              {addressSuggestions.length > 0 && (
                <div className="address-suggestions">
                  {addressSuggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className="address-suggestion-item"
                      onClick={() => selectAddress(suggestion)}
                    >
                      📍 {suggestion.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botón GPS */}
            <button
              type="button"
              className="gps-button"
              onClick={getGPSLocation}
              disabled={gpsLoading}
            >
              {gpsLoading ? (
                <>⏳ Obteniendo ubicación...</>
              ) : (
                <>📍 Usar mi ubicación actual (GPS)</>
              )}
            </button>

            {registerForm.lat && registerForm.lng && (
              <div style={{ fontSize: "0.8rem", color: "var(--primary-green)", textAlign: "center" }}>
                ✅ Ubicación registrada
              </div>
            )}

            <div className="auth-divider">
              <span>Al registrarte aceptas nuestros términos</span>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span className="auth-loading">
                  <span className="auth-spinner"></span> Registrando...
                </span>
              ) : (
                "Crear Cuenta"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;