// store/store.js - VERSIÓN OPTIMIZADA
import { createStore, combineReducers, applyMiddleware, compose } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import { thunk } from "redux-thunk";
import { productsReducer } from "../reducers/productsReducer";
import { categoriesReducer } from "../reducers/categoriesReducer";
import { authReducer } from "../reducers/authReducer";
import { adminUsersReducer } from "../reducers/adminUsersReducer";
import { appConfigReducer } from "../reducers/appConfigReducer";
import { cartReducer } from "../reducers/cartReducer";
import { ordersReducer } from "../reducers/ordersReducer";
import { storesReducer } from "../reducers/storesReducer";
import { chatReducer } from "../reducers/chatReducer";

const reducers = combineReducers({
  products: productsReducer,
  categories: categoriesReducer,
  auth: authReducer,
  adminUsers: adminUsersReducer,
  appConfig: appConfigReducer,
  cart: cartReducer,
  orders: ordersReducer,
  stores: storesReducer,
  chat: chatReducer,
});

// ✅ CONFIGURACIÓN DE PERSISTENCIA OPTIMIZADA
const persistConfig = {
  key: "root",
  storage,
  stateReconciler: autoMergeLevel2,
  whitelist: ["products", "categories", "appConfig", "cart"],
  blacklist: ["auth", "chat", "orders", "adminUsers", "stores"], // ✅ Explícito lo que NO persistir
  timeout: 10000, // ✅ Aumentado a 10 segundos para evitar timeouts
  version: 2,
};

const persistedReducer = persistReducer(persistConfig, reducers);

// 🔥 MIDDLEWARE DE DEBUG OPTIMIZADO
const debugMiddleware = (store) => (next) => (action) => {
  // Solo log en desarrollo y para acciones importantes
  if (process.env.NODE_ENV !== "development") {
    return next(action);
  }

  // Lista de acciones que queremos monitorear
  const importantActions = [
    "appConfigLoad",
    "productsLoad",
    "categoriesLoad",
    "authLogin",
    "authLogout",
    "cartAddItem",
    "cartClear",
    "orderAddNew",
  ];

  // Verificar si el action.type contiene alguna de las importantes
  const shouldLog = importantActions.some((important) =>
    action.type?.includes(important),
  );

  if (shouldLog) {
    console.group(`🔍 REDUX: ${action.type}`);
    console.log("Payload:", action.payload);
    const result = next(action);
    console.log("State:", store.getState());
    console.groupEnd();
    return result;
  }

  return next(action);
};

const composeEnhancers =
  (typeof window !== "undefined" &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

export const store = createStore(
  persistedReducer,
  composeEnhancers(applyMiddleware(thunk, debugMiddleware)),
);

export const persistor = persistStore(store, null, () => {
  if (process.env.NODE_ENV === "development") {
    console.log("✅ Redux Persist: Estado restaurado");
  }
});

// Para debug en desarrollo
if (process.env.NODE_ENV === "development") {
  window.store = store;
  window.persistor = persistor;
}
