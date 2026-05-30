// components/client/ClientInterface.jsx - VERSIÓN COMPLETA OPTIMIZADA
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { useProductsSync } from "../../../hooks/useProductsSync";
import { useAppNavigation } from "../../../hooks/useNavigationHistory";
import {
  HiOutlineShoppingBag,
  HiOutlineFire,
  HiOutlineTag,
  HiOutlinePhone,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineSearch,
  HiOutlineStar,
  HiOutlineCog,
  HiOutlineInformationCircle,
  HiOutlineMenu,
  HiOutlineChat,
  HiOutlineCollection,
} from "react-icons/hi";

// Components
import Header from "../../common/Header/Header";
import SearchBar from "../../common/SearchBar/SearchBar";
import ProductGrid from "../ProductGrid/ProductGrid";
import ProductDetail from "../ProductDetail/ProductDetail";
import BottomNavigation from "../../common/BottomNavigation/BottomNavigation";
import InitialInfoModal from "../../common/InitialInfoModal/InitialInfoModal";
import CartModal from "../../common/CartModal/CartModal";
import SideMenu from "../SideMenu/SideMenu";
import ChatModal from "../ChatModal/ChatModal";
import UserProfile from "../UserProfile/UserProfile";

// Actions & Selectors
import { loadFeaturedProducts } from "../../../actions/featuredProductsActions";
import { getStores } from "../../../actions/storesActions";
import {
  selectProducts,
  selectCategories,
  selectPopularProducts,
  selectOfferProducts,
  selectCategoryOptions,
} from "../../../selectors/productSelectors";

