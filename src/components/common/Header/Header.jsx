import React from "react";
import { useDispatch } from "react-redux";
import { toggleCartModal } from "../../../actions/cartActions";

const Header = ({
  searchTerm,
  onSearchChange,
  onMenuClick,
  onCartClick,
  cartItemsCount,
  appName = "La Bodeguita",
}) => {
  const dispatch = useDispatch();

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    } else {
      dispatch(toggleCartModal());
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e8edea] flex-shrink-0 h-14 w-full">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-3 h-14 gap-2">
        {/* Left */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center w-10 h-10 border-none rounded-xl bg-transparent text-[#1a1a1a] cursor-pointer p-0 flex-shrink-0 hover:bg-[#e8f5f0] transition-colors"
            aria-label="Abrir menú"
          >
            <span className="text-2xl material-symbols-outlined">menu</span>
          </button>

          <div className="flex items-center gap-1.5 text-decoration-none">
            <span className="text-2xl text-[#0b4f37] material-symbols-outlined">
              storefront
            </span>
            <span className="text-base font-bold text-[#0b4f37] whitespace-nowrap hidden sm:inline">
              {appName}
            </span>
          </div>
        </div>

        {/* Search - Mobile */}
        <div className="flex-1 max-w-[200px] sm:max-w-[300px] md:max-w-[420px] relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c6b63] text-lg material-symbols-outlined">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full py-1.5 pl-9 pr-3 text-sm border-2 border-[#e8edea] rounded-full bg-white text-[#1a1a1a] placeholder:text-[#a0aec0] focus:outline-none focus:border-[#0b4f37] focus:shadow-[0_0_0_3px_rgba(11,79,55,0.08)] transition-all"
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleCartClick}
            className="flex items-center justify-center w-10 h-10 border-none rounded-xl bg-transparent text-[#5c6b63] cursor-pointer relative p-0 flex-shrink-0 hover:bg-[#e8f5f0] hover:text-[#0b4f37] transition-colors"
            aria-label="Abrir carrito"
          >
            <span className="text-2xl material-symbols-outlined">
              shopping_cart
            </span>
            {cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#c8963e] text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
