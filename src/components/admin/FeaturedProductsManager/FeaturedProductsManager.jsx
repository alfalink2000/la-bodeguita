import { useState, useMemo, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  toggleProductPopular,
  toggleProductOnSale,
  saveFeaturedProducts,
  getFeaturedProducts,
} from "../../../actions/featuredProductsActions";
import SearchFilter from "../SearchFilter/SearchFilter";

const FeaturedProductsManager = () => {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.products.products);
  const featuredProducts = useSelector(
    (state) => state.products.featuredProducts,
  );

  const [activeTab, setActiveTab] = useState("popular");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(getFeaturedProducts());
  }, [dispatch]);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((p) => p.category?.name).filter(Boolean)),
    ];
    return ["Todos", ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = product.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCategory =
          selectedCategory === "Todos" ||
          product.category?.name === selectedCategory;
        return matchesSearch && matchesCategory;
      }),
    [products, searchTerm, selectedCategory],
  );

  const isProductPopular = useCallback(
    (productId) => featuredProducts.popular.includes(productId),
    [featuredProducts.popular],
  );

  const isProductOnSale = useCallback(
    (productId) => featuredProducts.onSale.includes(productId),
    [featuredProducts.onSale],
  );

  const handleTogglePopular = useCallback(
    (productId) => {
      dispatch(toggleProductPopular(productId));
    },
    [dispatch],
  );

  const handleToggleOnSale = useCallback(
    (productId) => {
      dispatch(toggleProductOnSale(productId));
    },
    [dispatch],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await dispatch(
        saveFeaturedProducts({
          popular: featuredProducts.popular,
          onSale: featuredProducts.onSale,
        }),
      );
    } finally {
      setSaving(false);
    }
  }, [dispatch, featuredProducts]);

  const ProductItem = useCallback(
    ({ product, isSelected, onToggle }) => (
      <div
        className={`admin-product-select${isSelected ? " admin-product-select--selected" : ""}`}
        onClick={() => onToggle(product.id)}
      >
        <img
          src={product.image_url || "/default-product.png"}
          alt={product.name}
          className="admin-product-select__img"
          onError={(e) => {
            e.target.src = "/default-product.png";
          }}
        />
        <div className="admin-product-select__info">
          <span className="admin-product-select__name">{product.name}</span>
          <span className="admin-product-select__category">{product.category?.name || "Sin categoría"}</span>
          <span className="admin-product-select__price">${product.price}</span>
        </div>
        <div className="admin-product-select__check">
          <span className="material-symbols-outlined">
            {isSelected ? "check" : "add"}
          </span>
        </div>
      </div>
    ),
    [],
  );

  return (
    <div className="admin-card">
      {/* Header */}
      <div className="admin-page-header">
        <h3 className="admin-page-header__title">Productos Destacados</h3>
        <button
          className="admin-btn admin-btn--primary"
          onClick={handleSave}
          disabled={saving}
        >
          <span className="material-symbols-outlined admin-btn__icon">save</span>
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stat-grid">
        <div className="admin-stat">
          <p className="admin-stat__value">{featuredProducts.popular.length}</p>
          <p className="admin-stat__label">Populares</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__value">{featuredProducts.onSale.length}</p>
          <p className="admin-stat__label">En Oferta</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__value">{products.length}</p>
          <p className="admin-stat__label">Total Productos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab${activeTab === "popular" ? " admin-tab--active" : ""}`}
          onClick={() => setActiveTab("popular")}
        >
          <span className="material-symbols-outlined admin-tab__icon">emoji_events</span>
          Populares ({featuredProducts.popular.length})
        </button>
        <button
          className={`admin-tab${activeTab === "sale" ? " admin-tab--active" : ""}`}
          onClick={() => setActiveTab("sale")}
        >
          <span className="material-symbols-outlined admin-tab__icon">gps_fixed</span>
          En Oferta ({featuredProducts.onSale.length})
        </button>
      </div>

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar productos..."
        showCategoryFilter={true}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Product grid */}
      <div>
        <div className="admin-page-header">
          <h4 className="admin-page-header__title">
            {activeTab === "popular"
              ? `Selecciona los productos populares (${featuredProducts.popular.length} seleccionados)`
              : `Selecciona los productos en oferta (${featuredProducts.onSale.length} seleccionados)`}
          </h4>
          <span className="admin-results-info">{filteredProducts.length} productos mostrados</span>
        </div>
        <div className="admin-grid admin-grid--3">
          {activeTab === "popular" &&
            filteredProducts.map((product) => (
              <ProductItem
                key={product.id}
                product={product}
                isSelected={isProductPopular(product.id)}
                onToggle={handleTogglePopular}
              />
            ))}
          {activeTab === "sale" &&
            filteredProducts.map((product) => (
              <ProductItem
                key={product.id}
                product={product}
                isSelected={isProductOnSale(product.id)}
                onToggle={handleToggleOnSale}
              />
            ))}
        </div>
      </div>

      {filteredProducts.length === 0 && products.length > 0 && (
        <div className="admin-empty">
          <p className="admin-empty__text">No se encontraron productos con los filtros aplicados</p>
        </div>
      )}
    </div>
  );
};

export default FeaturedProductsManager;
