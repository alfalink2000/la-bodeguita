// actions/authActions.js - VERSIÓN COMPLETA CORREGIDA
import { fetchConToken, fetchSinToken } from "../helpers/fetchAdmin";
import { types } from "../types/types";
import Swal from "sweetalert2";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

export const checkingFinish = () => ({
  type: types.authCheckingFinish,
});

export const startLoading = () => ({
  type: types.authStartLogin,
});

export const finishLoading = () => ({
  type: types.authCheckingFinish,
});

export const StartLogin = (username, password) => {
  return async (dispatch) => {
    dispatch(startLoading());

    console.log("🔐 Enviando login:", { username });

    try {
      const body = await fetchSinToken(
        "auth",
        {
          username,
          password_hash: password,
        },
        "POST",
      );

      console.log("📦 Body completo recibido del backend:", body);
      console.log("👤 Role recibido:", body?.user?.role);
      console.log("📞 Teléfono recibido:", body?.user?.phone);
      console.log("👤 Nombre recibido:", body?.user?.full_name);

      if (!body) {
        throw new Error("El servidor no respondió correctamente");
      }

      if (body.ok) {
        Swal.fire({
          icon: "success",
          title: "¡Login exitoso!",
          text: "Bienvenido al sistema",
          showConfirmButton: false,
          timer: 1500,
          background: "#f0f9ff",
          iconColor: "#10b981",
        });

        localStorage.setItem("token", body.token);
        localStorage.setItem("token-init-date", new Date().getTime());

        const userData = body.user || body;

        console.log("📝 Datos del usuario a guardar:", {
          uid: userData.id || userData.uid,
          name: userData.username || userData.name,
          role: userData.role,
          full_name: userData.full_name,
        });

        dispatch(
          login({
            uid: userData.id || userData.uid,
            name: userData.username || userData.name,
            role: userData.role || "customer",
            full_name: userData.full_name || "",
            email: userData.email || "",
            address: userData.address || "",
            city: userData.city || "",
            lat: userData.lat || null,
            lng: userData.lng || null,
            phone: userData.phone || "",
          }),
        );

        await dispatch(startLoadUserAddresses());
      } else {
        let errorMessage = body.msg || "Credenciales incorrectas";

        const errorMessages = {
          "Usuario no encontrado": "El usuario no existe en el sistema",
          "Contraseña incorrecta": "La contraseña es incorrecta",
          "Usuario inactivo": "La cuenta está desactivada",
          "Credenciales inválidas": "Usuario o contraseña incorrectos",
          "Usuario y contraseña son requeridos": "Completa todos los campos",
          "Usuario o contraseña incorrecta": "Usuario o contraseña incorrectos",
        };

        errorMessage = errorMessages[errorMessage] || errorMessage;

        Swal.fire({
          icon: "error",
          title: "Error de autenticación",
          text: errorMessage,
          confirmButtonColor: "#ef4444",
          background: "#fef2f2",
          iconColor: "#dc2626",
        });
      }
    } catch (error) {
      console.error("❌ Error completo en login:", error);

      let errorMessage = "Ha ocurrido un error inesperado";
      let errorTitle = "Error";

      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        errorTitle = "Error de conexión";
        errorMessage =
          "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
      } else if (error.message.includes("respuesta no es JSON")) {
        errorTitle = "Error del servidor";
        errorMessage = "El servidor respondió con un formato inválido.";
      } else {
        errorMessage = error.message || errorMessage;
      }

      Swal.fire({
        icon: "error",
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: "#ef4444",
        background: "#fef2f2",
        iconColor: "#dc2626",
      });
    } finally {
      dispatch(finishLoading());
    }
  };
};

// ✅ CARGAR DIRECCIONES DEL USUARIO
export const startLoadUserAddresses = () => {
  return async (dispatch, getState) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];

      const res = await fetch(`${API_URL}/api/users/addresses`, {
        headers: { "x-token": token },
      });
      const data = await res.json();

      if (data.ok && data.addresses) {
        dispatch({
          type: types.authLoadUserAddresses,
          payload: data.addresses,
        });
        return data.addresses;
      }
      return [];
    } catch (error) {
      console.error("Error cargando direcciones:", error);
      return [];
    }
  };
};

