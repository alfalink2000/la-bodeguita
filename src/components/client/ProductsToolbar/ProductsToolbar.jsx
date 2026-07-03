import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import CategoryFilter from "../../common/CategoryFilter/CategoryFilter";
import { getCategories } from "../../../../actions/categoriesActions";
import { selectCategoryOptions } from "../../../../selectors/productSelectors";
import "./ProductsToolbar.css";

const ProductsToolbar = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStoreId,
  onStoreChange,
  filteredCategories,
  isLoadingCategories,
}) => {
  const dispatch = useDispatch();
  const stores = useSelector((state) => state.stores.stores);
  const categoryOptions = useSelector(selectCategoryOptions);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (categoryOptions.length === 0) dispatch(getCategories());
  }, [dispatch, categoryOptions.length]);

  // Categorías combinadas: filtradas + "Todos"
  const categoriesToDisplay = [
    { id: "Todos", name: "Todos" },
    ...filteredCategories.filter((cat) => cat.name !== "Todos"),
  ];

  return (
    <div className="products-toolbar">
      {/* Desktop: Filtros horizontales */}
      <div className="products-toolbar__filters-desktop">
        {/* Selector de tienda */}
        {stores.length > 1 && (
          <div className="products-toolbar__store-selector">
            <span className="products-toolbar__store-icon material-symbols-outlined">
              store
            </span>
            <select
              value={selectedStoreId}
              onChange={(e) => onStoreChange(e.target.value)}
              className="products-toolbar__store-select"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id.toString()}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* CategoryFilter mejorado */}
        <CategoryFilter
          categories={categoriesToDisplay.map((cat) => cat.name)}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          title="Categorías"
          icon="category"
        />
      </div>

      {/* Búsqueda (desktop/mobile) */}
      <div className="products-toolbar__search">
        <span className="products-toolbar__search-icon material-symbols-outlined">
          search
        </span>
        <input
          className="products-toolbar__search-input"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Mobile: Botón para abrir filtros */}
      <button
        className="products-toolbar__filter-btn"
        onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
        aria-label="Filtros"
      >
        <span className="material-symbols-outlined">
          {isMobileFilterOpen ? "close" : "tune"}
        </span>
      </button>

      {/* Mobile: Drawer de filtros (se abre desde abajo) */}
      {isMobileFilterOpen && (
        <div className="products-toolbar__mobile-drawer">
          <div className="products-toolbar__mobile-filters">
            <div className="products-toolbar__mobile-section">
              <h4 className="products-toolbar__mobile-title">Tienda</h4>
              {stores.length > 1 && (
                <select
                  value={selectedStoreId}
                  onChange={(e) => onStoreChange(e.target.value)}
                  className="products-toolbar__mobile-select"
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id.toString()}>
                      {store.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="products-toolbar__mobile-section">
              <h4 className="products-toolbar__mobile-title">Filtrar por categoría</h4>
              <div className="products-toolbar__mobile-categories">
                {categoriesToDisplay.map((cat) => (
                  <button
                    key={cat.id}
                    className={`products-toolbar__mobile-chip ${selectedCategory === cat.name ? "products-toolbar__mobile-chip--active" : ""}`}
                    onClick={() => {
                      onCategoryChange(cat.name);
                      setIsMobileFilterOpen(false);
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsToolbar;