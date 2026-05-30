// hooks/useProductsSync.js - VERSIÓN SIMPLIFICADA PERO OPTIMIZADA
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { getProducts } from "../actions/productsActions";

export const useProductsSync = (interval = 60000, enabled = true) => {
  const dispatch = useDispatch();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    // ✅ Carga inicial sin forzar siempre
    dispatch(getProducts(false));

    // ✅ Polling inteligente
    const startPolling = () => {
      intervalRef.current = setInterval(() => {
        // ✅ Solo actualizar si la pestaña está visible
        if (document.visibilityState === "visible") {
          dispatch(getProducts(false));
        }
      }, interval);
    };

    startPolling();

    // ✅ Sincronizar al volver a la pestaña
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        dispatch(getProducts(true)); // Forzar al volver
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [dispatch, interval, enabled]);
};