// ✅ ACTUALIZAR PERFIL COMPLETO
export const updateUserProfile = (userData) => {
  return async (dispatch) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (data.ok && data.user) {
        dispatch({
          type: types.authUpdateProfile,
          payload: data.user,
        });

        await dispatch(startLoadUserAddresses());

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      return false;
    }
  };
};

// ✅ AGREGAR NUEVA DIRECCIÓN
export const addUserAddress = (addressData) => {
  return async (dispatch) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const res = await fetch(`${API_URL}/api/users/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify(addressData),
      });

      const data = await res.json();

      if (data.ok && data.address) {
        dispatch({
          type: types.authAddUserAddress,
          payload: data.address,
        });
        return data.address;
      }
      return false;
    } catch (error) {
      console.error("Error agregando dirección:", error);
      return false;
    }
  };
};

// ✅ ELIMINAR DIRECCIÓN
export const deleteUserAddress = (addressId) => {
  return async (dispatch) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const res = await fetch(`${API_URL}/api/users/addresses/${addressId}`, {
        method: "DELETE",
        headers: { "x-token": token },
      });

      const data = await res.json();

      if (data.ok) {
        dispatch({
          type: types.authRemoveUserAddress,
          payload: addressId,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error eliminando dirección:", error);
      return false;
    }
  };
};

// ✅ ESTABLECER DIRECCIÓN PREDETERMINADA
export const setDefaultUserAddress = (addressId) => {
  return async (dispatch, getState) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const res = await fetch(
        `${API_URL}/api/users/addresses/${addressId}/default`,
        {
          method: "PUT",
          headers: { "x-token": token },
        },
      );

      const data = await res.json();

      if (data.ok) {
        await dispatch(startLoadUserAddresses());
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error estableciendo dirección predeterminada:", error);
      return false;
    }
  };
};

export const startLoadUserProfile = () => {
  return async (dispatch) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log("🔄 Cargando perfil desde /api/auth/profile");
      const resp = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { "x-token": token },
      });
      const body = await resp.json();

      console.log("📦 Respuesta del perfil:", body);

      if (body.ok && body.user) {
        dispatch({
          type: types.authUpdateProfile,
          payload: body.user,
        });
      }
    } catch (error) {
      console.error("❌ Error cargando perfil:", error);
    }
  };
};

export const StartChecking = () => {
  return async (dispatch) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        dispatch(checkingFinish());
        return;
      }

      const body = await fetchConToken("auth/renew");

      console.log("📦 Respuesta de renew:", body);

      if (body && body.ok) {
        localStorage.setItem("token", body.token);
        localStorage.setItem("token-init-date", new Date().getTime());

        const userData = body.user || body;

        dispatch(
          login({
            uid: userData.id || userData.uid,
            name: userData.username || userData.name,
            role: userData.role || "customer",
            full_name: userData.full_name || "",
            email: userData.email || "",
            address: userData.address || "",
            city: userData.city || "",
            lat: userData.lat || null,
            lng: userData.lng || null,
            phone: userData.phone || "",
          }),
        );
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("token-init-date");
        dispatch(checkingFinish());
      }
    } catch (error) {
      console.error("Error en verificación de token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("token-init-date");
      dispatch(checkingFinish());
    }
  };
};

export const startLogout = () => {
  return (dispatch) => {
    localStorage.clear();
    dispatch(logout());
    Swal.fire({
      icon: "info",
      title: "Sesión cerrada",
      text: "Has cerrado sesión correctamente",
      showConfirmButton: false,
      timer: 1500,
      background: "#f0f9ff",
      iconColor: "#3b82f6",
    });
  };
};

const logout = () => ({ type: types.authLogout });

const login = (user) => ({
  type: types.authLogin,
  payload: user,
});
