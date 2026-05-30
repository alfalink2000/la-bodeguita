// components/common/SearchBar/SearchBar.jsx - VERSIÓN OPTIMIZADA
import { Search } from "lucide-react";
import { HiOutlineLocationMarker } from "react-icons/hi";
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
    "🚚 Envíos a domicilio — Calculamos el costo según tu ubicación — ¡Recibe tus productos sin salir de casa! 🚚";

  useEffect(() => {
    const calculateSpeed = () => {
      if (textRef.current && wrapperRef.current) {
        const textWidth = textRef.current.scrollWidth / 2;
        const distance = textWidth;
        const speed = Math.max(8, Math.min(20, distance / 50));
        setMarqueeSpeed(speed);
      }
    };

    calculateSpeed();
    window.addEventListener("resize", calculateSpeed);
    return () => window.removeEventListener("resize", calculateSpeed);
  }, [marqueeText]);

  return (
    <div className={`search-bar ${isDesktop ? "search-bar--desktop" : ""}`}>
      {!isDesktop && (
        <div className="search-bar__location-info search-bar__location-info--mobile">
          <HiOutlineLocationMarker className="location-info__icon" />
          <div className="location-info__text-wrapper" ref={wrapperRef}>
            <div
              className="location-info__container animate"
              style={{ animationDuration: `${marqueeSpeed}s` }}
            >
              <span ref={textRef} className="location-info__text">
                {marqueeText}
                <span className="marquee-spacer"></span>
                {marqueeText}
                <span className="marquee-spacer"></span>
                {marqueeText}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="search-bar__content">
        <div className="search-bar__input-container">
          <Search className="search-bar__icon" />
          <input
            type="text"
            placeholder="Buscar productos..."
            className="search-bar__input"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {isDesktop && (
          <div className="search-bar__location-info search-bar__location-info--desktop">
            <HiOutlineLocationMarker className="location-info__icon" />
            <div className="location-info__text-wrapper" ref={wrapperRef}>
              <div
                className="location-info__container animate"
                style={{ animationDuration: `${marqueeSpeed}s` }}
              >
                <span ref={textRef} className="location-info__text">
                  {marqueeText}
                  <span className="marquee-spacer"></span>
                  {marqueeText}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
