// components/common/CartModal/AddressSelector.jsx
import React, { useState, useEffect } from "react";
import { 
  HiOutlineLocationMarker, 
  HiOutlinePlus, 
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineSearch
} from "react-icons/hi";
import { FaLocationArrow } from "react-icons/fa";
import Swal from "sweetalert2";
import "./AddressSelector.css";

const API_URL = import.meta.env.VITE_API_URL || "https://minimarket-backend-6z9m.onrender.com";

const AddressSelector = ({ 
  selectedAddress, 
  onAddressSelect, 
  onAddressesLoaded,
  onAddressAdded,
  token 
}) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [newAddress, setNewAddress] = useState({
    address: "",
    lat: null,
    lng: null,
    nickname: "",
    is_default: false
  });
  const [addressError, setAddressError] = useState("");

  // Validación de dirección
  const validateAddress = (address, lat, lng) => {
    if (!address || address.trim() === "") {
      setAddressError("📝 Por favor ingresa una dirección válida");
      return false;
    }

    const trimmedAddress = address.trim();

    if (trimmedAddress.length < 10) {
      setAddressError(`📍 "${trimmedAddress}" es muy corto. Una dirección debe tener al menos 10 caracteres.`);
      return false;
    }

    const coordinatesPattern = /^-?\d+\.\d+,\s*-?\d+\.\d+$/;
    if (coordinatesPattern.test(trimmedAddress)) {
      setAddressError("🌍 Por favor escribe una dirección completa, no solo coordenadas");
      return false;
    }

    const hasNumbers = /\d/.test(trimmedAddress);
    const hasLetters = /[a-zA-Záéíóúñ]/i.test(trimmedAddress);
    
    if (!hasNumbers || !hasLetters) {
      setAddressError("🏠 La dirección debe incluir el número de la casa y el nombre de la calle");
      return false;
    }

    if (!lat || !lng) {
      setAddressError("📍 Por favor selecciona una dirección de las sugerencias o usa GPS");
      return false;
    }

    setAddressError("");
    return true;
  };

  // Cargar direcciones del usuario
  const loadUserAddresses = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/addresses`, {
        headers: { "x-token": token }
      });
      const data = await res.json();
      
      if (data.ok && data.addresses) {
        setAddresses(data.addresses);
        if (onAddressesLoaded) onAddressesLoaded(data.addresses);
      }
    } catch (err) {
      console.error("Error cargando direcciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAddresses();
  }, [token]);

  // Buscar dirección por texto
  const searchAddress = async (address) => {
    setNewAddress({ ...newAddress, address });
    setAddressError("");
    
    if (address.length < 5) {
      setAddressSuggestions([]);
      return;
    }

    setSearchingAddress(true);
    try {
      const res = await fetch(`${API_URL}/api/geocoding/geocode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, city: "La Habana" })
      });
      const data = await res.json();
      
      if (data.ok) {
        setAddressSuggestions([data]);
      } else {
        setAddressSuggestions([]);
      }
    } catch (err) {
      console.error("Error buscando dirección:", err);
      setAddressSuggestions([]);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Seleccionar sugerencia de dirección
  const selectAddressSuggestion = (suggestion) => {
    setNewAddress({
      ...newAddress,
      address: suggestion.display_name,
      lat: suggestion.lat,
      lng: suggestion.lng
    });
    setAddressSuggestions([]);
    validateAddress(suggestion.display_name, suggestion.lat, suggestion.lng);
  };

  // Obtener ubicación por GPS
  const getGPSLocation = () => {
    setGpsLoading(true);
    setAddressError("");

    if (!navigator.geolocation) {
      Swal.fire({
        icon: "warning",
        title: "GPS no soportado",
        text: "Tu navegador no soporta geolocalización. Por favor, escribe tu dirección manualmente.",
        confirmButtonColor: "#059669"
      });
      setGpsLoading(false);
      return;
    }

    Swal.fire({
      title: "📍 Obteniendo tu ubicación",
      text: "Por favor espera...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(`${API_URL}/api/geocoding/reverse`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude })
          });
          const data = await res.json();

          let addressText = data.ok && data.display_name 
            ? data.display_name 
            : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          setNewAddress({
            ...newAddress,
            address: addressText,
            lat: latitude,
            lng: longitude
          });
          
          validateAddress(addressText, latitude, longitude);

          Swal.fire({
            title: "📍 ¡Ubicación obtenida!",
            text: addressText.length > 80 ? addressText.substring(0, 80) + "..." : addressText,
            icon: "success",
            timer: 2000,
            showConfirmButton: false
          });
        } catch (err) {
          console.error("Error en reverse geocoding:", err);
          const coordText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setNewAddress({
            ...newAddress,
            address: coordText,
            lat: latitude,
            lng: longitude
          });
          setAddressError("⚠️ No pudimos obtener una dirección clara. Puedes editar el texto.");
          
          Swal.fire({
            title: "📍 Ubicación obtenida",
            text: "Coordenadas guardadas. Por favor, completa la dirección.",
            icon: "info",
            confirmButtonText: "Entendido"
          });
        }
        setGpsLoading(false);
        Swal.close();
      },
      (err) => {
        let errorMsg = "";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = "Permiso de ubicación denegado. Escribe tu dirección manualmente.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = "Ubicación no disponible. Escribe tu dirección manualmente.";
            break;
          case err.TIMEOUT:
            errorMsg = "Tiempo de espera agotado. Escribe tu dirección manualmente.";
            break;
          default:
            errorMsg = "Error obteniendo ubicación. Escribe tu dirección manualmente.";
        }
        
        Swal.fire({
          icon: "warning",
          title: "Error de GPS",
          text: errorMsg,
          confirmButtonColor: "#059669"
        });
        setGpsLoading(false);
        Swal.close();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Agregar nueva dirección
  const addNewAddress = async () => {
    if (!validateAddress(newAddress.address, newAddress.lat, newAddress.lng)) {
      Swal.fire({
        icon: "warning",
        title: "Dirección inválida",
        text: addressError,
        confirmButtonColor: "#059669"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": token
        },
        body: JSON.stringify({
          address: newAddress.address.trim(),
          lat: newAddress.lat,
          lng: newAddress.lng,
          nickname: newAddress.nickname || null,
          is_default: newAddress.is_default
        })
      });
      const data = await res.json();
      
      if (data.ok) {
        Swal.fire({
          icon: "success",
          title: "¡Dirección agregada!",
          text: "Tu nueva dirección ha sido guardada",
          confirmButtonColor: "#059669",
          timer: 1500,
          showConfirmButton: false
        });
        
        setNewAddress({ address: "", lat: null, lng: null, nickname: "", is_default: false });
        setShowAddForm(false);
        await loadUserAddresses();
        
        if (onAddressAdded) {
          onAddressAdded();
        }
      } else {
        throw new Error(data.msg || "Error al guardar");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        confirmButtonColor: "#059669"
      });
    } finally {
      setLoading(false);
    }
  };

  // Eliminar dirección
  const deleteAddress = async (addressId) => {
    const result = await Swal.fire({
      title: "¿Eliminar dirección?",
      text: "Esta acción no se puede deshacer",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });
    
    if (!result.isConfirmed) return;
    
    try {
      const res = await fetch(`${API_URL}/api/users/addresses/${addressId}`, {
        method: "DELETE",
        headers: { "x-token": token }
      });
      const data = await res.json();
      
      if (data.ok) {
        Swal.fire({
          icon: "success",
          title: "Eliminada",
          text: "Dirección eliminada correctamente",
          confirmButtonColor: "#059669",
          timer: 1500,
          showConfirmButton: false
        });
        loadUserAddresses();
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar la dirección",
        confirmButtonColor: "#059669"
      });
    }
  };

  // Establecer como predeterminada
  const setDefaultAddress = async (addressId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/addresses/${addressId}/default`, {
        method: "PUT",
        headers: { "x-token": token }
      });
      const data = await res.json();
      
      if (data.ok) {
        loadUserAddresses();
      }
    } catch (err) {
      console.error("Error:", err);
    }
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
                  {addr.nickname && <span className="address-nickname">🏷️ {addr.nickname}</span>}
                  <span className="address-full">{addr.address}</span>
                  {addr.is_default && <span className="default-badge">Predeterminada</span>}
                </div>
              </div>
              <div className="address-actions">
                {!addr.is_default && (
                  <button 
                    className="address-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDefaultAddress(addr.id);
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
                    deleteAddress(addr.id);
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
          <p className="no-addresses-hint">Agrega tu primera dirección para recibir pedidos</p>
        </div>
      )}

      {showAddForm ? (
        <div className="add-address-form">
          <div className="form-header">
            <span>➕ Agregar nueva dirección</span>
            <button className="close-form" onClick={() => setShowAddForm(false)}>
              <HiOutlineX size={18} />
            </button>
          </div>
          
          <button 
            className="gps-address-btn"
            onClick={getGPSLocation}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <>
                <div className="gps-spinner-small"></div>
                <span>Obteniendo ubicación...</span>
              </>
            ) : (
              <>
                <FaLocationArrow size={16} />
                <span>Usar mi ubicación actual</span>
              </>
            )}
          </button>

          <div className="location-divider-mini">
            <span>o escribe tu dirección</span>
          </div>
          
          <div className="address-search-wrapper">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              className="address-search-input"
              placeholder="Ej: Calle 23 #456 entre L y M, Vedado"
              value={newAddress.address}
              onChange={(e) => searchAddress(e.target.value)}
            />
            {searchingAddress && (
              <div className="searching-indicator">
                <div className="spinner-small"></div>
              </div>
            )}
          </div>

          {addressSuggestions.length > 0 && (
            <div className="address-suggestions-list">
              {addressSuggestions.map((suggestion, idx) => (
                <div 
                  key={idx}
                  className="address-suggestion"
                  onClick={() => selectAddressSuggestion(suggestion)}
                >
                  📍 {suggestion.display_name.substring(0, 60)}
                </div>
              ))}
            </div>
          )}

          {addressError && (
            <div className="address-error-mini">
              <span>⚠️</span> {addressError}
            </div>
          )}

          {newAddress.address && !addressError && newAddress.lat && newAddress.lng && (
            <div className="address-valid-mini">
              <span>✅</span> Dirección válida
            </div>
          )}

          <input
            type="text"
            className="address-nickname-input"
            placeholder="Nombre de la dirección (opcional: Casa, Trabajo, etc.)"
            value={newAddress.nickname}
            onChange={(e) => setNewAddress({ ...newAddress, nickname: e.target.value })}
          />
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={newAddress.is_default}
              onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
            />
            <span>Usar como dirección predeterminada</span>
          </label>
          
          <button 
            className="save-address-btn"
            onClick={addNewAddress}
            disabled={loading || !newAddress.lat || !newAddress.lng}
          >
            {loading ? "Guardando..." : "Guardar dirección"}
          </button>
        </div>
      ) : (
        <button className="add-address-btn" onClick={() => setShowAddForm(true)}>
          <HiOutlinePlus size={16} />
          Agregar nueva dirección
        </button>
      )}
    </div>
  );
};

export default AddressSelector;