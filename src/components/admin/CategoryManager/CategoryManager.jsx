// components/admin/CategoryManager/CategoryManager.jsx
import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import SearchFilter from "../SearchFilter/SearchFilter";
import "./CategoryManager.css";

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

  // ✅ NUEVO: Estados para tiendas
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [filterStoreId, setFilterStoreId] = useState("all");

  // Cargar tiendas
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

  // Memoizar categorías como strings (para validación)
  const categoryNames = useMemo(
    () => categories.map((cat) => cat.name),
    [categories],
  );

  // Memoizar categorías filtradas por tienda y búsqueda
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

  // ✅ NUEVO: handleAddCategory con store_id
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

    // ✅ Pasar store_id junto con el nombre
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
    <div className="category-manager">
      <h3 className="category-manager__title">Gestión de Categorías</h3>

      {/* ✅ NUEVO: Selector de tienda para filtrar */}
      <div className="category-manager__store-filter">
        <label className="category-manager__filter-label">
          Filtrar por tienda:
        </label>
        <select
          value={filterStoreId}
          onChange={(e) => setFilterStoreId(e.target.value)}
          className="category-manager__store-select"
        >
          <option value="all">Todas las tiendas</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id.toString()}>
              {store.name}
            </option>
          ))}
        </select>
      </div>

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar categorías..."
      />

      {/* ✅ NUEVO: Selector de tienda + input para nueva categoría */}
      <div className="category-manager__add">
        <select
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="category-manager__store-select"
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
          className="category-manager__input"
          onKeyPress={(e) => handleKeyPress(e, "add")}
          maxLength={100}
        />
        <button
          onClick={handleAddCategory}
          className="category-manager__add-button"
          disabled={!newCategory.trim() || !selectedStoreId}
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      <div className="category-manager__info">
        <span className="category-manager__count">
          {filteredCategories.length} de {categories.length} categorías
        </span>
        {searchTerm && (
          <span className="category-manager__search-term">
            Buscando: "{searchTerm}"
          </span>
        )}
      </div>

      <div className="category-manager__list">
        {filteredCategories
          .filter((cat) => cat.name !== "Todos")
          .map((category) => (
            <div key={category.id} className="category-manager__item">
              {editingCategory?.id === category.id ? (
                <>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, "edit")}
                    className="category-manager__edit-input"
                    autoFocus
                    maxLength={100}
                  />
                  <div className="category-manager__edit-actions">
                    <button
                      onClick={handleSaveEdit}
                      className="category-manager__save-button"
                      disabled={!editValue.trim()}
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="category-manager__cancel-button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="category-manager__info-row">
                    <span className="category-manager__name">
                      {category.name}
                    </span>
                    {/* ✅ Mostrar tienda a la que pertenece */}
                    {category.store_id && (
                      <span className="category-manager__store-badge">
                        {stores.find((s) => s.id === category.store_id)?.name ||
                          `Tienda #${category.store_id}`}
                      </span>
                    )}
                  </div>
                  <div className="category-manager__actions">
                    <button
                      onClick={() => handleStartEdit(category)}
                      className="category-manager__edit-button"
                      title="Editar categoría"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="category-manager__delete-button"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
      </div>

      {filteredCategories.length === 0 && categories.length > 0 && (
        <div className="category-manager__empty">
          <p>No se encontraron categorías con el término de búsqueda</p>
        </div>
      )}

      {categories.length === 0 && (
        <div className="category-manager__empty">
          <p>No hay categorías disponibles. Agrega una nueva categoría.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
