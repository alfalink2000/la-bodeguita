import { useSelector, useDispatch } from "react-redux";
import { toggleCartModal } from "../../../actions/cartActions";
import { selectCartItemsCount } from "../../../selectors/cartSelectors";

const RightSidebar = ({ isLoggedIn, userData, onLogout, onShowLogin, onProfileClick }) => {
  const dispatch = useDispatch();
  const cartItemsCount = useSelector(selectCartItemsCount);
  const cartItems = useSelector((state) => state.cart.items);
  const orders = useSelector((state) => state.orders.orders);

  return (
    <aside className="client-right-sidebar">
      <div className="client-right-sidebar__card">
        <div className="client-right-sidebar__user">
          <div className="client-right-sidebar__avatar">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="client-right-sidebar__user-info">
            <div className="client-right-sidebar__user-name">
              {isLoggedIn && userData
                ? (userData.full_name || userData.username || "Mi Cuenta")
                : "Mi Cuenta"}
            </div>
            <div className="client-right-sidebar__user-sub">
              {isLoggedIn ? "Bienvenido" : "Inicia sesión"}
            </div>
          </div>
        </div>

        <div className="client-right-sidebar__divider" />

        {isLoggedIn ? (
          <>
            <button className="client-right-sidebar__nav-item" onClick={onProfileClick}>
              <span className="material-symbols-outlined">person</span>
              <span>Mi Perfil</span>
            </button>
            <button className="client-right-sidebar__nav-item" onClick={onProfileClick}>
              <span className="material-symbols-outlined">shopping_bag</span>
              <span>Mis Pedidos ({orders.length})</span>
            </button>
            <button className="client-right-sidebar__nav-item" onClick={onLogout}>
              <span className="material-symbols-outlined">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </>
        ) : (
          <button className="client-right-sidebar__nav-item" onClick={onShowLogin}>
            <span className="material-symbols-outlined">login</span>
            <span>Iniciar Sesión</span>
          </button>
        )}
      </div>

      <div className="client-right-sidebar__card">
        <div className="client-right-sidebar__mini-cart">
          <div className="client-right-sidebar__mini-cart-title">
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>shopping_cart</span>
            Carrito ({cartItemsCount})
          </div>
          <div className="client-right-sidebar__divider" />
          {cartItems.length === 0 ? (
            <div className="client-right-sidebar__mini-cart-empty">
              Tu carrito está vacío
            </div>
          ) : (
            cartItems.slice(0, 3).map((item) => (
              <div key={item.id} className="client-right-sidebar__mini-item">
                <span className="client-right-sidebar__mini-item-name">{item.name}</span>
                <span className="client-right-sidebar__mini-item-qty">x{item.quantity}</span>
                <span className="client-right-sidebar__mini-item-price">
                  ${parseFloat(item.price).toFixed(2)}
                </span>
              </div>
            ))
          )}
          {cartItems.length > 3 && (
            <div style={{ fontSize: "11px", color: "var(--color-on-surface-variant)", textAlign: "center" }}>
              +{cartItems.length - 3} más
            </div>
          )}
          {cartItems.length > 0 && (
            <>
              <div className="client-right-sidebar__divider" />
              <button
                className="client-sidebar-cart-btn"
                onClick={() => dispatch(toggleCartModal())}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>shopping_cart</span>
                Ver Carrito
                {cartItemsCount > 0 && (
                  <span className="client-sidebar-cart-badge">{cartItemsCount}</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
