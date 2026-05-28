// components/admin/AppConfigManager/AppConfigManager.jsx
import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  HiOutlineCog,
  HiOutlineInformationCircle,
  HiCheck,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCurrencyDollar,
  HiOutlineCurrencyEuro,
  HiOutlineCash,
  HiOutlineTruck,
  HiOutlineLocationMarker,
  HiOutlineX,
} from "react-icons/hi";
import {
  updateAppConfig,
  loadAppConfig,
} from "../../../actions/appConfigActions";
import Swal from "sweetalert2";
import "./AppConfigManager.css";

const API_URL = import.meta.env.VITE_API_URL;

const AppConfigManager = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.appConfig.config);

  const [formData, setFormData] = useState({
    app_name: "",
    app_description: "",
    theme: "blue",
    whatsapp_number: "",
    business_hours: "",
    business_address: "",
    logo_url: "",
    initialinfo: "",
    show_initialinfo: true,
    currency: "CUP",
    marquee_text: "",
    delivery_origin_name: "",
    delivery_origin_address: "",
    delivery_origin_lat: "",
    delivery_origin_lng: "",
    delivery_price_per_km: "",
    delivery_minimum_price: "",
  });

  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [gpsLoadingDelivery, setGpsLoadingDelivery] = useState(false);

  // Cargar configuración de delivery
  const loadDeliveryConfig = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/delivery/config`, {
        headers: { "x-token": token },
      });
      const data = await res.json();

      if (data.ok && data.config) {
        setFormData((prev) => ({
          ...prev,
          delivery_origin_name: data.config.origin_name || "",
          delivery_origin_address: data.config.origin_address || "",
          delivery_origin_lat: data.config.origin_lat
            ? data.config.origin_lat.toString()
            : "",
          delivery_origin_lng: data.config.origin_lng
            ? data.config.origin_lng.toString()
            : "",
          delivery_price_per_km: data.config.price_per_km
            ? data.config.price_per_km.toString()
            : "",
          delivery_minimum_price: data.config.minimum_price
            ? data.config.minimum_price.toString()
            : "",
        }));
      }
    } catch (err) {
      console.error("Error cargando delivery config:", err);
    }
  }, []);

  useEffect(() => {
    // Cargar configuración de la app
    dispatch(loadAppConfig());
    loadDeliveryConfig();
  }, [dispatch, loadDeliveryConfig]);

  useEffect(() => {
    if (config) {
      setFormData((prev) => ({
        ...prev,
        app_name: config.app_name || "",
        app_description: config.app_description || "",
        theme: config.theme || "blue",
        whatsapp_number: config.whatsapp_number || "",
        business_hours: config.business_hours || "",
        business_address: config.business_address || "",
        logo_url: config.logo_url || "",
        initialinfo: config.initialinfo || "",
        show_initialinfo: config.show_initialinfo !== false,
        currency: config.currency || "CUP",
        marquee_text: config.marquee_text || "",
      }));
    }
  }, [config]);

  const getGPSLocationForDelivery = () => {
    setGpsLoadingDelivery(true);
    if (!navigator.geolocation) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Tu navegador no soporta geolocalización",
      });
      setGpsLoadingDelivery(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`${API_URL}/api/geocoding/reverse`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            delivery_origin_lat: latitude.toString(),
            delivery_origin_lng: longitude.toString(),
            delivery_origin_address:
              data.display_name || `${latitude}, ${longitude}`,
          }));
        } catch (err) {
          setFormData((prev) => ({
            ...prev,
            delivery_origin_lat: latitude.toString(),
            delivery_origin_lng: longitude.toString(),
          }));
        }
        setGpsLoadingDelivery(false);
        Swal.fire({
          icon: "success",
          title: "¡Ubicación obtenida!",
          showConfirmButton: false,
          timer: 1500,
        });
      },
      (err) => {
        setGpsLoadingDelivery(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error obteniendo ubicación: " + err.message,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSaveManualLocation = async () => {
    const lat = parseFloat(formData.delivery_origin_lat);
    const lng = parseFloat(formData.delivery_origin_lng);
    if (isNaN(lat) || isNaN(lng)) {
      Swal.fire({
        icon: "warning",
        title: "Coordenadas incompletas",
        text: "Ingresa latitud y longitud válidas",
      });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/geocoding/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();
      if (data.ok && data.display_name) {
        setFormData((prev) => ({
          ...prev,
          delivery_origin_address: data.display_name,
        }));
      }
    } catch (err) {
      console.error("Error obteniendo dirección:", err);
    }
    Swal.fire({
      icon: "success",
      title: "¡Ubicación guardada!",
      text: `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const handleClearLocation = () => {
    Swal.fire({
      title: "¿Quitar ubicación?",
      text: "Se borrarán las coordenadas y dirección del punto de partida",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        setFormData((prev) => ({
          ...prev,
          delivery_origin_lat: "",
          delivery_origin_lng: "",
          delivery_origin_address: "",
          delivery_origin_name: "",
        }));
        Swal.fire({
          icon: "info",
          title: "Ubicación eliminada",
          text: "El punto de partida ha sido desconfigurado",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  };

  const handleSaveDelivery = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      setSaving(true);

      const payload = {
        origin_name: formData.delivery_origin_name || "Punto de partida",
        origin_address: formData.delivery_origin_address || "",
        origin_lat: parseFloat(formData.delivery_origin_lat) || 23.113592,
        origin_lng: parseFloat(formData.delivery_origin_lng) || -82.366592,
        price_per_km: parseFloat(formData.delivery_price_per_km) || 50,
        minimum_price: parseFloat(formData.delivery_minimum_price) || 100,
      };

      const res = await fetch(`${API_URL}/api/delivery/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-token": token },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        Swal.fire({
          icon: "success",
          title: "¡Configuración de delivery guardada!",
          text: "El envío se calculará por distancia sin límite máximo",
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.msg || "No se pudo guardar la configuración",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCurrencySelect = (currencyCode) => {
    setFormData((prev) => ({ ...prev, currency: currencyCode }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: "¿Guardar cambios?",
      text: "Se aplicarán los cambios a toda la aplicación",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    setSaving(true);
    try {
      await dispatch(updateAppConfig(formData));
    } catch (error) {
      console.error("Error guardando configuración:", error);
    } finally {
      setSaving(false);
    }
  };

  const currencyOptions = [
    {
      code: "CUP",
      name: "Moneda Nacional",
      symbol: "$",
      description: "Peso local (CUP)",
      icon: HiOutlineCash,
    },
    {
      code: "USD",
      name: "Dólares Americanos",
      symbol: "US$",
      description: "Dólares (USD)",
      icon: HiOutlineCurrencyDollar,
    },
    {
      code: "EUR",
      name: "Euros",
      symbol: "€",
      description: "Euros (EUR)",
      icon: HiOutlineCurrencyEuro,
    },
  ];

  return (
    <div className="app-config-manager">
      <div className="config-header">
        <HiOutlineCog className="config-icon" />
        <h2>Configuración de la App</h2>
      </div>

      <div className="config-tabs">
        <button
          className={`tab ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          <HiOutlineInformationCircle /> General
        </button>

        <button
          className={`tab ${activeTab === "currency" ? "active" : ""}`}
          onClick={() => setActiveTab("currency")}
        >
          <HiOutlineCurrencyDollar /> Moneda
        </button>

        <button
          className={`tab ${activeTab === "welcome" ? "active" : ""}`}
          onClick={() => setActiveTab("welcome")}
        >
          <HiOutlineInformationCircle /> Mensaje Bienvenida
        </button>

        <button
          className={`tab ${activeTab === "delivery" ? "active" : ""}`}
          onClick={() => setActiveTab("delivery")}
        >
          <HiOutlineTruck /> Delivery
        </button>
      </div>

      <form onSubmit={handleSubmit} className="config-form">
        {/* ===== GENERAL ===== */}
        {activeTab === "general" && (
          <div className="tab-content">
            <div className="form-group">
              <label>Nombre de la App</label>
              <input
                type="text"
                name="app_name"
                value={formData.app_name}
                onChange={handleInputChange}
                placeholder="Ej: Minimarket Digital"
                required
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                name="app_description"
                value={formData.app_description}
                onChange={handleInputChange}
                placeholder="Ej: Tu tienda de confianza"
                rows="3"
                required
              />
            </div>
            <div className="form-group">
              <label>URL del Logo</label>
              <input
                type="url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com/logo.png"
              />
              <small className="help-text">
                Opcional. Deja vacío para usar el logo por defecto.
              </small>
            </div>

            {/* Campo para el texto del marquee */}
            <div className="form-group">
              <label>📢 Texto del Cartel Informativo (Marquee)</label>
              <textarea
                name="marquee_text"
                value={formData.marquee_text}
                onChange={handleInputChange}
                placeholder="Ej: 🚚 Envíos a domicilio — Calculamos el costo según tu ubicación — ¡Recibe tus productos sin salir de casa! 🚚"
                rows="3"
                className="marquee-textarea"
              />
              <small className="help-text">
                Este texto aparecerá en el cartel que se desplaza
                horizontalmente en la parte superior de la aplicación. Puedes
                usar emojis y texto informativo sobre promociones, envíos, etc.
              </small>
            </div>

            {/* Vista previa del marquee */}
            <div className="marquee-preview">
              <h4>Vista Previa del Cartel</h4>
              <div className="marquee-preview-container">
                <div className="marquee-preview-content">
                  <span>
                    {formData.marquee_text ||
                      "El texto del cartel aparecerá aquí..."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MONEDA ===== */}
        {activeTab === "currency" && (
          <div className="tab-content">
            <div className="currency-selection">
              <h3 className="currency-title">Selecciona la Moneda</h3>
              <p className="currency-subtitle">
                Esta moneda se mostrará en todos los precios de la aplicación
              </p>
              <div className="currency-grid">
                {currencyOptions.map((currency) => {
                  const IconComponent = currency.icon;
                  return (
                    <div
                      key={currency.code}
                      className={`currency-card ${
                        formData.currency === currency.code ? "selected" : ""
                      }`}
                      onClick={() => handleCurrencySelect(currency.code)}
                    >
                      <div className="currency-icon">
                        <IconComponent className="currency-symbol" />
                      </div>
                      <div className="currency-info">
                        <h4 className="currency-name">{currency.name}</h4>
                        <p className="currency-description">
                          {currency.description}
                        </p>
                        <div className="currency-preview">
                          <span className="currency-example">
                            {currency.symbol} 99.99
                          </span>
                        </div>
                      </div>
                      {formData.currency === currency.code && (
                        <div className="currency-selected-indicator">
                          <HiCheck className="check-icon" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="currency-preview-section">
                <h4 className="preview-title">Vista Previa</h4>
                <div className="preview-content">
                  <div className="price-preview">
                    <p>
                      <strong>Producto de ejemplo:</strong> Camiseta Básica
                    </p>
                    <p className="preview-price">
                      Precio:{" "}
                      {currencyOptions.find((c) => c.code === formData.currency)
                        ?.symbol || "$"}{" "}
                      29.99
                    </p>
                    <small className="help-text">
                      Los precios se mostrarán con este formato en toda la app
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== DELIVERY ===== */}
        {activeTab === "delivery" && (
          <div className="tab-content">
            <div className="delivery-config">
              <h3 className="delivery-title">
                <HiOutlineTruck className="delivery-title-icon" /> Configuración
                de Delivery
              </h3>
              <p className="delivery-subtitle">
                Configura el punto de partida y las tarifas de envío a domicilio
              </p>

              <div
                className={`delivery-status ${
                  formData.delivery_origin_lat && formData.delivery_origin_lng
                    ? "delivery-status--active"
                    : "delivery-status--inactive"
                }`}
              >
                <div className="delivery-status__indicator">
                  <div
                    className={`delivery-status__dot ${
                      formData.delivery_origin_lat &&
                      formData.delivery_origin_lng
                        ? "delivery-status__dot--green"
                        : "delivery-status__dot--red"
                    }`}
                  ></div>
                </div>
                <div className="delivery-status__info">
                  <span className="delivery-status__label">
                    {formData.delivery_origin_lat &&
                    formData.delivery_origin_lng
                      ? "✅ Punto de partida configurado"
                      : "❌ Punto de partida no configurado"}
                  </span>
                  {formData.delivery_origin_address && (
                    <span className="delivery-status__address">
                      📍 {formData.delivery_origin_address}
                    </span>
                  )}
                  {formData.delivery_origin_lat &&
                    formData.delivery_origin_lng && (
                      <span className="delivery-status__coords">
                        🗺️ {parseFloat(formData.delivery_origin_lat).toFixed(6)}
                        , {parseFloat(formData.delivery_origin_lng).toFixed(6)}
                      </span>
                    )}
                </div>
                <div className="delivery-status__actions">
                  {formData.delivery_origin_lat &&
                  formData.delivery_origin_lng ? (
                    <span className="delivery-status__badge delivery-status__badge--active">
                      ACTIVO
                    </span>
                  ) : (
                    <span className="delivery-status__badge delivery-status__badge--inactive">
                      PENDIENTE
                    </span>
                  )}
                </div>
              </div>

              <div className="delivery-section">
                <h4 className="delivery-section-title">
                  <HiOutlineLocationMarker /> Punto de Partida
                </h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.delivery_origin_lat}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          delivery_origin_lat: e.target.value,
                        }))
                      }
                      placeholder="23.113592"
                    />
                  </div>
                  <div className="form-group">
                    <label>Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.delivery_origin_lng}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          delivery_origin_lng: e.target.value,
                        }))
                      }
                      placeholder="-82.366592"
                    />
                  </div>
                </div>
                <div className="delivery-location-actions">
                  <button
                    type="button"
                    className="location-btn location-btn--save"
                    onClick={handleSaveManualLocation}
                    disabled={
                      !formData.delivery_origin_lat ||
                      !formData.delivery_origin_lng
                    }
                  >
                    <HiOutlineLocationMarker /> Guardar ubicación manual
                  </button>
                  <button
                    type="button"
                    className="location-btn location-btn--clear"
                    onClick={handleClearLocation}
                    disabled={
                      !formData.delivery_origin_lat &&
                      !formData.delivery_origin_lng &&
                      !formData.delivery_origin_address
                    }
                  >
                    <HiOutlineX /> Quitar ubicación
                  </button>
                </div>
                <button
                  type="button"
                  className="gps-button-delivery"
                  onClick={getGPSLocationForDelivery}
                  disabled={gpsLoadingDelivery}
                  style={{ width: "100%", marginTop: "0.5rem" }}
                >
                  {gpsLoadingDelivery ? (
                    <>⏳ Obteniendo ubicación...</>
                  ) : (
                    <>📍 Usar mi ubicación actual como punto de partida</>
                  )}
                </button>
                <small className="help-text" style={{ marginTop: "0.5rem" }}>
                  Puedes obtener las coordenadas exactas desde Google Maps,
                  OpenStreetMap o usar el botón GPS
                </small>
              </div>

              <div className="delivery-section">
                <h4 className="delivery-section-title">
                  <HiOutlineCurrencyDollar /> Tarifas de Envío
                </h4>
                <div className="form-group">
                  <label>Precio por kilómetro (CUP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.delivery_price_per_km}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        delivery_price_per_km: e.target.value,
                      }))
                    }
                    placeholder="50.00"
                  />
                  <small className="help-text">
                    Costo en CUP por cada kilómetro recorrido
                  </small>
                </div>
                <div className="form-group">
                  <label>Precio mínimo de delivery (CUP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.delivery_minimum_price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        delivery_minimum_price: e.target.value,
                      }))
                    }
                    placeholder="100.00"
                  />
                  <small className="help-text">
                    Cobro mínimo aunque la distancia sea corta
                  </small>
                </div>

                <div className="info-note">
                  <HiOutlineInformationCircle />
                  <span>
                    ✅ El envío se calcula SOLO por distancia (precio/km)
                    <br />
                    ✅ No hay límite máximo de distancia - se calcula cualquier
                    distancia
                    <br />✅ No existe envío gratis por monto de pedido
                  </span>
                </div>
              </div>

              <div className="delivery-preview">
                <h4>📊 Ejemplo de Cálculo</h4>
                <div className="preview-examples">
                  <div className="example-item">
                    <span>Cliente a 2 km:</span>
                    <strong>
                      {formData.delivery_price_per_km &&
                      formData.delivery_minimum_price
                        ? `${Math.max(
                            parseFloat(formData.delivery_minimum_price) || 100,
                            (parseFloat(formData.delivery_price_per_km) || 50) *
                              2,
                          ).toFixed(2)} CUP`
                        : "Configura las tarifas"}
                    </strong>
                  </div>
                  <div className="example-item">
                    <span>Cliente a 5 km:</span>
                    <strong>
                      {formData.delivery_price_per_km
                        ? `${Math.max(
                            parseFloat(formData.delivery_minimum_price) || 100,
                            (parseFloat(formData.delivery_price_per_km) || 50) *
                              5,
                          ).toFixed(2)} CUP`
                        : "—"}
                    </strong>
                  </div>
                  <div className="example-item">
                    <span>Cliente a 10 km:</span>
                    <strong>
                      {formData.delivery_price_per_km
                        ? `${Math.max(
                            parseFloat(formData.delivery_minimum_price) || 100,
                            (parseFloat(formData.delivery_price_per_km) || 50) *
                              10,
                          ).toFixed(2)} CUP`
                        : "—"}
                    </strong>
                  </div>
                  <div className="example-item example-item-info">
                    <span>ℹ️ Nota:</span>
                    <small>
                      El envío se calcula como: MAX(precio mínimo, distancia ×
                      precio/km)
                      <br />✓ No hay límite de distancia
                    </small>
                  </div>
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="save-btn"
                  onClick={handleSaveDelivery}
                  disabled={saving}
                >
                  <HiOutlineTruck style={{ marginRight: "0.5rem" }} /> Guardar
                  Configuración de Delivery
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== MENSAJE BIENVENIDA ===== */}
        {activeTab === "welcome" && (
          <div className="tab-content">
            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  name="show_initialinfo"
                  checked={formData.show_initialinfo}
                  onChange={handleInputChange}
                  className="toggle-input"
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {formData.show_initialinfo ? (
                    <>
                      <HiOutlineEye className="toggle-icon" /> Mostrar mensaje
                      al iniciar la app
                    </>
                  ) : (
                    <>
                      <HiOutlineEyeOff className="toggle-icon" /> Ocultar
                      mensaje al iniciar la app
                    </>
                  )}
                </span>
              </label>
              <small className="help-text">
                Cuando está activado, los usuarios verán este mensaje la primera
                vez que abran la aplicación
              </small>
            </div>
            <div className="form-group">
              <label>Mensaje de Bienvenida</label>
              <textarea
                name="initialinfo"
                value={formData.initialinfo}
                onChange={handleInputChange}
                placeholder="Escribe aquí tu mensaje de bienvenida personalizado..."
                rows="8"
                className="welcome-textarea"
              />
              <small className="help-text">
                Puedes usar formato Markdown básico: **negrita**, *cursiva*,
                saltos de línea
              </small>
            </div>
            <div className="preview-section">
              <h4 className="preview-title">Vista Previa del Mensaje</h4>
              <div className="preview-content">
                {formData.initialinfo ? (
                  <div className="preview-message">
                    {formData.initialinfo.split("\n").map((line, index) => (
                      <p key={index} className="preview-line">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="preview-placeholder">
                    El mensaje de bienvenida aparecerá aquí...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? "Guardando..." : "Guardar Configuración"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppConfigManager;
