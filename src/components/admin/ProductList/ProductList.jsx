import { useState, useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import { deleteProduct } from "../../../actions/productsActions";
import SearchFilter from "../SearchFilter/SearchFilter";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const ProductList = ({ products, onEdit }) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedStoreId, setSelectedStoreId] = useState("all");
  const [expandedProducts, setExpandedProducts] = useState({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchType, setSearchType] = useState("name");
  const [stores, setStores] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  useEffect(() => {
    console.log("[ProductList] Productos recibidos:", products.length);
    if (products.length > 0) {
      console.log(
        "[ProductList] Último producto:",
        products[products.length - 1],
      );
    }
  }, [products]);

  useEffect(() => {
    const loadStores = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stores`);
        const data = await res.json();
        if (data.ok) {
          setStores(data.stores || []);
        }
      } catch (err) {
        console.error("Error cargando tiendas:", err);
      } finally {
        setIsLoadingStores(false);
      }
    };
    loadStores();
  }, []);

  const categories = useMemo(() => {
    let filteredProducts = products;
    if (selectedStoreId !== "all") {
      filteredProducts = products.filter(
        (p) => p.store_id?.toString() === selectedStoreId.toString(),
      );
    }
    const uniqueCategories = [
      ...new Set(filteredProducts.map((p) => p.category?.name).filter(Boolean)),
    ];
    return ["Todos", ...uniqueCategories];
  }, [products, selectedStoreId]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedStoreId !== "all") {
      result = result.filter(
        (p) => p.store_id?.toString() === selectedStoreId.toString(),
      );
    }
    if (selectedCategory !== "Todos") {
      result = result.filter((p) => p.category?.name === selectedCategory);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((product) => {
        if (searchType === "name") {
          return product.name?.toLowerCase().includes(searchLower);
        } else {
          return (product.description || "")
            .toLowerCase()
            .includes(searchLower);
        }
      });
    }
    return result;
  }, [products, selectedStoreId, selectedCategory, searchTerm, searchType]);

  const storeCounts = useMemo(() => {
    const counts = { all: products.length };
    stores.forEach((store) => {
      counts[store.id] = products.filter(
        (p) => parseInt(p.store_id) === parseInt(store.id),
      ).length;
    });
    return counts;
  }, [products, stores]);

  const toggleExpand = (productId) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Todos");
    setSelectedStoreId("all");
    setSearchType("name");
  };

  const getStoreName = (storeId) => {
    if (!storeId) return "Sin tienda";
    const store = stores.find((s) => parseInt(s.id) === parseInt(storeId));
    return store?.name || "Sin tienda";
  };

  const handleDelete = (productId) => {
    const id = parseInt(productId);
    console.log("ProductList: Eliminando producto ID:", id);
    dispatch(deleteProduct(id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Mobile filter toggle */}
      <button
        className="admin-mobile-filter-btn"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>tune</span>
        <span className="admin-mobile-filter-btn__label">Filtros</span>
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
          {showMobileFilters ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Filters */}
      <div className={`admin-mobile-filter-body ${showMobileFilters ? "admin-mobile-filter-body--open" : ""}`}>
        {/* Store filter */}
        <div className="admin-filter-group">
          <span className="admin-filter-group__label">
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>store</span>
            Filtrar por tienda:
          </span>
          <div className="admin-pills">
            <button
              className={`admin-pill ${selectedStoreId === "all" ? "admin-pill--active" : ""}`}
              onClick={() => setSelectedStoreId("all")}
            >
              Todas <span className="admin-pill__count">({storeCounts.all})</span>
            </button>
            {stores.map((store) => (
              <button
                key={store.id}
                className={`admin-pill ${selectedStoreId === store.id.toString() ? "admin-pill--active" : ""}`}
                onClick={() => setSelectedStoreId(store.id.toString())}
              >
                {store.name} <span className="admin-pill__count">({storeCounts[store.id] || 0})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search type tabs */}
        <div className="admin-pills">
          <button
            className={`admin-pill ${searchType === "name" ? "admin-pill--active" : ""}`}
            onClick={() => setSearchType("name")}
          >
            Buscar por nombre
          </button>
          <button
            className={`admin-pill ${searchType === "description" ? "admin-pill--active" : ""}`}
            onClick={() => setSearchType("description")}
          >
            Buscar por descripción
          </button>
        </div>

        {/* Search bar */}
        <div className="admin-input-wrapper">
          <span className="admin-input-wrapper__icon material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder={
              searchType === "name"
                ? "Buscar por nombre del producto..."
                : "Buscar por descripción del producto..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input"
          />
          {searchTerm && (
            <button
              className="admin-input-wrapper__clear"
              onClick={() => setSearchTerm("")}
              aria-label="Limpiar búsqueda"
            >
              <span className="admin-input-wrapper__clear-icon material-symbols-outlined">close</span>
            </button>
          )}
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
      </div>

      {/* Results info */}
      <div className="admin-results-info">
        <span>
          {filteredProducts.length} de {products.length} productos
          {selectedStoreId !== "all" && (
            <span className="admin-results-info__tag">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>store</span>
              Tienda: {getStoreName(parseInt(selectedStoreId))}
            </span>
          )}
          {searchTerm && (
            <span className="admin-results-info__tag">
              {searchType === "name" ? "Nombre" : "Descripción"}: &quot;{searchTerm}&quot;
            </span>
          )}
          {selectedCategory !== "Todos" && (
            <span className="admin-results-info__tag">
              Categoría: {selectedCategory}
            </span>
          )}
        </span>

        {(searchTerm || selectedCategory !== "Todos" || selectedStoreId !== "all") && (
          <button
            className="admin-results-info__clear"
            onClick={clearFilters}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Product grid */}
      <div className="admin-grid admin-grid--4">
        {filteredProducts.map((product) => {
          const isExpanded = expandedProducts[product.id];
          const isOutOfStock =
            (product.stock_quantity !== undefined && product.stock_quantity <= 0) ||
            product.status === "outOfStock";
          const isLowStock =
            !isOutOfStock &&
            product.stock_quantity !== undefined &&
            product.stock_quantity <= 5;

          return (
            <div
              key={product.id}
              className="admin-card"
            >
              <div className="admin-product-card">
                <div className="admin-product-card__image-wrap">
                  <img
                    src={
                      product.image_url ||
                      product.image ||
                      "/placeholder-image.jpg"
                    }
                    alt={product.name}
                    className="admin-product-card__image"
                    onError={(e) => {
                      e.target.src = "/placeholder-image.jpg";
                    }}
                    loading="lazy"
                  />
                  <span
                    className={`admin-product-card__badge ${
                      isOutOfStock
                        ? "admin-product-card__badge--error"
                        : isLowStock
                        ? "admin-product-card__badge--warning"
                        : "admin-product-card__badge--success"
                    }`}
                  >
                    {isOutOfStock
                      ? "Agotado"
                      : isLowStock
                      ? "Stock bajo"
                      : "Disponible"}
                  </span>
                </div>

                <div className="admin-product-card__body">
                  <div>
                    <h3 className="admin-product-card__name">{product.name}</h3>
                    {product.store_id && (
                      <p className="admin-product-card__meta" style={{ marginTop: "4px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>store</span>
                        {getStoreName(product.store_id)}
                      </p>
                    )}
                    <p className="admin-product-card__meta">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>category</span>
                      {product.category?.name || "Sin categoría"}
                    </p>
                  </div>

                  <div className="admin-product-card__price-row">
                    <span className="admin-product-card__price">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    <span className={`admin-product-card__stock ${
                      isOutOfStock ? "admin-product-card__stock--error" : isLowStock ? "admin-product-card__stock--warning" : ""
                    }`}>
                      Stock: {product.stock_quantity || 0}
                    </span>
                  </div>

                  {product.description && (
                    <>
                      <button
                        className="admin-product-card__desc-toggle"
                        onClick={() => toggleExpand(product.id)}
                      >
                        {isExpanded ? "Ver menos" : "Ver descripción"}
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                          {isExpanded ? "expand_less" : "expand_more"}
                        </span>
                      </button>
                      {isExpanded && (
                        <p className="admin-product-card__desc">
                          {product.description}
                          {searchTerm && searchType === "description" && (
                            <span className="admin-badge admin-badge--primary" style={{ marginLeft: "8px" }}>
                              Coincidencia en descripción
                            </span>
                          )}
                        </p>
                      )}
                    </>
                  )}

                  <div className="admin-product-card__actions">
                    <button
                      onClick={() => onEdit(product)}
                      className="admin-btn admin-btn--secondary admin-btn--sm"
                      style={{ flex: 1 }}
                    >
                      <span className="admin-btn__icon admin-btn__icon--sm material-symbols-outlined">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="admin-btn admin-btn--danger admin-btn--sm"
                      style={{ flex: 1 }}
                    >
                      <span className="admin-btn__icon admin-btn__icon--sm material-symbols-outlined">delete</span>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="admin-empty">
          <span className="admin-empty__icon material-symbols-outlined">inventory_2</span>
          <p className="admin-empty__text">No se encontraron productos con los filtros aplicados</p>
          <button className="admin-btn admin-btn--primary" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;
