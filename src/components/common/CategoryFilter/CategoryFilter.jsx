import { useRef, useEffect, useState } from "react";
import "./CategoryFilter.css";

const CategoryFilter = ({
  categories,
  selectedCategory,
  onCategoryChange,
  productsCount,
  title = "Categorías",
  icon = "folder",
}) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

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

  const checkOverflow = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setIsOverflowing(container.scrollWidth > container.clientWidth);
      updateArrowsVisibility();
    }
  };

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: "smooth" });
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
  }, [categories]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && selectedCategory) {
      const selectedButton = container.querySelector(
        `[data-category="${selectedCategory}"]`,
      );
      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedCategory]);

  const hasFewCategories = categories.length <= 3;

  return (
    <div className="category-filter">
      <div className="category-filter__header">
        <div className="category-filter__title">
          <span className="category-filter__title-icon">{icon}</span>
          <h3 className="category-filter__title-text">{title}</h3>
        </div>
        {productsCount !== undefined && (
          <div className="category-filter__count">
            <span className="category-filter__count-number">
              {productsCount}
            </span>
            <span className="category-filter__count-label">productos</span>
          </div>
        )}
      </div>

      <div className="category-filter__scroll-wrapper">
        {isOverflowing && showLeftArrow && (
          <button
            className="category-filter__arrow category-filter__arrow--left"
            onClick={scrollLeft}
            aria-label="Desplazar izquierda"
          >
            <span className="category-filter__arrow-icon material-symbols-outlined">
              chevron_left
            </span>
          </button>
        )}

        <div className="category-filter__scroll" ref={scrollContainerRef}>
          <div
            className={`category-filter__list ${hasFewCategories ? "category-filter__list--centered" : ""}`}
          >
            {categories.map((category) => (
              <button
                key={category}
                data-category={category}
                onClick={() => onCategoryChange(category)}
                className={`category-filter__chip ${selectedCategory === category ? "category-filter__chip--active" : ""}`}
                aria-pressed={selectedCategory === category}
              >
                {category}
              </button>
            ))}

            {hasFewCategories && (
              <div className="category-filter__decorations">
                <div className="category-filter__decoration-dots">
                  <span className="category-filter__decoration-dot" />
                  <span className="category-filter__decoration-dot" />
                  <span className="category-filter__decoration-dot" />
                </div>
                <span className="material-symbols-outlined">auto_awesome</span>
                <div className="category-filter__decoration-line" />
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
            <span className="category-filter__arrow-icon material-symbols-outlined">
              chevron_right
            </span>
          </button>
        )}
      </div>

      {isOverflowing && (
        <div className="category-filter__scroll-hint">
          <span>← Desliza para ver más →</span>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
