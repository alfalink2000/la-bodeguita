import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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

  const getGPSLocation = () => {
    setGpsLoading(true);
    setPermissionDenied(false);
    setTimeoutError(false);

    if (!navigator.geolocation) {
      Swal.fire({
        icon: "error",
        title: "GPS no soportado",
        text: "Tu navegador no soporta geolocalización.",
        confirmButtonColor: "var(--color-primary)",
      });
      setGpsLoading(false);
      return;
    }

    const loadingSwal = Swal.fire({
      title: "Obteniendo tu ubicación",
      html: `<p>Por favor espera...</p>`,
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
          title: "Tiempo de espera agotado",
          text: "La búsqueda de ubicación tomó demasiado tiempo.",
          confirmButtonColor: "var(--color-primary)",
          confirmButtonText: "Intentar de nuevo",
          showCancelButton: true,
          cancelButtonText: "Cancelar",
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
            confirmButtonColor: "var(--color-primary)",
          });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const showAddressConfirmation = (address, lat, lng) => {
    Swal.fire({
      title: "Guardar esta dirección?",
      html: `<div><p>Dirección detectada:</p><strong>${address.length > 80 ? address.substring(0, 80) + "..." : address}</strong></div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--color-primary)",
      cancelButtonColor: "var(--color-on-surface-variant)",
      confirmButtonText: "Guardar dirección",
      cancelButtonText: "Cancelar",
      preConfirm: () => saveAddress(address, lat, lng),
    });
  };

  const saveAddress = async (address, lat, lng) => {
    try {
      const result = await dispatch(
        addUserAddress({
          address: address.trim(),
          lat,
          lng,
          is_default: addresses.length === 0,
        }),
      );
      if (result) {
        Swal.fire({
          icon: "success",
          title: "Dirección agregada!",
          text: "Tu dirección ha sido guardada correctamente.",
          confirmButtonColor: "var(--color-primary)",
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
        confirmButtonColor: "var(--color-primary)",
      });
      return false;
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const result = await Swal.fire({
      title: "Eliminar dirección?",
      text: "Esta acción no se puede deshacer",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--color-error)",
      cancelButtonColor: "var(--color-on-surface-variant)",
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
      <div className="address-selector__header">
        <span className="address-selector__header-icon material-symbols-outlined">
          location_on
        </span>
        <span className="address-selector__header-text">Mis direcciones</span>
      </div>

      {loading && !addresses.length ? (
        <div className="address-selector__loading">
          <span className="address-selector__loading-icon material-symbols-outlined">
            sync
          </span>
          <span>Cargando tus direcciones...</span>
        </div>
      ) : addresses.length > 0 ? (
        <div className="address-selector__list">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`address-selector__item ${selectedAddress?.id === addr.id ? "address-selector__item--selected" : ""}`}
              onClick={() => onAddressSelect(addr)}
            >
              <div
                className={`address-selector__radio ${selectedAddress?.id === addr.id ? "address-selector__radio--checked" : ""}`}
              >
                {selectedAddress?.id === addr.id && (
                  <div className="address-selector__radio-dot" />
                )}
              </div>
              <div className="address-selector__details">
                <p className="address-selector__address-text">{addr.address}</p>
                {addr.is_default && (
                  <span className="address-selector__default-badge">
                    Predeterminada
                  </span>
                )}
              </div>
              <div className="address-selector__actions">
                {!addr.is_default && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(addr.id);
                    }}
                    className="address-selector__action-btn address-selector__action-btn--default"
                    title="Establecer como predeterminada"
                  >
                    <span className="address-selector__action-icon material-symbols-outlined">
                      check
                    </span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAddress(addr.id);
                  }}
                  className="address-selector__action-btn address-selector__action-btn--delete"
                  title="Eliminar"
                >
                  <span className="address-selector__action-icon material-symbols-outlined">
                    delete
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="address-selector__empty">
          <span className="address-selector__empty-icon material-symbols-outlined">
            location_off
          </span>
          <p className="address-selector__empty-text">
            No tienes direcciones guardadas
          </p>
          <p className="address-selector__empty-text">
            Agrega tu primera dirección usando GPS
          </p>
        </div>
      )}

      {showAddForm ? (
        <div className="address-selector__add-form">
          <div className="address-selector__add-header">
            <span className="address-selector__add-title">
              Agregar nueva dirección
            </span>
            <button
              onClick={() => setShowAddForm(false)}
              className="address-selector__add-close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <button
            type="button"
            onClick={getGPSLocation}
            disabled={gpsLoading}
            className="address-selector__gps-btn"
          >
            {gpsLoading ? (
              <>
                <span className="address-selector__gps-icon material-symbols-outlined address-selector__loading-icon">
                  sync
                </span>
                <span>Obteniendo ubicación...</span>
              </>
            ) : (
              <>
                <span className="address-selector__gps-icon material-symbols-outlined">
                  my_location
                </span>
                <span>Usar mi ubicación actual</span>
              </>
            )}
          </button>

          {permissionDenied && (
            <div className="address-selector__alert address-selector__alert--permission">
              <span className="address-selector__alert-icon material-symbols-outlined">
                lock
              </span>
              <div>
                <p className="address-selector__alert-title">
                  Permiso de ubicación bloqueado
                </p>
                <p className="address-selector__alert-text">
                  Debes permitir la ubicación para este sitio.
                </p>
              </div>
            </div>
          )}

          {timeoutError && (
            <div className="address-selector__alert address-selector__alert--timeout">
              <span className="address-selector__alert-icon material-symbols-outlined">
                timer
              </span>
              <div>
                <p className="address-selector__alert-title">
                  Tiempo de espera agotado
                </p>
                <p className="address-selector__alert-text">
                  La búsqueda de ubicación tomó demasiado tiempo.
                </p>
                <button
                  onClick={getGPSLocation}
                  className="address-selector__retry-btn"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}

          <div className="address-selector__info">
            <span className="address-selector__info-icon material-symbols-outlined">
              info
            </span>
            <div>
              <p className="address-selector__info-title">Por qué usar GPS?</p>
              <p className="address-selector__info-text">
                Entrega más rápida y precisa
              </p>
              <p className="address-selector__info-text">
                Calculamos el costo de envío exacto
              </p>
              <p className="address-selector__info-text">
                Tus pedidos llegan sin errores
              </p>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="address-selector__add-btn"
        >
          <span className="address-selector__add-btn-icon material-symbols-outlined">
            add
          </span>
          Agregar nueva dirección
        </button>
      )}
    </div>
  );
};

export default AddressSelector;
