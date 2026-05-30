// actions/categoriesActions.js - VERSIÓN OPTIMIZADA
import { fetchAPIConfig } from "../helpers/fetchAPIConfig";
import { fetchPublic } from "../helpers/fetchPublic";
import { types } from "../types/types";
import Swal from "sweetalert2";

// 🔥 OPTIMIZACIÓN: Constante para mensajes de error
const ERROR_MESSAGES = {
  PRODUCTS_EXIST:
    "No se puede eliminar la categoría porque tiene productos asociados",
  NOT_FOUND: "Categoría no encontrada",
  CONNECTION: "Error de conexión",
};

export const getCategories = () => {
  return async (dispatch, getState) => {
    if (getState().categories.categories.length > 0) {
      console.log("🔄 Categorías ya cargadas, omitiendo...");
      return Promise.resolve();
    }

    try {
      const body = await fetchPublic("categories/getCategories");

      if (body.ok) {
        console.log(`✅ ${body.categories.length} categorías cargadas`);
        dispatch({
          type: types.categoriesLoad,
          payload: body.categories,
        });
        return Promise.resolve();
      } else {
        return Promise.reject(
          new Error(body.msg || "Error cargando categorías"),
        );
      }
    } catch (error) {
      console.error("❌ Error en getCategories:", error);
      return Promise.reject(error);
    }
  };
};

export const insertCategory = (categoryName, storeId) => {
  return async (dispatch) => {
    try {
      const body = await fetchAPIConfig(
        "categories/new",
        { name: categoryName, store_id: storeId },
        "POST",
      );

      if (body.ok) {
        dispatch({
          type: types.categoryAddNew,
          payload: body.category,
        });
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Categoría creada correctamente",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", body.msg || "Error al crear la categoría", "error");
      }
    } catch (error) {
      console.error("❌ Error insertando categoría:", error);
      Swal.fire(
        "Error",
        "No se pudo crear la categoría. Verifica tu conexión.",
        "error",
      );
    }
  };
};

export const updateCategory = (oldName, newName) => {
  return async (dispatch) => {
    try {
      const body = await fetchAPIConfig(
        `categories/update/${encodeURIComponent(oldName)}`,
        { newName },
        "PUT",
      );

      if (body.ok) {
        dispatch({
          type: types.categoryUpdated,
          payload: { oldName, newName },
        });
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Categoría actualizada correctamente",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire(
          "Error",
          body.msg || "Error al actualizar la categoría",
          "error",
        );
      }
    } catch (error) {
      console.error("❌ Error actualizando categoría:", error);
      if (error.message?.includes("404")) {
        Swal.fire(
          "Error",
          "La categoría que intentas actualizar no existe.",
          "error",
        );
      } else {
        Swal.fire("Error", "No se pudo actualizar la categoría.", "error");
      }
    }
  };
};

export const deleteCategory = (categoryName) => {
  return async (dispatch) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      html: `
        <div style="text-align: center;">
          <p>Vas a eliminar la categoría:</p>
          <p style="font-weight: bold; color: #ef4444;">"${categoryName}"</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Sí, eliminar",
    });

    if (!result.isConfirmed) return;

    try {
      const body = await fetchAPIConfig(
        `categories/delete/${encodeURIComponent(categoryName)}`,
        {},
        "DELETE",
      );

      if (body.ok) {
        dispatch({
          type: types.categoryDeleted,
          payload: categoryName,
        });
        Swal.fire(
          "¡Eliminada!",
          "Categoría eliminada correctamente",
          "success",
        );
      } else {
        if (body.msg?.includes("producto")) {
          await Swal.fire({
            icon: "error",
            title: "No se puede eliminar",
            text: `La categoría "${categoryName}" tiene productos asociados. Elimínalos o reasíhnalos primero.`,
          });
        } else {
          Swal.fire(
            "Error",
            body.msg || "Error al eliminar la categoría",
            "error",
          );
        }
      }
    } catch (error) {
      console.error("❌ Error eliminando categoría:", error);
      Swal.fire("Error", "No se pudo eliminar la categoría.", "error");
    }
  };
};
