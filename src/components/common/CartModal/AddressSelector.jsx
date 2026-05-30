// components/common/CartModal/AddressSelector.jsx - VERSIÓN OPTIMIZADA
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  HiOutlineLocationMarker,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineX,
} from "react-icons/hi";
import { FaLocationArrow } from "react-icons/fa";
import Swal from "sweetalert2";
import {
  startLoadUserAddresses,
  addUserAddress,
  deleteUserAddress,
  setDefaultUserAddress,
} from "../../../actions/authActions";
import "./AddressSelector.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const AddressSelector = ({
  selectedAddress,
  onAddressSelect,
  onAddressAdded,
  onAddressDeleted,
}) => {
  const dispatch = useDispatch();
  const addresses = useSelector((state) => state.auth.userAddresses || []);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);

  useEffect(() => {
    if (addresses.length === 0) {
      dispatch(startLoadUserAddresses());
    }
  }, [dispatch, addresses.length]);

  const loadUserAddresses = async () => {
    setLoading(true);
    await dispatch(startLoadUserAddresses());
    setLoading(false);
  };

  const getGPSLocation = () => {
    setGpsLoading(true);
    setPermissionDenied(false);
    setTimeoutError(false);

    if (!navigator.geolocation) {
      Swal.fire({
        icon: "error",
        title: "GPS no soportado",
        text: "Tu navegador no soporta geolocalización.",
        confirmButtonColor: "#059669",
      });
      setGpsLoading(false);
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          if (permissionStatus.state === "denied") {
            setPermissionDenied(true);
            setGpsLoading(false);
            return;
          }
        })
        .catch(() => {});
    }

    const loadingSwal = Swal.fire({
      title: "📍 Obteniendo tu ubicación",
      html: `<div style="text-align: center;">
          <div class="gps-loading-spinner"></div>
          <p style="margin-top: 15px;">Por favor espera...</p>
          <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">⏱️ Esto puede tomar unos segundos</p>
        </div>`,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    const timeoutId = setTimeout(() => {
      if (gpsLoading) {
        loadingSwal.close();
        setGpsLoading(false);
        setTimeoutError(true);
        Swal.fire({
          icon: "info",
          title: "⏱️ Tiempo de espera agotado",
          html: `<div style="text-align: center;"><p>La búsqueda de ubicación tomó demasiado tiempo.</p>
            <div style="background: #f0f9ff; padding: 12px; border-radius: 8px; margin-top: 15px;">
              <p style="margin: 0; font-size: 13px;">💡 <strong>¿Qué puedes hacer?</strong></p>
              <p style="margin: 8px 0 0 0; font-size: 12px;">
                • Asegúrate de tener una conexión a internet estable<br>
                • Activa el GPS de tu dispositivo<br>
                • Intenta nuevamente
              </p>
            </div></div>`,
          confirmButtonColor: "#059669",
          confirmButtonText: "Intentar de nuevo",
          showCancelButton: true,
          cancelButtonText: "Cancelar",
          cancelButtonColor: "#6b7280",
        }).then((result) => {
          if (result.isConfirmed) getGPSLocation();
        });
      }
    }, 15000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        const { latitude, longitude } = position.coords;
        loadingSwal.close();
        try {
          const res = await fetch(`${API_URL}/api/geocoding/reverse`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          const data = await res.json();
          let addressText =
            data.ok && data.display_name
              ? data.display_name
              : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          showAddressConfirmation(addressText, latitude, longitude);
        } catch (err) {
          const coordText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          showAddressConfirmation(coordText, latitude, longitude);
        }
        setGpsLoading(false);
      },
      (err) => {
        clearTimeout(timeoutId);
        loadingSwal.close();
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Ocurrió un error inesperado. Intenta de nuevo.",
            confirmButtonColor: "#059669",
          });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const showAddressConfirmation = (address, lat, lng) => {
    Swal.fire({
      title: "📍 ¿Guardar esta dirección?",
      html: `<div style="text-align: left;">
          <p style="margin-bottom: 8px; color: #4b5563;">Dirección detectada:</p>
          <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #10b981;">
            <strong>${address.length > 80 ? address.substring(0, 80) + "..." : address}</strong>
          </div>
        </div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "✅ Guardar dirección",
      cancelButtonText: "Cancelar",
      preConfirm: () => saveAddress(address, lat, lng),
    });
  };

  const saveAddress = async (address, lat, lng) => {
    try {
      const result = await dispatch(
        addUserAddress({
          address: address.trim(),
          lat: lat,
          lng: lng,
          is_default: addresses.length === 0,
        }),
      );
      if (result) {
        Swal.fire({
          icon: "success",
          title: "¡Dirección agregada!",
          text: "Tu dirección ha sido guardada correctamente.",
          confirmButtonColor: "#059669",
          timer: 1500,
          showConfirmButton: false,
        });
        setShowAddForm(false);
        if (onAddressAdded) onAddressAdded();
        if (onAddressSelect && result) onAddressSelect(result);
        return true;
      }
      return false;
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar la dirección",
        confirmButtonColor: "#059669",
      });
      return false;
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const result = await Swal.fire({
      title: "¿Eliminar dirección?",
      text: "Esta acción no se puede deshacer",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    const success = await dispatch(deleteUserAddress(addressId));
    if (success && onAddressDeleted) onAddressDeleted();
  };

  const handleSetDefault = async (addressId) => {
    await dispatch(setDefaultUserAddress(addressId));
    if (onAddressAdded) onAddressAdded();
  };

  return (
    <div className="address-selector">
      <div className="address-selector-header">
        <HiOutlineLocationMarker className="address-icon" />
        <span>Mis direcciones</span>
      </div>

      {loading && !addresses.length ? (
        <div className="address-loading">
          <div className="spinner-small"></div>
          <span>Cargando tus direcciones...</span>
        </div>
      ) : addresses.length > 0 ? (
        <div className="address-list">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`address-item ${selectedAddress?.id === addr.id ? "selected" : ""}`}
              onClick={() => onAddressSelect(addr)}
            >
              <div className="address-radio">
                {selectedAddress?.id === addr.id ? (
                  <div className="radio-checked" />
                ) : (
                  <div className="radio-unchecked" />
                )}
              </div>
              <div className="address-details">
                <div className="address-text">
                  <span className="address-full">{addr.address}</span>
                  {addr.is_default && (
                    <span className="default-badge">Predeterminada</span>
                  )}
                </div>
              </div>
              <div className="address-actions">
                {!addr.is_default && (
                  <button
                    className="address-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(addr.id);
                    }}
                    title="Establecer como predeterminada"
                  >
                    <HiOutlineCheck size={14} />
                  </button>
                )}
                <button
                  className="address-action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAddress(addr.id);
                  }}
                  title="Eliminar"
                >
                  <HiOutlineTrash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-addresses">
          <p>📭 No tienes direcciones guardadas</p>
          <p className="no-addresses-hint">
            Agrega tu primera dirección usando GPS
          </p>
        </div>
      )}

      {showAddForm ? (
        <div className="add-address-form">
          <div className="form-header">
            <span>➕ Agregar nueva dirección</span>
            <button
              className="close-form"
              onClick={() => setShowAddForm(false)}
            >
              <HiOutlineX size={18} />
            </button>
          </div>
          <button
            type="button"
            className="gps-address-btn-large"
            onClick={getGPSLocation}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <>
                <div className="gps-spinner"></div>
                <span>Obteniendo ubicación...</span>
              </>
            ) : (
              <>
                <FaLocationArrow size={24} />
                <span>Usar mi ubicación actual</span>
              </>
            )}
          </button>
          {permissionDenied && (
            <div className="gps-permission-denied">
              <div className="permission-icon">🔒</div>
              <div className="permission-text">
                <strong>Permiso de ubicación bloqueado</strong>
                <p>Debes permitir la ubicación para este sitio.</p>
              </div>
            </div>
          )}
          {timeoutError && (
            <div className="gps-timeout-error">
              <div className="timeout-icon">⏱️</div>
              <div className="timeout-text">
                <strong>Tiempo de espera agotado</strong>
                <p>La búsqueda de ubicación tomó demasiado tiempo.</p>
                <button className="timeout-retry-btn" onClick={getGPSLocation}>
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}
          <div className="gps-info-card-selector">
            <div className="gps-info-icon">📍</div>
            <div className="gps-info-text">
              <strong>¿Por qué usar GPS?</strong>
              <p>✓ Entrega más rápida y precisa</p>
              <p>✓ Calculamos el costo de envío exacto</p>
              <p>✓ Tus pedidos llegan sin errores</p>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="add-address-btn"
          onClick={() => setShowAddForm(true)}
        >
          <HiOutlinePlus size={16} />
          Agregar nueva dirección
        </button>
      )}
    </div>
  );
};

export default AddressSelector;
