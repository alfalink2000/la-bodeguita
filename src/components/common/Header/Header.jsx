const Header = ({
  searchTerm,
  onSearchChange,
  onMenuClick,
  onCartClick,
  cartItemsCount,
  appName,
}) => {
  return (
    <header className="client-header">
      <div className="client-header__inner">
        <div className="client-header__left">
          <button
            className="client-header__menu-btn"
            onClick={onMenuClick}
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="client-header__brand">
            <span className="material-symbols-outlined client-header__brand-icon">
              storefront
            </span>
            <span className="client-header__brand-name">{appName}</span>
          </div>
        </div>

        <div className="client-header__search">
          <span className="material-symbols-outlined client-header__search-icon">
            search
          </span>
          <input
            className="client-header__search-input"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="client-header__right">
          <button
            className="client-header__icon-btn client-header__icon-btn--cart"
            onClick={onCartClick}
            aria-label="Carrito"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartItemsCount > 0 && (
              <span className="client-header__cart-badge">
                {cartItemsCount > 99 ? "99+" : cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
