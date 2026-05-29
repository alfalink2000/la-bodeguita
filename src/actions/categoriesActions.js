// actions/categoriesActions.js - VERSIÓN CORREGIDA
import { fetchAPIConfig } from "../helpers/fetchAPIConfig";
import { fetchPublic } from "../helpers/fetchPublic";
import { types } from "../types/types";
import Swal from "sweetalert2";

export const getCategories = () => {
  return async (dispatch, getState) => {
    if (getState().categories.categories.length > 0) {
      console.log("🔄 Categorías ya cargadas, omitiendo...");
      return Promise.resolve();
    }

    console.log("📂 Cargando categorías...");

    try {
      const body = await fetchPublic("categories/getCategories");

      if (body.ok) {
        console.log(
          `✅ ${body.categories.length} categorías cargadas exitosamente`,
        );
        dispatch({
          type: types.categoriesLoad,
          payload: body.categories,
        });
        return Promise.resolve();
      } else {
        console.error("❌ Error en respuesta de categorías:", body.msg);
        return Promise.reject(
          new Error(body.msg || "Error cargando categorías"),
        );
      }
    } catch (error) {
      console.error("❌ Error de conexión en getCategories:", error);
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
        Swal.fire({
          icon: "error",
          title: "Error",
          text: body.msg || "Error al crear la categoría",
        });
      }
    } catch (error) {
      console.error("Error insertando categoría:", error);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo crear la categoría. Verifica tu conexión.",
      });
    }
  };
};

export const updateCategory = (oldName, newName) => {
  return async (dispatch) => {
    try {
      console.log("🔄 [DEBUG] updateCategory - Enviando:", {
        oldName,
        newName,
      });

      // ✅ CORREGIDO: Usar encodeURIComponent y la ruta correcta
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
        Swal.fire({
          icon: "error",
          title: "Error",
          text: body.msg || "Error al actualizar la categoría",
        });
      }
    } catch (error) {
      console.error("Error actualizando categoría:", error);

      // ✅ DETECTAR ERROR 404 (categoría no encontrada)
      if (error.message?.includes("404")) {
        Swal.fire({
          icon: "error",
          title: "Categoría no encontrada",
          text: "La categoría que intentas actualizar no existe.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error de conexión",
          text: "No se pudo actualizar la categoría. Verifica tu conexión.",
        });
      }
    }
  };
};

export const deleteCategory = (categoryName) => {
  return async (dispatch) => {
    try {
      // ✅ CONFIRMACIÓN MEJORADA
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        html: `
          <div style="text-align: center;">
            <p>Vas a eliminar la categoría:</p>
            <p style="font-weight: bold; color: #ef4444; font-size: 1.1rem;">"${categoryName}"</p>
            <p style="font-size: 0.9rem; color: #6b7280; margin-top: 10px;">
              Esta acción no se puede deshacer.
            </p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (!result.isConfirmed) {
        return;
      }

      console.log("🗑️ [DEBUG] deleteCategory - Eliminando:", categoryName);

      // ✅ CORREGIDO: Usar encodeURIComponent
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
        Swal.fire({
          icon: "success",
          title: "¡Eliminada!",
          text: "Categoría eliminada correctamente",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // ✅ MANEJO ESPECÍFICO PARA CATEGORÍAS CON PRODUCTOS
        if (
          body.msg &&
          (body.msg.includes("producto") || body.msg.includes("asociado"))
        ) {
          await Swal.fire({
            icon: "error",
            title: "No se puede eliminar",
            html: `
              <div style="text-align: left;">
                <p style="margin-bottom: 15px;">
                  <strong>"${categoryName}"</strong> no se puede eliminar porque tiene <strong>${
                    body.productsCount || "varios"
                  } producto(s)</strong> asociado(s).
                </p>
                <div style="background: #fef2f2; padding: 12px; border-radius: 8px; border-left: 4px solid #ef4444;">
                  <p style="margin: 0; font-size: 0.9rem; color: #7f1d1d;">
                    <strong>⚠️ Acción requerida:</strong><br>
                    Antes de eliminar esta categoría, debes:
                  </p>
                  <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 0.85rem; color: #b91c1c;">
                    <li>Eliminar todos los productos de esta categoría, o</li>
                    <li>Reasignar los productos a otra categoría</li>
                  </ul>
                </div>
                ${
                  body.products && body.products.length > 0
                    ? `
                  <div style="margin-top: 15px;">
                    <p style="font-size: 0.9rem; margin-bottom: 8px;"><strong>Productos en esta categoría:</strong></p>
                    <div style="max-height: 120px; overflow-y: auto; background: white; border: 1px solid #fecaca; border-radius: 6px; padding: 8px;">
                      ${body.products
                        .map(
                          (product) =>
                            `<div style="padding: 4px 0; border-bottom: 1px solid #fef2f2; font-size: 0.85rem;">
                          • ${product.name}
                        </div>`,
                        )
                        .join("")}
                    </div>
                  </div>
                `
                    : ""
                }
              </div>
            `,
            confirmButtonText: "Entendido",
            width: "500px",
          });
        } else {
          // ✅ OTROS ERRORES
          Swal.fire({
            icon: "error",
            title: "Error",
            text: body.msg || "Error al eliminar la categoría",
          });
        }
      }
    } catch (error) {
      console.error("Error eliminando categoría:", error);

      // ✅ MANEJO DE ERRORES DE RED O SERVIDOR
      if (error.message && error.message.includes("400")) {
        Swal.fire({
          icon: "error",
          title: "No se puede eliminar",
          html: `
            <div style="text-align: center;">
              <p>La categoría <strong>"${categoryName}"</strong> no se puede eliminar porque contiene productos.</p>
              <p style="font-size: 0.9rem; color: #6b7280; margin-top: 10px;">
                Elimina o reasigna los productos primero.
              </p>
            </div>
          `,
        });
      } else if (error.message && error.message.includes("404")) {
        Swal.fire({
          icon: "error",
          title: "Categoría no encontrada",
          text: "La categoría que intentas eliminar no existe.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error de conexión",
          text: "No se pudo eliminar la categoría. Verifica tu conexión.",
        });
      }
    }
  };
};
