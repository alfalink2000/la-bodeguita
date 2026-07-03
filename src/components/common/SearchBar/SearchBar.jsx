import { useEffect, useRef, useState } from "react";
import "./SearchBar.css";

const SearchBar = ({
  searchTerm,
  onSearchChange,
  isDesktop = false,
  appConfig,
}) => {
  const [marqueeSpeed, setMarqueeSpeed] = useState(12);
  const textRef = useRef(null);
  const wrapperRef = useRef(null);

  const marqueeText =
    appConfig?.marquee_text ||
    "Envíos a domicilio — Calculamos el costo según tu ubicación — ¡Recibe tus productos sin salir de casa!";

  useEffect(() => {
    const calculateSpeed = () => {
      if (textRef.current && wrapperRef.current) {
        const textWidth = textRef.current.scrollWidth / 2;
        const speed = Math.max(8, Math.min(20, textWidth / 50));
        setMarqueeSpeed(speed);
      }
    };

    calculateSpeed();
    window.addEventListener("resize", calculateSpeed);
    return () => window.removeEventListener("resize", calculateSpeed);
  }, [marqueeText]);

  const MarqueeContent = () => (
    <div className="search-bar__marquee">
      <span className="search-bar__marquee-icon material-symbols-outlined">
        location_on
      </span>
      <div className="search-bar__marquee-wrapper" ref={wrapperRef}>
        <div
          className="search-bar__marquee-scroll"
          style={{ animationDuration: `${marqueeSpeed}s` }}
        >
          <span ref={textRef} className="search-bar__marquee-text">
            {marqueeText}
            <span className="search-bar__marquee-separator">•</span>
            {marqueeText}
            <span className="search-bar__marquee-separator">•</span>
            {marqueeText}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`search-bar ${isDesktop ? "search-bar--desktop" : ""}`}>
      {/* Marquee en móvil (arriba del input) */}
      {!isDesktop && <MarqueeContent />}

      {/* Input de búsqueda + Marquee en desktop (al lado) */}
      <div className="search-bar__input-row">
        <div className="search-bar__input-wrapper">
          <span className="search-bar__input-icon material-symbols-outlined">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar productos..."
            className="search-bar__input"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Marquee en desktop (al lado del input) */}
        {isDesktop && (
          <div className="search-bar__marquee-desktop">
            <MarqueeContent />
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
