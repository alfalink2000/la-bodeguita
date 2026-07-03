import { useSelector } from "react-redux";
import "./SpiralLoading.css";

/**
 * SpiralLoading - Pantalla de carga principal
 *
 * Muestra un spinner animado con el nombre de la app
 * y skeleton loaders mientras se cargan los datos iniciales.
 *
 * @returns {JSX.Element} Componente de loading
 */
const SpiralLoading = () => {
  const appConfig = useSelector((state) => state.appConfig.config);
  const appName = appConfig?.app_name || "La Bodeguita";

  return (
    <div
      className="spiral-loading"
      role="status"
      aria-label={`Cargando ${appName}`}
      aria-live="polite"
    >
      {/* Spinner animado */}
      <div className="spiral-loading__spinner">
        {/* Anillo base decorativo */}
        <div className="spiral-loading__ring-base" aria-hidden="true" />

        {/* Anillo exterior - gira horario */}
        <div className="spiral-loading__ring-outer" aria-hidden="true" />

        {/* Anillo interior - gira antihorario */}
        <div className="spiral-loading__ring-inner" aria-hidden="true" />

        {/* Icono central */}
        <div className="spiral-loading__icon" aria-hidden="true">
          <span className="material-symbols-outlined">storefront</span>
        </div>
      </div>

      {/* Texto de carga */}
      <div className="spiral-loading__text">
        <h2 className="spiral-loading__title">{appName}</h2>

        {/* Puntos animados */}
        <div className="spiral-loading__dots" aria-hidden="true">
          <span className="spiral-loading__dot" />
          <span className="spiral-loading__dot" />
          <span className="spiral-loading__dot" />
        </div>
      </div>

      {/* Skeleton loader */}
      <div className="spiral-loading__skeleton" aria-hidden="true">
        <div className="spiral-loading__skeleton-line" />
        <div className="spiral-loading__skeleton-line spiral-loading__skeleton-line--short" />
        <div className="spiral-loading__skeleton-line spiral-loading__skeleton-line--shorter" />
      </div>

      {/* Texto oculto para screen readers */}
      <span className="sr-only">Cargando aplicación, por favor espera...</span>
    </div>
  );
};

export default SpiralLoading;
