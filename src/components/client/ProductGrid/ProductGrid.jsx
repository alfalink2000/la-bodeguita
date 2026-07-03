import React from "react";
import ProductCard from "../ProductCard/ProductCard";
import ProductCardOffer from "../ProductCardOffer/ProductCardOffer";
import "./ProductGrid.css";

const ProductGrid = ({ products, onProductClick, isOfferSection = false }) => {
  if (products.length === 0) {
    return (
      <div className="product-grid__empty">
        <div className="product-grid__empty-icon-wrapper">
          <span className="product-grid__empty-icon material-symbols-outlined">
            search
          </span>
        </div>
        <h3 className="product-grid__empty-title">
          No se encontraron productos
        </h3>
        <p className="product-grid__empty-text">
          Intenta ajustar los filtros de búsqueda o categoría
        </p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      <div className="product-grid__container">
        {products.map((product) =>
          isOfferSection ? (
            <ProductCardOffer
              key={product.id}
              product={product}
              onProductClick={onProductClick}
            />
          ) : (
            <ProductCard
              key={product.id}
              product={product}
              onProductClick={onProductClick}
            />
          ),
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
