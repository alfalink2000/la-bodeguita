import React, { useCallback, memo } from "react";

const ProductCardOffer = memo(
  ({ product, onWhatsAppClick, onProductClick }) => {
    const isAvailable = product.stock_quantity > 0;

    const handleCardClick = useCallback(() => {
      onProductClick?.(product);
    }, [onProductClick, product]);

    const handleWhatsAppClick = useCallback(
      (e) => {
        e.stopPropagation();
        onWhatsAppClick?.(product.name);
      },
      [onWhatsAppClick, product.name]
    );

    const handleImageError = useCallback((e) => {
      e.target.src =
        "https://via.placeholder.com/200x200?text=Imagen+No+Disponible";
    }, []);

    return (
      <div className="client-offer-card" onClick={handleCardClick}>
        <div className="client-offer-card__badge">
          <span className="client-offer-card__badge-icon material-symbols-outlined">local_fire_department</span>
          <span className="client-offer-card__badge-text">HOT</span>
        </div>

        <div className="client-offer-card__image-wrapper">
          <img
            src={product.image_url}
            alt={product.name}
            className="client-offer-card__image"
            onError={handleImageError}
            loading="lazy"
          />
        </div>

        <div className="client-offer-card__body">
          <h3 className="client-offer-card__name">
            {product.name}
          </h3>

          <div className="client-offer-card__row">
            <div className="client-offer-card__price">
              ${parseFloat(product.price).toFixed(2)}
            </div>
            <div className="client-offer-card__category">
              {product.category?.name}
            </div>
          </div>

          <p className="client-offer-card__description">
            {product.description?.substring(0, 80) ||
              "¡Oferta especial! No te pierdas esta oportunidad..."}
            {product.description && product.description.length > 80
              ? "..."
              : ""}
          </p>

          <button
            className="client-offer-card__btn"
            onClick={handleWhatsAppClick}
            disabled={!isAvailable}
          >
            <span className="client-offer-card__btn-icon material-symbols-outlined">phone</span>
            Consultar Oferta
          </button>
        </div>
      </div>
    );
  }
);

ProductCardOffer.displayName = "ProductCardOffer";

export default ProductCardOffer;
