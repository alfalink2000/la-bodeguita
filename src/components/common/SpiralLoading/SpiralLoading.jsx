// components/common/SpiralLoading/SpiralLoading.jsx - VERSIÓN OPTIMIZADA
import { useSelector } from "react-redux";
import "./SpiralLoading.css";

const SpiralLoading = ({ fadeOut = false }) => {
  const appConfig = useSelector((state) => state.appConfig.config);
  const appName = appConfig?.app_name || "Cruz Market";
  const appDescription =
    appConfig?.app_description || "🛒 Tu tienda de confianza";

  return (
    <div className={`spiral-loading ${fadeOut ? "fade-out" : ""}`}>
      <div className="spiral-container">
        <div className="spiral">
          <div className="spiral-ring ring-1"></div>
          <div className="spiral-ring ring-2"></div>
          <div className="spiral-ring ring-3"></div>
          <div className="spiral-ring ring-4"></div>
          <div className="spiral-core"></div>
        </div>

        <div className="floating-particles">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
        </div>
      </div>

      <div className="welcome-message">
        <h2>{appName}</h2>
        <p>{appDescription}</p>
      </div>
    </div>
  );
};

export default SpiralLoading;
