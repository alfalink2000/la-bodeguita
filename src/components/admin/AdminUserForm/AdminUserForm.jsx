import React, { useState, useEffect } from "react";

const AdminUserForm = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        full_name: user.full_name || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es obligatorio";
    }
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }
    if (!formData.full_name.trim()) {
      newErrors.full_name = "El nombre completo es obligatorio";
    }
    if (
      formData.newPassword ||
      formData.confirmPassword ||
      formData.currentPassword
    ) {
      if (!formData.currentPassword) {
        newErrors.currentPassword =
          "La contraseña actual es obligatoria para cambiar la contraseña";
      }
      if (formData.newPassword && formData.newPassword.length < 6) {
        newErrors.newPassword =
          "La nueva contraseña debe tener al menos 6 caracteres";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const submitData = {
      id: user?.id,
      username: formData.username.trim(),
      email: formData.email.trim(),
      full_name: formData.full_name.trim(),
    };
    const changingPassword = formData.currentPassword && formData.newPassword;
    if (changingPassword) {
      submitData.password_user = formData.currentPassword;
      submitData.new_password = formData.newPassword;
    }
    console.log("[AdminUserForm] Datos a enviar:", submitData);
    console.log("¿Cambiando contraseña?", changingPassword);
    onSubmit(submitData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case "current": setShowCurrentPassword(!showCurrentPassword); break;
      case "new": setShowNewPassword(!showNewPassword); break;
      case "confirm": setShowConfirmPassword(!showConfirmPassword); break;
      default: break;
    }
  };

  const isEditing = !!user;

  return (
    <div className="admin-modal admin-modal--open">
      <div className="admin-modal__overlay" onClick={onCancel} />
      <div className="admin-modal__container" style={{ maxWidth: "512px" }}>
        <div className="admin-modal__header" style={{ position: "sticky" }}>
          <h2 className="admin-modal__title">
            {isEditing ? "Editar Usuario Administrador" : "Crear Usuario Administrador"}
          </h2>
          <button onClick={onCancel} className="admin-modal__close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="admin-modal__body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Username */}
            <div className="admin-form-group">
              <label htmlFor="username" className="admin-form-group__label">Nombre de Usuario *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`admin-input ${errors.username ? "admin-input--error" : ""}`}
                placeholder="Ingresa el nombre de usuario"
              />
              {errors.username && <span className="admin-form-group__error">{errors.username}</span>}
            </div>

            {/* Email */}
            <div className="admin-form-group">
              <label htmlFor="email" className="admin-form-group__label">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`admin-input ${errors.email ? "admin-input--error" : ""}`}
                placeholder="Ingresa el email"
              />
              {errors.email && <span className="admin-form-group__error">{errors.email}</span>}
            </div>

            {/* Full name */}
            <div className="admin-form-group">
              <label htmlFor="full_name" className="admin-form-group__label">Nombre Completo *</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`admin-input ${errors.full_name ? "admin-input--error" : ""}`}
                placeholder="Ingresa el nombre completo"
              />
              {errors.full_name && <span className="admin-form-group__error">{errors.full_name}</span>}
            </div>

            {isEditing && (
              <>
                <div style={{ borderTop: "1px solid var(--color-outline-variant)", paddingTop: "16px" }}>
                  <span className="admin-form-group__helper">Cambiar Contraseña (Opcional)</span>
                </div>

                {/* Current Password */}
                <div className="admin-form-group">
                  <label htmlFor="currentPassword" className="admin-form-group__label">Contraseña Actual</label>
                  <div className="admin-input-wrapper">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className={`admin-input ${errors.currentPassword ? "admin-input--error" : ""}`}
                      placeholder="Ingresa la contraseña actual"
                      style={{ paddingRight: "40px" }}
                    />
                    <button type="button" onClick={() => togglePasswordVisibility("current")} className="admin-input-wrapper__clear">
                      <span className="admin-input-wrapper__clear-icon material-symbols-outlined">{showCurrentPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                  {errors.currentPassword && <span className="admin-form-group__error">{errors.currentPassword}</span>}
                </div>

                {/* New Password */}
                <div className="admin-form-group">
                  <label htmlFor="newPassword" className="admin-form-group__label">Nueva Contraseña</label>
                  <div className="admin-input-wrapper">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className={`admin-input ${errors.newPassword ? "admin-input--error" : ""}`}
                      placeholder="Ingresa la nueva contraseña (mínimo 6 caracteres)"
                      style={{ paddingRight: "40px" }}
                    />
                    <button type="button" onClick={() => togglePasswordVisibility("new")} className="admin-input-wrapper__clear">
                      <span className="admin-input-wrapper__clear-icon material-symbols-outlined">{showNewPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                  {errors.newPassword && <span className="admin-form-group__error">{errors.newPassword}</span>}
                </div>

                {/* Confirm Password */}
                <div className="admin-form-group">
                  <label htmlFor="confirmPassword" className="admin-form-group__label">Confirmar Nueva Contraseña</label>
                  <div className="admin-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`admin-input ${errors.confirmPassword ? "admin-input--error" : ""}`}
                      placeholder="Confirma la nueva contraseña"
                      style={{ paddingRight: "40px" }}
                    />
                    <button type="button" onClick={() => togglePasswordVisibility("confirm")} className="admin-input-wrapper__clear">
                      <span className="admin-input-wrapper__clear-icon material-symbols-outlined">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="admin-form-group__error">{errors.confirmPassword}</span>}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="admin-modal__footer">
            <button
              type="button"
              onClick={onCancel}
              className="admin-btn admin-btn--secondary admin-btn--full"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn--primary admin-btn--full"
            >
              {isEditing ? "Actualizar Usuario" : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserForm;
