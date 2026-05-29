// components/admin/DashboardStats/DashboardStats.jsx
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  HiOutlineChartBar,
  HiOutlineCube,
  HiOutlineExclamationCircle,
  HiOutlineCollection,
  HiOutlineCurrencyDollar,
  HiOutlinePhotograph,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineInformationCircle,
  HiOutlineChevronRight,
} from "react-icons/hi";
import "./DashboardStats.css";

const DashboardStats = ({ products = [] }) => {
  const [expandedSections, setExpandedSections] = useState({
    inventory: true,
    details: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Todas las métricas en un solo useMemo
  const metrics = useMemo(() => {
    const totalProducts = products.length;

    // ✅ CORREGIDO: Detectar productos agotados por stock_quantity (no por status)
    const outOfStockCount = products.filter(
      (p) =>
        (p.stock_quantity !== undefined && p.stock_quantity <= 0) ||
        p.status === "outOfStock",
    ).length;

    const inStockCount = totalProducts - outOfStockCount;

    const productsByCategory = products.reduce((acc, product) => {
      const category = product.category?.name || "Sin categoría";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const topCategory = Object.entries(productsByCategory).sort(
      ([, a], [, b]) => b - a,
    )[0] || ["Sin categorías", 0];
    const totalCategories = Object.keys(productsByCategory).length;

    const totalInventoryValue = products.reduce((total, product) => {
      const price = parseFloat(product.price) || 0;
      const stock = parseInt(product.stock_quantity) || 0;
      return total + price * stock;
    }, 0);

    // ✅ CORREGIDO: Verificar image_url
    const productsWithImages = products.filter(
      (p) => p.image_url && p.image_url !== "" && p.image_url !== null,
    ).length;
    const productsWithoutImages = totalProducts - productsWithImages;

    const recentProducts = products.filter((product) => {
      const productDate = new Date(product.created_at || product.updated_at);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return productDate >= monthAgo;
    }).length;

    const stockPercentage = totalProducts
      ? Math.round((inStockCount / totalProducts) * 100)
      : 0;
    const imagesPercentage = totalProducts
      ? Math.round((productsWithImages / totalProducts) * 100)
      : 0;

    return {
      totalProducts,
      outOfStockCount,
      inStockCount,
      topCategory,
      totalCategories,
      totalInventoryValue,
      productsWithImages,
      productsWithoutImages,
      recentProducts,
      stockPercentage,
      imagesPercentage,
    };
  }, [products]);

  // Tarjeta de estadística compacta
  const CompactStat = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className="ds-compact-stat">
      <div
        className="ds-compact-stat__icon"
        style={{ backgroundColor: bgColor }}
      >
        <Icon size={16} color={color} />
      </div>
      <div className="ds-compact-stat__info">
        <span className="ds-compact-stat__value" style={{ color }}>
          {value}
        </span>
        <span className="ds-compact-stat__label">{label}</span>
      </div>
    </div>
  );

  return (
    <div className="dashboard-stats">
      {/* ===== HEADER DEL DASHBOARD ===== */}
      <div className="ds-header">
        <div className="ds-header__greeting">
          <span className="ds-header__emoji">📊</span>
          <div>
            <h2 className="ds-header__title">Panel de Control</h2>
            <p className="ds-header__subtitle">
              {metrics.totalProducts} productos · {metrics.totalCategories}{" "}
              categorías
            </p>
          </div>
        </div>
        <div className="ds-header__date">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
      </div>

      {/* ===== RESUMEN RÁPIDO - TARJETAS COMPACTAS ===== */}
      <div className="ds-quick-stats">
        <CompactStat
          icon={HiOutlineCube}
          label="En stock"
          value={metrics.inStockCount}
          color="#059669"
          bgColor="#d1fae5"
        />
        <CompactStat
          icon={HiOutlineExclamationCircle}
          label="Agotados"
          value={metrics.outOfStockCount}
          color={metrics.outOfStockCount > 0 ? "#dc2626" : "#6b7280"}
          bgColor={metrics.outOfStockCount > 0 ? "#fee2e2" : "#f3f4f6"}
        />
        <CompactStat
          icon={HiOutlineCollection}
          label="Categorías"
          value={metrics.totalCategories}
          color="#7c3aed"
          bgColor="#ede9fe"
        />
        <CompactStat
          icon={HiOutlineCurrencyDollar}
          label="Valor inventario"
          value={`$${(metrics.totalInventoryValue / 1000).toFixed(0)}k`}
          color="#0891b2"
          bgColor="#cffafe"
        />
      </div>

      {/* ===== SECCIÓN: INVENTARIO ===== */}
      <div className="ds-section">
        <button
          className="ds-section__header"
          onClick={() => toggleSection("inventory")}
        >
          <div className="ds-section__header-left">
            <span className="ds-section__icon">📦</span>
            <span className="ds-section__title">Estado del Inventario</span>
          </div>
          <HiOutlineChevronRight
            className={`ds-section__arrow ${expandedSections.inventory ? "ds-section__arrow--open" : ""}`}
            size={18}
          />
        </button>

        <div
          className={`ds-section__content ${expandedSections.inventory ? "ds-section__content--open" : ""}`}
        >
          {/* Barra de progreso principal */}
          <div className="ds-progress-card">
            <div className="ds-progress-card__header">
              <span>Productos en stock</span>
              <span className="ds-progress-card__percentage">
                {metrics.stockPercentage}%
              </span>
            </div>
            <div className="ds-progress-bar">
              <div
                className="ds-progress-bar__fill ds-progress-bar__fill--success"
                style={{ width: `${metrics.stockPercentage}%` }}
              />
            </div>
            <div className="ds-progress-card__details">
              <span>
                {metrics.inStockCount} de {metrics.totalProducts} disponibles
              </span>
            </div>
          </div>

          {/* Grid de métricas de inventario */}
          <div className="ds-metrics-grid">
            <div className="ds-metric-item">
              <div className="ds-metric-item__icon ds-metric-item__icon--blue">
                <HiOutlineChartBar size={16} />
              </div>
              <div className="ds-metric-item__info">
                <span className="ds-metric-item__value">
                  {metrics.totalProducts}
                </span>
                <span className="ds-metric-item__label">Total productos</span>
              </div>
            </div>

            <div className="ds-metric-item">
              <div className="ds-metric-item__icon ds-metric-item__icon--green">
                <HiOutlineArrowUp size={16} />
              </div>
              <div className="ds-metric-item__info">
                <span className="ds-metric-item__value">
                  {metrics.inStockCount}
                </span>
                <span className="ds-metric-item__label">Disponibles</span>
              </div>
            </div>

            <div className="ds-metric-item">
              <div className="ds-metric-item__icon ds-metric-item__icon--red">
                <HiOutlineArrowDown size={16} />
              </div>
              <div className="ds-metric-item__info">
                <span className="ds-metric-item__value">
                  {metrics.outOfStockCount}
                </span>
                <span className="ds-metric-item__label">Agotados</span>
              </div>
            </div>

            <div className="ds-metric-item">
              <div className="ds-metric-item__icon ds-metric-item__icon--purple">
                <HiOutlineCollection size={16} />
              </div>
              <div className="ds-metric-item__info">
                <span className="ds-metric-item__value">
                  {metrics.totalCategories}
                </span>
                <span className="ds-metric-item__label">Categorías</span>
              </div>
            </div>
          </div>

          {/* Categoría principal */}
          <div className="ds-info-card">
            <span className="ds-info-card__icon">🏆</span>
            <div className="ds-info-card__content">
              <span className="ds-info-card__title">Categoría principal</span>
              <span className="ds-info-card__text">
                {metrics.topCategory[0]} ({metrics.topCategory[1]} productos)
              </span>
            </div>
          </div>

          {/* Nuevos productos este mes */}
          {metrics.recentProducts > 0 && (
            <div className="ds-info-card ds-info-card--success">
              <span className="ds-info-card__icon">🆕</span>
              <div className="ds-info-card__content">
                <span className="ds-info-card__title">Nuevos este mes</span>
                <span className="ds-info-card__text">
                  {metrics.recentProducts} productos agregados
                </span>
              </div>
            </div>
          )}

          {/* Alerta de productos agotados */}
          {metrics.outOfStockCount > 0 && (
            <div className="ds-alert">
              <span className="ds-alert__icon">⚠️</span>
              <div className="ds-alert__content">
                <span className="ds-alert__title">Requieren atención</span>
                <span className="ds-alert__text">
                  {metrics.outOfStockCount} producto
                  {metrics.outOfStockCount !== 1 ? "s" : ""} necesita
                  {metrics.outOfStockCount === 1 ? "" : "n"} reposición
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== SECCIÓN: DETALLES ADICIONALES ===== */}
      <div className="ds-section">
        <button
          className="ds-section__header"
          onClick={() => toggleSection("details")}
        >
          <div className="ds-section__header-left">
            <span className="ds-section__icon">ℹ️</span>
            <span className="ds-section__title">Detalles Adicionales</span>
          </div>
          <HiOutlineChevronRight
            className={`ds-section__arrow ${expandedSections.details ? "ds-section__arrow--open" : ""}`}
            size={18}
          />
        </button>

        <div
          className={`ds-section__content ${expandedSections.details ? "ds-section__content--open" : ""}`}
        >
          {/* Valor del inventario */}
          {metrics.totalInventoryValue > 0 && (
            <div className="ds-metric-item ds-metric-item--full">
              <div className="ds-metric-item__icon ds-metric-item__icon--cyan">
                <HiOutlineCurrencyDollar size={16} />
              </div>
              <div className="ds-metric-item__info">
                <span className="ds-metric-item__value ds-metric-item__value--large">
                  ${metrics.totalInventoryValue.toLocaleString()}
                </span>
                <span className="ds-metric-item__label">
                  Valor total del inventario
                </span>
              </div>
            </div>
          )}

          {/* Imágenes */}
          <div className="ds-metrics-grid ds-metrics-grid--two">
            <div className="ds-metric-item">
              <div className="ds-metric-item__icon ds-metric-item__icon--purple">
                <HiOutlinePhotograph size={16} />
              </div>
              <div className="ds-metric-item__info">
                <span className="ds-metric-item__value">
                  {metrics.productsWithImages}
                </span>
                <span className="ds-metric-item__label">Con imágenes</span>
              </div>
            </div>

            <div className="ds-metric-item">
              <div className="ds-metric-item__icon ds-metric-item__icon--gray">
                <HiOutlineInformationCircle size={16} />
              </div>
              <div className="ds-metric-item__info">
                <span className="ds-metric-item__value">
                  {metrics.productsWithoutImages}
                </span>
                <span className="ds-metric-item__label">Sin imágenes</span>
              </div>
            </div>
          </div>

          {/* Barra de progreso de imágenes */}
          <div className="ds-progress-card">
            <div className="ds-progress-card__header">
              <span>Productos con imágenes</span>
              <span className="ds-progress-card__percentage">
                {metrics.imagesPercentage}%
              </span>
            </div>
            <div className="ds-progress-bar">
              <div
                className="ds-progress-bar__fill ds-progress-bar__fill--purple"
                style={{ width: `${metrics.imagesPercentage}%` }}
              />
            </div>
          </div>

          {metrics.productsWithoutImages > 0 && (
            <div className="ds-tip">
              <span className="ds-tip__icon">💡</span>
              <span className="ds-tip__text">
                {metrics.productsWithoutImages} producto
                {metrics.productsWithoutImages !== 1 ? "s" : ""} sin imágenes.
                Agregar imágenes mejora las ventas.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
