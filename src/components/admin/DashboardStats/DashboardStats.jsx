import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

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

  const metrics = useMemo(() => {
    const totalProducts = products.length;
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__title" style={{ gap: "16px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--color-primary)" }}>dashboard</span>
          <div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-headline-md)", fontSize: "var(--text-headline-md)", color: "var(--color-on-surface)" }}>
              Panel de Control
            </h2>
            <p style={{ margin: 0, fontFamily: "var(--font-body-md)", fontSize: "var(--text-body-md)", color: "var(--color-on-surface-variant)" }}>
              {metrics.totalProducts} productos · {metrics.totalCategories} categorías
            </p>
          </div>
        </div>
        <span className="admin-dashboard-date">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="admin-stat-grid">
        <div className="admin-stat">
          <span className="admin-stat__icon material-symbols-outlined" style={{ color: "var(--color-primary)" }}>inventory_2</span>
          <div>
            <p className="admin-stat__value">{metrics.inStockCount}</p>
            <p className="admin-stat__label">En stock</p>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon material-symbols-outlined" style={{ color: metrics.outOfStockCount > 0 ? "var(--color-error)" : "var(--color-on-surface-variant)" }}>block</span>
          <div>
            <p className="admin-stat__value" style={{ color: metrics.outOfStockCount > 0 ? "var(--color-error)" : "var(--color-on-surface)" }}>{metrics.outOfStockCount}</p>
            <p className="admin-stat__label">Agotados</p>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon material-symbols-outlined" style={{ color: "var(--color-secondary)" }}>category</span>
          <div>
            <p className="admin-stat__value">{metrics.totalCategories}</p>
            <p className="admin-stat__label">Categorías</p>
          </div>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon material-symbols-outlined" style={{ color: "var(--color-primary)" }}>payments</span>
          <div>
            <p className="admin-stat__value">${(metrics.totalInventoryValue / 1000).toFixed(0)}k</p>
            <p className="admin-stat__label">Valor inventario</p>
          </div>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="admin-section">
        <button
          onClick={() => toggleSection("inventory")}
          className="admin-section__toggle"
        >
          <div className="admin-section__toggle-left">
            <span className="material-symbols-outlined" style={{ color: "var(--color-on-surface-variant)" }}>inventory</span>
            <span>Estado del Inventario</span>
          </div>
          <span className={`material-symbols-outlined admin-section__toggle-icon ${expandedSections.inventory ? "admin-section__toggle-icon--open" : ""}`}>
            arrow_forward
          </span>
        </button>

        {expandedSections.inventory && (
          <div className="admin-section__body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Progress bar */}
            <div className="admin-stat">
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="admin-stat__label">Productos en stock</span>
                  <span style={{ fontFamily: "var(--font-label-sm)", fontSize: "var(--text-label-sm)", color: "var(--color-primary)", fontWeight: 600 }}>{metrics.stockPercentage}%</span>
                </div>
                <div className="admin-progress">
                  <div className="admin-progress__bar" style={{ width: `${metrics.stockPercentage}%` }} />
                </div>
                <p className="admin-stat__label" style={{ marginTop: "8px" }}>
                  {metrics.inStockCount} de {metrics.totalProducts} disponibles
                </p>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="admin-stat-grid">
              <div className="admin-stat">
                <span className="admin-stat__icon material-symbols-outlined" style={{ color: "var(--color-primary)" }}>inventory</span>
                <div>
                  <p className="admin-stat__value">{metrics.totalProducts}</p>
                  <p className="admin-stat__label">Total productos</p>
                </div>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__icon material-symbols-outlined" style={{ color: "var(--color-primary)" }}>check_circle</span>
                <div>
                  <p className="admin-stat__value">{metrics.inStockCount}</p>
                  <p className="admin-stat__label">Disponibles</p>
                </div>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__icon material-symbols-outlined" style={{ color: "var(--color-error)" }}>error</span>
                <div>
                  <p className="admin-stat__value">{metrics.outOfStockCount}</p>
                  <p className="admin-stat__label">Agotados</p>
                </div>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__icon material-symbols-outlined" style={{ color: "var(--color-secondary)" }}>category</span>
                <div>
                  <p className="admin-stat__value">{metrics.totalCategories}</p>
                  <p className="admin-stat__label">Categorías</p>
                </div>
              </div>
            </div>

            {/* Top category */}
            <div className="admin-stat">
              <span className="admin-stat__icon material-symbols-outlined" style={{ color: "var(--color-secondary)" }}>star</span>
              <div>
                <p className="admin-stat__label">Categoría principal</p>
                <p className="admin-stat__value">{metrics.topCategory[0]} ({metrics.topCategory[1]} productos)</p>
              </div>
            </div>

            {metrics.recentProducts > 0 && (
              <div className="admin-alert admin-alert--info">
                <span className="admin-alert__icon material-symbols-outlined">fiber_new</span>
                <div className="admin-alert__content">
                  <span className="admin-alert__text">{metrics.recentProducts} productos agregados este mes</span>
                </div>
              </div>
            )}

            {metrics.outOfStockCount > 0 && (
              <div className="admin-alert admin-alert--error">
                <span className="admin-alert__icon material-symbols-outlined">warning</span>
                <div className="admin-alert__content">
                  <span className="admin-alert__title">Requieren atención</span>
                  <span className="admin-alert__text">
                    {metrics.outOfStockCount} producto{metrics.outOfStockCount !== 1 ? "s" : ""} necesita{metrics.outOfStockCount === 1 ? "" : "n"} reposición
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="admin-section">
        <button
          onClick={() => toggleSection("details")}
          className="admin-section__toggle"
        >
          <div className="admin-section__toggle-left">
            <span className="material-symbols-outlined" style={{ color: "var(--color-on-surface-variant)" }}>info</span>
            <span>Detalles Adicionales</span>
          </div>
          <span className={`material-symbols-outlined admin-section__toggle-icon ${expandedSections.details ? "admin-section__toggle-icon--open" : ""}`}>
            arrow_forward
          </span>
        </button>

        {expandedSections.details && (
          <div className="admin-section__body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {metrics.totalInventoryValue > 0 && (
              <div className="admin-stat">
                <span className="admin-stat__icon material-symbols-outlined" style={{ color: "var(--color-primary)" }}>payments</span>
                <div>
                  <p className="admin-stat__value" style={{ fontFamily: "var(--font-headline-md)", fontSize: "var(--text-headline-md)" }}>
                    ${metrics.totalInventoryValue.toLocaleString()}
                  </p>
                  <p className="admin-stat__label">Valor total del inventario</p>
                </div>
              </div>
            )}

            <div className="admin-stat-grid">
              <div className="admin-stat">
                <span className="admin-stat__icon material-symbols-outlined" style={{ color: "var(--color-secondary)" }}>image</span>
                <div>
                  <p className="admin-stat__value">{metrics.productsWithImages}</p>
                  <p className="admin-stat__label">Con imágenes</p>
                </div>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__icon material-symbols-outlined" style={{ color: "var(--color-on-surface-variant)" }}>hide_image</span>
                <div>
                  <p className="admin-stat__value">{metrics.productsWithoutImages}</p>
                  <p className="admin-stat__label">Sin imágenes</p>
                </div>
              </div>
            </div>

            <div className="admin-stat">
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="admin-stat__label">Productos con imágenes</span>
                  <span style={{ fontFamily: "var(--font-label-sm)", fontSize: "var(--text-label-sm)", color: "var(--color-secondary)", fontWeight: 600 }}>{metrics.imagesPercentage}%</span>
                </div>
                <div className="admin-progress">
                  <div className="admin-progress__bar admin-progress__bar--secondary" style={{ width: `${metrics.imagesPercentage}%` }} />
                </div>
              </div>
            </div>

            {metrics.productsWithoutImages > 0 && (
              <div className="admin-alert admin-alert--info">
                <span className="admin-alert__icon material-symbols-outlined">lightbulb</span>
                <div className="admin-alert__content">
                  <span className="admin-alert__text">
                    {metrics.productsWithoutImages} producto{metrics.productsWithoutImages !== 1 ? "s" : ""} sin imágenes. Agregar imágenes mejora las ventas.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardStats;
