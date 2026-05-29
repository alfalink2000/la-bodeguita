// AdminInterface.jsx - VERSIÓN COMPLETA CORREGIDA
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAppNavigation } from "../../../hooks/useNavigationHistory";
import {
  HiOutlineChartBar,
  HiOutlineTag,
  HiOutlineCube,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineCog,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
  HiOutlineUsers,
  HiOutlineChat,
  HiOutlineClipboardList,
  HiOutlineCollection,
} from "react-icons/hi";
import Swal from "sweetalert2";

// Components
import AdminHeader from "../AdminHeader/AdminHeader";
import DashboardStats from "../DashboardStats/DashboardStats";
import ProductList from "../ProductList/ProductList";
import ProductForm from "../ProductForm/ProductForm";
import CategoryManager from "../CategoryManager/CategoryManager";
import FeaturedProductsManager from "../FeaturedProductsManager/FeaturedProductsManager";
import AdminUsersManager from "../AdminUsersManager/AdminUsersManager";
import AppConfigManager from "../AppConfigManager/AppConfigManager";
import AdminChatManager from "../AdminChatManager/AdminChatManager";
import StoreManager from "../StoreManager/StoreManager";
import AdminOrdersManager from "../AdminOrdersManager/AdminOrdersManager";

// Actions
import { getFeaturedProducts } from "../../../actions/featuredProductsActions";
import { getAdminUsers } from "../../../actions/adminUsersActions";
import { insertProduct, updateProduct } from "../../../actions/productsActions"; // ✅ ELIMINADO deleteProduct
import {
  insertCategory,
  updateCategory,
  deleteCategory,
} from "../../../actions/categoriesActions";
import { startLogout } from "../../../actions/authActions";
import { resetCart } from "../../../actions/cartActions";

import "./AdminInterface.css";

const API_URL = import.meta.env.VITE_API_URL;

const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: HiOutlineChartBar },
  { id: "orders", label: "Pedidos", icon: HiOutlineClipboardList, badge: true },
  { id: "chats", label: "Chats", icon: HiOutlineChat, badge: true },
  { id: "stores", label: "Tiendas", icon: HiOutlineCollection },
  { id: "products", label: "Productos", icon: HiOutlineCube },
  { id: "categories", label: "Categorías", icon: HiOutlineTag },
  { id: "users", label: "Usuarios Admin", icon: HiOutlineUsers },
  { id: "config", label: "Configuración App", icon: HiOutlineCog },
];

