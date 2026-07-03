import { useState, useMemo, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useProductsSync } from "../../../hooks/useProductsSync";
import { useAppNavigation } from "../../../hooks/useNavigationHistory";
import { loadFeaturedProducts } from "../../../actions/featuredProductsActions";
import { getStores } from "../../../actions/storesActions";
import { getCategories } from "../../../actions/categoriesActions";
import { addToCart, toggleCartModal } from "../../../actions/cartActions";
import { selectCartItemsCount } from "../../../selectors/cartSelectors";
import {
  selectProducts,
  selectCategories,
  selectPopularProducts,
  selectOfferProducts,
} from "../../../selectors/productSelectors";
import Header from "../../common/Header/Header";
import ProductDetail from "../ProductDetail/ProductDetail";
import InitialInfoModal from "../../common/InitialInfoModal/InitialInfoModal";
import CartModal from "../../common/CartModal/CartModal";
import SideMenu from "../SideMenu/SideMenu";
import RightSidebar from "../DesktopSidebar/DesktopSidebar";
import ChatModal from "../ChatModal/ChatModal";
import UserProfile from "../UserProfile/UserProfile";
import "../client.css";
import "./ClientInterface.css";

const SECTIONS = {
  TODOS: "todos",
  POPULARES: "populares",
  OFERTAS: "ofertas",
  CONTACTO: "contacto",
};

