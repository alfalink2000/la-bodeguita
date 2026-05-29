// components/admin/StoreSelector/StoreSelector.jsx
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { HiOutlineCollection } from "react-icons/hi";
import {
  getStores,
  getCategoriesByStore,
} from "../../../actions/storesActions";
import "./StoreSelector.css";

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

  // Cargar tiendas si no hay
  useEffect(() => {
    if (stores.length === 0) {
      dispatch(getStores());
    }
  }, [dispatch, stores.length]);

  // Cargar categorías cuando cambia la tienda
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
    <div className="store-selector">
      {/* Selector de Tienda */}
      <div className="store-selector__field">
        <label className="store-selector__label">
          <HiOutlineCollection /> Tienda *
        </label>
        <select
          value={selectedStoreId || ""}
          onChange={(e) => {
            onStoreChange(e.target.value);
            onCategoryChange(""); // Resetear categoría al cambiar tienda
          }}
          className="store-selector__select"
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

      {/* Selector de Categoría (filtrado por tienda) */}
      <div className="store-selector__field">
        <label className="store-selector__label">📂 Categoría *</label>
        <select
          value={selectedCategoryId || ""}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="store-selector__select"
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
