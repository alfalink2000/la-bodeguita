import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAppNavigation } from "../../../hooks/useNavigationHistory";
import Swal from "sweetalert2";

import "../admin.css";

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

import { getFeaturedProducts } from "../../../actions/featuredProductsActions";
import { getAdminUsers } from "../../../actions/adminUsersActions";
import { insertProduct, updateProduct } from "../../../actions/productsActions";
import {
  insertCategory,
  updateCategory,
  deleteCategory,
} from "../../../actions/categoriesActions";
import { startLogout } from "../../../actions/authActions";
import { resetCart } from "../../../actions/cartActions";

const API_URL = import.meta.env.VITE_API_URL;

const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "orders", label: "Pedidos", icon: "orders", badge: true },
  { id: "chats", label: "Chats", icon: "chat", badge: true },
  { id: "stores", label: "Tiendas", icon: "store" },
  { id: "products", label: "Productos", icon: "inventory" },
  { id: "categories", label: "Categorías", icon: "category" },
  { id: "users", label: "Usuarios Admin", icon: "manage_accounts" },
  { id: "config", label: "Configuración App", icon: "settings" },
];

const AdminInterface = ({ onLogout }) => {
  const { saveAction, resetNavigation, getStackInfo } = useAppNavigation({
    moduleName: "admin",
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

  const refreshUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/chat/unread-count`, {
        headers: { "x-token": token },
      });
      const data = await res.json();
      if (data.ok) setUnreadChats(data.unreadCount || 0);
    } catch (err) {
      console.error("Error actualizando contador:", err);
    }
  }, []);

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
            if (pedido.user_id) usersWithNeedingContact.add(pedido.user_id);
          }
        });
        setUsersNeedingAttention(usersWithNeedingContact.size);
      }
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
    }
  }, []);

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

  const handleOpenChatFromOrders = useCallback(
    (userId, userName) => {
      setSelectedChatUserId(userId);
      setActiveSection("chats");
      saveAction("detail", { type: "chat", userId });
      setTimeout(() => {
        loadUsersNeedingAttention();
        refreshUnreadCount();
      }, 500);
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

  useEffect(() => {
    const handleCloseDetail = (event) => {
      const detailType = event.detail?.data?.type;
      if (detailType === "order") setSelectedOrder(null);
      else if (detailType === "chat") {
        setSelectedChatUserId(null);
        refreshUnreadCount();
        loadUsersNeedingAttention();
      }
    };
    const handleCloseModal = (event) => {
      if (event.detail?.data?.type === "product-form") {
        setShowAddForm(false);
        setEditingProduct(null);
      }
    };
    const handleSectionBack = (event) => {
      setActiveSection(event.detail?.data?.to || "dashboard");
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
        if (data.ok && activeSection !== "chats")
          setUnreadChats(data.unreadCount || 0);
      } catch (err) {
        console.error("Error cargando no leídos:", err);
      }
    };
    loadUnread();
    const interval = setInterval(loadUnread, 10000);
    return () => clearInterval(interval);
  }, [activeSection]);

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
    (product) => handleOpenProductForm(product),
    [handleOpenProductForm],
  );

  const handleCancel = useCallback(() => {
    setShowAddForm(false);
    setEditingProduct(null);
  }, []);

  const handleAddCategory = useCallback(
    (categoryName, storeId) => dispatch(insertCategory(categoryName, storeId)),
    [dispatch],
  );
  const handleUpdateCategory = useCallback(
    (oldName, newName) => dispatch(updateCategory(oldName, newName)),
    [dispatch],
  );
  const handleDeleteCategory = useCallback(
    (categoryName) => {
      Swal.fire({
        title: `¿Eliminar categoría "${categoryName}"?`,
        text: "Los productos de esta categoría quedarán sin categoría",
        icon: "warning",
        showCancelButton: true,
      confirmButtonColor: "var(--color-error)",
      cancelButtonColor: "var(--color-on-surface-variant)",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) dispatch(deleteCategory(categoryName));
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

  const chatBadgeCount = unreadChats + usersNeedingAttention;

  const renderContent = () => {
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
        return <StoreManager />;
      case "products":
        return (
          <div>
            <div className="admin-page-header admin-page-header--row">
              <h2 className="admin-page-header__title">
                <span className="material-symbols-outlined">inventory</span>
                Gestión de Productos
              </h2>
              <button
                onClick={() => handleOpenProductForm()}
                className="admin-btn admin-btn--primary"
              >
                <span className="admin-btn__icon">add</span>
                Agregar Producto
              </button>
            </div>
            {products.length === 0 ? (
              <div className="admin-empty">
                <span className="admin-empty__icon material-symbols-outlined">inventory</span>
                <h3 className="admin-empty__title">No hay productos</h3>
                <p className="admin-empty__text">Comienza agregando tu primer producto al catálogo</p>
                <button
                  onClick={() => handleOpenProductForm()}
                  className="admin-btn admin-btn--primary"
                >
                  <span className="admin-btn__icon">add</span>
                  Agregar Primer Producto
                </button>
              </div>
            ) : (
              <ProductList products={products} onEdit={handleEdit} />
            )}
          </div>
        );
      case "categories":
        return (
          <div>
            <div className="admin-page-header">
              <h2 className="admin-page-header__title">
                <span className="material-symbols-outlined">category</span>
                Gestión de Categorías
              </h2>
            </div>
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
          <div style={{ height: "calc(100vh - 120px)" }}>
            <AdminChatManager
              selectedUserId={selectedChatUserId}
              onSelectUser={setSelectedChatUserId}
              onUnreadCountChange={(count) => setUnreadChats(count)}
            />
          </div>
        );
      case "users":
        return (
          <div>
            <div className="admin-page-header">
              <h2 className="admin-page-header__title">
                <span className="material-symbols-outlined">admin_panel_settings</span>
                Gestión de Usuarios Administradores
              </h2>
            </div>
            <AdminUsersManager users={adminUsers} />
          </div>
        );
      case "config":
        return (
          <div>
            <AppConfigManager />
          </div>
        );
      case "orders":
        return (
          <div style={{ height: "calc(100vh - 120px)" }}>
            <AdminOrdersManager
              token={localStorage.getItem("token")}
              onOpenChatWithUser={handleOpenChatFromOrders}
              onSelectOrder={setSelectedOrder}
              onOrderStatusChange={async () => {
                await loadUsersNeedingAttention();
                await refreshUnreadCount();
                window.dispatchEvent(new CustomEvent("admin:refresh-chats"));
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
  };

  return (
    <div className="admin-layout">
      <AdminHeader>
        <div className="admin-header__brand">
          <div className="admin-header__logo">
            <span className="admin-header__logo-icon material-symbols-outlined">admin_panel_settings</span>
          </div>
          <div className="admin-header__info">
            <h1 className="admin-header__info-title">La Bodeguita — Admin</h1>
            <p className="admin-header__info-subtitle">Gestión completa de tu tienda</p>
          </div>
        </div>
        <div className="admin-header__user">
          <div className="admin-header__user-details">
            <p className="admin-header__info-title" style={{ fontSize: "var(--text-label-sm)" }}>Administrador</p>
            <p className="admin-header__info-subtitle">Super Admin</p>
          </div>
          <div className="admin-header__user-avatar">
            <span className="admin-header__user-avatar-icon material-symbols-outlined">person</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="admin-header__menu-btn"
            aria-label="Menú de navegación"
          >
            <span className="material-symbols-outlined">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </AdminHeader>

      <nav
        className={`admin-layout__sidebar ${isMobileMenuOpen ? "admin-layout__sidebar--open" : ""}`}
      >
        <div className="admin-layout__sidebar-header">
          <h3 className="admin-layout__sidebar-title">La Bodeguita</h3>
        </div>
        <div className="admin-layout__sidebar-nav">
          {MENU_ITEMS.map((item) => {
            let badgeCount = 0;
            if (item.id === "chats") badgeCount = chatBadgeCount;
            else if (item.id === "orders") badgeCount = pendingOrders;
            const badgeClass = item.id === "chats" && usersNeedingAttention > 0
              ? "admin-nav__badge--warning"
              : "admin-nav__badge--primary";
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`admin-nav__item ${activeSection === item.id ? "admin-nav__item--active" : ""}`}
              >
                <span className="admin-nav__icon material-symbols-outlined">{item.icon}</span>
                <span className="admin-nav__label">{item.label}</span>
                {badgeCount > 0 && (
                  <span className={`admin-nav__badge ${badgeClass}`}>
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
          <hr className="admin-layout__sidebar-divider" />
          <button
            onClick={handleLogout}
            className="admin-nav__item admin-nav__item--danger"
          >
            <span className="admin-nav__icon material-symbols-outlined">logout</span>
            <span className="admin-nav__label">Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="admin-layout__overlay admin-layout__overlay--visible"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="admin-layout__content desktop-main-content">
        <div className="admin-layout__content-inner">{renderContent()}</div>
      </main>

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
