import React, { useCallback, memo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, updateCartQuantity } from "../../../actions/cartActions";
import { selectCartItems } from "../../../selectors/cartSelectors";
import Swal from "sweetalert2";
import "./ProductCard.css";

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
              confirmButtonColor: "var(--color-primary)",
            });
            setIsCheckingStock(false);
            return;
          }

          if (currentQuantity >= currentStock) {
            Swal.fire({
              icon: "warning",
              title: "Stock insuficiente",
              text: `Solo hay ${currentStock} unidades disponibles de ${product.name}.`,
              confirmButtonColor: "var(--color-primary)",
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
          confirmButtonColor: "var(--color-primary)",
          timer: 2000,
        });
      }
    },
    [dispatch, product.id, product.stock_quantity, currentQuantity],
  );

  const handleImageError = useCallback((e) => {
    e.target.src = "https://via.placeholder.com/200x200?text=Producto";
  }, []);

  return (
    <div
      className="product-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleCardClick();
      }}
    >
      {/* Imagen */}
      <div className="product-card__image-wrapper">
        <img
          src={product.image_url}
          alt={product.name}
          className="product-card__image"
          onError={handleImageError}
          loading="lazy"
        />

        {/* Badge de estado */}
        <span
          className={`product-card__status-badge ${isAvailable ? "product-card__status-badge--available" : "product-card__status-badge--soldout"}`}
        >
          {isAvailable ? "Disponible" : "Agotado"}
        </span>

        {/* Badge de moneda */}
        <span className="product-card__currency-badge">{currency}</span>

        {/* Badge de cantidad en carrito */}
        {currentQuantity > 0 && (
          <span className="product-card__cart-badge">{currentQuantity}</span>
        )}
      </div>

      {/* Contenido */}
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>

        <div className="product-card__meta">
          <span className="product-card__price">
            {getCurrencySymbol()} {formatPrice(product.price)}
          </span>
          <span className="product-card__category">
            {product.category?.name}
          </span>
        </div>

        {/* Stock */}
        <div className="product-card__stock">
          <span className="product-card__stock-label">Stock:</span>
          <span
            className={`product-card__stock-value ${product.stock_quantity <= 5 ? "product-card__stock-value--low" : product.stock_quantity <= 10 ? "product-card__stock-value--medium" : "product-card__stock-value--good"}`}
          >
            {product.stock_quantity} unidades
          </span>
        </div>

        {/* Descripción */}
        <p className="product-card__description">
          {product.description?.substring(0, 80) || "Producto de calidad..."}
          {product.description && product.description.length > 80 ? "..." : ""}
        </p>

        {/* Controles de cantidad o botón agregar */}
        {showQuantity || currentQuantity > 0 ? (
          <div className="product-card__quantity">
            <button
              className="product-card__quantity-btn product-card__quantity-btn--minus"
              onClick={(e) => handleQuantityChange(e, -1)}
              disabled={!isAvailable || isCheckingStock}
              aria-label="Reducir cantidad"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="product-card__quantity-value">
              {currentQuantity}
            </span>
            <button
              className="product-card__quantity-btn product-card__quantity-btn--plus"
              onClick={(e) => handleQuantityChange(e, 1)}
              disabled={
                !isAvailable ||
                isCheckingStock ||
                currentQuantity >= product.stock_quantity
              }
              aria-label="Aumentar cantidad"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        ) : (
          <button
            className="product-card__add-btn"
            onClick={handleAddToCart}
            disabled={!isAvailable || isCheckingStock}
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {isCheckingStock ? "Verificando..." : "Agregar"}
          </button>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";
export default ProductCard;
