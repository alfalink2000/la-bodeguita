// AdminInterface.jsx - VERSIÓN COMPLETA
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  HiOutlineChartBar,
  HiOutlineTag,
  HiOutlineStar,
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
  HiOutlineExclamationCircle,
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

// Actions
import { getFeaturedProducts } from "../../../actions/featuredProductsActions";
import { getAdminUsers } from "../../../actions/adminUsersActions";
import {
  insertProduct,
  updateProduct,
  deleteProduct,
} from "../../../actions/productsActions";
import {
  insertCategory,
  updateCategory,
  deleteCategory,
} from "../../../actions/categoriesActions";
import { startLogout } from "../../../actions/authActions";
import { resetCart } from "../../../actions/cartActions";

const API_URL = import.meta.env.VITE_API_URL;

import AdminOrdersManager from "../AdminOrdersManager/AdminOrdersManager";

import "./AdminInterface.css";

// Constantes para evitar recreación de objetos
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
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [ordersNeedingContact, setOrdersNeedingContact] = useState(0);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);

  const dispatch = useDispatch();

  // Selectores
  const products = useSelector((state) => state.products.products);
  const categories = useSelector((state) => state.categories.categories);
  const adminUsers = useSelector((state) => state.adminUsers.users);

  // Cargar datos iniciales
  useEffect(() => {
    dispatch(getFeaturedProducts());
    dispatch(getAdminUsers());
  }, [dispatch]);

  // Cargar pedidos pendientes y los que necesitan contacto
  useEffect(() => {
    const loadOrdersStats = async () => {
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
          setOrdersNeedingContact(
            pedidos.filter(
              (o) =>
                o.delivery_needs_manual_contact === true &&
                o.status !== "cancelled",
            ).length,
          );
        }
      } catch (err) {
        console.error("Error cargando estadísticas:", err);
      }
    };

    loadOrdersStats();
    const interval = setInterval(loadOrdersStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // Cargar contador de chats no leídos
  useEffect(() => {
    const loadUnread = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_URL}/api/chat/admin/unread`, {
          headers: { "x-token": token },
        });
        const data = await res.json();
        if (data.ok) setUnreadChats(data.noLeidos);
      } catch (err) {
        console.error("Error cargando no leídos:", err);
      }
    };

    loadUnread();
    const interval = setInterval(loadUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  // Memoizar valores derivados
  const categoryNames = useMemo(
    () =>
      Array.isArray(categories)
        ? categories.map((cat) => cat.name).filter(Boolean)
        : [],
    [categories],
  );

  // Handlers optimizados
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

  const handleEdit = useCallback((product) => {
    setEditingProduct(product);
    setShowAddForm(true);
  }, []);

  const handleDelete = useCallback(
    (productId) => {
      Swal.fire({
        title: "¿Eliminar producto?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          dispatch(deleteProduct(productId));
          Swal.fire({
            icon: "success",
            title: "Producto eliminado",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      });
    },
    [dispatch],
  );

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
        // Limpiar carrito
        dispatch(resetCart());
        localStorage.clear();
        sessionStorage.clear();
        dispatch(startLogout());
        onLogout();
      }
    });
  }, [dispatch, onLogout]);

  const handleSectionChange = useCallback((sectionId) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
  }, []);

  // Función para abrir chat desde pedidos
  const handleOpenChatFromOrders = useCallback((userId, userName) => {
    setSelectedChatUserId(userId);
    setActiveSection("chats");
    Swal.fire({
      icon: "info",
      title: "Chat abierto",
      text: `Ahora puedes chatear con ${userName || "el cliente"}`,
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  }, []);

  // Función para actualizar badge de chats no leídos
  const handleChatUnreadCount = useCallback((count) => {
    setUnreadChats(count);
  }, []);

  // Renderizado de contenido
  const renderContent = useMemo(() => {
    switch (activeSection) {
      case "dashboard":
        return (
          <DashboardStats
            products={products}
            pendingOrders={pendingOrders}
            ordersNeedingContact={ordersNeedingContact}
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
                onClick={() => setShowAddForm(true)}
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
                  onClick={() => setShowAddForm(true)}
                  className="admin-section__empty-button"
                >
                  Agregar Primer Producto
                </button>
              </div>
            ) : (
              <ProductList
                products={products}
                onEdit={handleEdit}
                onDelete={handleDelete}
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
              token={localStorage.getItem("token")}
              selectedUserId={selectedChatUserId}
              onSelectUser={setSelectedChatUserId}
              onUnreadCountChange={handleChatUnreadCount}
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
            />
          </div>
        );

      default:
        return (
          <DashboardStats
            products={products}
            pendingOrders={pendingOrders}
            ordersNeedingContact={ordersNeedingContact}
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
    ordersNeedingContact,
    unreadChats,
    selectedChatUserId,
    handleEdit,
    handleDelete,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleOpenChatFromOrders,
    handleChatUnreadCount,
  ]);

  // Calcular badge combinado para chats (incluye pedidos que necesitan contacto)
  const chatBadgeCount = unreadChats + ordersNeedingContact;

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
                      className={`admin-sidebar__badge ${item.id === "chats" && ordersNeedingContact > 0 ? "admin-sidebar__badge--warning" : ""}`}
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
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default AdminInterface;
