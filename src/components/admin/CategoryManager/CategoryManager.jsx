import { useState, useMemo, useCallback, useEffect } from "react";
import SearchFilter from "../SearchFilter/SearchFilter";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const CategoryManager = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [filterStoreId, setFilterStoreId] = useState("all");

  useEffect(() => {
    const loadStores = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stores`);
        const data = await res.json();
        if (data.ok) setStores(data.stores || []);
      } catch (err) {
        console.error("Error cargando tiendas:", err);
      }
    };
    loadStores();
  }, []);

  const categoryNames = useMemo(
    () => categories.map((cat) => cat.name),
    [categories],
  );

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch = category.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStore =
        filterStoreId === "all" ||
        category.store_id?.toString() === filterStoreId;
      return matchesSearch && matchesStore;
    });
  }, [categories, searchTerm, filterStoreId]);

  const handleAddCategory = useCallback(() => {
    const trimmedName = newCategory.trim();
    if (!trimmedName) return;
    if (!selectedStoreId) {
      alert("Selecciona una tienda primero");
      return;
    }
    if (categoryNames.includes(trimmedName)) {
      alert("Ya existe una categoría con ese nombre");
      return;
    }
    if (trimmedName.length > 100) {
      alert("El nombre de la categoría no puede tener más de 100 caracteres");
      return;
    }
    onAddCategory(trimmedName, selectedStoreId);
    setNewCategory("");
  }, [newCategory, selectedStoreId, categoryNames, onAddCategory]);

  const handleStartEdit = useCallback((category) => {
    setEditingCategory(category);
    setEditValue(category.name);
  }, []);

  const handleSaveEdit = useCallback(() => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      alert("El nombre de la categoría no puede estar vacío");
      return;
    }
    if (trimmedValue === editingCategory.name) {
      setEditingCategory(null);
      setEditValue("");
      return;
    }
    if (
      categoryNames.includes(trimmedValue) &&
      trimmedValue !== editingCategory.name
    ) {
      alert("Ya existe una categoría con ese nombre");
      return;
    }
    onUpdateCategory(editingCategory.name, trimmedValue);
    setEditingCategory(null);
    setEditValue("");
  }, [editValue, editingCategory, categoryNames, onUpdateCategory]);

  const handleCancelEdit = useCallback(() => {
    setEditingCategory(null);
    setEditValue("");
  }, []);

  const handleDeleteCategory = useCallback(
    (category) => {
      onDeleteCategory(category.name);
    },
    [onDeleteCategory],
  );

  const handleKeyPress = useCallback(
    (e, action) => {
      if (e.key === "Enter") {
        if (action === "add") handleAddCategory();
        else if (action === "edit") handleSaveEdit();
      } else if (e.key === "Escape" && action === "edit") {
        handleCancelEdit();
      }
    },
    [handleAddCategory, handleSaveEdit, handleCancelEdit],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Store filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <span className="admin-filter-group__label">Filtrar por tienda:</span>
          <select
            value={filterStoreId}
            onChange={(e) => setFilterStoreId(e.target.value)}
            className="admin-select"
          >
            <option value="all">Todas las tiendas</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id.toString()}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar categorías..."
      />

      {/* Add category */}
      <div className="admin-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <select
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="admin-select"
          style={{ maxWidth: "200px" }}
        >
          <option value="">Seleccionar tienda *</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id.toString()}>
              {store.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Nueva categoría (máx. 100 caracteres)"
          className="admin-input"
          onKeyPress={(e) => handleKeyPress(e, "add")}
          maxLength={100}
        />
        <button
          onClick={handleAddCategory}
          className="admin-btn admin-btn--primary"
          disabled={!newCategory.trim() || !selectedStoreId}
        >
          <span className="admin-btn__icon material-symbols-outlined">add</span>
          Agregar
        </button>
      </div>

      {/* Info */}
      <div className="admin-results-info">
        <span>{filteredCategories.length} de {categories.length} categorías</span>
        {searchTerm && <span>Buscando: "{searchTerm}"</span>}
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filteredCategories
          .filter((cat) => cat.name !== "Todos")
          .map((category) => (
            <div key={category.id} className="admin-card" style={{ padding: "16px" }}>
              {editingCategory?.id === category.id ? (
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, "edit")}
                    className="admin-input"
                    style={{ flex: 1 }}
                    autoFocus
                    maxLength={100}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={handleSaveEdit}
                      className="admin-btn admin-btn--primary admin-btn--icon"
                      disabled={!editValue.trim()}
                    >
                      <span className="admin-btn__icon material-symbols-outlined">check</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="admin-btn admin-btn--secondary admin-btn--icon"
                    >
                      <span className="admin-btn__icon material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ fontFamily: "var(--font-label-md)", fontSize: "var(--text-label-md)", color: "var(--color-on-surface)" }}>{category.name}</span>
                    {category.store_id && (
                      <span className="admin-badge admin-badge--neutral">
                        {stores.find((s) => s.id === category.store_id)?.name ||
                          `Tienda #${category.store_id}`}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleStartEdit(category)}
                      className="admin-btn admin-btn--ghost admin-btn--icon"
                    >
                      <span className="admin-btn__icon material-symbols-outlined">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="admin-btn admin-btn--danger admin-btn--icon"
                    >
                      <span className="admin-btn__icon material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {filteredCategories.length === 0 && categories.length > 0 && (
        <div className="admin-empty">
          <p className="admin-empty__text">No se encontraron categorías con el término de búsqueda</p>
        </div>
      )}

      {categories.length === 0 && (
        <div className="admin-empty">
          <p className="admin-empty__text">No hay categorías disponibles. Agrega una nueva categoría.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
