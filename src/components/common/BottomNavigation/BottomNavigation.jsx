// components/common/BottomNavigation/BottomNavigation.jsx
import { useState, useRef, useEffect } from "react";
import {
  HiOutlineEye,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineHome,
  HiOutlineTag,
  HiOutlineStar,
  HiOutlinePhone,
  HiOutlineX,
  HiOutlineSparkles,
  HiOutlineHeart,
  HiOutlineShoppingBag,
} from "react-icons/hi";
import "./BottomNavigation.css";
import "./BottomNavigation.desktop.css";

const BottomNavigation = ({
  currentView,
  onViewChange,
  categories = [],
  selectedCategory,
  onCategoryChange,
  onSearchClick,
  activeSection,
  onSectionChange,
  isLoggedIn,
  onLogout,
  onShowLogin,
  onProfileClick,
  unreadOrdersCount = 0,
  currentStoreName = "Tiendas", // Nombre de la tienda actual
}) => {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [searchInputFocused, setSearchInputFocused] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowCategoryMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategorySelect = (category) => {
    onCategoryChange(category);
    setShowCategoryMenu(false);
  };

  // Manejar búsqueda - enfocar el input de búsqueda
  const handleSearchPress = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      // Buscar y enfocar el input de búsqueda
      const searchInput = document.querySelector(
        ".search-bar__input, .client-interface__search-section input, .desktop-search input",
      );
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // Navegación principal
  const navItems = [
    {
      id: "catalog",
      icon: HiOutlineHome,
      label: "Inicio",
      action: () => onViewChange("client"),
      isActive: currentView === "client",
    },
    {
      id: "search",
      icon: HiOutlineSearch,
      label: "Buscar",
      action: handleSearchPress,
      isActive: false,
    },
    {
      id: "categories",
      icon: HiOutlineTag,
      label: selectedCategory !== "Todos" ? selectedCategory : "Categorías",
      action: () => setShowCategoryMenu(!showCategoryMenu),
      isActive: selectedCategory !== "Todos",
      hasMenu: true,
    },
  ];

  // Categorías filtradas para mostrar en el menú
  const displayCategories = categories.filter((cat) => cat !== "Todos");

  return (
    <>
      {/* Overlay */}
      {showCategoryMenu && (
        <div
          className="bottom-nav-overlay"
          onClick={() => setShowCategoryMenu(false)}
        />
      )}

      <nav className="bottom-nav" ref={menuRef}>
        <div className="bottom-nav__container">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`bottom-nav__button ${
                  item.isActive
                    ? "bottom-nav__button--active"
                    : "bottom-nav__button--inactive"
                }`}
              >
                <IconComponent className="bottom-nav__icon" />
                <span className="bottom-nav__label">{item.label}</span>
                {item.hasMenu && (
                  <span className="bottom-nav__indicator"></span>
                )}
              </button>
            );
          })}

          {/* Perfil / Entrar */}
          {isLoggedIn ? (
            <button
              onClick={onProfileClick}
              className="bottom-nav__button bottom-nav__button--profile"
              title="Mi perfil"
            >
              <HiOutlineUser className="bottom-nav__icon" />
              <span className="bottom-nav__label">Perfil</span>
            </button>
          ) : (
            <button
              onClick={onShowLogin}
              className="bottom-nav__button bottom-nav__button--inactive"
              title="Iniciar sesión"
            >
              <HiOutlineUser className="bottom-nav__icon" />
              <span className="bottom-nav__label">Entrar</span>
            </button>
          )}
        </div>

        {/* Menú de Categorías - Diseño mejorado y funcional */}
        {showCategoryMenu && (
          <div className="bottom-nav-menu category-menu">
            <div className="menu-header">
              <div className="menu-header__left">
                <HiOutlineTag className="menu-header__icon" />
                <h3 className="menu-title">
                  Filtrar por categoría
                  {currentStoreName && currentStoreName !== "Tiendas" && (
                    <span className="menu-subtitle">
                      {" "}
                      en {currentStoreName}
                    </span>
                  )}
                </h3>
              </div>
              <button
                onClick={() => setShowCategoryMenu(false)}
                className="menu-close"
              >
                <HiOutlineX size={18} />
              </button>
            </div>

            <div className="category-list">
              {/* Opción "Todos" destacada */}
              <button
                onClick={() => handleCategorySelect("Todos")}
                className={`category-item category-item--all ${
                  selectedCategory === "Todos" ? "category-item--active" : ""
                }`}
              >
                <div className="category-item__icon">
                  <HiOutlineSparkles size={16} />
                </div>
                <span className="category-name">Todos los productos</span>
                <div className="category-item__check">
                  {selectedCategory === "Todos" && <span>✓</span>}
                </div>
              </button>

              {/* Mostrar mensaje si no hay categorías */}
              {displayCategories.length === 0 ? (
                <div className="category-empty">
                  <HiOutlineTag size={32} />
                  <p>No hay categorías disponibles</p>
                  <span>Selecciona una tienda para ver sus categorías</span>
                </div>
              ) : (
                <>
                  {/* Separador */}
                  <div className="category-divider"></div>

                  {/* Lista de categorías */}
                  <div className="category-items">
                    {displayCategories.map((category, index) => (
                      <button
                        key={category}
                        onClick={() => handleCategorySelect(category)}
                        className={`category-item ${
                          selectedCategory === category
                            ? "category-item--active"
                            : ""
                        }`}
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <div className="category-item__icon">
                          <HiOutlineTag size={14} />
                        </div>
                        <span className="category-name">{category}</span>
                        <div className="category-item__check">
                          {selectedCategory === category && <span>✓</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Footer decorativo */}
              <div className="menu-footer">
                <div className="menu-footer__dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <span className="menu-footer__text">
                  {displayCategories.length} categorías disponibles
                </span>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default BottomNavigation;
