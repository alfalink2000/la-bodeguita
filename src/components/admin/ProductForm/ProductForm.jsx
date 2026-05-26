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
    status: "available",
    stock_quantity: 1,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState({});
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'uploading', 'success', 'error'

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
        // Aumentado a 10MB para mejor calidad
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

  // ✅ NUEVA FUNCIÓN: Subir imagen en segundo plano después de crear el producto
  const uploadImageInBackground = async (
    productId,
    imageBuffer,
    categoryName,
  ) => {
    try {
      setUploadStatus("uploading");
      console.log(
        `🖼️ Subiendo imagen en segundo plano para producto ${productId}...`,
      );

      const formData = new FormData();
      formData.append("image", imageBuffer);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "https://minimarket-backend-6z9m.onrender.com"}/api/products/update/${productId}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      const result = await response.json();

      if (result.ok) {
        console.log("✅ Imagen subida exitosamente en segundo plano");
        setUploadStatus("success");
        // Opcional: Mostrar notificación de éxito
        setTimeout(() => setUploadStatus(null), 3000);
      } else {
        throw new Error(result.msg || "Error al subir imagen");
      }
    } catch (error) {
      console.error("❌ Error subiendo imagen en segundo plano:", error);
      setUploadStatus("error");
      // Opcional: Mostrar notificación de error
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

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

      // ✅ PASO 1: Crear producto SIN imagen primero (rápido)
      const productData = new FormData();

      // Agregar todos los campos excepto la imagen
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== undefined && formData[key] !== "") {
          productData.append(key, formData[key]);
        }
      });

      console.log("📤 PASO 1: Creando producto sin imagen...");
      const createResponse = await fetch(`${API_URL}/api/products/new`, {
        method: "POST",
        body: productData,
      });

      const createResult = await createResponse.json();

      if (!createResult.ok) {
        throw new Error(createResult.msg || "Error al crear el producto");
      }

      const newProduct = createResult.product;
      console.log("✅ Producto creado exitosamente:", newProduct);

      // ✅ PASO 2: Si hay imagen, subirla en segundo plano (no bloqueante)
      if (imageFile) {
        console.log(
          "🖼️ PASO 2: Iniciando subida de imagen en segundo plano...",
        );

        // Subir imagen sin esperar a que termine
        uploadImageInBackground(newProduct.id, imageFile, formData.category_id);

        // Mostrar mensaje indicando que la imagen se está procesando
        alert(
          "✅ Producto creado exitosamente.\n\nLa imagen se está subiendo en segundo plano y aparecerá en unos momentos.",
        );
      } else {
        alert("✅ Producto creado exitosamente.");
      }

      // ✅ Recargar la lista de productos para mostrar el nuevo producto
      if (onSubmit) {
        onSubmit(); // Llamar al callback para recargar la lista
      }

      // Cerrar el formulario
      onCancel();

      // Opcional: Recargar la página para mostrar el producto actualizado
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("❌ Error detallado:", error);
      alert(`Error al crear producto: ${error.message}`);
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

        {/* ✅ NUEVO: Indicador de subida en segundo plano */}
        {uploadStatus === "uploading" && (
          <div className="product-form__notification product-form__notification--info">
            <span className="spinner"></span>
            Subiendo imagen en segundo plano...
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="product-form__notification product-form__notification--success">
            ✅ ¡Imagen subida exitosamente!
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="product-form__notification product-form__notification--error">
            ⚠️ Error al subir la imagen. El producto se creó sin imagen.
          </div>
        )}

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
              {!product &&
                " La imagen es requerida y se subirá en segundo plano."}
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

          {/* DEBUG: Mostrar estado actual */}
          <div
            className="product-form__debug"
            style={{
              padding: "10px",
              background: "#f5f5f5",
              borderRadius: "4px",
              fontSize: "12px",
              marginBottom: "15px",
            }}
          >
            <strong>Estado actual:</strong>
            <br />
            Status:{" "}
            <span
              style={{
                color: formData.status === "available" ? "green" : "red",
              }}
            >
              {formData.status}
            </span>
            <br />
            Stock:{" "}
            <span
              style={{ color: formData.stock_quantity > 0 ? "green" : "red" }}
            >
              {formData.stock_quantity}
            </span>
          </div>

          <div className="product-form__actions">
            <button
              type="submit"
              className="product-form__submit"
              disabled={isLoading}
            >
              {isLoading
                ? "Creando producto..."
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
