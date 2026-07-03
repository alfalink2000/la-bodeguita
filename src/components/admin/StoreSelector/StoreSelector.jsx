import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getStores,
  getCategoriesByStore,
} from "../../../actions/storesActions";

const StoreSelector = ({
  selectedStoreId,
  onStoreChange,
  selectedCategoryId,
  onCategoryChange,
}) => {
  const dispatch = useDispatch();
  const stores = useSelector((state) => state.stores.stores);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stores.length === 0) {
      dispatch(getStores());
    }
  }, [dispatch, stores.length]);

  useEffect(() => {
    if (!selectedStoreId) {
      setCategories([]);
      return;
    }

    const loadCategories = async () => {
      setLoading(true);
      const cats = await getCategoriesByStore(selectedStoreId);
      setCategories(cats);
      setLoading(false);
    };
    loadCategories();
  }, [selectedStoreId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="admin-form-group" style={{ flex: 1 }}>
        <label className="admin-form-group__label">
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--color-on-surface-variant)" }}>store</span>
          Tienda *
        </label>
        <select
          value={selectedStoreId || ""}
          onChange={(e) => {
            onStoreChange(e.target.value);
            onCategoryChange("");
          }}
          className="admin-select"
          required
        >
          <option value="">Seleccionar tienda</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-form-group" style={{ flex: 1 }}>
        <label className="admin-form-group__label">
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--color-on-surface-variant)" }}>category</span>
          Categoría *
        </label>
        <select
          value={selectedCategoryId || ""}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="admin-select"
          required
          disabled={!selectedStoreId || loading}
        >
          <option value="">
            {!selectedStoreId
              ? "Primero selecciona una tienda"
              : loading
                ? "Cargando categorías..."
                : "Seleccionar categoría"}
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default StoreSelector;
