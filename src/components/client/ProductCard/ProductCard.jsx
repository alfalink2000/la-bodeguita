// components/client/ProductCard/ProductCard.jsx
import React, { useCallback, memo, useState, useEffect } from "react";
import { FiPhone, FiPlus, FiMinus, FiShoppingCart } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, updateCartQuantity } from "../../../actions/cartActions";
import { selectCartItems } from "../../../selectors/cartSelectors";
import "./ProductCard.css";
import "./ProductCard.desktop.css";

const ProductCard = memo(({ product, onWhatsAppClick, onProductClick }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const [showQuantity, setShowQuantity] = useState(false);
  const [isCheckingStock, setIsCheckingStock] = useState(false);

  const currency = useSelector(
    (state) => state.appConfig.config?.currency || "MN",
  );
  const isAvailable =
    product.status === "available" && product.stock_quantity > 0;
  const cartItem = cartItems.find((item) => item.id === product.id);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  useEffect(() => {
    setShowQuantity(currentQuantity > 0);
  }, [currentQuantity]);

  const getCurrencySymbol = useCallback(() => {
    switch (currency) {
      case "USD":
        return "US$";
      case "EUR":
        return "€";
      default:
        return "$";
    }
  }, [currency]);

  const formatPrice = useCallback((price) => parseFloat(price).toFixed(2), []);

  const handleCardClick = useCallback(
    () => onProductClick?.(product),
    [onProductClick, product],
  );

  const handleWhatsAppClick = useCallback(
    (e) => {
      e.stopPropagation();
      onWhatsAppClick?.(product.name);
    },
    [onWhatsAppClick, product.name],
  );

  const handleAddToCart = useCallback(
    async (e) => {
      e.stopPropagation();
      if (!isAvailable) return;

      setIsCheckingStock(true);

      try {
        const token = localStorage.getItem("token");
        const API_URL =
          import.meta.env.VITE_API_URL ||
          "https://minimarket-backend-6z9m.onrender.com";

        const stockRes = await fetch(`${API_URL}/api/products/get-stock`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-token": token },
          body: JSON.stringify({ ids: [product.id] }),
        });

        const stockData = await stockRes.json();

        if (stockData.ok && stockData.stock[product.id]) {
          const currentStock = stockData.stock[product.id].stock_quantity;
          const currentStatus = stockData.stock[product.id].status;

          if (currentStock <= 0 || currentStatus !== "available") {
            Swal.fire({
              icon: "error",
              title: "Producto agotado",
              text: `Lo sentimos, ${product.name} ya no está disponible.`,
              confirmButtonColor: "#059669",
            });
            setIsCheckingStock(false);
            return;
          }

          if (currentQuantity >= currentStock) {
            Swal.fire({
              icon: "warning",
              title: "Stock insuficiente",
              text: `Solo hay ${currentStock} unidades disponibles de ${product.name}.`,
              confirmButtonColor: "#059669",
            });
            setIsCheckingStock(false);
            return;
          }
        }

        dispatch(addToCart(product));
      } catch (error) {
        console.error("Error verificando stock:", error);
        dispatch(addToCart(product));
      } finally {
        setIsCheckingStock(false);
      }
    },
    [dispatch, product, isAvailable, currentQuantity],
  );

  const handleQuantityChange = useCallback(
    (e, change) => {
      e.stopPropagation();
      const newQuantity = Math.max(0, currentQuantity + change);
      if (newQuantity === 0) {
        dispatch(updateCartQuantity(product.id, 0));
      } else if (newQuantity <= product.stock_quantity) {
        dispatch(updateCartQuantity(product.id, newQuantity));
      } else {
        Swal.fire({
          icon: "warning",
          title: "Stock insuficiente",
          text: `Solo hay ${product.stock_quantity} unidades disponibles.`,
          confirmButtonColor: "#059669",
          timer: 2000,
        });
      }
    },
    [dispatch, product.id, product.stock_quantity, currentQuantity],
  );

  const handleImageError = useCallback((e) => {
    e.target.src =
      "https://via.placeholder.com/200x200?text=Imagen+No+Disponible";
  }, []);

  return (
    <div className="product-card" onClick={handleCardClick}>
      <div className="product-card__image-container">
        <img
          src={product.image_url}
          alt={product.name}
          className="product-card__image"
          onError={handleImageError}
          loading="lazy"
        />
        <div
          className={`product-card__status ${isAvailable ? "available" : "out-of-stock"}`}
        >
          {isAvailable ? "🟢 Disponible" : "🔴 Agotado"}
        </div>
        <div className="product-card__currency-badge">{currency}</div>
        {currentQuantity > 0 && (
          <div className="product-card__cart-badge">{currentQuantity}</div>
        )}
      </div>

      <div className="product-card__content">
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__info-row">
          <div className="product-card__price">
            {getCurrencySymbol()} {formatPrice(product.price)}
          </div>
          <div className="product-card__category">{product.category?.name}</div>
        </div>

        {/* ✅ Mostrar stock disponible */}
        <div className="product-card__stock-info">
          <span className="stock-label">Stock:</span>
          <span
            className={`stock-value ${product.stock_quantity <= 5 ? "low-stock" : product.stock_quantity <= 10 ? "medium-stock" : "good-stock"}`}
          >
            {product.stock_quantity} unidades
          </span>
        </div>

        <p className="product-card__description">
          {product.description?.substring(0, 80) || "Producto de calidad..."}
          {product.description && product.description.length > 80 ? "..." : ""}
        </p>

        {showQuantity || currentQuantity > 0 ? (
          <div className="product-card__quantity-controls">
            <button
              className="quantity-btn minus"
              onClick={(e) => handleQuantityChange(e, -1)}
              disabled={!isAvailable || isCheckingStock}
            >
              <FiMinus size={14} />
            </button>
            <span className="quantity-display">{currentQuantity}</span>
            <button
              className="quantity-btn plus"
              onClick={(e) => handleQuantityChange(e, 1)}
              disabled={
                !isAvailable ||
                isCheckingStock ||
                currentQuantity >= product.stock_quantity
              }
            >
              <FiPlus size={14} />
            </button>
          </div>
        ) : (
          <div className="product-card__action-buttons">
            <button
              className="product-card__cart-btn"
              onClick={handleAddToCart}
              disabled={!isAvailable || isCheckingStock}
            >
              <FiShoppingCart className="cart-icon" />
              {isCheckingStock ? "Verificando..." : "Agregar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";
export default ProductCard;
