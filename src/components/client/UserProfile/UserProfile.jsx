import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { startLogout, updateUserProfile } from "../../../actions/authActions";
import { resetCart } from "../../../actions/cartActions";
import "./UserProfile.css";

const selectCurrencySymbol = (state) => {
  const currency = state.appConfig.config?.currency || "CUP";
  switch (currency) {
    case "USD":
      return "US$";
    case "EUR":
      return "€";
    default:
      return "$";
  }
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const UserProfile = ({
  userData,
  onClose,
  onOrdersViewed,
  unreadOrdersCount: initialUnreadOrders = 0,
}) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("profile");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
    lat: null,
    lng: null,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [unreadOrdersCount, setUnreadOrdersCount] =
    useState(initialUnreadOrders);
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [expandedOrders, setExpandedOrders] = useState({});

  const currencySymbol = useSelector(selectCurrencySymbol);

  const toggleExpandOrder = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  useEffect(() => {
    if (userData) {
      setEditForm({
        username: userData.username || userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
        lat: userData.lat || null,
        lng: userData.lng || null,
      });
    }
  }, [userData]);

  useEffect(() => {
    if (unreadOrdersCount > 0 && onOrdersViewed) {
      onOrdersViewed();
      setUnreadOrdersCount(0);
      localStorage.setItem("unread_orders_count", "0");
    }
  }, [unreadOrdersCount, onOrdersViewed]);

  const loadOrders = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/mine`, {
        headers: { "x-token": token },
      });
      const data = await res.json();
      if (data.ok) {
        setOrders(data.pedidos || []);
      }
    } catch (err) {
      console.error("Error cargando pedidos:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders();
    }
  }, [activeTab, loadOrders]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "open":
        return {
          label: "Abierto",
          color: "var(--color-primary)",
          bg: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
          icon: "hourglass_top",
        };
      case "pending":
        return {
          label: "En Proceso",
          color: "var(--color-warning)",
          bg: "color-mix(in srgb, var(--color-warning) 15%, transparent)",
          icon: "progress_activity",
        };
      case "completed":
        return {
          label: "Completado",
          color: "var(--color-primary)",
          bg: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
          icon: "check_circle",
        };
      case "cancelled":
        return {
          label: "Cancelado",
          color: "var(--color-error)",
          bg: "color-mix(in srgb, var(--color-error) 10%, transparent)",
          icon: "cancel",
        };
      default:
        return {
          label: status,
          color: "var(--color-on-surface-variant)",
          bg: "var(--color-surface-container)",
          icon: "package",
        };
    }
  };

  const validateEmail = (email) => {
    if (!email || email.trim() === "") {
      setEmailError("");
      return true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Formato de email inválido");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateUsername = (username) => {
    if (!username || username.trim() === "") {
      setUsernameError("El nombre de usuario es obligatorio");
      return false;
    }
    if (username.trim().length < 3) {
      setUsernameError("Mínimo 3 caracteres");
      return false;
    }
    if (username.trim().length > 50) {
      setUsernameError("Máximo 50 caracteres");
      return false;
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameError("Solo letras, números y guiones bajos");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = "La contraseña actual es obligatoria";
    }
    if (passwordData.newPassword && passwordData.newPassword.length < 6) {
      errors.newPassword =
        "La nueva contraseña debe tener al menos 6 caracteres";
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      const errorMessages = Object.values(passwordErrors).join("<br>");
      Swal.fire({
        icon: "warning",
        title: "Errores en el formulario",
        html: errorMessages,
        confirmButtonColor: "var(--color-primary)",
      });
      return;
    }
    setChangingPassword(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/auth/profile/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-token": token },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        Swal.fire({
          icon: "success",
          title: "Contraseña actualizada",
          text: "Tu contraseña ha sido cambiada correctamente",
          confirmButtonColor: "var(--color-primary)",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({});
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg || "No se pudo cambiar la contraseña",
          confirmButtonColor: "var(--color-error)",
        });
      }
    } catch (err) {
      console.error("Error cambiando contraseña:", err);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor",
        confirmButtonColor: "var(--color-error)",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({
        username: userData?.username || userData?.name || "",
        email: userData?.email || "",
        phone: userData?.phone || "",
        address: userData?.address || "",
        lat: userData?.lat || null,
        lng: userData?.lng || null,
      });
      setEmailError("");
      setUsernameError("");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: "error",
        title: "GPS no disponible",
        text: "Tu dispositivo no soporta geolocalización",
        confirmButtonColor: "var(--color-primary)",
      });
      return;
    }
    setGettingLocation(true);
    Swal.fire({
      title: "Obteniendo ubicación...",
      text: "Por favor permite el acceso a tu ubicación",
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
          setEditForm((prev) => ({
            ...prev,
            lat: latitude,
            lng: longitude,
            address: addressText,
          }));
          setGettingLocation(false);
          Swal.fire({
            icon: "success",
            title: "Ubicación obtenida!",
            text:
              addressText.length > 60
                ? addressText.substring(0, 60) + "..."
                : addressText,
            timer: 2500,
            showConfirmButton: false,
          });
        } catch (err) {
          console.error("Error en reverse geocoding:", err);
          const coordText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setEditForm((prev) => ({
            ...prev,
            lat: latitude,
            lng: longitude,
            address: coordText,
          }));
          setGettingLocation(false);
          Swal.fire({
            icon: "success",
            title: "Ubicación obtenida!",
            text: "Coordenadas GPS registradas correctamente",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      },
      (error) => {
        console.error("Error GPS:", error);
        setGettingLocation(false);
        let errorMsg = "No se pudo obtener tu ubicación.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg =
              "Permiso de ubicación denegado. Actívalo en la configuración de tu navegador.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Información de ubicación no disponible.";
            break;
          case error.TIMEOUT:
            errorMsg = "Tiempo de espera agotado al obtener ubicación.";
            break;
        }
        Swal.fire({
          icon: "error",
          title: "Error de ubicación",
          text: errorMsg,
          confirmButtonColor: "var(--color-primary)",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const handleSaveProfile = async () => {
    if (!editForm.username || editForm.username.trim() === "") {
      Swal.fire({
        icon: "error",
        title: "Campo requerido",
        text: "El nombre de usuario es obligatorio",
        confirmButtonColor: "var(--color-primary)",
      });
      return;
    }
    if (!validateUsername(editForm.username)) {
      Swal.fire({
        icon: "error",
        title: "Usuario inválido",
        text: usernameError,
        confirmButtonColor: "var(--color-primary)",
      });
      return;
    }
    if (editForm.email && editForm.email.trim() !== "") {
      if (!validateEmail(editForm.email)) {
        Swal.fire({
          icon: "error",
          title: "Email inválido",
          text: emailError,
          confirmButtonColor: "var(--color-primary)",
        });
        return;
      }
    }
    setSaving(true);
    const bodyData = {
      username: editForm.username.trim(),
      phone: editForm.phone?.trim() || "",
      address: editForm.address?.trim() || "",
    };
    if (editForm.email && editForm.email.trim() !== "") {
      bodyData.email = editForm.email.trim();
    }
    if (
      editForm.lat !== null &&
      editForm.lat !== undefined &&
      !isNaN(parseFloat(editForm.lat))
    ) {
      bodyData.lat = parseFloat(editForm.lat);
    }
    if (
      editForm.lng !== null &&
      editForm.lng !== undefined &&
      !isNaN(parseFloat(editForm.lng))
    ) {
      bodyData.lng = parseFloat(editForm.lng);
    }
    try {
      const success = await dispatch(updateUserProfile(bodyData));
      if (success) {
        Swal.fire({
          icon: "success",
          title: "Perfil actualizado",
          text: "Tus datos han sido actualizados correctamente.",
          confirmButtonColor: "var(--color-primary)",
        });
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor",
        confirmButtonColor: "var(--color-error)",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Cerrar sesión?",
      text: "Se cerrará tu sesión actual",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--color-error)",
      cancelButtonColor: "var(--color-on-surface-variant)",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(resetCart());
        localStorage.clear();
        sessionStorage.clear();
        dispatch(startLogout());
        onClose();
        window.location.reload();
      }
    });
  };

  return (
    <div
      className="user-profile"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="user-profile__container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="user-profile__header">
          <button
            onClick={onClose}
            className="user-profile__close-btn"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="user-profile__avatar">
            <span className="user-profile__avatar-icon material-symbols-outlined">
              person
            </span>
          </div>
          <h3 className="user-profile__name">
            {userData?.full_name || userData?.username || "Usuario"}
          </h3>
          <p className="user-profile__username">
            @{userData?.username || userData?.name}
          </p>
        </header>

        {/* Tabs */}
        <nav className="user-profile__tabs">
          <button
            className={`user-profile__tab ${activeTab === "profile" ? "user-profile__tab--active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="user-profile__tab-icon material-symbols-outlined">
              person
            </span>
            <span>Perfil</span>
          </button>
          <button
            className={`user-profile__tab ${activeTab === "orders" ? "user-profile__tab--active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <span className="user-profile__tab-icon material-symbols-outlined">
              list_alt
            </span>
            <span>Pedidos</span>
            {unreadOrdersCount > 0 && (
              <span className="user-profile__tab-badge">
                {unreadOrdersCount}
              </span>
            )}
          </button>
        </nav>

        {/* Content */}
        <div className="user-profile__content">
          {activeTab === "profile" ? (
            <div className="user-profile__profile-section">
              {/* Username */}
              <div className="user-profile__field">
                <label className="user-profile__label">
                  <span className="material-symbols-outlined user-profile__label-icon">
                    badge
                  </span>
                  Usuario de acceso
                </label>
                {isEditing ? (
                  <div className="user-profile__field-content">
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => {
                        setEditForm({ ...editForm, username: e.target.value });
                        validateUsername(e.target.value);
                      }}
                      onBlur={(e) => validateUsername(e.target.value)}
                      placeholder="Tu usuario para iniciar sesión"
                      className={`user-profile__input ${usernameError ? "user-profile__input--error" : ""}`}
                    />
                    {usernameError && (
                      <p className="user-profile__error">{usernameError}</p>
                    )}
                    <p className="user-profile__hint">
                      Este es el nombre que usas para iniciar sesión
                    </p>
                  </div>
                ) : (
                  <p className="user-profile__value">
                    @{userData?.username || userData?.name || "No registrado"}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="user-profile__field">
                <label className="user-profile__label">
                  <span className="material-symbols-outlined user-profile__label-icon">
                    mail
                  </span>
                  Correo electrónico
                </label>
                {isEditing ? (
                  <div className="user-profile__field-content">
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => {
                        setEditForm({ ...editForm, email: e.target.value });
                        if (e.target.value.trim() !== "") {
                          validateEmail(e.target.value);
                        } else {
                          setEmailError("");
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value.trim() !== "") {
                          validateEmail(e.target.value);
                        }
                      }}
                      placeholder="ejemplo@correo.com"
                      className={`user-profile__input ${emailError ? "user-profile__input--error" : ""}`}
                    />
                    {emailError && (
                      <p className="user-profile__error">{emailError}</p>
                    )}
                  </div>
                ) : (
                  <p className="user-profile__value">
                    {userData?.email || "No registrado"}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="user-profile__field">
                <label className="user-profile__label">
                  <span className="material-symbols-outlined user-profile__label-icon">
                    phone
                  </span>
                  Teléfono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    placeholder="+53 5XXXXXXXX"
                    className="user-profile__input"
                  />
                ) : (
                  <p className="user-profile__value">
                    {userData?.phone || "No registrado"}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="user-profile__field">
                <label className="user-profile__label">
                  <span className="material-symbols-outlined user-profile__label-icon">
                    location_on
                  </span>
                  Dirección
                </label>
                {isEditing ? (
                  <div className="user-profile__field-content">
                    <textarea
                      rows="2"
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                      placeholder="Tu dirección de entrega"
                      className="user-profile__textarea"
                    />
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gettingLocation}
                      className="user-profile__gps-btn"
                    >
                      <span className="material-symbols-outlined">
                        my_location
                      </span>
                      {gettingLocation
                        ? "Obteniendo ubicación..."
                        : "Usar mi ubicación actual GPS"}
                    </button>
                    {editForm.lat && editForm.lng && (
                      <p className="user-profile__coords">
                        Lat: {Number(editForm.lat).toFixed(6)}, Lng:{" "}
                        {Number(editForm.lng).toFixed(6)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="user-profile__value">
                      {userData?.address || "No registrada"}
                    </p>
                    {userData?.lat && userData?.lng && (
                      <p className="user-profile__coords">
                        Ubicación GPS registrada
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Password Section (edit mode) */}
              {isEditing && (
                <div className="user-profile__password-section">
                  <div className="user-profile__divider">
                    <span>Cambiar Contraseña (Opcional)</span>
                  </div>

                  <div className="user-profile__field">
                    <label className="user-profile__label">
                      <span className="material-symbols-outlined user-profile__label-icon">
                        lock
                      </span>
                      Contraseña actual
                    </label>
                    <div className="user-profile__password-wrapper">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        placeholder="Ingresa tu contraseña actual"
                        className={`user-profile__input ${passwordErrors.currentPassword ? "user-profile__input--error" : ""}`}
                      />
                      <button
                        type="button"
                        className="user-profile__password-toggle"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        aria-label="Mostrar/ocultar contraseña"
                      >
                        <span className="material-symbols-outlined">
                          {showCurrentPassword
                            ? "visibility_off"
                            : "visibility"}
                        </span>
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="user-profile__error">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div className="user-profile__field">
                    <label className="user-profile__label">
                      <span className="material-symbols-outlined user-profile__label-icon">
                        lock
                      </span>
                      Nueva contraseña
                    </label>
                    <div className="user-profile__password-wrapper">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        placeholder="Mínimo 6 caracteres"
                        className={`user-profile__input ${passwordErrors.newPassword ? "user-profile__input--error" : ""}`}
                      />
                      <button
                        type="button"
                        className="user-profile__password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label="Mostrar/ocultar contraseña"
                      >
                        <span className="material-symbols-outlined">
                          {showNewPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="user-profile__error">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>

                  <div className="user-profile__field">
                    <label className="user-profile__label">
                      <span className="material-symbols-outlined user-profile__label-icon">
                        lock
                      </span>
                      Confirmar nueva contraseña
                    </label>
                    <div className="user-profile__password-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirma tu nueva contraseña"
                        className={`user-profile__input ${passwordErrors.confirmPassword ? "user-profile__input--error" : ""}`}
                      />
                      <button
                        type="button"
                        className="user-profile__password-toggle"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        aria-label="Mostrar/ocultar contraseña"
                      >
                        <span className="material-symbols-outlined">
                          {showConfirmPassword
                            ? "visibility_off"
                            : "visibility"}
                        </span>
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="user-profile__error">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="user-profile__change-password-btn"
                  >
                    {changingPassword
                      ? "Actualizando..."
                      : "Actualizar Contraseña"}
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="user-profile__actions">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving || !!usernameError || !!emailError}
                      className="user-profile__btn user-profile__btn--primary"
                    >
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="user-profile__btn user-profile__btn--secondary"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEditToggle}
                      className="user-profile__btn user-profile__btn--primary"
                    >
                      <span className="material-symbols-outlined">edit</span>
                      Editar Perfil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="user-profile__btn user-profile__btn--logout"
                    >
                      <span className="material-symbols-outlined">logout</span>
                      Cerrar Sesión
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="user-profile__orders-section">
              {loadingOrders ? (
                <div className="user-profile__orders-state">
                  <span className="user-profile__orders-state-icon material-symbols-outlined user-profile__spin">
                    sync
                  </span>
                  <p>Cargando tus pedidos...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="user-profile__orders-state">
                  <span className="user-profile__orders-state-icon material-symbols-outlined">
                    shopping_bag
                  </span>
                  <h4>No tienes pedidos</h4>
                  <p>Realiza tu primer pedido para verlo aquí</p>
                </div>
              ) : (
                <div className="user-profile__orders-list">
                  {orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const items = order.items || [];
                    const isExpanded = expandedOrders[order.id];
                    return (
                      <div key={order.id} className="user-profile__order-card">
                        <div className="user-profile__order-header">
                          <div className="user-profile__order-header-top">
                            <span className="user-profile__order-id">
                              Pedido #{order.id}
                            </span>
                            <span
                              className="user-profile__order-status"
                              style={{
                                background: statusConfig.bg,
                                color: statusConfig.color,
                              }}
                            >
                              <span className="material-symbols-outlined user-profile__order-status-icon">
                                {statusConfig.icon}
                              </span>
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="user-profile__order-date">
                            <span className="material-symbols-outlined">
                              schedule
                            </span>
                            {formatDate(order.created_at)}
                          </div>
                        </div>

                        <div className="user-profile__order-info">
                          {order.wants_delivery ? (
                            <span className="user-profile__order-delivery">
                              <span className="material-symbols-outlined">
                                local_shipping
                              </span>
                              {order.delivery_needs_manual_contact
                                ? "Delivery (Pendiente contacto)"
                                : `Delivery: ${currencySymbol}${order.delivery_price || 0}`}
                            </span>
                          ) : (
                            <span className="user-profile__order-pickup">
                              <span className="material-symbols-outlined">
                                store
                              </span>
                              Retiro en tienda
                            </span>
                          )}
                          <span className="user-profile__order-total">
                            <span className="material-symbols-outlined">
                              payments
                            </span>
                            Total: {currencySymbol}
                            {parseFloat(order.total_amount).toFixed(2)}
                          </span>
                        </div>

                        <div className="user-profile__order-products">
                          <button
                            onClick={() => toggleExpandOrder(order.id)}
                            className="user-profile__order-toggle"
                          >
                            <span className="material-symbols-outlined">
                              {isExpanded ? "expand_less" : "expand_more"}
                            </span>
                            <span>
                              {isExpanded ? "Ocultar" : "Ver"} productos (
                              {items.length})
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="user-profile__order-items">
                              {items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="user-profile__order-item"
                                >
                                  <span className="user-profile__order-item-name">
                                    {item.name}
                                  </span>
                                  <div className="user-profile__order-item-meta">
                                    <span>x{item.quantity}</span>
                                    <span>
                                      {currencySymbol}
                                      {(
                                        parseFloat(item.price) * item.quantity
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {order.status === "open" && (
                          <div className="user-profile__order-cancel-wrapper">
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: "Cancelar pedido?",
                                  text: "Esta acción no se puede deshacer",
                                  icon: "warning",
                                  showCancelButton: true,
                                  confirmButtonColor: "var(--color-error)",
                                  cancelButtonColor: "var(--color-on-surface-variant)",
                                  confirmButtonText: "Sí, cancelar",
                                  cancelButtonText: "Cancelar",
                                }).then(async (result) => {
                                  if (result.isConfirmed) {
                                    const token = localStorage.getItem("token");
                                    const res = await fetch(
                                      `${API_URL}/api/orders/cancel/${order.id}`,
                                      {
                                        method: "PUT",
                                        headers: { "x-token": token },
                                      },
                                    );
                                    const data = await res.json();
                                    if (data.ok) {
                                      Swal.fire(
                                        "Pedido cancelado",
                                        "",
                                        "success",
                                      );
                                      loadOrders();
                                    } else {
                                      Swal.fire("Error", data.msg, "error");
                                    }
                                  }
                                });
                              }}
                              className="user-profile__order-cancel-btn"
                            >
                              Cancelar Pedido
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
