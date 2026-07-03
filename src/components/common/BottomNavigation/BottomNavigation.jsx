import { useState, useRef, useEffect } from "react";
import "./BottomNavigation.css";

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
  currentStoreName = "Tiendas",
}) => {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadOrdersCount);
  const menuRef = useRef(null);
  const previousOrdersCount = useRef(unreadOrdersCount);

  useEffect(() => {
    setLocalUnreadCount(unreadOrdersCount);
  }, [unreadOrdersCount]);

  useEffect(() => {
    if (unreadOrdersCount > previousOrdersCount.current) {
      setShowBadgeAnimation(true);
      setTimeout(() => setShowBadgeAnimation(false), 1000);
    }
    previousOrdersCount.current = unreadOrdersCount;
  }, [unreadOrdersCount]);

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

  const handleSearchPress = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      const searchInput = document.querySelector(
        ".search-bar__input, .client-interface__search-section input, .desktop-search input",
      );
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handleProfileClick = () => {
    onProfileClick();
  };

  const navItems = [
    {
      id: "catalog",
      icon: "home",
      label: "Inicio",
      action: () => onViewChange("client"),
      isActive: currentView === "client",
    },
    {
      id: "search",
      icon: "search",
      label: "Buscar",
      action: handleSearchPress,
      isActive: false,
    },
    {
      id: "categories",
      icon: "sell",
      label: selectedCategory !== "Todos" ? selectedCategory : "Categorías",
      action: () => setShowCategoryMenu(!showCategoryMenu),
      isActive: selectedCategory !== "Todos",
      hasMenu: true,
    },
  ];

  const displayCategories = categories.filter((cat) => cat !== "Todos");

  return (
    <>
      {showCategoryMenu && (
        <div
          className="bottom-nav__overlay"
          onClick={() => setShowCategoryMenu(false)}
        />
      )}

      <nav className="bottom-nav" ref={menuRef}>
        <div className="bottom-nav__container">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className={`bottom-nav__button ${item.isActive ? "bottom-nav__button--active" : ""}`}
            >
              <span className="bottom-nav__icon material-symbols-outlined">
                {item.icon}
              </span>
              <span className="bottom-nav__label">{item.label}</span>
              {item.hasMenu && (
                <span
                  className={`bottom-nav__indicator ${item.isActive ? "bottom-nav__indicator--active" : ""}`}
                />
              )}
            </button>
          ))}

          {isLoggedIn ? (
            <button
              onClick={handleProfileClick}
              className="bottom-nav__button"
              title="Mi perfil"
            >
              <span className="bottom-nav__icon material-symbols-outlined">
                person
              </span>
              <span className="bottom-nav__label">Perfil</span>
              {localUnreadCount > 0 && (
                <div
                  className={`bottom-nav__badge ${showBadgeAnimation ? "bottom-nav__badge--pulse" : ""}`}
                >
                  <div className="bottom-nav__badge-content">
                    <span className="bottom-nav__badge-number">
                      {localUnreadCount > 99 ? "99+" : localUnreadCount}
                    </span>
                    <div className="bottom-nav__badge-ripple" />
                  </div>
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={onShowLogin}
              className="bottom-nav__button"
              title="Iniciar sesión"
            >
              <span className="bottom-nav__icon material-symbols-outlined">
                person
              </span>
              <span className="bottom-nav__label">Entrar</span>
            </button>
          )}
        </div>

        {showCategoryMenu && (
          <div className="bottom-nav__category-menu">
            <div className="bottom-nav__category-container">
              <div className="bottom-nav__category-header">
                <div className="bottom-nav__category-header-left">
                  <span className="bottom-nav__category-header-icon material-symbols-outlined">
                    sell
                  </span>
                  <h3 className="bottom-nav__category-title">
                    Filtrar por categoría
                    {currentStoreName && currentStoreName !== "Tiendas" && (
                      <span className="bottom-nav__category-subtitle">
                        {" "}
                        en {currentStoreName}
                      </span>
                    )}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCategoryMenu(false)}
                  className="bottom-nav__category-close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="bottom-nav__category-list">
                <button
                  onClick={() => handleCategorySelect("Todos")}
                  className={`bottom-nav__category-item ${selectedCategory === "Todos" ? "bottom-nav__category-item--active" : ""}`}
                >
                  <span className="bottom-nav__category-item-icon material-symbols-outlined">
                    auto_awesome
                  </span>
                  <span className="bottom-nav__category-item-name">
                    Todos los productos
                  </span>
                  {selectedCategory === "Todos" && (
                    <span className="bottom-nav__category-item-check material-symbols-outlined">
                      check
                    </span>
                  )}
                </button>

                {displayCategories.length === 0 ? (
                  <div className="bottom-nav__category-empty">
                    <span className="bottom-nav__category-empty-icon material-symbols-outlined">
                      sell
                    </span>
                    <p className="bottom-nav__category-empty-text">
                      No hay categorías disponibles
                    </p>
                    <p className="bottom-nav__category-empty-sub">
                      Selecciona una tienda para ver sus categorías
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bottom-nav__category-divider" />
                    {displayCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategorySelect(category)}
                        className={`bottom-nav__category-item ${selectedCategory === category ? "bottom-nav__category-item--active" : ""}`}
                      >
                        <span className="bottom-nav__category-item-icon material-symbols-outlined">
                          sell
                        </span>
                        <span className="bottom-nav__category-item-name">
                          {category}
                        </span>
                        {selectedCategory === category && (
                          <span className="bottom-nav__category-item-check material-symbols-outlined">
                            check
                          </span>
                        )}
                      </button>
                    ))}
                  </>
                )}

                <div className="bottom-nav__category-footer">
                  <span className="bottom-nav__category-footer-dot" />
                  <span className="bottom-nav__category-footer-dot" />
                  <span className="bottom-nav__category-footer-dot" />
                  <span>{displayCategories.length} categorías disponibles</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default BottomNavigation;