const ClientInterface = ({
  currentView,
  onViewChange,
  onShowLoginForm,
  onLogout,
  isLoggedIn,
  userData,
}) => {
  useProductsSync(60000);
  const dispatch = useDispatch();
  const { saveAction, resetNavigation } = useAppNavigation({ moduleName: "client" });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [activeSection, setActiveSection] = useState(SECTIONS.TODOS);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadOrders, setUnreadOrders] = useState(() => {
    const saved = localStorage.getItem("unread_orders_count");
    return saved ? parseInt(saved) : 0;
  });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const stores = useSelector((state) => state.stores.stores);
  const products = useSelector(selectProducts);
  const categories = useSelector(selectCategories);
  const popularProducts = useSelector(selectPopularProducts);
  const offerProducts = useSelector(selectOfferProducts);
  const cartItemsCount = useSelector(selectCartItemsCount);
  const appConfig = useSelector((state) => state.appConfig.config);

  useEffect(() => {
    if (stores.length === 0) dispatch(getStores());
  }, [dispatch, stores.length]);

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id.toString());
    }
  }, [stores, selectedStoreId]);

  useEffect(() => {
    if (!selectedStoreId) {
      setFilteredCategories([]);
      return;
    }
    const API_URL = import.meta.env.VITE_API_URL || "https://minimarket-backend-6z9m.onrender.com";
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const res = await fetch(`${API_URL}/api/stores/${selectedStoreId}/categories`);
        const data = await res.json();
        if (data.ok && data.categories?.length > 0) {
          setFilteredCategories(data.categories.filter((cat) => cat.name !== "Todos"));
        } else {
          const filtered = categories.filter(
            (cat) => cat.store_id?.toString() === selectedStoreId && cat.name !== "Todos",
          );
          setFilteredCategories(filtered.length > 0 ? filtered : []);
        }
        setSelectedCategory("Todos");
      } catch {
        const filtered = categories.filter(
          (cat) => cat.store_id?.toString() === selectedStoreId && cat.name !== "Todos",
        );
        setFilteredCategories(filtered);
        setSelectedCategory("Todos");
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, [selectedStoreId, categories]);

  useEffect(() => {
    if (categories.length === 0) dispatch(getCategories());
  }, [dispatch, categories.length]);

  useEffect(() => {
    localStorage.setItem("unread_orders_count", unreadOrders);
  }, [unreadOrders]);

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadOrders(0);
      localStorage.removeItem("unread_orders_count");
    }
  }, [isLoggedIn]);

  const resetUnreadOrders = useCallback(() => {
    setUnreadOrders(0);
    localStorage.setItem("unread_orders_count", "0");
  }, []);

  const handleSectionChange = useCallback(
    (sectionId) => {
      if (sectionId === SECTIONS.CONTACTO) {
        setIsChatOpen(true);
        return;
      }
      if (activeSection !== sectionId) {
        setActiveSection(sectionId);
        saveAction("section", { from: activeSection, to: sectionId });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [activeSection, saveAction],
  );

  const handleProductClick = useCallback(
    (product) => {
      setSelectedProduct(product);
      saveAction("detail", { type: "product", id: product.id, name: product.name });
    },
    [saveAction],
  );

  useEffect(() => {
    resetNavigation();
    return () => resetNavigation();
  }, [resetNavigation]);

  const loadUnreadMessages = useCallback(async () => {
    const API_URL = import.meta.env.VITE_API_URL || "https://minimarket-backend-6z9m.onrender.com";
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/unread-count`, {
        headers: { "x-token": token },
      });
      const data = await res.json();
      if (data.ok) setUnreadMessages(data.unreadCount || 0);
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadUnreadMessages();
      const interval = setInterval(loadUnreadMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, loadUnreadMessages]);

  const storeFilteredProducts = useMemo(() => {
    if (!selectedStoreId) return products;
    return products.filter(
      (p) => p.store_id?.toString() === selectedStoreId || !p.store_id,
    );
  }, [products, selectedStoreId]);

  useEffect(() => {
    if (appConfig?.show_initialinfo !== false) {
      const timer = setTimeout(() => setShowInfoModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [appConfig?.show_initialinfo]);

  useEffect(() => {
    if (Array.isArray(products) && Array.isArray(categories)) {
      dispatch(loadFeaturedProducts());
    }
  }, [dispatch, products, categories]);

  const filteredProducts = useMemo(() => {
    const productsToFilter =
      activeSection === SECTIONS.TODOS
        ? storeFilteredProducts
        : activeSection === SECTIONS.POPULARES
          ? popularProducts.filter((p) =>
              storeFilteredProducts.some((sp) => sp.id === p.id),
            )
          : activeSection === SECTIONS.OFERTAS
            ? offerProducts.filter((p) =>
                storeFilteredProducts.some((sp) => sp.id === p.id),
              )
            : storeFilteredProducts;

    return productsToFilter.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        selectedCategory === "Todos" ||
        product.category?.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [storeFilteredProducts, popularProducts, offerProducts, searchTerm, selectedCategory, activeSection]);

  const handleWhatsAppClick = useCallback(
    (productName) => {
      const phoneNumber = appConfig?.whatsapp_number || "5491112345678";
      window.open(
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(`¡Hola! Estoy interesado en el producto: ${productName}`)}`,
        "_blank",
      );
    },
    [appConfig?.whatsapp_number],
  );

  if (selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onWhatsAppClick={handleWhatsAppClick}
      />
    );
  }

  const marqueeText = appConfig?.marquee_text || "🚚 Envíos a domicilio — Calculamos el costo según tu ubicación — ¡Recibe tus productos sin salir de casa! 🚚";

  const categoryChips = [
    { id: "Todos", name: "Todos" },
    ...filteredCategories.filter((cat) => cat.name !== "Todos"),
  ];

  const isPopularSection = activeSection === SECTIONS.TODOS && popularProducts.length > 0;
  const isOfferSection = activeSection === SECTIONS.TODOS && offerProducts.length > 0;

  return (
    <div className="client-interface">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuClick={() => setIsSideMenuOpen(true)}
        onCartClick={() => dispatch(toggleCartModal())}
        cartItemsCount={cartItemsCount}
        appName={appConfig?.app_name || "La Bodeguita"}
      />

      {stores.length > 1 && (
        <div className="client-store-bar client-store-bar--visible">
          <span className="client-store-bar__label">Tienda:</span>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="client-store-bar__select"
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id.toString()}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {marqueeText && (
        <div className="client-notice-bar">
          <div className="client-notice-bar__inner">
            <span className="client-notice-bar__item">{marqueeText}</span>
            <span className="client-notice-bar__item">{marqueeText}</span>
          </div>
        </div>
      )}

      <div className={`client-main${isLoggedIn ? " client-main--sidebar" : ""}`}>
        <div>
          <div className="client-categories">
            {categoryChips.map((cat) => (
              <button
                key={cat.id}
                className={`client-category-chip ${selectedCategory === cat.name ? "client-category-chip--active" : ""}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {isPopularSection && (
            <>
              <div className="client-section-header">
                <div className="client-section-title">
                  <span className="material-symbols-outlined client-section-title-icon">star</span>
                  Populares
                </div>
                <button
                  className="client-section-link"
                  onClick={() => handleSectionChange(SECTIONS.POPULARES)}
                >
                  Ver todos
                </button>
              </div>
              <div className="client-scroll-row">
                {popularProducts.map((product) => (
                  <div
                    key={product.id}
                    className="client-product-card"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="client-product-card__image-wrap">
                      <img
                        className="client-product-card__image"
                        src={product.image_url || "https://via.placeholder.com/200"}
                        alt={product.name}
                        loading="lazy"
                      />
                      <button
                        className="client-product-card__add-btn client-product-card__add-btn--visible"
                        onClick={(e) => { e.stopPropagation(); dispatch(addToCart(product)); }}
                        aria-label={`Agregar ${product.name}`}
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                    <div className="client-product-card__body">
                      {product.category?.name && (
                        <div className="client-product-card__category">{product.category.name}</div>
                      )}
                      <h3 className="client-product-card__name">{product.name}</h3>
                      <div className="client-product-card__footer">
                        <span className="client-product-card__price">
                          ${parseFloat(product.price).toFixed(2)}{" "}
                          <span className="client-product-card__price-currency">CUP</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {isOfferSection && (
            <>
              <div className="client-section-header">
                <div className="client-section-title">
                  <span className="material-symbols-outlined client-section-title-icon">local_offer</span>
                  Ofertas
                </div>
                <button
                  className="client-section-link"
                  onClick={() => handleSectionChange(SECTIONS.OFERTAS)}
                >
                  Ver todas
                </button>
              </div>
              <div className="client-scroll-row">
                {offerProducts.map((product) => (
                  <div
                    key={product.id}
                    className="client-product-card"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="client-product-card__image-wrap">
                      <img
                        className="client-product-card__image"
                        src={product.image_url || "https://via.placeholder.com/200"}
                        alt={product.name}
                        loading="lazy"
                      />
                      <button
                        className="client-product-card__add-btn client-product-card__add-btn--visible"
                        onClick={(e) => { e.stopPropagation(); dispatch(addToCart(product)); }}
                        aria-label={`Agregar ${product.name}`}
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                    <div className="client-product-card__body">
                      {product.category?.name && (
                        <div className="client-product-card__category">{product.category.name}</div>
                      )}
                      <h3 className="client-product-card__name">{product.name}</h3>
                      <div className="client-product-card__footer">
                        <span className="client-product-card__price">
                          ${parseFloat(product.price).toFixed(2)}{" "}
                          <span className="client-product-card__price-currency">CUP</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="client-section-header">
            <div className="client-section-title">
              <span className="material-symbols-outlined client-section-title-icon">
                {activeSection === SECTIONS.POPULARES ? "star" : activeSection === SECTIONS.OFERTAS ? "local_offer" : "storefront"}
              </span>
              {activeSection === SECTIONS.POPULARES
                ? "Populares"
                : activeSection === SECTIONS.OFERTAS
                  ? "Ofertas"
                  : "Todos los productos"}
            </div>
            {searchTerm && (
              <div className="client-section-link" style={{ opacity: 0.6 }}>
                "{searchTerm}"
              </div>
            )}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="client-product-grid">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="client-product-card"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="client-product-card__image-wrap">
                    <img
                      className="client-product-card__image"
                      src={product.image_url || "https://via.placeholder.com/200"}
                      alt={product.name}
                      loading="lazy"
                    />
                    <button
                      className="client-product-card__add-btn"
                      onClick={(e) => { e.stopPropagation(); dispatch(addToCart(product)); }}
                      aria-label={`Agregar ${product.name}`}
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                  <div className="client-product-card__body">
                    {product.category?.name && (
                      <div className="client-product-card__category">{product.category.name}</div>
                    )}
                    <h3 className="client-product-card__name">{product.name}</h3>
                    <div className="client-product-card__footer">
                      <span className="client-product-card__price">
                        ${parseFloat(product.price).toFixed(2)}{" "}
                        <span className="client-product-card__price-currency">CUP</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="client-empty">
              <span className="client-empty__icon material-symbols-outlined">search_off</span>
              <h3 className="client-empty__title">No se encontraron productos</h3>
              <p className="client-empty__text">Intenta ajustar los filtros o busca con otro término</p>
            </div>
          )}
        </div>

        <RightSidebar
          isLoggedIn={isLoggedIn}
          userData={userData}
          onLogout={onLogout}
          onShowLogin={onShowLoginForm}
          onProfileClick={() => setShowProfile(true)}
        />
      </div>

      <nav className="client-bottom-nav">
        {[
          { id: SECTIONS.TODOS, icon: "storefront", label: "Tienda" },
          { id: SECTIONS.POPULARES, icon: "star", label: "Populares" },
          { id: SECTIONS.OFERTAS, icon: "local_offer", label: "Ofertas" },
          { id: SECTIONS.CONTACTO, icon: "chat", label: "Contacto" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleSectionChange(item.id)}
            className={`client-bottom-nav__btn ${activeSection === item.id ? "client-bottom-nav__btn--active" : ""}`}
          >
            <div className="client-bottom-nav__btn-wrap">
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.id === SECTIONS.CONTACTO && unreadMessages > 0 && (
                <span className="client-bottom-nav__badge">{unreadMessages}</span>
              )}
            </div>
            <span className="client-bottom-nav__label">{item.label}</span>
          </button>
        ))}
      </nav>

      <footer className="client-footer">
        <div className="client-footer__brand">
          <span className="material-symbols-outlined client-footer__brand-icon">storefront</span>
          <span className="client-footer__brand-name">{appConfig?.app_name || "La Bodeguita"}</span>
        </div>
        <p className="client-footer__copy">© 2024 La Bodeguita Market. Frescura Cubana.</p>
      </footer>

      <button
        className="client-fab-chat"
        onClick={() => setIsChatOpen(true)}
        aria-label="Abrir chat"
      >
        <span className="material-symbols-outlined">chat</span>
        {unreadMessages > 0 && (
          <span className="client-fab-chat__badge">{unreadMessages}</span>
        )}
      </button>

      <CartModal
        isLoggedIn={isLoggedIn}
        onShowLogin={onShowLoginForm}
        onOpenChat={() => setIsChatOpen(true)}
        onOrderCreated={() => setUnreadOrders((prev) => prev + 1)}
      />
      <InitialInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        initialInfo={appConfig?.initialinfo}
      />
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        token={localStorage.getItem("token")}
        userData={userData}
      />
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        userData={userData}
        onLogout={onLogout}
        onShowLogin={onShowLoginForm}
        onProfileClick={() => setShowProfile(true)}
      />
      {showProfile && (
        <UserProfile
          userData={userData}
          onClose={() => setShowProfile(false)}
          onOrdersViewed={resetUnreadOrders}
          unreadOrdersCount={unreadOrders}
        />
      )}
    </div>
  );
};

export default ClientInterface;
