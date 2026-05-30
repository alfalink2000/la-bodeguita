// components/auth/AuthPage.jsx - VERSIÓN OPTIMIZADA
import { useState } from "react";
import { useDispatch } from "react-redux";
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
import { StartLogin } from "../../actions/authActions"; // ✅ Importar acción
import "./Auth.css";
import "./Auth.desktop.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const AuthPage = ({ onLoginSuccess }) => {
  const dispatch = useDispatch(); // ✅ Para usar Redux
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

  // ✅ VALIDACIÓN DE DIRECCIÓN (sin cambios)
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

  // ✅ CORREGIDO: Usar el action de Redux para login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // ✅ Usar dispatch con StartLogin
      const result = await dispatch(
        StartLogin(loginForm.username, loginForm.password),
      );

      // StartLogin ya maneja el almacenamiento de token y actualización de Redux
      // Solo necesitamos verificar si fue exitoso mirando el estado de Redux

      // Esperar un momento para que Redux se actualice
      setTimeout(() => {
        const token = localStorage.getItem("token");
        if (token) {
          showSuccessAlertAndRedirect(
            "¡Bienvenido!",
            `Has iniciado sesión correctamente`,
            { ok: true, token },
          );
        } else {
          setError("Error al iniciar sesión");
        }
      }, 500);
    } catch (err) {
      const errorMsg = "Error de conexión con el servidor";
      setError(errorMsg);
      showErrorAlert(errorMsg, "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORREGIDO: Usar fetch con estructura consistente
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

        // ✅ También actualizar Redux después del registro
        await dispatch(
          StartLogin(registerForm.username, registerForm.password),
        );

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

  // El resto de las funciones (handleAddressSearch, selectAddress, getGPSLocation)
  // se mantienen IGUALES porque no afectan a Redux
  // ... (mantener el código existente)

  return (
    // ✅ JSX sin cambios
    <div className="auth-container">{/* ... resto del JSX igual ... */}</div>
  );
};

export default AuthPage;