import image from "../../../assets/images/shop.png";
import "./ClientInterface.css";
import "./ClientInterface.desktop.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

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
  const { saveAction, resetNavigation, canGoBack, getStackInfo } =
    useAppNavigation({
      moduleName: "client",
    });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [activeSection, setActiveSection] = useState(SECTIONS.TODOS);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [unreadOrders, setUnreadOrders] = useState(() => {
    const saved = localStorage.getItem("unread_orders_count");
    return saved ? parseInt(saved) : 0;
  });

  const [unreadMessages, setUnreadMessages] = useState(0);
  const isListenerRegistered = useRef(false);

  const stores = useSelector((state) => state.stores.stores);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);

  const products = useSelector(selectProducts);
  const categories = useSelector(selectCategories);
  const popularProducts = useSelector(selectPopularProducts);
  const offerProducts = useSelector(selectOfferProducts);
  const categoryOptions = useSelector(selectCategoryOptions);
  const appConfig = useSelector((state) => state.appConfig.config);

  useEffect(() => {
    if (stores.length === 0) {
      dispatch(getStores());
    }
  }, [dispatch, stores.length]);

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id.toString());
    }
  }, [stores, selectedStoreId]);

  useEffect(() => {
    localStorage.setItem("unread_orders_count", unreadOrders);
  }, [unreadOrders]);

  useEffect(() => {
    if (isListenerRegistered.current) return;

    const handleOrderCreated = (event) => {
      setUnreadOrders((prev) => prev + 1);
    };

    window.addEventListener("order-created", handleOrderCreated);
    isListenerRegistered.current = true;

    return () => {
      window.removeEventListener("order-created", handleOrderCreated);
      isListenerRegistered.current = false;
    };
  }, []);

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

  const handleOpenChat = useCallback(() => {
    setIsChatOpen(true);
    saveAction("modal", { type: "chat" });
  }, [saveAction]);

  const handleOpenSideMenu = useCallback(() => {
    setIsSideMenuOpen(true);
    saveAction("modal", { type: "sidemenu" });
  }, [saveAction]);

  const handleOpenProfile = useCallback(() => {
    setShowProfile(true);
    saveAction("modal", { type: "profile" });
  }, [saveAction]);

  const handleOpenInfoModal = useCallback(() => {
    setShowInfoModal(true);
    saveAction("modal", { type: "info" });
  }, [saveAction]);

  useEffect(() => {
    const handleCloseDetail = () => {
      setSelectedProduct(null);
    };

    const handleCloseModal = (event) => {
      const modalType = event.detail?.data?.type;
      switch (modalType) {
        case "chat":
          setIsChatOpen(false);
          break;
        case "sidemenu":
          setIsSideMenuOpen(false);
          break;
        case "profile":
          setShowProfile(false);
          break;
        case "info":
          setShowInfoModal(false);
          break;
        default:
          setIsChatOpen(false);
          setIsSideMenuOpen(false);
          setShowProfile(false);
          setShowInfoModal(false);
      }
    };

    const handleSectionBack = (event) => {
      const previousSection = event.detail?.data?.to || "todos";
      setActiveSection(previousSection);
    };

    window.addEventListener("client:close-detail", handleCloseDetail);
    window.addEventListener("client:close-modal", handleCloseModal);
    window.addEventListener("client:section-back", handleSectionBack);

    return () => {
      window.removeEventListener("client:close-detail", handleCloseDetail);
      window.removeEventListener("client:close-modal", handleCloseModal);
      window.removeEventListener("client:section-back", handleSectionBack);
    };
  }, []);

  useEffect(() => {
    resetNavigation();
    return () => resetNavigation();
  }, [resetNavigation]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("📊 Estado navegación cliente:", getStackInfo());
    }
  }, [getStackInfo, activeSection, selectedProduct, isChatOpen]);

  const loadUnreadMessages = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/chat/unread-count`, {
        headers: { "x-token": token },
      });
      const data = await res.json();
      if (data.ok) {
        setUnreadMessages(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error cargando mensajes no leídos:", err);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadUnreadMessages();
      const interval = setInterval(loadUnreadMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, loadUnreadMessages]);

  useEffect(() => {
    if (!selectedStoreId) {
      setFilteredCategories(
        categoryOptions.filter((cat) => cat.name !== "Todos"),
      );
      return;
    }
    const filtered = categoryOptions.filter(
      (cat) =>
        (cat.store_id?.toString() === selectedStoreId || !cat.store_id) &&
        cat.name !== "Todos",
    );
    setFilteredCategories(
      filtered.length > 0
        ? filtered
        : categoryOptions.filter((cat) => cat.name !== "Todos"),
    );
    setSelectedCategory("Todos");
  }, [selectedStoreId, categoryOptions]);

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

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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

  const getProductsCount = useCallback(() => {
    return `${filteredProducts.length} ${
      filteredProducts.length === 1 ? "producto" : "productos"
    }`;
  }, [filteredProducts]);

  const handleBackFromDetail = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const handleWhatsAppClick = useCallback(
    (productName) => {
      const phoneNumber = appConfig?.whatsapp_number || "5491112345678";
      const message = `¡Hola! Estoy interesado en el producto: ${productName}`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message,
      )}`;
      window.open(whatsappUrl, "_blank");
    },
    [appConfig?.whatsapp_number],
  );

  const InfoButton = useCallback(
    () => (
      <button
        className="header-action header-action--icon"
        title="Información de la tienda"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("open-help-modal"));
        }}
      >
        <HiOutlineInformationCircle className="header-action__icon" />
      </button>
    ),
    [],
  );

  const TitleWithIcon = useCallback(() => {
    const handleImageError = (e) => {
      e.target.src = image;
      e.target.onerror = null;
    };
    const isValidLogoUrl = (url) => {
      if (!url) return false;
      try {
        const parsedUrl = new URL(url);
        return (
          parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
        );
      } catch {
        return false;
      }
    };
    const logoUrl = appConfig?.logo_url;
    const shouldUseCustomLogo = isValidLogoUrl(logoUrl);

    return (
      <div className="header-title-with-icon">
        <img
          src={shouldUseCustomLogo ? logoUrl : image}
          alt={`Logo ${appConfig?.app_name}`}
          className="header-icon"
          onError={handleImageError}
          loading="lazy"
        />
        <div className="header-text">
          <span className="header-main-title">{appConfig?.app_name}</span>
          <span className="header-subtitle">{appConfig?.app_description}</span>
        </div>
      </div>
    );
  }, [appConfig]);

  const DesktopNavigation = useCallback(
    () => (
      <div className="desktop-navigation">
        <InfoButton />
        <button
          className="header-action header-action--icon"
          title="Búsqueda avanzada"
          onClick={() =>
            document.querySelector(".desktop-search input")?.focus()
          }
        >
          <HiOutlineSearch className="header-action__icon" />
        </button>
        <div className="header-separator"></div>
      </div>
    ),
    [InfoButton],
  );

  const renderMobileLayout = useMemo(
    () => (
      <div className="client-interface__content mobile-layout">
        <div className="client-interface__search-section">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            isDesktop={false}
            appConfig={appConfig}
          />
        </div>

        <div className="store-selector-client">
          <div className="selector-header">
            <div className="selector-header__title">
              <HiOutlineCollection className="selector-header__icon" />
              <div className="decorative-divider">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <h3>Tiendas</h3>
            </div>
            <div className="selector-header__count">
              <span className="count-number">{stores.length}</span>
              <span className="count-label">tiendas</span>
            </div>
          </div>

          <div className="store-selector-client__scroll">
            {stores.map((store) => (
              <button
                key={store.id}
                className={`store-chip ${
                  selectedStoreId === store.id.toString()
                    ? "store-chip--active"
                    : ""
                }`}
                onClick={() => {
                  setSelectedStoreId(store.id.toString());
                  setSelectedCategory("Todos");
                }}
              >
                <HiOutlineCollection className="store-chip__icon" />
                <span className="store-chip__text">{store.name}</span>
              </button>
            ))}
            {stores.length <= 3 && (
              <div className="chips-decoration">
                <div className="decoration-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <div className="decoration-sparkle">✨</div>
                <div className="decoration-line"></div>
              </div>
            )}
          </div>
        </div>

        <div className="categories-chips">
          <div className="selector-header">
            <div className="selector-header__title">
              <HiOutlineTag className="selector-header__icon" />
              <div className="decorative-divider">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <h3>Categorías</h3>
            </div>
            <div className="selector-header__count">
              <span className="count-number">
                {
                  filteredCategories.filter(
                    (cat) => (cat.name || cat) !== "Todos",
                  ).length
                }
              </span>
              <span className="count-label">categorías</span>
            </div>
          </div>

          <div className="categories-chips__scroll">
            <button
              className={`category-chip ${
                selectedCategory === "Todos" ? "category-chip--active" : ""
              }`}
              onClick={() => setSelectedCategory("Todos")}
            >
              Todos
            </button>
            {filteredCategories
              .filter((cat) => (cat.name || cat) !== "Todos")
              .map((cat) => (
                <button
                  key={cat.id || cat}
                  className={`category-chip ${
                    selectedCategory === (cat.name || cat)
                      ? "category-chip--active"
                      : ""
                  }`}
                  onClick={() => setSelectedCategory(cat.name || cat)}
                >
                  {cat.name || cat}
                </button>
              ))}
            {filteredCategories.filter((c) => (c.name || c) !== "Todos")
              .length <= 3 && (
              <div className="chips-decoration">
                <div className="decoration-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <div className="decoration-sparkle">✨</div>
                <div className="decoration-line"></div>
              </div>
            )}
          </div>
        </div>

        <div className="results-info">
          <span className="results-info__text">
            {getProductsCount()} encontrados
          </span>
        </div>

        <div className="client-interface__products-section">
          <ProductGrid
            products={filteredProducts}
            onProductClick={handleProductClick}
            isOfferSection={false}
          />
        </div>
      </div>
    ),
    [
      searchTerm,
      appConfig,
      stores,
      selectedStoreId,
      filteredCategories,
      selectedCategory,
      filteredProducts,
      getProductsCount,
      handleProductClick,
    ],
  );

  const renderDesktopLayout = useMemo(
    () => (
      <div className="client-interface__content desktop-layout">
        <div className="client-interface__search-section desktop-search">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            isDesktop={true}
            appConfig={appConfig}
          />
        </div>

        <div className="desktop-sidebar">
          <div className="desktop-stores-nav">
            <h3 className="desktop-stores-title">
              <HiOutlineCollection className="desktop-stores-icon" /> Tiendas
            </h3>
            <div className="desktop-stores-list">
              {stores.map((store) => (
                <button
                  key={store.id}
                  className={`desktop-section-button ${
                    selectedStoreId === store.id.toString()
                      ? "desktop-section-button--active"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedStoreId(store.id.toString());
                    setSelectedCategory("Todos");
                  }}
                >
                  <HiOutlineCollection className="desktop-section-icon" />
                  <span className="desktop-section-text">{store.name}</span>
                  <span className="desktop-section-badge">
                    {
                      products.filter(
                        (p) => p.store_id?.toString() === store.id.toString(),
                      ).length
                    }
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="desktop-categories-nav">
            <h3 className="desktop-stores-title">
              <HiOutlineTag className="desktop-stores-icon" /> Categorías
            </h3>
            <div className="desktop-stores-list">
              <button
                className={`desktop-section-button ${
                  selectedCategory === "Todos"
                    ? "desktop-section-button--active"
                    : ""
                }`}
                onClick={() => setSelectedCategory("Todos")}
              >
                <span className="desktop-section-text">
                  Todos los productos
                </span>
                <span className="desktop-section-badge">
                  {storeFilteredProducts.length}
                </span>
              </button>

              {filteredCategories
                .filter((cat) => {
                  const name = (cat.name || cat).trim();
                  return (
                    name !== "Todos" && name !== "todos" && name !== "TODOS"
                  );
                })
                .map((cat) => (
                  <button
                    key={cat.id || cat.name || cat}
                    className={`desktop-section-button ${
                      selectedCategory === (cat.name || cat)
                        ? "desktop-section-button--active"
                        : ""
                    }`}
                    onClick={() => setSelectedCategory(cat.name || cat)}
                  >
                    <span className="desktop-section-text">
                      {cat.name || cat}
                    </span>
                    <span className="desktop-section-badge">
                      {
                        storeFilteredProducts.filter(
                          (p) => p.category?.name === (cat.name || cat),
                        ).length
                      }
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="desktop-main-content">
          <div className="results-info results-info--desktop">
            <span className="results-info__text">
              {getProductsCount()} encontrados en{" "}
              {stores.find((s) => s.id.toString() === selectedStoreId)?.name ||
                "Todas las tiendas"}
            </span>
          </div>
          <div className="desktop-products-section">
            <ProductGrid
              products={filteredProducts}
              onProductClick={handleProductClick}
              isOfferSection={false}
            />
          </div>
        </div>
      </div>
    ),
    [
      searchTerm,
      appConfig,
      stores,
      selectedStoreId,
      storeFilteredProducts,
      filteredCategories,
      selectedCategory,
      products,
      filteredProducts,
      getProductsCount,
      handleProductClick,
    ],
  );

  if (!appConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Error de configuración</p>
        </div>
      </div>
    );
  }

  if (selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        onBack={handleBackFromDetail}
        onWhatsAppClick={handleWhatsAppClick}
      />
    );
  }

  return (
    <div className="client-interface">
      <Header
        title={<TitleWithIcon />}
        onInfoClick={handleOpenInfoModal}
        showInfoButton={!isDesktop}
      >
        <DesktopNavigation />
        <button
          className="header-action header-action--icon sidemenu-trigger"
          onClick={handleOpenSideMenu}
          title="Menú"
        >
          <HiOutlineMenu className="header-action__icon" />
        </button>
      </Header>

      <CartModal
        isLoggedIn={isLoggedIn}
        onShowLogin={onShowLoginForm}
        onOpenChat={handleOpenChat}
        onOrderCreated={() => {
          setUnreadOrders((prev) => prev + 1);
        }}
      />
      <InitialInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        initialInfo={appConfig.initialinfo}
      />

      {isDesktop ? renderDesktopLayout : renderMobileLayout}

      {showProfile && (
        <UserProfile
          userData={userData}
          onClose={() => setShowProfile(false)}
          onOrdersViewed={resetUnreadOrders}
          unreadOrdersCount={unreadOrders}
        />
      )}

      {!isDesktop && (
        <BottomNavigation
          currentView={currentView}
          onViewChange={onViewChange}
          onAdminClick={onShowLoginForm}
          categories={filteredCategories.map((c) => c.name || c)}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onSearchClick={() => {
            const searchInput = document.querySelector(
              ".search-bar__input, .client-interface__search-section input",
            );
            searchInput?.focus();
            searchInput?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          isLoggedIn={isLoggedIn}
          onLogout={onLogout}
          onShowLogin={onShowLoginForm}
          onProfileClick={handleOpenProfile}
          currentStoreName={
            stores.find((s) => s.id.toString() === selectedStoreId)?.name ||
            "Tiendas"
          }
          unreadOrdersCount={unreadOrders}
        />
      )}

      <button
        className="floating-chat-button"
        onClick={handleOpenChat}
        title="Chatear con soporte"
      >
        <HiOutlineChat className="chat-icon" />
        {unreadMessages > 0 && (
          <span className="chat-badge">{unreadMessages}</span>
        )}
        <div className="chat-pulse"></div>
      </button>

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
        onProfileClick={handleOpenProfile}
      />
    </div>
  );
};

export default ClientInterface;
