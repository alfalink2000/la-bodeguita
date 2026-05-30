// actions/adminUsersActions.js - VERSIÓN OPTIMIZADA
import { fetchAPIConfig } from "../helpers/fetchAPIConfig";
import { types } from "../types/types";
import Swal from "sweetalert2";

// Cargar todos los usuarios (admin)
export const getAdminUsers = () => {
  return async (dispatch) => {
    try {
      const body = await fetchAPIConfig("auth/getUsers", {}, "GET");

      if (body.ok) {
        dispatch({
          type: types.adminUsersLoad,
          payload: body.usuarios || [],
        });
      } else {
        Swal.fire("Error", body.msg || "Error al cargar usuarios", "error");
      }
    } catch (error) {
      console.error("❌ Error cargando usuarios:", error);
      Swal.fire("Error", "Error de conexión al cargar usuarios", "error");
    }
  };
};

// Actualizar usuario (admin)
export const updateAdminUser = (userData) => {
  return async (dispatch) => {
    try {
      // 🔥 OPTIMIZACIÓN: Eliminar logs innecesarios en producción
      if (process.env.NODE_ENV === "development") {
        console.log("📤 [updateAdminUser] Datos a enviar:", userData);
      }

      const data = await fetchAPIConfig("auth/update", userData, "PUT");

      if (data.ok) {
        dispatch({
          type: types.adminUserUpdated,
          payload: data.user,
        });

        // Recargar lista de usuarios después de actualizar
        dispatch(getAdminUsers());

        Swal.fire({
          icon: "success",
          title: "¡Usuario actualizado!",
          text: data.msg || "El usuario ha sido actualizado correctamente",
          timer: 2000,
          showConfirmButton: false,
        });

        return true;
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg || "No se pudo actualizar el usuario",
        });
        return false;
      }
    } catch (error) {
      console.error("❌ Error actualizando usuario:", error);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor",
      });
      return false;
    }
  };
};

// Activar/Desactivar usuario
export const toggleUserStatus = (userId, currentStatus) => {
  return async (dispatch, getState) => {
    try {
      const { adminUsers } = getState();
      const newStatus = !currentStatus;

      // Proteger: no desactivar el último usuario activo
      if (!newStatus) {
        const activeUsersCount = adminUsers.users.filter(
          (user) => user.is_active,
        ).length;
        if (activeUsersCount <= 1) {
          Swal.fire(
            "Error",
            "No se puede desactivar el último usuario activo",
            "error",
          );
          return false;
        }
      }

      const body = await fetchAPIConfig(
        `auth/toggle-status/${userId}`,
        { is_active: newStatus },
        "PUT",
      );

      if (body.ok) {
        dispatch({
          type: types.adminUserStatusToggled,
          payload: { userId, isActive: newStatus },
        });

        Swal.fire({
          icon: "success",
          title: `Usuario ${newStatus ? "activado" : "desactivado"}`,
          timer: 1500,
          showConfirmButton: false,
        });
        return true;
      } else {
        Swal.fire("Error", body.msg, "error");
        return false;
      }
    } catch (error) {
      console.error("❌ Error cambiando estado:", error);
      Swal.fire("Error", "Error de conexión", "error");
      return false;
    }
  };
};

// Eliminar usuario
export const deleteAdminUser = (userId) => {
  return async (dispatch, getState) => {
    const { adminUsers } = getState();

    if (adminUsers.users.length <= 1) {
      Swal.fire("Error", "No se puede eliminar el último usuario", "error");
      return false;
    }

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return false;

    try {
      const body = await fetchAPIConfig(`auth/delete/${userId}`, {}, "DELETE");

      if (body.ok) {
        dispatch({
          type: types.adminUserDeleted,
          payload: userId,
        });

        Swal.fire("Eliminado", "Usuario eliminado correctamente", "success");
        return true;
      } else {
        Swal.fire("Error", body.msg, "error");
        return false;
      }
    } catch (error) {
      console.error("❌ Error eliminando usuario:", error);
      Swal.fire("Error", "Error de conexión al eliminar usuario", "error");
      return false;
    }
  };
};

// Establecer usuario activo para edición
export const setActiveAdminUser = (user) => ({
  type: types.adminUserSetActive,
  payload: user,
});

export const clearActiveAdminUser = () => ({
  type: types.adminUserClearActive,
});
