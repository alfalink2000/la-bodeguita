// App.js - VERSIÓN CON AUTENTICACIÓN, ROLES Y PERSISTENCIA LOCAL
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor } from "./store/store";
import ClientInterface from "./components/client/ClientInterface/ClientInterface";
import AdminInterface from "./components/admin/AdminInterface/AdminInterface";
import AuthPage from "./components/auth/AuthPage";
import RoleSelector from "./components/auth/RoleSelector";
import {
  StartChecking,
  checkingFinish,
  StartLogin,
} from "./actions/authActions";
import { getProducts } from "./actions/productsActions";
import { getCategories } from "./actions/categoriesActions";
import { loadFeaturedProducts } from "./actions/featuredProductsActions";
import { loadAppConfig, loadDefaultConfig } from "./actions/appConfigActions";
import SpiralLoading from "./components/common/SpiralLoading/SpiralLoading";
import MaintenanceMode from "./components/common/MaintenanceMode/MaintenanceMode";

const AppContent = () => {
  const [currentView, setCurrentView] = useState("client");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Iniciando aplicación...");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false); // ✅ ESTÁ AQUÍ

  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const authLoading = useSelector((state) => state.auth.loading);
  const appConfig = useSelector((state) => state.appConfig.config);
  const products = useSelector((state) => state.products.products);
  const categories = useSelector((state) => state.categories.categories);

  // ✅ VERIFICAR SI HAY DATOS EN CACHÉ VÁLIDOS
  const hasValidCachedData = () => {
    const hasAppConfig = appConfig && appConfig.app_name;
    const hasProducts = Array.isArray(products) && products.length > 0;
    const hasCategories = Array.isArray(categories) && categories.length > 0;
    return hasAppConfig && hasProducts && hasCategories;
  };

  // ✅ CARGAR DATOS INICIALES MEJORADO
  const loadInitialData = async () => {
    try {
      console.log("🚀 Iniciando carga de datos...");

      if (hasValidCachedData() && !syncCompleted) {
        console.log("📦 Datos cacheados encontrados, mostrando UI inmediatamente...");
        setUsingCachedData(true);
        setIsLoading(false);
        setLoadingStatus("Sincronizando datos en segundo plano...");
      } else {
        setLoadingStatus("Conectando con el servidor...");
      }

      let syncErrors = [];

      try {
        if (!usingCachedData) setLoadingStatus("Cargando configuración...");
        await dispatch(loadAppConfig());
        console.log("✅ Configuración cargada/sincronizada");
      } catch (configError) {
        console.warn("⚠️ Error cargando configuración:", configError);
        syncErrors.push("config");
        if (!hasValidCachedData()) {
          await dispatch(loadDefaultConfig());
        }
      }

      if (!usingCachedData) setLoadingStatus("Cargando productos y categorías...");

      const loadPromises = [
        dispatch(getProducts()).catch((error) => {
          console.warn("⚠️ Error cargando productos:", error);
          syncErrors.push("products");
          return null;
        }),
        dispatch(getCategories()).catch((error) => {
          console.warn("⚠️ Error cargando categorías:", error);
          syncErrors.push("categories");
          return null;
        }),
      ];

      try {
        if (!usingCachedData) setLoadingStatus("Cargando datos adicionales...");
        loadPromises.push(dispatch(loadFeaturedProducts()));
      } catch (featuredError) {
        console.warn("⚠️ Productos destacados no cargados:", featuredError);
      }

      await Promise.allSettled(loadPromises);

      const token = localStorage.getItem("token");
      if (token) {
        dispatch(StartChecking());
      } else {
        dispatch(checkingFinish());
      }

      setSyncCompleted(true);
      setDataLoaded(true);

      if (syncErrors.length > 0) {
        console.warn(`⚠️ Sincronización completada con errores: ${syncErrors.join(", ")}`);
        setHasErrors(true);
      } else {
        console.log("✅ Sincronización completada exitosamente");
        setHasErrors(false);
      }

      if (usingCachedData) {
        setUsingCachedData(false);
        console.log("🔄 Cambiando de datos cacheados a datos actualizados");
      }
    } catch (error) {
      console.error("❌ Error crítico en sincronización:", error);
      setHasErrors(true);
      if (!hasValidCachedData()) {
        setDataLoaded(false);
      }
    }
  };

  // ✅ EFECTO PRINCIPAL
  useEffect(() => {
    const initializeApp = async () => {
      if (hasValidCachedData()) {
        console.log("🎯 Datos cacheados disponibles, mostrando UI...");
        setIsLoading(false);
      }
      await loadInitialData();
    };
    initializeApp();
  }, []);

  // ✅ EFECTO PARA MANEJAR ESTADOS DE CARGA
  useEffect(() => {
    if (hasValidCachedData() && syncCompleted) {
      setIsLoading(false);
      return;
    }
    if (hasValidCachedData() && !syncCompleted) return;
    if (!hasValidCachedData() && dataLoaded) {
      setIsLoading(false);
      return;
    }
    if (hasErrors && hasValidCachedData()) {
      setIsLoading(false);
      return;
    }
  }, [dataLoaded, hasErrors, syncCompleted, usingCachedData]);

  // ✅ TIMEOUT (12 SEGUNDOS)
  useEffect(() => {
    const maintenanceTimeout = setTimeout(() => {
      if (isLoading && !hasValidCachedData()) {
        console.log("🚨 Timeout de 12 segundos: Activando modo mantenimiento");
        setMaintenanceMode(true);
        setIsLoading(false);
      }
    }, 12000);
    return () => clearTimeout(maintenanceTimeout);
  }, [isLoading]);

  // ✅ REINTENTAR CONEXIÓN
  const handleRetryConnection = () => {
    console.log("🔄 Reintentando conexión...");
    setMaintenanceMode(false);
    setHasErrors(false);
    setDataLoaded(false);
    setSyncCompleted(false);
    setUsingCachedData(false);
    setIsLoading(true);
    loadInitialData();
  };

  // ✅ VERIFICAR AUTENTICACIÓN
  useEffect(() => {
    if (!isLoading && !auth.isLoggedIn && !auth.checking && !maintenanceMode && dataLoaded) {
      console.log("🔒 Usuario no autenticado, mostrando página de autenticación...");
      setShowAuthPage(true);
      setShowRoleSelector(false); // ✅ Ocultar selector si no está logueado
    } else if (auth.isLoggedIn && !auth.checking) {
      console.log("✅ Usuario autenticado:", auth.username);
      setShowAuthPage(false);
    }
  }, [isLoading, auth.isLoggedIn, auth.checking, maintenanceMode, dataLoaded]);

  // ✅ MANEJAR LOGIN EXITOSO
  const handleLoginSuccess = (userData) => {
    console.log("🔑 Login exitoso:", userData);
    dispatch({ type: "[auth] Login", payload: userData });
    setShowAuthPage(false);
    
    if (userData.role === "admin") {
      // ✅ Mostrar selector de rol para admin
      setShowRoleSelector(true);
    } else {
      // Cliente va directo a la vista cliente
      setCurrentView("client");
    }
  };

  // ✅ MANEJAR LOGIN
  const handleLogin = async (username, password) => {
    try {
      await dispatch(StartLogin(username, password));
    } catch (error) {
      console.error("Error en login:", error);
    }
  };

  // ✅ MANEJAR LOGOUT
  const handleLogout = () => {
    console.log("👋 Cerrando sesión...");
    dispatch({ type: "[auth] Logout" });
    localStorage.removeItem("token");
    setCurrentView("client");
    setShowRoleSelector(false); // ✅ Ocultar selector al cerrar sesión
    setShowAuthPage(true);
  };

  // ✅ FUNCIÓN PARA CAMBIAR VISTA
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // ✅ MANEJAR CIERRE DE SESIÓN DESDE ADMIN
  const handleAdminLogout = () => {
    handleLogout();
  };

  // ✅ DEBUG
  console.log("🔍 Estado App:", {
    isLoading,
    maintenanceMode,
    hasErrors,
    dataLoaded,
    syncCompleted,
    showAuthPage,
    showRoleSelector,
    isLoggedIn: auth.isLoggedIn,
    currentView,
  });

  // ✅ RENDERIZAR MODO MANTENIMIENTO
  if (maintenanceMode) {
    return (
      <MaintenanceMode
        onRetry={handleRetryConnection}
        message="No se pudieron cargar los datos esenciales."
      />
    );
  }

  // ✅ RENDERIZAR LOADING
  if (isLoading && !hasValidCachedData()) {
    return (
      <div className="relative">
        <SpiralLoading />
        <div className="fixed bottom-10 left-0 right-0 text-center z-50">
          <div className="bg-black bg-opacity-70 text-white inline-block px-6 py-3 rounded-full shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span className="font-medium">{loadingStatus}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ RENDERIZAR AUTH PAGE
  if (showAuthPage && !auth.isLoggedIn && !isLoading && !maintenanceMode) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // ✅ RENDERIZAR INTERFAZ PRINCIPAL
  return (
    <div className="font-sans antialiased">
      {/* Indicador de datos cacheados */}
      {usingCachedData && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>
      )}

      {/* Indicador de datos desactualizados */}
      {hasErrors && !usingCachedData && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* ✅ ROLE SELECTOR PARA ADMIN */}
      {showRoleSelector && (
        <RoleSelector
          userData={auth}
          onSelectClient={() => {
            setShowRoleSelector(false);
            setCurrentView("client");
          }}
          onSelectAdmin={() => {
            setShowRoleSelector(false);
            setCurrentView("admin");
          }}
        />
      )}

      {currentView === "client" ? (
        <ClientInterface
          currentView={currentView}
          onViewChange={handleViewChange}
          onShowLoginForm={() => setShowAuthPage(true)}
          onLogout={handleLogout}
          isLoggedIn={auth.isLoggedIn}
          userData={auth}
        />
      ) : (
        <AdminInterface
          onLogout={handleAdminLogout}
          onSwitchToClient={() => setCurrentView("client")}
        />
      )}

      {/* Estado de carga global */}
      {authLoading && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Procesando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ COMPONENTE PRINCIPAL CON PERSIST GATE
const App = () => {
  return (
    <PersistGate
      loading={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <SpiralLoading />
        </div>
      }
      persistor={persistor}
    >
      <AppContent />
    </PersistGate>
  );
};

export default App;