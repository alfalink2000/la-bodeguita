// hooks/useAppNavigation.js
import { useEffect, useCallback, useRef, useState } from "react";

export const useAppNavigation = (options = {}) => {
  const { moduleName = "app", maxStackSize = 20, onBack = null } = options;

  const [canGoBack, setCanGoBack] = useState(false);
  const [currentStackSize, setCurrentStackSize] = useState(0);

  const modalStack = useRef([]);
  const sectionStack = useRef([]);
  const detailStack = useRef([]);
  const isProcessingBack = useRef(false);

  const saveAction = useCallback(
    (actionType, actionData) => {
      const action = {
        type: actionType,
        data: actionData,
        timestamp: Date.now(),
        module: moduleName,
      };

      switch (actionType) {
        case "modal":
          modalStack.current.push(action);
          break;
        case "section":
          sectionStack.current.push(action);
          break;
        case "detail":
          detailStack.current.push(action);
          break;
        default:
          return;
      }

      const stack =
        actionType === "modal"
          ? modalStack.current
          : actionType === "section"
            ? sectionStack.current
            : detailStack.current;
      if (stack.length > maxStackSize) {
        stack.shift();
      }

      const stateKey = `${moduleName}_${actionType}_${Date.now()}`;
      window.history.pushState(
        {
          actionType,
          actionIndex: Date.now(),
          module: moduleName,
          stateKey,
        },
        "",
        window.location.href,
      );

      setCanGoBack(true);
      setCurrentStackSize(stack.length);

      if (import.meta.env.DEV) {
        console.log(`📝 [${moduleName}] Acción guardada:`, action);
      }
    },
    [moduleName, maxStackSize],
  );

  const replaceLastAction = useCallback(
    (actionType, actionData) => {
      let stack;
      switch (actionType) {
        case "modal":
          stack = modalStack.current;
          break;
        case "section":
          stack = sectionStack.current;
          break;
        case "detail":
          stack = detailStack.current;
          break;
        default:
          return false;
      }

      if (stack.length > 0) {
        stack[stack.length - 1] = {
          type: actionType,
          data: actionData,
          timestamp: Date.now(),
          module: moduleName,
        };
        return true;
      }
      return false;
    },
    [moduleName],
  );

  const goBack = useCallback(() => {
    if (isProcessingBack.current) return false;
    isProcessingBack.current = true;

    setTimeout(() => {
      isProcessingBack.current = false;
    }, 300);

    if (onBack && onBack()) {
      window.history.back();
      return true;
    }

    if (detailStack.current.length > 0) {
      const lastDetail = detailStack.current.pop();
      window.dispatchEvent(
        new CustomEvent(`${moduleName}:close-detail`, {
          detail: lastDetail,
        }),
      );
      window.history.back();
      setCurrentStackSize(detailStack.current.length);
      if (import.meta.env.DEV) {
        console.log(`🔙 [${moduleName}] Cerrando detalle:`, lastDetail);
      }
      return true;
    }

    if (modalStack.current.length > 0) {
      const lastModal = modalStack.current.pop();
      window.dispatchEvent(
        new CustomEvent(`${moduleName}:close-modal`, {
          detail: lastModal,
        }),
      );
      window.history.back();
      setCurrentStackSize(modalStack.current.length);
      if (import.meta.env.DEV) {
        console.log(`🔙 [${moduleName}] Cerrando modal:`, lastModal);
      }
      return true;
    }

    if (sectionStack.current.length > 1) {
      sectionStack.current.pop();
      const previousSection =
        sectionStack.current[sectionStack.current.length - 1];
      window.dispatchEvent(
        new CustomEvent(`${moduleName}:section-back`, {
          detail: previousSection,
        }),
      );
      window.history.back();
      setCurrentStackSize(sectionStack.current.length);
      if (import.meta.env.DEV) {
        console.log(`🔙 [${moduleName}] Volviendo a sección:`, previousSection);
      }
      return true;
    }

    setCanGoBack(false);
    setCurrentStackSize(0);

    if (import.meta.env.DEV) {
      console.log(`🔚 [${moduleName}] No hay más acciones en el historial`);
    }
    return false;
  }, [moduleName, onBack]);

  const resetNavigation = useCallback(() => {
    modalStack.current = [];
    sectionStack.current = [];
    detailStack.current = [];
    setCanGoBack(false);
    setCurrentStackSize(0);
    if (import.meta.env.DEV) {
      console.log(`🔄 [${moduleName}] Navegación reseteada`);
    }
  }, [moduleName]);

  const clearStack = useCallback((stackType) => {
    switch (stackType) {
      case "modal":
        modalStack.current = [];
        break;
      case "section":
        sectionStack.current = [];
        break;
      case "detail":
        detailStack.current = [];
        break;
      default:
        modalStack.current = [];
        sectionStack.current = [];
        detailStack.current = [];
    }
    setCurrentStackSize(0);
    setCanGoBack(false);
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.module && event.state.module !== moduleName) {
        return;
      }
      goBack();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [goBack, moduleName]);

  const getStackInfo = useCallback(() => {
    return {
      modalStack: modalStack.current.length,
      sectionStack: sectionStack.current.length,
      detailStack: detailStack.current.length,
      total:
        modalStack.current.length +
        sectionStack.current.length +
        detailStack.current.length,
      canGoBack,
    };
  }, [canGoBack]);

  return {
    saveAction,
    replaceLastAction,
    goBack,
    resetNavigation,
    clearStack,
    canGoBack,
    currentStackSize,
    getStackInfo,
  };
};
