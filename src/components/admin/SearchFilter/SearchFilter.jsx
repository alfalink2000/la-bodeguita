const SearchFilter = ({
  searchTerm,
  onSearchChange,
  placeholder = "Buscar...",
  showCategoryFilter = false,
  categories = [],
  selectedCategory = "Todos",
  onCategoryChange = () => {},
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div className="admin-input-wrapper">
        <span className="admin-input-wrapper__icon material-symbols-outlined">search</span>
        <input
          type="text"
          placeholder={placeholder}
          className="admin-input"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {showCategoryFilter && categories.length > 0 && (
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="admin-select"
          style={{ maxWidth: "100%" }}
        >
          <option value="Todos">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default SearchFilter;