const AdminInterface = ({ onLogout }) => {
  // ✅ Navegación
  const { saveAction, resetNavigation, canGoBack, getStackInfo } =
    useAppNavigation({
      moduleName: "admin",
      onBack: () => {
        if (selectedOrder) {
          setSelectedOrder(null);
          return true;
        }
        if (selectedChatUserId) {
          setSelectedChatUserId(null);
          return true;
        }
        if (showAddForm) {
          setShowAddForm(false);
          setEditingProduct(null);
          return true;
        }
        return false;
      },
    });

  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [usersNeedingAttention, setUsersNeedingAttention] = useState(0);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const dispatch = useDispatch();

  const products = useSelector((state) => state.products.products);
  const categories = useSelector((state) => state.categories.categories);
  const adminUsers = useSelector((state) => state.adminUsers.users);

  // ✅ Función para forzar actualización del contador de chats
  const refreshUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/chat/unread-count`, {
        headers: { "x-token": token },
      });
      const data = await res.json();

      if (data.ok) {
        const count = data.unreadCount || 0;
        console.log(
          "📊 [AdminInterface] Forzando actualización contador:",
          count,
        );
        setUnreadChats(count);
      }
    } catch (err) {
      console.error("Error actualizando contador:", err);
    }
  }, []);

  // ✅ Función para cargar usuarios que necesitan atención
  const loadUsersNeedingAttention = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/orders/admin/all`, {
        headers: { "x-token": token },
      });
      const data = await res.json();

      if (data.ok) {
        const pedidos = data.pedidos || [];
        setPendingOrders(pedidos.filter((o) => o.status === "open").length);

        const usersWithNeedingContact = new Set();
        pedidos.forEach((pedido) => {
          if (
            pedido.delivery_needs_manual_contact === true &&
            pedido.status !== "cancelled" &&
            pedido.status !== "completed"
          ) {
            if (pedido.user_id) {
              usersWithNeedingContact.add(pedido.user_id);
            }
          }
        });

        const uniqueUsersCount = usersWithNeedingContact.size;
        console.log(
          "📊 [AdminInterface] Usuarios únicos que necesitan atención:",
          uniqueUsersCount,
        );
        setUsersNeedingAttention(uniqueUsersCount);
      }
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
    }
  }, []);

  // ✅ Guardar cambios de sección
  const handleSectionChange = useCallback(
    (sectionId) => {
      if (activeSection !== sectionId) {
        setActiveSection(sectionId);
        saveAction("section", { from: activeSection, to: sectionId });
        setIsMobileMenuOpen(false);
        setSelectedChatUserId(null);
        setSelectedOrder(null);

        if (activeSection === "chats" && sectionId !== "chats") {
          refreshUnreadCount();
          loadUsersNeedingAttention();
        }
      }
    },
    [activeSection, saveAction, refreshUnreadCount, loadUsersNeedingAttention],
  );

  const handleSelectOrder = useCallback(
    (order) => {
      setSelectedOrder(order);
      saveAction("detail", { type: "order", id: order.id });
    },
    [saveAction],
  );

  const handleOpenChatFromOrders = useCallback(
    (userId, userName) => {
      console.log("📌 Abriendo chat desde pedidos para usuario:", userId);
      setSelectedChatUserId(userId);
      setActiveSection("chats");
      saveAction("detail", { type: "chat", userId });

      setTimeout(() => {
        loadUsersNeedingAttention();
        refreshUnreadCount();
      }, 500);

      Swal.fire({
        icon: "info",
        title: "Chat abierto",
        text: `Ahora puedes chatear con ${userName || "el cliente"}`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    },
    [saveAction, loadUsersNeedingAttention, refreshUnreadCount],
  );

  const handleOpenProductForm = useCallback(
    (product = null) => {
      setEditingProduct(product);
      setShowAddForm(true);
      saveAction("modal", { type: "product-form", productId: product?.id });
    },
    [saveAction],
  );

  // ✅ Escuchar eventos de navegación
  useEffect(() => {
    const handleCloseDetail = (event) => {
      const detailType = event.detail?.data?.type;
      if (detailType === "order") {
        setSelectedOrder(null);
      } else if (detailType === "chat") {
        setSelectedChatUserId(null);
        refreshUnreadCount();
        loadUsersNeedingAttention();
      }
    };

    const handleCloseModal = (event) => {
      const modalType = event.detail?.data?.type;
      if (modalType === "product-form") {
        setShowAddForm(false);
        setEditingProduct(null);
      }
    };

    const handleSectionBack = (event) => {
      const previousSection = event.detail?.data?.to || "dashboard";
      setActiveSection(previousSection);
    };

    window.addEventListener("admin:close-detail", handleCloseDetail);
    window.addEventListener("admin:close-modal", handleCloseModal);
    window.addEventListener("admin:section-back", handleSectionBack);

    return () => {
      window.removeEventListener("admin:close-detail", handleCloseDetail);
      window.removeEventListener("admin:close-modal", handleCloseModal);
      window.removeEventListener("admin:section-back", handleSectionBack);
    };
  }, [refreshUnreadCount, loadUsersNeedingAttention]);

  useEffect(() => {
    resetNavigation();
    return () => resetNavigation();
  }, [resetNavigation]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("📊 Estado navegación admin:", getStackInfo());
    }
  }, [
    getStackInfo,
    activeSection,
    selectedOrder,
    selectedChatUserId,
    showAddForm,
  ]);

  // Cargar datos iniciales
  useEffect(() => {
    dispatch(getFeaturedProducts());
    dispatch(getAdminUsers());
    loadUsersNeedingAttention();
  }, [dispatch, loadUsersNeedingAttention]);

  useEffect(() => {
    const interval = setInterval(loadUsersNeedingAttention, 15000);
    return () => clearInterval(interval);
  }, [loadUsersNeedingAttention]);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_URL}/api/chat/unread-count`, {
          headers: { "x-token": token },
        });
        const data = await res.json();

        if (data.ok) {
          const count = data.unreadCount || 0;
          console.log("📊 [AdminInterface] Chats no leídos desde API:", count);

          if (activeSection !== "chats") {
            setUnreadChats(count);
          }
        }
      } catch (err) {
        console.error("Error cargando no leídos:", err);
      }
    };

    loadUnread();
    const interval = setInterval(loadUnread, 10000);
    return () => clearInterval(interval);
  }, [activeSection]);

  const categoryNames = useMemo(
    () =>
      Array.isArray(categories)
        ? categories.map((cat) => cat.name).filter(Boolean)
        : [],
    [categories],
  );

  // ✅ CORREGIDO: handleSubmit para ProductForm
  const handleSubmit = useCallback(
    (formData) => {
      if (editingProduct) {
        formData.append("id", editingProduct.id);
        dispatch(updateProduct(formData));
      } else {
        dispatch(insertProduct(formData));
      }
      setShowAddForm(false);
      setEditingProduct(null);
    },
    [editingProduct, dispatch],
  );

  const handleEdit = useCallback(
    (product) => {
      handleOpenProductForm(product);
    },
    [handleOpenProductForm],
  );

  // ❌ ELIMINADO: handleDelete - ProductList usa Redux directamente

  const handleCancel = useCallback(() => {
    setShowAddForm(false);
    setEditingProduct(null);
  }, []);

  const handleAddCategory = useCallback(
    (categoryName, storeId) => {
      dispatch(insertCategory(categoryName, storeId));
    },
    [dispatch],
  );

  const handleUpdateCategory = useCallback(
    (oldName, newName) => {
      dispatch(updateCategory(oldName, newName));
    },
    [dispatch],
  );

  const handleDeleteCategory = useCallback(
    (categoryName) => {
      Swal.fire({
        title: `¿Eliminar categoría "${categoryName}"?`,
        text: "Los productos de esta categoría quedarán sin categoría",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          dispatch(deleteCategory(categoryName));
        }
      });
    },
    [dispatch],
  );

  const handleLogout = useCallback(() => {
    Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Se cerrará tu sesión actual",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(resetCart());
        localStorage.clear();
        sessionStorage.clear();
        dispatch(startLogout());
        onLogout();
      }
    });
  }, [dispatch, onLogout]);

  const renderContent = useMemo(() => {
    switch (activeSection) {
      case "dashboard":
        return (
          <DashboardStats
            products={products}
            pendingOrders={pendingOrders}
            ordersNeedingContact={usersNeedingAttention}
            unreadChats={unreadChats}
          />
        );

      case "stores":
        return (
          <div className="admin-section">
            <StoreManager />
          </div>
        );

      case "products":
        return (
          <div className="admin-section">
            <div className="admin-section__header">
              <h2 className="admin-section__title">Gestión de Productos</h2>
              <button
                onClick={() => handleOpenProductForm()}
                className="admin-section__add-button"
              >
                Agregar Producto
              </button>
            </div>

            {products.length === 0 ? (
              <div className="admin-section__empty">
                <HiOutlineCube className="admin-section__empty-icon" />
                <h3>No hay productos</h3>
                <p>Comienza agregando tu primer producto al catálogo</p>
                <button
                  onClick={() => handleOpenProductForm()}
                  className="admin-section__empty-button"
                >
                  Agregar Primer Producto
                </button>
              </div>
            ) : (
              <ProductList
                products={products}
                onEdit={handleEdit}
                // ✅ NO pasar onDelete - ProductList maneja la eliminación directamente
              />
            )}
          </div>
        );

      case "categories":
        return (
          <div className="admin-section">
            <h2 className="admin-section__title">Gestión de Categorías</h2>
            <CategoryManager
              categories={categories}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          </div>
        );

      case "chats":
        return (
          <div
            className="admin-section"
            style={{ height: "calc(100vh - 120px)", padding: 0 }}
          >
            <AdminChatManager
              selectedUserId={selectedChatUserId}
              onSelectUser={setSelectedChatUserId}
              onUnreadCountChange={(count) => {
                console.log(
                  "📊 [AdminInterface] onUnreadCountChange recibido:",
                  count,
                );
                setUnreadChats(count);
              }}
              onMessageSent={() => {
                refreshUnreadCount();
                loadUsersNeedingAttention();
              }}
            />
          </div>
        );

      case "users":
        return (
          <div className="admin-section">
            <h2 className="admin-section__title">
              Gestión de Usuarios Administradores
            </h2>
            <AdminUsersManager users={adminUsers} />
          </div>
        );

      case "config":
        return (
          <div className="admin-section">
            <h2 className="admin-section__title">Configuración de la App</h2>
            <AppConfigManager />
          </div>
        );

      case "orders":
        return (
          <div
            className="admin-section"
            style={{ height: "calc(100vh - 120px)", padding: 0 }}
          >
            <AdminOrdersManager
              token={localStorage.getItem("token")}
              onOpenChatWithUser={handleOpenChatFromOrders}
              onSelectOrder={handleSelectOrder}
              onOrderStatusChange={async () => {
                console.log(
                  "📊 [AdminInterface] Notificado cambio de estado de pedido",
                );
                await loadUsersNeedingAttention();
                await refreshUnreadCount();
                window.dispatchEvent(new CustomEvent("admin:refresh-chats"));
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("admin:refresh-chats"));
                }, 1000);
              }}
            />
          </div>
        );

      default:
        return (
          <DashboardStats
            products={products}
            pendingOrders={pendingOrders}
            ordersNeedingContact={usersNeedingAttention}
            unreadChats={unreadChats}
          />
        );
    }
  }, [
    activeSection,
    products,
    categories,
    adminUsers,
    pendingOrders,
    usersNeedingAttention,
    unreadChats,
    selectedChatUserId,
    handleEdit,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleOpenChatFromOrders,
    handleSelectOrder,
    handleOpenProductForm,
    refreshUnreadCount,
    loadUsersNeedingAttention,
  ]);

  const chatBadgeCount = unreadChats + usersNeedingAttention;

  console.log(
    "📊 [AdminInterface] Render - chatBadgeCount:",
    chatBadgeCount,
    "unreadChats:",
    unreadChats,
    "usersNeedingAttention:",
    usersNeedingAttention,
  );

  return (
    <div className="admin-interface">
      <AdminHeader>
        <div className="admin-header__content">
          <div className="admin-header__left">
            <div className="admin-header__brand">
              <div className="admin-header__icon-wrapper">
                <HiOutlineShieldCheck className="admin-header__icon" />
              </div>
              <div className="admin-header__text">
                <h1 className="admin-header__title">Panel de Administración</h1>
                <p className="admin-header__subtitle">
                  Gestión completa de tu tienda
                </p>
              </div>
            </div>
          </div>

          <div className="admin-header__right">
            <div className="admin-header__user-info">
              <HiOutlineUserCircle className="admin-header__user-icon" />
              <div className="admin-header__user-details">
                <span className="admin-header__user-name">Administrador</span>
                <span className="admin-header__user-role">Super Admin</span>
              </div>
            </div>

            <button
              className="admin-interface__mobile-menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menú de navegación"
            >
              {isMobileMenuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
            </button>
          </div>
        </div>
      </AdminHeader>

      <div className="admin-interface__layout">
        <nav
          className={`admin-sidebar ${
            isMobileMenuOpen ? "admin-sidebar--open" : ""
          }`}
        >
          <div className="admin-sidebar__header">
            <h3 className="admin-sidebar__title">Menú Admin</h3>
          </div>

          <div className="admin-sidebar__menu">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              let badgeCount = 0;

              if (item.id === "chats") {
                badgeCount = chatBadgeCount;
              } else if (item.id === "orders") {
                badgeCount = pendingOrders;
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`admin-sidebar__item ${
                    activeSection === item.id
                      ? "admin-sidebar__item--active"
                      : ""
                  }`}
                >
                  <Icon className="admin-sidebar__icon" />
                  <span className="admin-sidebar__label">{item.label}</span>
                  {badgeCount > 0 && (
                    <span
                      className={`admin-sidebar__badge ${
                        item.id === "chats" && usersNeedingAttention > 0
                          ? "admin-sidebar__badge--warning"
                          : ""
                      }`}
                    >
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={handleLogout}
              className="admin-sidebar__item admin-sidebar__item--logout"
            >
              <HiOutlineLogout className="admin-sidebar__icon" />
              <span className="admin-sidebar__label">Cerrar Sesión</span>
            </button>
          </div>
        </nav>

        <main className="admin-main">
          <div className="admin-main__content">{renderContent}</div>
        </main>
      </div>

      {showAddForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default AdminInterface;
