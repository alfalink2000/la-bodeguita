import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  updateCartQuantity,
  removeFromCart,
} from "../../../actions/cartActions";
import { selectCartItems } from "../../../selectors/cartSelectors";
import { selectProducts } from "../../../selectors/productSelectors";
import "./ProductDetail.css";

const Thumbnail = React.memo(({ image, index, isActive, onClick }) => (
  <button
    onClick={() => onClick(index)}
    aria-label={`Ver imagen ${index + 1}`}
    className={`product-detail__thumbnail ${isActive ? "product-detail__thumbnail--active" : ""}`}
  >
    <img
      src={image}
      alt={`Vista ${index + 1}`}
      loading="lazy"
      className="product-detail__thumbnail-img"
    />
  </button>
));

Thumbnail.displayName = "Thumbnail";

const ProductDetail = ({ product, onBack, onWhatsAppClick }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const allProducts = useSelector(selectProducts);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationQuantity, setNotificationQuantity] = useState(0);

  const cartItem = cartItems.find((item) => item.id === product?.id);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  // Scroll al top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Auto-ocultar notificación
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
        setNotificationQuantity(0);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const { isAvailable, images, formattedPrice } = useMemo(
    () => ({
      isAvailable:
        product?.status === "available" && product?.stock_quantity > 0,
      images: [product?.image_url].filter(Boolean),
      formattedPrice: product?.price
        ? `$${parseFloat(product.price).toFixed(2)}`
        : "$0.00",
    }),
    [product],
  );

  const handleAddToCart = useCallback(() => {
    if (!isAvailable) return;
    const newQuantity = currentQuantity + 1;
    dispatch(addToCart(product));
    setNotificationMessage(
      window.innerWidth >= 768
        ? "Producto agregado al carrito"
        : "Agregado al carrito",
    );
    setNotificationQuantity(newQuantity);
    setShowNotification(true);
  }, [dispatch, product, isAvailable, currentQuantity]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setNotificationMessage("Enlace copiado");
      setNotificationQuantity(0);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    }
  }, [product]);

  const handleImageSelect = useCallback((index) => {
    setSelectedImage(index);
  }, []);

  const handleImageError = useCallback((e) => {
    e.target.src =
      "https://via.placeholder.com/600x600/ffffff/374151?text=Imagen+No+Disponible";
  }, []);

  // Productos relacionados
  const relatedProducts = useMemo(
    () =>
      allProducts
        .filter((p) => p.id !== product?.id && p.store_id === product?.store_id)
        .slice(0, 8),
    [allProducts, product],
  );

  if (!product) return null;

  return (
    <div className="product-detail">
      {/* ============================================ */}
      {/* NOTIFICACIÓN FLOTANTE                         */}
      {/* ============================================ */}
      {showNotification && (
        <div className="product-detail__notification" role="status">
          <div className="product-detail__notification-content">
            <span className="product-detail__notification-icon material-symbols-outlined">
              check_circle
            </span>
            <div className="product-detail__notification-text">
              <p className="product-detail__notification-title">
                {notificationMessage}
              </p>
              <p className="product-detail__notification-sub">
                {notificationQuantity} producto
                {notificationQuantity !== 1 ? "s" : ""} en tu carrito
              </p>
            </div>
            <button
              className="product-detail__notification-close"
              onClick={() => setShowNotification(false)}
              aria-label="Cerrar notificación"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* HEADER FLOTANTE                               */}
      {/* ============================================ */}
      <header className="product-detail__floating-header">
        <button
          onClick={onBack}
          aria-label="Volver atrás"
          className="product-detail__back-btn"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Volver</span>
        </button>
        <button
          onClick={handleShare}
          aria-label="Compartir"
          className="product-detail__share-btn"
        >
          <span className="material-symbols-outlined">share</span>
        </button>
      </header>

      {/* ============================================ */}
      {/* CONTENIDO PRINCIPAL                           */}
      {/* ============================================ */}
      <main className="product-detail__main">
        <div className="product-detail__layout">
          {/* ============================================ */}
          {/* GALERÍA DE IMÁGENES                           */}
          {/* ============================================ */}
          <section className="product-detail__gallery">
            <div className="product-detail__gallery-container">
              <div className="product-detail__main-image-wrapper">
                {!imageLoaded && (
                  <div
                    className="product-detail__image-skeleton"
                    aria-hidden="true"
                  />
                )}
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className={`product-detail__main-image ${imageLoaded ? "product-detail__main-image--loaded" : ""}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={handleImageError}
                  loading="eager"
                />
                <span
                  className={`product-detail__status-badge ${isAvailable ? "product-detail__status-badge--available" : "product-detail__status-badge--soldout"}`}
                >
                  {isAvailable ? "Disponible" : "Agotado"}
                </span>
              </div>

              {images.length > 1 && (
                <div className="product-detail__thumbnails">
                  {images.map((image, index) => (
                    <Thumbnail
                      key={index}
                      image={image}
                      index={index}
                      isActive={selectedImage === index}
                      onClick={handleImageSelect}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ============================================ */}
          {/* INFORMACIÓN DEL PRODUCTO                      */}
          {/* ============================================ */}
          <section className="product-detail__info">
            <div className="product-detail__info-content">
              {/* Header */}
              <div className="product-detail__product-header">
                {product.category?.name && (
                  <span className="product-detail__category-tag">
                    {product.category.name}
                  </span>
                )}
                <h1 className="product-detail__product-name">{product.name}</h1>
              </div>

              {/* Precio */}
              <div className="product-detail__price">{formattedPrice}</div>

              {/* Especificaciones */}
              <div className="product-detail__specs">
                <div className="product-detail__spec-item">
                  <span className="product-detail__spec-label">Stock:</span>
                  <span className="product-detail__spec-value">
                    {product.stock_quantity}u
                  </span>
                </div>
                <div className="product-detail__spec-item">
                  <span className="product-detail__spec-label">Categoría:</span>
                  <span className="product-detail__spec-value">
                    {product.category?.name}
                  </span>
                </div>
                <div className="product-detail__spec-item">
                  <span className="product-detail__spec-label">Entrega:</span>
                  <span className="product-detail__spec-value">24-48h</span>
                </div>
              </div>

              {/* Descripción */}
              <div className="product-detail__description">
                <h3 className="product-detail__description-title">
                  Descripción
                </h3>
                <p className="product-detail__description-text">
                  {product.description ||
                    "Descubre la excelencia en cada detalle. Este producto ha sido cuidadosamente seleccionado para ofrecerte la mejor calidad y experiencia."}
                </p>
              </div>

              {/* Feature pills */}
              <div className="product-detail__features">
                <div className="product-detail__feature-pill">
                  <span className="material-symbols-outlined product-detail__feature-icon">
                    schedule
                  </span>
                  <div className="product-detail__feature-text">
                    <p className="product-detail__feature-title">Disponible</p>
                    <p className="product-detail__feature-sub">
                      Lun-Vie 8:00-20:00
                    </p>
                  </div>
                </div>
                <div className="product-detail__feature-pill">
                  <span className="material-symbols-outlined product-detail__feature-icon">
                    local_shipping
                  </span>
                  <div className="product-detail__feature-text">
                    <p className="product-detail__feature-title">Envío</p>
                    <p className="product-detail__feature-sub">A domicilio</p>
                  </div>
                </div>
              </div>

              {/* Botón de acción (Desktop) */}
              <div className="product-detail__action-desktop">
                <button
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                  className={`product-detail__add-btn ${isAvailable ? "product-detail__add-btn--available" : "product-detail__add-btn--disabled"}`}
                >
                  <span className="material-symbols-outlined">
                    shopping_cart
                  </span>
                  <div className="product-detail__add-btn-text">
                    <p>
                      {isAvailable ? "Agregar al Carrito" : "Producto Agotado"}
                    </p>
                    <p>Compra rápida y segura</p>
                  </div>
                  {currentQuantity > 0 && (
                    <span className="product-detail__cart-badge">
                      {currentQuantity}
                    </span>
                  )}
                </button>
              </div>

              {/* Nota de seguridad */}
              <div className="product-detail__security">
                <span className="material-symbols-outlined product-detail__security-icon">
                  verified
                </span>
                <span>Compra 100% segura · Tus datos están protegidos</span>
              </div>
            </div>
          </section>
        </div>

        {/* ============================================ */}
        {/* CROSS-SELLING                                 */}
        {/* ============================================ */}
        {relatedProducts.length > 0 && (
          <div className="product-detail__related">
            <h3 className="product-detail__related-title">
              También te puede interesar
            </h3>
            <div className="product-detail__related-scroll">
              {relatedProducts.map((related) => (
                <div key={related.id} className="product-detail__related-card">
                  <div className="product-detail__related-image-wrapper">
                    <img
                      className="product-detail__related-image"
                      src={
                        related.image_url || "https://via.placeholder.com/200"
                      }
                      alt={related.name}
                      loading="lazy"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(addToCart(related));
                      }}
                      className="product-detail__related-add-btn"
                      aria-label={`Agregar ${related.name}`}
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                  <div className="product-detail__related-info">
                    <h4 className="product-detail__related-name">
                      {related.name}
                    </h4>
                    <p className="product-detail__related-price">
                      ${related.price} CUP
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ============================================ */}
      {/* BARRA INFERIOR MÓVIL                          */}
      {/* ============================================ */}
      <div className="product-detail__mobile-bar">
        <div className="product-detail__mobile-bar-content">
          {/* Selector de cantidad */}
          <div className="product-detail__quantity-selector">
            <button
              onClick={() => {
                if (currentQuantity > 0) {
                  const newQty = currentQuantity - 1;
                  if (newQty === 0) {
                    dispatch(removeFromCart(product.id));
                  } else {
                    dispatch(updateCartQuantity(product.id, newQty));
                  }
                }
              }}
              disabled={currentQuantity === 0 || !isAvailable}
              className="product-detail__quantity-btn"
              aria-label="Reducir cantidad"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="product-detail__quantity-value">
              {currentQuantity}
            </span>
            <button
              onClick={() => {
                if (isAvailable) dispatch(addToCart(product));
              }}
              disabled={!isAvailable}
              className="product-detail__quantity-btn"
              aria-label="Aumentar cantidad"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>

          {/* Botón agregar */}
          <button
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className={`product-detail__mobile-add-btn ${isAvailable ? "product-detail__mobile-add-btn--available" : "product-detail__mobile-add-btn--disabled"}`}
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductDetail);
