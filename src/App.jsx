// App.js - VERSIÓN CORREGIDA CON TEMA
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor } from "./store/store";
import ClientInterface from "./components/client/ClientInterface/ClientInterface";
import AdminInterface from "./components/admin/AdminInterface/AdminInterface";
import AuthPage from "./components/auth/AuthPage";
import RoleSelector from "./components/auth/RoleSelector";
import { StartChecking, checkingFinish } from "./actions/authActions";
import { getProducts } from "./actions/productsActions";
import { getCategories } from "./actions/categoriesActions";
import { loadFeaturedProducts } from "./actions/featuredProductsActions";
import { loadAppConfig, loadDefaultConfig } from "./actions/appConfigActions";
import SpiralLoading from "./components/common/SpiralLoading/SpiralLoading";
import MaintenanceMode from "./components/common/MaintenanceMode/MaintenanceMode";
import { types } from "./types/types";
import { applyTheme } from "./utils/themeManager";

const AppContent = () => {
  const [currentView, setCurrentView] = useState("client");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Iniciando aplicación...");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [themeApplied, setThemeApplied] = useState(false);

  // ✅ REF para evitar bucles y ejecuciones múltiples
  const roleSelectorShownRef = useRef(false);

  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
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

  // ✅ APLICAR TEMA CUANDO LA CONFIGURACIÓN ESTÉ DISPONIBLE
  useEffect(() => {
    if (appConfig && appConfig.theme && !themeApplied) {
      console.log("🎨 Aplicando tema desde configuración:", appConfig.theme);
      applyTheme(appConfig.theme);
      setThemeApplied(true);
    } else if (appConfig && !themeApplied) {
      console.log("🎨 Aplicando tema por defecto: blue");
      applyTheme("blue");
      setThemeApplied(true);
    }
  }, [appConfig, themeApplied]);

  // ✅ CARGAR DATOS INICIALES Y VERIFICAR AUTENTICACIÓN
  const loadInitialData = async () => {
    try {
      console.log("🚀 Iniciando carga de datos...");

      if (hasValidCachedData() && !syncCompleted) {
        console.log(
          "📦 Datos cacheados encontrados, mostrando UI inmediatamente...",
        );
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

      if (!usingCachedData)
        setLoadingStatus("Cargando productos y categorías...");

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

      // ✅ VERIFICAR AUTENTICACIÓN
      setLoadingStatus("Verificando autenticación...");
      const token = localStorage.getItem("token");

      if (token) {
        console.log("🔑 Token encontrado, verificando autenticación...");
        await dispatch(StartChecking());
      } else {
        console.log("🔓 No hay token, usuario no autenticado");
        dispatch(checkingFinish());
      }

      setAuthCheckComplete(true);
      setSyncCompleted(true);
      setDataLoaded(true);

      if (syncErrors.length > 0) {
        console.warn(
          `⚠️ Sincronización completada con errores: ${syncErrors.join(", ")}`,
        );
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
      setAuthCheckComplete(true);
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

  // ✅ EFECTO PARA MANEJAR EL ROLE SELECTOR - CORREGIDO
  useEffect(() => {
    if (
      !isLoading &&
      authCheckComplete &&
      auth?.isLoggedIn &&
      !roleSelectorShownRef.current
    ) {
      console.log("👤 Usuario autenticado:", auth);
      console.log("Rol del usuario:", auth?.role);

      if (auth?.role === "admin") {
        console.log("🎭 Admin detectado, mostrando RoleSelector");
        roleSelectorShownRef.current = true;
        setShowRoleSelector(true);
      } else if (auth?.role === "client") {
        console.log("👤 Cliente detectado, mostrando ClientInterface");
        setCurrentView("client");
      }
    }
  }, [isLoading, authCheckComplete, auth?.isLoggedIn, auth?.role]);

  // ✅ TIMEOUT (12 SEGUNDOS)
  useEffect(() => {
    const maintenanceTimeout = setTimeout(() => {
      if (isLoading && !hasValidCachedData() && !authCheckComplete) {
        console.log("🚨 Timeout de 12 segundos: Activando modo mantenimiento");
        setMaintenanceMode(true);
        setIsLoading(false);
        setAuthCheckComplete(true);
      }
    }, 12000);
    return () => clearTimeout(maintenanceTimeout);
  }, [isLoading, authCheckComplete]);

  // ✅ REINTENTAR CONEXIÓN
  const handleRetryConnection = () => {
    console.log("🔄 Reintentando conexión...");
    setMaintenanceMode(false);
    setHasErrors(false);
    setDataLoaded(false);
    setSyncCompleted(false);
    setUsingCachedData(false);
    setAuthCheckComplete(false);
    setShowRoleSelector(false);
    roleSelectorShownRef.current = false;
    setThemeApplied(false);
    setIsLoading(true);
    loadInitialData();
  };

  // ✅ MANEJAR LOGIN EXITOSO DESDE AuthPage
  const handleLoginSuccess = (userData) => {
    console.log("🔑 Login exitoso desde AuthPage:", userData);

    roleSelectorShownRef.current = false;

    dispatch({
      type: types.authLogin,
      payload: {
        uid: userData.id || userData.uid,
        name: userData.full_name || userData.username,
        role: userData.role || "client",
      },
    });
  };

  // ✅ MANEJAR SELECCIÓN DE VISTA CLIENTE DESDE ROLE SELECTOR
  const handleSelectClient = () => {
    console.log("👁️ Admin seleccionó Vista Cliente");
    setShowRoleSelector(false);
    setCurrentView("client");
  };

  // ✅ MANEJAR SELECCIÓN DE PANEL ADMIN DESDE ROLE SELECTOR
  const handleSelectAdmin = () => {
    console.log("⚙️ Admin seleccionó Panel de Administración");
    setShowRoleSelector(false);
    setCurrentView("admin");
  };

  // ✅ MANEJAR LOGOUT
  const handleLogout = () => {
    console.log("👋 Cerrando sesión...");
    dispatch({ type: types.authLogout });
    localStorage.removeItem("token");
    setCurrentView("client");
    setShowRoleSelector(false);
    roleSelectorShownRef.current = false;
  };

  // ✅ FUNCIÓN PARA CAMBIAR VISTA
  const handleViewChange = (view) => {
    console.log("🔄 Cambiando vista a:", view);
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
    authCheckComplete,
    authIsLoggedIn: auth?.isLoggedIn,
    authRole: auth?.role,
    showRoleSelector,
    currentView,
    themeApplied,
    appConfigTheme: appConfig?.theme,
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
  if (isLoading || !authCheckComplete || auth?.checking === true) {
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

  // ✅ RENDERIZAR AUTH PAGE (NO AUTENTICADO)
  if (!auth?.isLoggedIn) {
    console.log("🔒 Usuario no autenticado, mostrando AuthPage");
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // ✅ RENDERIZAR ROLE SELECTOR (SOLO PARA ADMIN)
  if (showRoleSelector && auth?.role === "admin") {
    console.log("🎭 Mostrando RoleSelector");
    return (
      <RoleSelector
        userData={auth}
        onSelectClient={handleSelectClient}
        onSelectAdmin={handleSelectAdmin}
      />
    );
  }

  // ✅ USUARIO AUTENTICADO - MOSTRAR INTERFAZ CORRESPONDIENTE
  console.log("✅ Usuario autenticado, mostrando interfaz:", currentView);

  return (
    <div className="font-sans antialiased">
      {/* Interfaz según vista seleccionada */}
      {currentView === "client" ? (
        <ClientInterface
          currentView={currentView}
          onViewChange={handleViewChange}
          onShowLoginForm={() => {}}
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
