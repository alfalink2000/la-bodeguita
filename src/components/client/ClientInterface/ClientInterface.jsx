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

// SOLO importamos Tailwind (ya está en index.css)
// No importamos ningún CSS personalizado

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
  const { saveAction, resetNavigation } = useAppNavigation({
    moduleName: "client",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Electrodomésticos");
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
    const API_URL =
      import.meta.env.VITE_API_URL ||
      "https://minimarket-backend-6z9m.onrender.com";
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const res = await fetch(
          `${API_URL}/api/stores/${selectedStoreId}/categories`,
        );
        const data = await res.json();
        if (data.ok && data.categories?.length > 0) {
          setFilteredCategories(
            data.categories.filter((cat) => cat.name !== "Todos"),
          );
        } else {
          const filtered = categories.filter(
            (cat) =>
              cat.store_id?.toString() === selectedStoreId &&
              cat.name !== "Todos",
          );
          setFilteredCategories(filtered.length > 0 ? filtered : []);
        }
        const hasElectro = data.categories?.some(cat => cat.name === "Electrodomésticos");
        setSelectedCategory(hasElectro ? "Electrodomésticos" : "Todos");
      } catch {
        const filtered = categories.filter(
          (cat) =>
            cat.store_id?.toString() === selectedStoreId &&
            cat.name !== "Todos",
        );
        setFilteredCategories(filtered);
        const hasElectro = filtered.some(cat => cat.name === "Electrodomésticos");
        setSelectedCategory(hasElectro ? "Electrodomésticos" : "Todos");
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
      saveAction("detail", {
        type: "product",
        id: product.id,
        name: product.name,
      });
    },
    [saveAction],
  );

  useEffect(() => {
    resetNavigation();
    return () => resetNavigation();
  }, [resetNavigation]);

  const loadUnreadMessages = useCallback(async () => {
    const API_URL =
      import.meta.env.VITE_API_URL ||
      "https://minimarket-backend-6z9m.onrender.com";
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
  }, [
    storeFilteredProducts,
    popularProducts,
    offerProducts,
    searchTerm,
    selectedCategory,
    activeSection,
  ]);

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

  const marqueeText =
    appConfig?.marquee_text ||
    "🚚 Envíos a domicilio — Calculamos el costo según tu ubicación — ¡Recibe tus productos sin salir de casa! 🚚";

  const categoryChips = [
    { id: "Todos", name: "Todos" },
    ...filteredCategories.filter((cat) => cat.name !== "Todos"),
  ];

  const isPopularSection =
    activeSection === SECTIONS.TODOS && popularProducts.length > 0;
  const isOfferSection =
    activeSection === SECTIONS.TODOS && offerProducts.length > 0;

  // Componente ProductCard reutilizable con Tailwind
  const ProductCard = ({ product }) => (
    <div
      className="bg-white rounded-lg overflow-hidden cursor-pointer shadow-sm border border-[#e8edea] flex flex-col h-full min-h-[140px] max-h-[170px] active:scale-95 transition-transform"
      onClick={() => handleProductClick(product)}
    >
      <div className="relative aspect-square max-h-[120px] bg-[#e8f5f0] overflow-hidden flex-shrink-0">
        <img
          className="w-full h-full object-cover"
          src={product.image_url || "https://via.placeholder.com/200"}
          alt={product.name}
          loading="lazy"
        />
        <button
          className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-none bg-[#0b4f37] text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-[#c8963e] transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            dispatch(addToCart(product));
          }}
          aria-label={`Agregar ${product.name}`}
        >
          <span className="text-[10px] material-symbols-outlined">add</span>
        </button>
      </div>
      <div className="p-1.5 flex flex-col gap-0.5 flex-1 min-h-[30px] max-h-[38px] overflow-hidden">
        {product.category?.name && (
          <div className="text-[6px] font-semibold text-[#c8963e] uppercase tracking-wider">
            {product.category.name}
          </div>
        )}
        <h3 className="text-[9px] font-medium text-[#1a1a1a] line-clamp-2 leading-tight flex-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-auto pt-0.5">
          <span className="text-[10px] font-bold text-[#0b4f37]">
            ${parseFloat(product.price).toFixed(2)}{" "}
            <span className="text-[6px] text-[#5c6b63] font-normal">CUP</span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[#fafbf9] text-[#1a1a1a] font-sans overflow-x-hidden w-full max-w-full">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuClick={() => setIsSideMenuOpen(true)}
        onCartClick={() => dispatch(toggleCartModal())}
        cartItemsCount={cartItemsCount}
        appName={appConfig?.app_name || "La Bodeguita"}
      />

      {stores.length > 1 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-[#e8edea] flex-shrink-0">
          <span className="text-sm font-semibold text-[#5c6b63] flex-shrink-0">
            Tienda:
          </span>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="flex-1 min-w-0 px-3 py-1.5 pr-8 text-sm border-2 border-[#e8edea] rounded-full bg-white text-[#1a1a1a] appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%235C6B63%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center] focus:outline-none focus:border-[#0b4f37]"
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
        <div className="h-10 flex items-center px-3 py-2 bg-[#e8f5f0] border-b border-[#e8edea] overflow-hidden flex-shrink-0">
          <div className="flex animate-marquee whitespace-nowrap">
            <span className="inline-block text-sm font-medium text-[#1a1a1a] px-8 flex-shrink-0">
              {marqueeText}
            </span>
            <span className="inline-block text-sm font-medium text-[#1a1a1a] px-8 flex-shrink-0">
              {marqueeText}
            </span>
          </div>
        </div>
      )}

      <div
        className={`flex-1 max-w-7xl mx-auto px-3 pb-24 w-full min-h-[60vh] ${
          isLoggedIn ? "lg:grid lg:grid-cols-[1fr_240px] lg:gap-6" : ""
        }`}
      >
        <div>
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto py-1 pb-3 mb-4 scrollbar-none">
            {categoryChips.map((cat) => (
              <button
                key={cat.id}
                className={`flex-shrink-0 px-4 py-2 rounded-full border-2 text-sm font-medium whitespace-nowrap min-h-[36px] transition-colors ${
                  selectedCategory === cat.name
                    ? "bg-[#0b4f37] text-white border-[#0b4f37]"
                    : "bg-white text-[#5c6b63] border-[#e8edea] hover:bg-[#e8f5f0] hover:border-[#0b4f37] hover:text-[#0b4f37]"
                }`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Popular Section */}
          {isPopularSection && (
            <>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
                  <span className="text-2xl text-[#c8963e] material-symbols-outlined">
                    star
                  </span>
                  Populares
                </div>
                <button
                  className="text-sm font-semibold text-[#0b4f37] flex items-center gap-0.5 hover:text-[#c8963e] transition-colors"
                  onClick={() => handleSectionChange(SECTIONS.POPULARES)}
                >
                  Ver todos
                  <span className="text-base material-symbols-outlined">
                    arrow_forward
                  </span>
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 mb-5 scrollbar-none">
                {popularProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}

          {/* Offer Section */}
          {isOfferSection && (
            <>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
                  <span className="text-2xl text-[#c8963e] material-symbols-outlined">
                    local_offer
                  </span>
                  Ofertas
                </div>
                <button
                  className="text-sm font-semibold text-[#0b4f37] flex items-center gap-0.5 hover:text-[#c8963e] transition-colors"
                  onClick={() => handleSectionChange(SECTIONS.OFERTAS)}
                >
                  Ver todas
                  <span className="text-base material-symbols-outlined">
                    arrow_forward
                  </span>
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 mb-5 scrollbar-none">
                {offerProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}

          {/* All Products */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
              <span className="text-2xl text-[#c8963e] material-symbols-outlined">
                {activeSection === SECTIONS.POPULARES
                  ? "star"
                  : activeSection === SECTIONS.OFERTAS
                    ? "local_offer"
                    : "storefront"}
              </span>
              {activeSection === SECTIONS.POPULARES
                ? "Populares"
                : activeSection === SECTIONS.OFERTAS
                  ? "Ofertas"
                  : "Todos los productos"}
            </div>
            {searchTerm && (
              <div className="text-sm text-[#5c6b63] opacity-60">
                "{searchTerm}"
              </div>
            )}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4">
              <span className="text-5xl text-[#e8edea] material-symbols-outlined block mb-3">
                search_off
              </span>
              <h3 className="text-xl text-[#1a1a1a] mb-1">
                No se encontraron productos
              </h3>
              <p className="text-sm text-[#5c6b63]">
                Intenta ajustar los filtros o busca con otro término
              </p>
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 w-full z-50 bg-white border-t border-[#e8edea] shadow-[0_-2px_12px_rgba(11,79,55,0.06)] flex justify-around items-center px-2 pb-[max(6px,env(safe-area-inset-bottom))] h-[60px]">
        {[
          { id: SECTIONS.TODOS, icon: "storefront", label: "Inicio" },
          { id: SECTIONS.POPULARES, icon: "trending_up", label: "Popular" },
          { id: SECTIONS.OFERTAS, icon: "local_offer", label: "Ofertas" },
          { id: SECTIONS.CONTACTO, icon: "chat", label: "Chat" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleSectionChange(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 border-none bg-transparent cursor-pointer rounded-xl min-w-[48px] min-h-[44px] relative flex-1 max-w-[72px] transition-colors ${
              activeSection === item.id
                ? "text-[#0b4f37]"
                : "text-[#94a3b8] hover:text-[#0b4f37]"
            }`}
            aria-label={item.label}
          >
            {activeSection === item.id && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#0b4f37] rounded-b-sm" />
            )}
            <div className="relative flex items-center justify-center">
              <span className="text-2xl material-symbols-outlined">
                {item.icon}
              </span>
              {item.id === SECTIONS.CONTACTO && unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#c8963e] text-white text-[9px] font-bold flex items-center justify-center shadow-md">
                  {unreadMessages}
                </span>
              )}
            </div>
            <span
              className={`text-[9px] font-medium leading-none ${
                activeSection === item.id ? "font-semibold" : ""
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <footer className="hidden flex-col items-center gap-1.5 px-4 py-6 border-t border-[#e8edea] bg-[#e8f5f0] text-center flex-shrink-0 lg:flex">
        <div className="flex items-center gap-2">
          <span className="text-lg text-[#0b4f37] material-symbols-outlined">
            storefront
          </span>
          <span className="text-base font-semibold text-[#0b4f37]">
            {appConfig?.app_name || "La Bodeguita"}
          </span>
        </div>
        <p className="text-xs text-[#5c6b63]">
          © 2024 La Bodeguita Market. Frescura Cubana.
        </p>
      </footer>

      {/* FAB Chat */}
      <button
        className="fixed bottom-[72px] right-3.5 z-40 w-[50px] h-[50px] rounded-full border-none bg-[#0b4f37] text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#c8963e] hover:scale-105 transition-all active:scale-95"
        onClick={() => setIsChatOpen(true)}
        aria-label="Abrir chat"
      >
        <span className="text-2xl material-symbols-outlined">chat</span>
        {unreadMessages > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#c8963e] text-white text-[9px] font-bold flex items-center justify-center shadow-md">
            {unreadMessages}
          </span>
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
