import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  HiOutlineChartBar,
  HiOutlineCube,
  HiOutlineExclamationCircle,
  HiOutlineStar,
  HiOutlineTag,
  HiOutlineCollection,
  HiOutlineCurrencyDollar,
  HiOutlinePhotograph,
  HiOutlineTrendingUp,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import "./DashboardStats.css";

const DashboardStats = ({ products }) => {
  const featuredProducts = useSelector(
    (state) => state.products.featuredProducts,
  );
  const [expandedCards, setExpandedCards] = useState({});

  const toggleExpand = (cardId) => {
    setExpandedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  // Todas las métricas en un solo useMemo para evitar cálculos repetidos
  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const outOfStockCount = products.filter(
      (p) => p.status === "outOfStock",
    ).length;
    const inStockCount = totalProducts - outOfStockCount;

    const featuredProductsCount = featuredProducts?.popular?.length || 0;
    const offerProductsCount = featuredProducts?.onSale?.length || 0;

    // Agrupar cálculos de categorías
    const productsByCategory = products.reduce((acc, product) => {
      const category = product.category?.name || "Sin categoría";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const topCategory = Object.entries(productsByCategory).sort(
      ([, a], [, b]) => b - a,
    )[0] || ["Sin categorías", 0];
    const totalCategories = Object.keys(productsByCategory).length;

    // Agrupar cálculos de inventario
    const totalInventoryValue = products.reduce((total, product) => {
      const price = parseFloat(product.price) || 0;
      const stock = parseInt(product.stock) || 0;
      return total + price * stock;
    }, 0);

    const productsWithImages = products.filter(
      (p) => p.image && p.image !== "",
    ).length;
    const productsWithoutImages = totalProducts - productsWithImages;

    const recentProducts = products.filter((product) => {
      const productDate = new Date(product.createdAt || product.updatedAt);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return productDate >= monthAgo;
    }).length;

    // Calcular porcentajes una sola vez
    const stockPercentage = totalProducts
      ? Math.round((inStockCount / totalProducts) * 100)
      : 0;
    const imagesPercentage = totalProducts
      ? Math.round((productsWithImages / totalProducts) * 100)
      : 0;
    const outOfStockPercentage = totalProducts
      ? Math.round((outOfStockCount / totalProducts) * 100)
      : 0;
    const featuredPercentage = totalProducts
      ? Math.round((featuredProductsCount / totalProducts) * 100)
      : 0;

    return {
      totalProducts,
      outOfStockCount,
      inStockCount,
      featuredProductsCount,
      offerProductsCount,
      topCategory,
      totalCategories,
      totalInventoryValue,
      productsWithImages,
      productsWithoutImages,
      recentProducts,
      stockPercentage,
      imagesPercentage,
      outOfStockPercentage,
      featuredPercentage,
      hasMarketing: featuredProductsCount > 0 || offerProductsCount > 0,
    };
  }, [products, featuredProducts]);

  // Componente de tarjeta reutilizable con soporte móvil
  const StatCard = ({
    id,
    type,
    icon: IconComponent,
    label,
    value,
    percentage,
    breakdown,
    trend,
    alert,
    tip,
  }) => {
    const isExpanded = expandedCards[id];
    const hasExpandableContent =
      breakdown || percentage !== undefined || trend || alert || tip;

    return (
      <div className={`dashboard-stat dashboard-stat--${type}`}>
        <div className="stat-content">
          <div className="stat-header">
            <div className="stat-header-main">
              <div className="stat-icon">
                <IconComponent size={20} />
              </div>
              <div className="stat-label">{label}</div>
            </div>
            {hasExpandableContent && (
              <button
                className="stat-expand-btn"
                onClick={() => toggleExpand(id)}
                aria-label={isExpanded ? "Ver menos" : "Ver más"}
              >
                <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>
                  ▼
                </span>
              </button>
            )}
          </div>

          <div className={`stat-value stat-value--${type}`}>{value}</div>

          {/* Contenido expandible para móvil */}
          <div
            className={`stat-expandable-content ${isExpanded ? "expanded" : ""}`}
          >
            {percentage !== undefined && (
              <div className="stat-progress">
                <div className="progress-bar">
                  <div
                    className={`progress-fill progress-fill--${type}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="progress-label">
                  {percentage}% del inventario
                </div>
              </div>
            )}

            {breakdown && (
              <div className="stat-breakdown">
                {breakdown.map((item, index) => (
                  <div key={index} className="breakdown-item">
                    <div className="breakdown-info">
                      <span
                        className={`breakdown-dot breakdown-dot--${item.type}`}
                      />
                      <span className="breakdown-text">{item.text}</span>
                    </div>
                    {item.value !== null && (
                      <span className="breakdown-value">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {trend && (
              <div className={`stat-trend stat-trend--${trend.type}`}>
                <span className="trend-icon">{trend.icon}</span>
                <span className="trend-text">{trend.text}</span>
              </div>
            )}

            {alert && <div className="stat-alert">{alert}</div>}
            {tip && <div className="stat-tip">{tip}</div>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-stats">
      <StatCard
        id="inventory"
        type="primary"
        icon={HiOutlineChartBar}
        label="Inventario Total"
        value={metrics.totalProducts}
        breakdown={[
          {
            type: "success",
            text: `${metrics.inStockCount} disponibles`,
            value: metrics.inStockCount,
          },
          {
            type: "warning",
            text: `${metrics.outOfStockCount} agotados`,
            value: metrics.outOfStockCount,
          },
        ]}
        trend={
          metrics.recentProducts > 0
            ? {
                type: "positive",
                icon: "📈",
                text: `${metrics.recentProducts} nuevos este mes`,
              }
            : null
        }
      />

      <StatCard
        id="stock"
        type="success"
        icon={HiOutlineCube}
        label="Stock Disponible"
        value={metrics.inStockCount}
        percentage={metrics.stockPercentage}
      />

      <StatCard
        id="attention"
        type="warning"
        icon={HiOutlineExclamationCircle}
        label="Requiere Atención"
        value={metrics.outOfStockCount}
        percentage={metrics.outOfStockPercentage}
        alert={
          metrics.outOfStockCount > 0 ? "Necesitan reposición inmediata" : null
        }
      />

      <StatCard
        id="featured"
        type="featured"
        icon={HiOutlineStar}
        label="Destacados"
        value={metrics.featuredProductsCount}
        percentage={metrics.featuredPercentage}
        trend={
          metrics.featuredProductsCount === 0
            ? null
            : {
                type: "positive",
                icon: "⭐",
                text: "Productos populares",
              }
        }
        tip={
          metrics.featuredProductsCount === 0
            ? "Agrega productos destacados"
            : null
        }
      />

      <StatCard
        id="offers"
        type="danger"
        icon={HiOutlineTag}
        label="Ofertas Activas"
        value={metrics.offerProductsCount}
        trend={
          metrics.offerProductsCount > 0
            ? {
                type: "positive",
                icon: "🔥",
                text: "Atrayendo clientes",
              }
            : null
        }
        tip={
          metrics.offerProductsCount === 0
            ? "Crea ofertas para aumentar ventas"
            : null
        }
      />

      <StatCard
        id="categories"
        type="info"
        icon={HiOutlineCollection}
        label="Categorías"
        value={metrics.totalCategories}
        breakdown={[
          {
            type: "info",
            text: `Principal: ${metrics.topCategory[0]} (${metrics.topCategory[1]} prod.)`,
            value: null,
          },
        ]}
      />

      {metrics.totalInventoryValue > 0 && (
        <StatCard
          id="inventoryValue"
          type="inventory"
          icon={HiOutlineCurrencyDollar}
          label="Valor Inventario"
          value={`$${metrics.totalInventoryValue.toLocaleString()}`}
          breakdown={[
            { text: "Basado en precios actuales", value: null, type: "info" },
          ]}
        />
      )}

      <StatCard
        id="images"
        type="media"
        icon={HiOutlinePhotograph}
        label="Imágenes"
        value={metrics.productsWithImages}
        percentage={metrics.imagesPercentage}
        tip={
          metrics.productsWithoutImages > 0
            ? `${metrics.productsWithoutImages} productos sin imágenes`
            : null
        }
      />

      {metrics.hasMarketing && (
        <StatCard
          id="marketing"
          type="summary"
          icon={HiOutlineTrendingUp}
          label="Marketing Activo"
          value="✓"
          breakdown={[
            {
              type: "featured",
              text: "Productos destacados",
              value: metrics.featuredProductsCount,
            },
            {
              type: "danger",
              text: "Ofertas activas",
              value: metrics.offerProductsCount,
            },
          ]}
          trend={{
            type: "positive",
            icon: "📈",
            text: "Estrategia de marketing activa",
          }}
        />
      )}
    </div>
  );
};

export default DashboardStats;
