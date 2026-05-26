// components/ProductForm/ProductForm.jsx
import { useState, useEffect } from "react";
import StoreSelector from "../StoreSelector/StoreSelector";
import "./ProductForm.css";

const ProductForm = ({ product, categories, onSubmit, onCancel }) => {
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

  // ✅ CORREGIDO: Enviar SOLO el producto creado/actualizado, NO FormData
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Por favor completa todos los campos requeridos correctamente");
      return;
    }

    setIsLoading(true);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL ||
        "https://minimarket-backend-6z9m.onrender.com";

      // ✅ CREAR FormData para enviar al backend
      const submitFormData = new FormData();

      // Agregar todos los campos del formulario
      submitFormData.append("name", formData.name.trim());
      submitFormData.append("description", formData.description.trim());
      submitFormData.append("price", formData.price);
      submitFormData.append("category_id", formData.category_id);
      submitFormData.append("status", formData.status);
      submitFormData.append(
        "stock_quantity",
        formData.stock_quantity.toString(),
      );

      // Agregar store_id si existe
      if (formData.store_id) {
        submitFormData.append("store_id", formData.store_id);
      }

      // Agregar imagen si existe
      if (imageFile) {
        submitFormData.append("image", imageFile);
      }

      // ✅ DEBUG: Ver qué se está enviando
      console.log("📤 Enviando FormData:");
      for (let pair of submitFormData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      let url = `${API_URL}/api/products/new`;
      let method = "POST";

      // Si es edición, cambiar URL y método
      if (product && product.id) {
        url = `${API_URL}/api/products/update/${product.id}`;
        method = "PUT";
        console.log("✏️ Modo edición - ID:", product.id);
      }

      const response = await fetch(url, {
        method: method,
        body: submitFormData,
        // No incluir Content-Type, fetch lo setea automáticamente con el boundary
      });

      const result = await response.json();

      if (result.ok) {
        alert(
          product
            ? "Producto actualizado exitosamente"
            : "Producto creado exitosamente",
        );

        // ✅ CORREGIDO: Llamar a onSubmit con el producto JSON, NO con FormData
        if (onSubmit) {
          // Pasamos el producto que viene en la respuesta
          onSubmit(result.product);
        }

        // Cerrar el formulario
        onCancel();
      } else {
        alert(result.msg || "Error al guardar el producto");
      }
    } catch (error) {
      console.error("❌ Error detallado:", error);
      alert(
        `Error al ${product ? "actualizar" : "crear"} producto: ${error.message}`,
      );
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
    <div className="product-form-overlay">
      <div className="product-form">
        <div className="product-form__header">
          <h2 className="product-form__title">
            {product ? "Editar Producto" : "Agregar Producto"}
          </h2>
          <div className="product-form__required-note">* Campos requeridos</div>
        </div>

        <form onSubmit={handleSubmit} className="product-form__content">
          {/* Campo Nombre */}
          <div className="product-form__group">
            <label className="product-form__label">Nombre *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`product-form__input ${
                errors.name ? "product-form__input--error" : ""
              }`}
              required
              placeholder="Nombre del producto"
              disabled={isLoading}
            />
            {errors.name && (
              <span className="product-form__error">{errors.name}</span>
            )}
          </div>

          {/* Campo Descripción */}
          <div className="product-form__group">
            <label className="product-form__label">Descripción *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className={`product-form__textarea ${
                errors.description ? "product-form__input--error" : ""
              }`}
              required
              placeholder="Descripción del producto"
              disabled={isLoading}
            />
            {errors.description && (
              <span className="product-form__error">{errors.description}</span>
            )}
          </div>

          {/* Campo Precio */}
          <div className="product-form__group">
            <label className="product-form__label">Precio ($) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className={`product-form__input ${
                errors.price ? "product-form__input--error" : ""
              }`}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              disabled={isLoading}
            />
            {errors.price && (
              <span className="product-form__error">{errors.price}</span>
            )}
          </div>

          {/* Campo Categoría */}
          <div className="product-form__group">
            <label className="product-form__label">Tienda y Categoría *</label>
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
            {errors.category_id && (
              <span className="product-form__error">{errors.category_id}</span>
            )}
          </div>

          {/* Campo Stock */}
          <div className="product-form__group">
            <label className="product-form__label">Stock *</label>
            <input
              type="number"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleInputChange}
              className={`product-form__input ${
                errors.stock_quantity ? "product-form__input--error" : ""
              }`}
              min="0"
              required
              placeholder="0"
              disabled={isLoading}
            />
            {errors.stock_quantity && (
              <span className="product-form__error">
                {errors.stock_quantity}
              </span>
            )}
            <small className="product-form__help">
              ✅ Stock se sincroniza automáticamente con el estado
            </small>
          </div>

          {/* Campo Imagen */}
          <div className="product-form__group">
            <label className="product-form__label">
              Imagen del Producto {!product && "*"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className={`product-form__file-input ${
                errors.image ? "product-form__input--error" : ""
              }`}
              disabled={isLoading}
            />
            <small className="product-form__help">
              Formatos: JPG, PNG, GIF, WebP. Máximo 10MB.
            </small>

            {errors.image && (
              <span className="product-form__error">{errors.image}</span>
            )}

            {imagePreview && (
              <div className="product-form__image-preview">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="product-form__preview-image"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="product-form__remove-image"
                  disabled={isLoading}
                >
                  × Eliminar
                </button>
              </div>
            )}
          </div>

          {/* Campo Estado */}
          <div className="product-form__group">
            <label className="product-form__label">Estado</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="product-form__select"
              disabled={isLoading}
            >
              <option value="available">Disponible</option>
              <option value="outOfStock">Agotado</option>
            </select>
            <small className="product-form__help">
              ✅ Estado se sincroniza automáticamente con el stock
            </small>
          </div>

          <div className="product-form__actions">
            <button
              type="submit"
              className="product-form__submit"
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
              className="product-form__cancel"
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
