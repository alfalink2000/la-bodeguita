import { useRef, useEffect, useState } from "react";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineSparkles,
} from "react-icons/hi";
import "./CategoryFilter.css";

const CategoryFilter = ({
  categories,
  selectedCategory,
  onCategoryChange,
  productsCount,
  title = "Categorías", // Título personalizable
  icon = "📂", // Icono personalizable
}) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Verificar si hay overflow y mostrar flechas
  const checkOverflow = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const hasOverflow = container.scrollWidth > container.clientWidth;
      setIsOverflowing(hasOverflow);
      updateArrowsVisibility();
    }
  };

  const updateArrowsVisibility = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 0);
      setShowRightArrow(
        container.scrollLeft + container.clientWidth <
          container.scrollWidth - 5,
      );
    }
  };

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkOverflow();
      updateArrowsVisibility();
      container.addEventListener("scroll", updateArrowsVisibility);
      window.addEventListener("resize", checkOverflow);
      return () => {
        container.removeEventListener("scroll", updateArrowsVisibility);
        window.removeEventListener("resize", checkOverflow);
      };
    }
  }, [categories]);

  useEffect(() => {
    checkOverflow();
    updateArrowsVisibility();
  }, [categories]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && selectedCategory) {
      const selectedButton = container.querySelector(
        `.category-filter__button[data-category="${selectedCategory}"]`,
      );
      if (selectedButton) {
        const buttonRect = selectedButton.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        if (
          buttonRect.left < containerRect.left ||
          buttonRect.right > containerRect.right
        ) {
          selectedButton.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }
  }, [selectedCategory]);

  // Determinar si hay pocas categorías (menos de 4 visibles)
  const hasFewCategories = categories.length <= 3;

  return (
    <div className="category-filter-wrapper">
      {/* Header con título y contador */}
      <div className="category-filter-header">
        <div className="category-filter-header__title">
          <span className="category-filter-header__icon">{icon}</span>
          <h3>{title}</h3>
        </div>
        {productsCount !== undefined && (
          <div className="category-filter-header__count">
            <span className="count-number">{productsCount}</span>
            <span className="count-label">productos</span>
          </div>
        )}
      </div>

      {/* Contenedor de filtros con decoración cuando hay pocas categorías */}
      <div
        className={`category-filter-container ${hasFewCategories ? "category-filter-container--few-items" : ""}`}
      >
        {isOverflowing && showLeftArrow && (
          <button
            className="category-filter__arrow category-filter__arrow--left"
            onClick={scrollLeft}
            aria-label="Desplazar izquierda"
          >
            <HiOutlineChevronLeft />
          </button>
        )}

        <div className="category-filter" ref={scrollContainerRef}>
          <div className="category-filter__container">
            {categories.map((category, index) => (
              <button
                key={category}
                data-category={category}
                onClick={() => onCategoryChange(category)}
                className={`category-filter__button ${
                  selectedCategory === category
                    ? "category-filter__button--active"
                    : ""
                }`}
                aria-pressed={selectedCategory === category}
                style={{
                  animationDelay: `${index * 0.03}s`,
                }}
              >
                <span className="category-filter__button-text">{category}</span>
                {selectedCategory === category && (
                  <span className="category-filter__button-indicator"></span>
                )}
              </button>
            ))}

            {/* ✅ Elementos decorativos cuando hay pocas categorías */}
            {hasFewCategories && (
              <div className="category-filter__decorations">
                <div className="decoration-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <div className="decoration-sparkle">
                  <HiOutlineSparkles />
                </div>
                <div className="decoration-line"></div>
              </div>
            )}
          </div>
        </div>

        {isOverflowing && showRightArrow && (
          <button
            className="category-filter__arrow category-filter__arrow--right"
            onClick={scrollRight}
            aria-label="Desplazar derecha"
          >
            <HiOutlineChevronRight />
          </button>
        )}
      </div>

      {/* Indicador de scroll */}
      {isOverflowing && (
        <div className="category-filter-scroll-hint">
          <span>← Desliza para ver más →</span>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
