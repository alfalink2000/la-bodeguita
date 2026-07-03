import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { insertProduct, updateProduct } from "../../../actions/productsActions";
import StoreSelector from "../StoreSelector/StoreSelector";
import Swal from "sweetalert2";

const ProductForm = ({ product, categories, onCancel }) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    store_id: "",
    status: "available",
    stock_quantity: 1,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState({});
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price ? product.price.toString() : "",
        category_id: product.category_id ? product.category_id.toString() : "",
        store_id: product.store_id ? product.store_id.toString() : "",
        status: product.status || "available",
        stock_quantity: product.stock_quantity || 0,
      });
      setSelectedCategoryId(
        product.category_id ? product.category_id.toString() : "",
      );
      setSelectedStoreId(product.store_id ? product.store_id.toString() : "");
      if (product.image_url) {
        setImagePreview(product.image_url);
      }
    }
  }, [product]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "El nombre del producto es requerido";
    }
    if (!formData.description.trim()) {
      newErrors.description = "La descripción del producto es requerida";
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "El precio debe ser un número mayor a 0";
    }
    if (!formData.category_id) {
      newErrors.category_id = "Debes seleccionar una categoría";
    }
    if (!product && !imageFile && !imagePreview) {
      newErrors.image = "La imagen del producto es requerida";
    }
    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = "El stock no puede ser negativo";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };
      if (name === "status" && value === "outOfStock") {
        newFormData.stock_quantity = 0;
      } else if (
        name === "status" &&
        value === "available" &&
        prev.stock_quantity === 0
      ) {
        newFormData.stock_quantity = 1;
      } else if (name === "stock_quantity" && parseInt(value) === 0) {
        newFormData.status = "outOfStock";
      } else if (
        name === "stock_quantity" &&
        parseInt(value) > 0 &&
        prev.status === "outOfStock"
      ) {
        newFormData.status = "available";
      }
      return newFormData;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          image: "Por favor selecciona un archivo de imagen válido",
        }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: "La imagen debe ser menor a 10MB",
        }));
        return;
      }
      setImageFile(file);
      setErrors((prev) => ({ ...prev, image: "" }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const errorMessages = Object.values(errors).join("<br>");
      Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        html: errorMessages,
        confirmButtonText: "Entendido",
      });
      return;
    }
    setIsLoading(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append("name", formData.name.trim());
      submitFormData.append("description", formData.description.trim());
      submitFormData.append("price", formData.price);
      submitFormData.append("category_id", formData.category_id);
      submitFormData.append("status", formData.status);
      submitFormData.append("stock_quantity", formData.stock_quantity.toString());
      if (formData.store_id) {
        submitFormData.append("store_id", formData.store_id);
      }
      if (imageFile) {
        submitFormData.append("image", imageFile);
      }
      if (product && product.id) {
        submitFormData.append("id", product.id);
        await dispatch(updateProduct(submitFormData));
      } else {
        await dispatch(insertProduct(submitFormData));
      }
      console.log("[ProductForm] Operación completada, cerrando formulario");
      onCancel();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (!product) {
      setErrors((prev) => ({
        ...prev,
        image: "La imagen del producto es requerida",
      }));
    }
    const fileInput = document.querySelector(".product-form__file-input");
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="admin-modal admin-modal--open">
      <div className="admin-modal__overlay" onClick={onCancel} />
      <div className="admin-modal__container" style={{ maxWidth: "640px" }}>
        <div className="admin-modal__header" style={{ position: "sticky" }}>
          <h2 className="admin-modal__title">
            {product ? "Editar Producto" : "Agregar Producto"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="admin-form-group__helper">* Campos requeridos</span>
            <button type="button" className="admin-modal__close" onClick={onCancel}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-modal__body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Name */}
            <div className="admin-form-group">
              <label className="admin-form-group__label">Nombre *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`admin-input ${errors.name ? "admin-input--error" : ""}`}
                required
                placeholder="Nombre del producto"
                disabled={isLoading}
              />
              {errors.name && <span className="admin-form-group__error">{errors.name}</span>}
            </div>

            {/* Description */}
            <div className="admin-form-group">
              <label className="admin-form-group__label">Descripción *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className={`admin-textarea ${errors.description ? "admin-textarea--error" : ""}`}
                required
                placeholder="Descripción del producto"
                disabled={isLoading}
              />
              {errors.description && <span className="admin-form-group__error">{errors.description}</span>}
            </div>

            {/* Price */}
            <div className="admin-form-group">
              <label className="admin-form-group__label">Precio ($) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={`admin-input ${errors.price ? "admin-input--error" : ""}`}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                disabled={isLoading}
              />
              {errors.price && <span className="admin-form-group__error">{errors.price}</span>}
            </div>

            {/* Store & Category */}
            <div className="admin-form-group">
              <label className="admin-form-group__label">Tienda y Categoría *</label>
              <StoreSelector
                selectedStoreId={selectedStoreId}
                onStoreChange={(storeId) => {
                  setSelectedStoreId(storeId);
                  setFormData((prev) => ({
                    ...prev,
                    category_id: "",
                    store_id: storeId,
                  }));
                }}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={(catId) => {
                  setSelectedCategoryId(catId);
                  setFormData((prev) => ({ ...prev, category_id: catId }));
                }}
                disabled={isLoading}
              />
              {errors.category_id && <span className="admin-form-group__error">{errors.category_id}</span>}
            </div>

            {/* Stock */}
            <div className="admin-form-group">
              <label className="admin-form-group__label">Stock *</label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                className={`admin-input ${errors.stock_quantity ? "admin-input--error" : ""}`}
                min="0"
                required
                placeholder="0"
                disabled={isLoading}
              />
              {errors.stock_quantity && <span className="admin-form-group__error">{errors.stock_quantity}</span>}
              <span className="admin-form-group__helper">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>check_circle</span>
                Stock se sincroniza automáticamente con el estado
              </span>
            </div>

            {/* Image */}
            <div className="admin-form-group">
              <label className="admin-form-group__label">
                Imagen del Producto {!product && "*"}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="admin-file-input"
                disabled={isLoading}
              />
              <span className="admin-form-group__helper">Formatos: JPG, PNG, GIF, WebP. Máximo 10MB.</span>
              {errors.image && <span className="admin-form-group__error">{errors.image}</span>}
              {imagePreview && (
                <div className="admin-image-preview">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="admin-image-preview__img"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="admin-image-preview__remove"
                    disabled={isLoading}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span>
                  </button>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="admin-form-group">
              <label className="admin-form-group__label">Estado</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="admin-select"
                disabled={isLoading}
              >
                <option value="available">Disponible</option>
                <option value="outOfStock">Agotado</option>
              </select>
              <span className="admin-form-group__helper">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>check_circle</span>
                Estado se sincroniza automáticamente con el stock
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="admin-modal__footer">
            <button
              type="submit"
              className="admin-btn admin-btn--primary admin-btn--full"
              disabled={isLoading}
            >
              {isLoading
                ? product
                  ? "Actualizando..."
                  : "Creando producto..."
                : product
                  ? "Guardar Cambios"
                  : "Agregar Producto"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="admin-btn admin-btn--secondary admin-btn--full"
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
