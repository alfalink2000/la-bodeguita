// components/common/CartModal/AddressSelector.jsx
import React, { useState, useEffect } from "react";
import { 
  HiOutlineLocationMarker, 
  HiOutlinePlus, 
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineX 
} from "react-icons/hi";
import Swal from "sweetalert2";
import "./AddressSelector.css";
const API_URL = import.meta.env.VITE_API_URL || "https://minimarket-backend-6z9m.onrender.com";

const AddressSelector = ({ 
  selectedAddress, 
  onAddressSelect, 
  onAddressesLoaded,
  token 
}) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    address: "",
    lat: null,
    lng: null,
    is_default: false
  });
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);

  // Cargar ubicaciones del usuario
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
        
        // Seleccionar la dirección por defecto si existe
        const defaultAddress = data.addresses.find(addr => addr.is_default);
        if (defaultAddress && !selectedAddress) {
          onAddressSelect(defaultAddress);
        }
      }
    } catch (err) {
      console.error("Error cargando ubicaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAddresses();
  }, [token]);

  // Buscar dirección para nueva ubicación
  const handleAddressSearch = async (address) => {
    setNewAddress({ ...newAddress, address });
    
    if (address.length < 5) {
      setAddressSuggestions([]);
      return;
    }

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
    }
  };

  const selectAddressSuggestion = (suggestion) => {
    setNewAddress({
      ...newAddress,
      address: suggestion.display_name,
      lat: suggestion.lat,
      lng: suggestion.lng
    });
    setAddressSuggestions([]);
  };

  // Agregar nueva ubicación
  const addNewAddress = async () => {
    if (!newAddress.address.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Dirección requerida",
        text: "Por favor ingresa una dirección válida",
        confirmButtonColor: "#059669"
      });
      return;
    }

    if (!newAddress.lat || !newAddress.lng) {
      Swal.fire({
        icon: "warning",
        title: "Ubicación no válida",
        text: "Por favor selecciona una dirección de las sugerencias",
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
        body: JSON.stringify(newAddress)
      });
      const data = await res.json();
      
      if (data.ok) {
        Swal.fire({
          icon: "success",
          title: "¡Ubicación agregada!",
          text: "Tu nueva dirección ha sido guardada",
          confirmButtonColor: "#059669",
          timer: 1500,
          showConfirmButton: false
        });
        
        setNewAddress({ address: "", lat: null, lng: null, is_default: false });
        setShowAddForm(false);
        loadUserAddresses(); // Recargar lista
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

  // Eliminar ubicación
  const deleteAddress = async (addressId) => {
    const result = await Swal.fire({
      title: "¿Eliminar ubicación?",
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
          text: "Ubicación eliminada correctamente",
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
        text: "No se pudo eliminar la ubicación",
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
        <span>Dirección de entrega</span>
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
                  {addr.address}
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
          <p>No tienes direcciones guardadas</p>
          <p className="no-addresses-hint">Agrega tu primera dirección para recibir pedidos</p>
        </div>
      )}

      {showAddForm ? (
        <div className="add-address-form">
          <div className="form-header">
            <span>Nueva dirección</span>
            <button className="close-form" onClick={() => setShowAddForm(false)}>
              <HiOutlineX size={18} />
            </button>
          </div>
          
          <div className="address-search-wrapper">
            <input
              type="text"
              className="address-search-input"
              placeholder="Buscar dirección..."
              value={newAddress.address}
              onChange={(e) => handleAddressSearch(e.target.value)}
            />
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
          </div>
          
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
            disabled={loading}
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