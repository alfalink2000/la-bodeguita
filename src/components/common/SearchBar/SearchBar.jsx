// components/common/SearchBar/SearchBar.jsx
import { Search } from "lucide-react";
import { HiOutlineLocationMarker } from "react-icons/hi";
import "./SearchBar.css";

const SearchBar = ({
  searchTerm,
  onSearchChange,
  isDesktop = false,
  appConfig,
}) => {
  return (
    <div className={`search-bar ${isDesktop ? "search-bar--desktop" : ""}`}>
      {/* ✅ Mensaje de envíos - Visible en móvil (arriba) */}
      {!isDesktop && (
        <div className="search-bar__location-info search-bar__location-info--mobile">
          <HiOutlineLocationMarker className="location-info__icon" />
          <div className="location-info__text-wrapper">
            <span className="location-info__text">
              🚚 Envíos a Domicilio — GRATIS por cantidad — ¡No dude en
              preguntar! 🚚 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🚚 Envíos a
              Domicilio — GRATIS por cantidad — ¡No dude en preguntar! 🚚
            </span>
          </div>
        </div>
      )}

      <div className="search-bar__content">
        <div className="search-bar__input-container">
          <Search className="search-bar__icon" />
          <input
            type="text"
            placeholder="Buscar productos..."
            className="search-bar__input"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* ✅ Mensaje de envíos - Visible en desktop (al lado derecho) */}
        {isDesktop && (
          <div className="search-bar__location-info search-bar__location-info--desktop">
            <HiOutlineLocationMarker className="location-info__icon" />
            <div className="location-info__text-wrapper">
              <span className="location-info__text">
                🚚 Envíos a Domicilio — GRATIS por cantidad — ¡No dude en
                preguntar! 🚚
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
