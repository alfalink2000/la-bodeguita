import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  updateAppConfig,
  loadAppConfig,
} from "../../../actions/appConfigActions";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

const AppConfigManager = () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.appConfig.config);

  const [formData, setFormData] = useState({
    app_name: "",
    app_description: "",
    theme: "bodeguita",
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
          delivery_origin_lat: data.config.origin_lat ? data.config.origin_lat.toString() : "",
          delivery_origin_lng: data.config.origin_lng ? data.config.origin_lng.toString() : "",
          delivery_price_per_km: data.config.price_per_km ? data.config.price_per_km.toString() : "",
          delivery_minimum_price: data.config.minimum_price ? data.config.minimum_price.toString() : "",
        }));
      }
    } catch (err) {
      console.error("Error cargando delivery config:", err);
    }
  }, []);

  useEffect(() => {
    dispatch(loadAppConfig());
    loadDeliveryConfig();
  }, [dispatch, loadDeliveryConfig]);

  useEffect(() => {
    if (config) {
      setFormData((prev) => ({
        ...prev,
        app_name: config.app_name || "",
        app_description: config.app_description || "",
        theme: config.theme || "bodeguita",
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
      Swal.fire({ icon: "error", title: "Error", text: "Tu navegador no soporta geolocalización" });
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
            delivery_origin_address: data.display_name || `${latitude}, ${longitude}`,
          }));
        } catch (err) {
          setFormData((prev) => ({
            ...prev,
            delivery_origin_lat: latitude.toString(),
            delivery_origin_lng: longitude.toString(),
          }));
        }
        setGpsLoadingDelivery(false);
        Swal.fire({ icon: "success", title: "¡Ubicación obtenida!", showConfirmButton: false, timer: 1500 });
      },
      (err) => {
        setGpsLoadingDelivery(false);
        Swal.fire({ icon: "error", title: "Error", text: "Error obteniendo ubicación: " + err.message });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSaveManualLocation = async () => {
    const lat = parseFloat(formData.delivery_origin_lat);
    const lng = parseFloat(formData.delivery_origin_lng);
    if (isNaN(lat) || isNaN(lng)) {
      Swal.fire({ icon: "warning", title: "Coordenadas incompletas", text: "Ingresa latitud y longitud válidas" });
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
        setFormData((prev) => ({ ...prev, delivery_origin_address: data.display_name }));
      }
    } catch (err) {
      console.error("Error obteniendo dirección:", err);
    }
    Swal.fire({ icon: "success", title: "¡Ubicación guardada!", text: `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, showConfirmButton: false, timer: 1500 });
  };

  const handleClearLocation = () => {
    Swal.fire({
      title: "¿Quitar ubicación?",
      text: "Se borrarán las coordenadas y dirección del punto de partida",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--color-error)",
      cancelButtonColor: "var(--color-on-surface-variant)",
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
        Swal.fire({ icon: "info", title: "Ubicación eliminada", text: "El punto de partida ha sido desconfigurado", showConfirmButton: false, timer: 1500 });
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
        Swal.fire({ icon: "success", title: "¡Configuración de delivery guardada!", text: "El envío se calculará por distancia sin límite máximo", showConfirmButton: false, timer: 2000 });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: data.msg || "No se pudo guardar la configuración" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error de conexión", text: "No se pudo conectar con el servidor" });
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
      confirmButtonColor: "var(--color-primary)",
      cancelButtonColor: "var(--color-error)",
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
    { code: "CUP", name: "Moneda Nacional", symbol: "$", description: "Peso local (CUP)", icon: "payments" },
    { code: "USD", name: "Dólares Americanos", symbol: "US$", description: "Dólares (USD)", icon: "attach_money" },
    { code: "EUR", name: "Euros", symbol: "€", description: "Euros (EUR)", icon: "euro" },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <h2 className="admin-page-header__title">
          <span className="material-symbols-outlined">settings</span>
          Configuración de la App
        </h2>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {[
          { id: "general", label: "General", icon: "info" },
          { id: "currency", label: "Moneda", icon: "attach_money" },
          { id: "welcome", label: "Mensaje Bienvenida", icon: "info" },
          { id: "delivery", label: "Delivery", icon: "local_shipping" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? "admin-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="material-symbols-outlined admin-tab__icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* GENERAL */}
        {activeTab === "general" && (
          <div>
            <div className="admin-form-group">
              <label className="admin-form-group__label">Nombre de la App</label>
              <input
                type="text"
                name="app_name"
                value={formData.app_name}
                onChange={handleInputChange}
                placeholder="Ej: Minimarket Digital"
                className="admin-input"
                required
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-group__label">Descripción</label>
              <textarea
                name="app_description"
                value={formData.app_description}
                onChange={handleInputChange}
                placeholder="Ej: Tu tienda de confianza"
                rows="3"
                className="admin-textarea"
                required
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-group__label">URL del Logo</label>
              <input
                type="url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com/logo.png"
                className="admin-input"
              />
              <p className="admin-form-group__helper">Opcional. Deja vacío para usar el logo por defecto.</p>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-group__label">
                <span className="material-symbols-outlined">campaign</span>
                Texto del Cartel Informativo (Marquee)
              </label>
              <textarea
                name="marquee_text"
                value={formData.marquee_text}
                onChange={handleInputChange}
                placeholder="Ej: Envíos a domicilio — Calculamos el costo según tu ubicación — Recibe tus productos sin salir de casa"
                rows="3"
                className="admin-textarea"
              />
              <p className="admin-form-group__helper">Este texto aparecerá en el cartel que se desplaza horizontalmente.</p>
            </div>
            <div className="admin-preview">
              <h4 className="admin-preview__label">Vista Previa del Cartel</h4>
              <div className="admin-preview__content">
                <p>
                  {formData.marquee_text || "El texto del cartel aparecerá aquí..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CURRENCY */}
        {activeTab === "currency" && (
          <div>
            <div>
              <h3 className="admin-form-group__label">Selecciona la Moneda</h3>
              <p className="admin-form-group__helper">Esta moneda se mostrará en todos los precios de la aplicación</p>
            </div>
            <div className="admin-grid admin-grid--3">
              {currencyOptions.map((currency) => (
                <div
                  key={currency.code}
                  className={`admin-currency-card ${formData.currency === currency.code ? "admin-currency-card--selected" : ""}`}
                  onClick={() => handleCurrencySelect(currency.code)}
                >
                  <div className="admin-currency-card__inner">
                    <span className="material-symbols-outlined admin-currency-card__icon">{currency.icon}</span>
                    <div className="admin-currency-card__info">
                      <h4 className="admin-currency-card__name">{currency.name}</h4>
                      <p className="admin-currency-card__desc">{currency.description}</p>
                      <p className="admin-currency-card__example">{currency.symbol} 99.99</p>
                    </div>
                    {formData.currency === currency.code && (
                      <span className="material-symbols-outlined admin-currency-card__check">check_circle</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="admin-preview">
              <h4 className="admin-preview__label">Vista Previa</h4>
              <div className="admin-preview__content">
                <p className="admin-form-group__helper">Producto de ejemplo: Camiseta Básica</p>
                <p className="admin-currency-card__example">
                  Precio: {currencyOptions.find((c) => c.code === formData.currency)?.symbol || "$"} 29.99
                </p>
                <p className="admin-form-group__helper">Los precios se mostrarán con este formato en toda la app</p>
              </div>
            </div>
          </div>
        )}

        {/* DELIVERY */}
        {activeTab === "delivery" && (
          <div>
            <div>
              <h3 className="admin-form-group__label">
                <span className="material-symbols-outlined">local_shipping</span>
                Configuración de Delivery
              </h3>
              <p className="admin-form-group__helper">Configura el punto de partida y las tarifas de envío a domicilio</p>
            </div>

            {/* Status indicator */}
            <div className={`admin-delivery-status ${formData.delivery_origin_lat && formData.delivery_origin_lng ? "admin-delivery-status--active" : "admin-delivery-status--inactive"}`}>
              <div className="admin-delivery-status__info">
                <div className={`admin-delivery-status__dot ${formData.delivery_origin_lat && formData.delivery_origin_lng ? "admin-delivery-status__dot--active" : "admin-delivery-status__dot--inactive"}`} />
                <div>
                  <p>
                    {formData.delivery_origin_lat && formData.delivery_origin_lng
                      ? <><span className="material-symbols-outlined">check_circle</span> Punto de partida configurado</>
                      : <><span className="material-symbols-outlined">cancel</span> Punto de partida no configurado</>}
                  </p>
                  {formData.delivery_origin_address && (
                    <p><span className="material-symbols-outlined">location_on</span> {formData.delivery_origin_address}</p>
                  )}
                </div>
              </div>
              <span className={`admin-badge ${formData.delivery_origin_lat && formData.delivery_origin_lng ? "admin-badge--primary" : "admin-badge--neutral"}`}>
                {formData.delivery_origin_lat && formData.delivery_origin_lng ? "ACTIVO" : "PENDIENTE"}
              </span>
            </div>

            {/* Origin point */}
            <div className="admin-card">
              <div className="admin-card__body">
                <h4 className="admin-form-group__label">
                  <span className="material-symbols-outlined">location_on</span>
                  Punto de Partida
                </h4>
                <div className="admin-grid admin-grid--2">
                  <div className="admin-form-group">
                    <label className="admin-form-group__label">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.delivery_origin_lat}
                      onChange={(e) => setFormData((prev) => ({ ...prev, delivery_origin_lat: e.target.value }))}
                      placeholder="23.113592"
                      className="admin-input"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-group__label">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.delivery_origin_lng}
                      onChange={(e) => setFormData((prev) => ({ ...prev, delivery_origin_lng: e.target.value }))}
                      placeholder="-82.366592"
                      className="admin-input"
                    />
                  </div>
                </div>
                <div className="admin-card__footer">
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    onClick={handleSaveManualLocation}
                    disabled={!formData.delivery_origin_lat || !formData.delivery_origin_lng}
                  >
                    <span className="material-symbols-outlined admin-btn__icon">location_on</span>
                    Guardar ubicación manual
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary"
                    onClick={handleClearLocation}
                    disabled={!formData.delivery_origin_lat && !formData.delivery_origin_lng && !formData.delivery_origin_address}
                  >
                    <span className="material-symbols-outlined admin-btn__icon">close</span>
                    Quitar ubicación
                  </button>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary admin-btn--full"
                  onClick={getGPSLocationForDelivery}
                  disabled={gpsLoadingDelivery}
                >
                  {gpsLoadingDelivery ? (
                    <><span className="material-symbols-outlined">hourglass_bottom</span> Obteniendo ubicación...</>
                  ) : (
                    <><span className="material-symbols-outlined">location_on</span> Usar mi ubicación actual como punto de partida</>
                  )}
                </button>
                <p className="admin-form-group__helper">Puedes obtener las coordenadas exactas desde Google Maps, OpenStreetMap o usar el botón GPS</p>
              </div>
            </div>

            {/* Shipping rates */}
            <div className="admin-card">
              <div className="admin-card__body">
                <h4 className="admin-form-group__label">
                  <span className="material-symbols-outlined">attach_money</span>
                  Tarifas de Envío
                </h4>
                <div className="admin-form-group">
                  <label className="admin-form-group__label">Precio por kilómetro (CUP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.delivery_price_per_km}
                    onChange={(e) => setFormData((prev) => ({ ...prev, delivery_price_per_km: e.target.value }))}
                    placeholder="50.00"
                    className="admin-input"
                  />
                  <p className="admin-form-group__helper">Costo en CUP por cada kilómetro recorrido</p>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-group__label">Precio mínimo de delivery (CUP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.delivery_minimum_price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, delivery_minimum_price: e.target.value }))}
                    placeholder="100.00"
                    className="admin-input"
                  />
                  <p className="admin-form-group__helper">Cobro mínimo aunque la distancia sea corta</p>
                </div>
                <div className="admin-alert admin-alert--info">
                  <span className="material-symbols-outlined admin-alert__icon">info</span>
                  <div className="admin-alert__content">
                    <p>
                      <span className="material-symbols-outlined">check_circle</span> El envío se calcula SOLO por distancia (precio/km)<br />
                      <span className="material-symbols-outlined">check_circle</span> No hay límite máximo de distancia<br />
                      <span className="material-symbols-outlined">check_circle</span> No existe envío gratis por monto de pedido
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Example */}
            <div className="admin-card">
              <div className="admin-card__body">
                <h4 className="admin-form-group__label">
                  <span className="material-symbols-outlined">bar_chart</span>
                  Ejemplo de Cálculo
                </h4>
                <div className="admin-order-detail__totals">
                  <div className="admin-order-detail__total-row">
                    <span className="admin-form-group__helper">Cliente a 2 km:</span>
                    <strong className="admin-order-detail__total-value">
                      {formData.delivery_price_per_km && formData.delivery_minimum_price
                        ? `${Math.max(parseFloat(formData.delivery_minimum_price) || 100, (parseFloat(formData.delivery_price_per_km) || 50) * 2).toFixed(2)} CUP`
                        : "Configura las tarifas"}
                    </strong>
                  </div>
                  <div className="admin-order-detail__total-row">
                    <span className="admin-form-group__helper">Cliente a 5 km:</span>
                    <strong className="admin-order-detail__total-value">
                      {formData.delivery_price_per_km
                        ? `${Math.max(parseFloat(formData.delivery_minimum_price) || 100, (parseFloat(formData.delivery_price_per_km) || 50) * 5).toFixed(2)} CUP`
                        : "—"}
                    </strong>
                  </div>
                  <div className="admin-order-detail__total-row">
                    <span className="admin-form-group__helper">Cliente a 10 km:</span>
                    <strong className="admin-order-detail__total-value">
                      {formData.delivery_price_per_km
                        ? `${Math.max(parseFloat(formData.delivery_minimum_price) || 100, (parseFloat(formData.delivery_price_per_km) || 50) * 10).toFixed(2)} CUP`
                        : "—"}
                    </strong>
                  </div>
                  <div className="admin-alert admin-alert--info">
                    <span className="material-symbols-outlined admin-alert__icon">info</span>
                    <div className="admin-alert__content">
                      <small>
                        El envío se calcula como: MAX(precio mínimo, distancia × precio/km)<br />
                        ✓ No hay límite de distancia
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="admin-btn admin-btn--primary admin-btn--full"
              onClick={handleSaveDelivery}
              disabled={saving}
            >
              <span className="material-symbols-outlined">local_shipping</span>
              Guardar Configuración de Delivery
            </button>
          </div>
        )}

        {/* WELCOME */}
        {activeTab === "welcome" && (
          <div>
            <div className="admin-form-group">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  name="show_initialinfo"
                  checked={formData.show_initialinfo}
                  onChange={handleInputChange}
                  className="admin-checkbox"
                />
                <span>
                  <span className="material-symbols-outlined">
                    {formData.show_initialinfo ? "visibility" : "visibility_off"}
                  </span>
                  {formData.show_initialinfo ? "Mostrar mensaje al iniciar la app" : "Ocultar mensaje al iniciar la app"}
                </span>
              </label>
              <p className="admin-form-group__helper">Cuando está activado, los usuarios verán este mensaje la primera vez que abran la aplicación</p>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-group__label">Mensaje de Bienvenida</label>
              <textarea
                name="initialinfo"
                value={formData.initialinfo}
                onChange={handleInputChange}
                placeholder="Escribe aquí tu mensaje de bienvenida personalizado..."
                rows="8"
                className="admin-textarea"
              />
              <p className="admin-form-group__helper">Puedes usar formato Markdown básico: **negrita**, *cursiva*, saltos de línea</p>
            </div>
            <div className="admin-preview">
              <h4 className="admin-preview__label">Vista Previa del Mensaje</h4>
              <div className="admin-preview__content">
                {formData.initialinfo ? (
                  formData.initialinfo.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))
                ) : (
                  <p className="admin-form-group__helper">El mensaje de bienvenida aparecerá aquí...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="admin-card__footer">
          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar Configuración"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppConfigManager;
