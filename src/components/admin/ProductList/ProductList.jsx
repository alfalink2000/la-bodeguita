// components/admin/ProductList/ProductList.jsx
import { useState, useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import { deleteProduct } from "../../../actions/productsActions"; // ✅ IMPORTAR
import {
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  Tag,
  DollarSign,
  Layers,
  Search,
  X,
  Store,
} from "lucide-react";
import SearchFilter from "../SearchFilter/SearchFilter";
import "./ProductList.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const ProductList = ({ products, onEdit, onDelete }) => {
  const dispatch = useDispatch(); // ✅ AGREGAR
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedStoreId, setSelectedStoreId] = useState("all");
  const [expandedProducts, setExpandedProducts] = useState({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchType, setSearchType] = useState("name");
  const [stores, setStores] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  // Cargar tiendas
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

  // Obtener categorías únicas de los productos (filtradas por tienda seleccionada)
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

  // Filtrar productos por búsqueda, categoría y tienda
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

  // Contar productos por tienda
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

  // ✅ CORREGIDO: SOLO despachar Redux, NO usar onDelete callback
  const handleDelete = (productId) => {
    const id = parseInt(productId);
    console.log("🗑️ ProductList: Eliminando producto ID:", id);

    // ✅ Despachar Redux DIRECTAMENTE
    dispatch(deleteProduct(id));
  };

  return (
    <div className="product-list">
      {/* Botón de filtros móvil */}
      <button
        className="product-list__mobile-filters"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <Layers size={18} />
        <span>Filtros</span>
        {showMobileFilters ? (
          <ChevronUp size={16} />
        ) : (
          <ChevronDown size={16} />
        )}
      </button>

      {/* Filtros - Desktop siempre visible, móvil toggle */}
      <div
        className={`product-list__filters ${showMobileFilters ? "product-list__filters--open" : ""}`}
      >
        {/* Selector de tienda */}
        <div className="product-list__store-filter">
          <label className="product-list__filter-label">
            <Store size={16} /> Filtrar por tienda:
          </label>
          <div className="product-list__store-buttons">
            <button
              className={`store-btn ${selectedStoreId === "all" ? "active" : ""}`}
              onClick={() => setSelectedStoreId("all")}
            >
              Todas <span className="store-count">{storeCounts.all}</span>
            </button>
            {stores.map((store) => (
              <button
                key={store.id}
                className={`store-btn ${selectedStoreId === store.id.toString() ? "active" : ""}`}
                onClick={() => setSelectedStoreId(store.id.toString())}
              >
                {store.name}{" "}
                <span className="store-count">
                  {storeCounts[store.id] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selector de tipo de búsqueda */}
        <div className="product-list__search-type">
          <button
            className={`search-type-btn ${searchType === "name" ? "active" : ""}`}
            onClick={() => setSearchType("name")}
          >
            Buscar por nombre
          </button>
          <button
            className={`search-type-btn ${searchType === "description" ? "active" : ""}`}
            onClick={() => setSearchType("description")}
          >
            Buscar por descripción
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="product-list__search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={
              searchType === "name"
                ? "Buscar por nombre del producto..."
                : "Buscar por descripción del producto..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              className="search-clear"
              onClick={() => setSearchTerm("")}
              aria-label="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtro de categorías */}
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

      {/* Contador de resultados y botón limpiar */}
      <div className="product-list__info">
        <span className="product-list__count">
          {filteredProducts.length} de {products.length} productos
          {selectedStoreId !== "all" && (
            <span className="product-list__store-badge">
              Tienda: {getStoreName(parseInt(selectedStoreId))}
            </span>
          )}
          {searchTerm && (
            <span className="product-list__search-badge">
              {searchType === "name" ? "Nombre" : "Descripción"}: "{searchTerm}"
            </span>
          )}
          {selectedCategory !== "Todos" && (
            <span className="product-list__category-badge">
              Categoría: {selectedCategory}
            </span>
          )}
        </span>

        {(searchTerm ||
          selectedCategory !== "Todos" ||
          selectedStoreId !== "all") && (
          <button
            className="product-list__clear-filters"
            onClick={clearFilters}
          >
            <X size={14} />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Lista de productos */}
      <div className="product-list__grid">
        {filteredProducts.map((product) => {
          const isExpanded = expandedProducts[product.id];

          return (
            <div key={product.id} className="product-list__item">
              <div className="product-list__content">
                <img
                  src={
                    product.image_url ||
                    product.image ||
                    "/placeholder-image.jpg"
                  }
                  alt={product.name}
                  className="product-list__image"
                  onError={(e) => {
                    e.target.src = "/placeholder-image.jpg";
                  }}
                  loading="lazy"
                />

                <div className="product-list__details">
                  <div className="product-list__details-header">
                    <div className="product-list__title-section">
                      <h3 className="product-list__name">{product.name}</h3>
                      {searchTerm && searchType === "name" && (
                        <span className="product-list__match-badge">
                          Coincidencia
                        </span>
                      )}
                    </div>
                    <span
                      className={`product-list__status ${
                        product.status === "available"
                          ? "product-list__status--available"
                          : "product-list__status--outOfStock"
                      }`}
                    >
                      {product.status === "available"
                        ? "Disponible"
                        : "Agotado"}
                    </span>
                  </div>

                  {product.store_id && (
                    <p className="product-list__store">
                      <Store size={12} /> {getStoreName(product.store_id)}
                    </p>
                  )}

                  <p className="product-list__category">
                    <Tag size={12} />{" "}
                    {product.category?.name || "Sin categoría"}
                  </p>

                  <div className="product-list__price-stock">
                    <p className="product-list__price">
                      <DollarSign size={12} /> $
                      {parseFloat(product.price).toFixed(2)}
                    </p>
                    <p className="product-list__stock">
                      <Package size={12} /> Stock: {product.stock_quantity || 0}
                    </p>
                  </div>

                  {product.description && (
                    <>
                      <button
                        className="product-list__expand-btn"
                        onClick={() => toggleExpand(product.id)}
                      >
                        {isExpanded ? "Ver menos" : "Ver descripción"}
                        {isExpanded ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>
                      <div
                        className={`product-list__description ${isExpanded ? "expanded" : ""}`}
                      >
                        <p>{product.description}</p>
                        {searchTerm && searchType === "description" && (
                          <span className="product-list__match-badge description-match">
                            Coincidencia en descripción
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="product-list__actions">
                  <button
                    onClick={() => onEdit(product)}
                    className="product-list__button product-list__button--edit"
                    title="Editar producto"
                  >
                    <Edit className="product-list__icon" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="product-list__button product-list__button--delete"
                    title="Eliminar producto"
                  >
                    <Trash2 className="product-list__icon" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="product-list__empty">
          <Package size={48} className="product-list__empty-icon" />
          <p>No se encontraron productos con los filtros aplicados</p>
          <button className="product-list__reset-btn" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;
