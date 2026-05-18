// components/admin/StoreManager/StoreManager.jsx
import { useState, useEffect, useCallback } from "react";
import {
  HiOutlineStore,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineCheck,
} from "react-icons/hi";
import Swal from "sweetalert2";
import "./StoreManager.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const StoreManager = () => {
  const [stores, setStores] = useState([]);
  const [newStore, setNewStore] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const loadStores = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/stores`);
      const data = await res.json();
      if (data.ok) setStores(data.stores || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleCreate = async () => {
    if (!newStore.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-token": token },
        body: JSON.stringify(newStore),
      });
      const data = await res.json();
      if (data.ok) {
        setNewStore({ name: "", description: "" });
        loadStores();
        Swal.fire({
          icon: "success",
          title: "Tienda creada",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUpdate = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/stores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-token": token },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (data.ok) {
        setEditingId(null);
        loadStores();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar tienda?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Eliminar",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/api/stores/${id}`, {
        method: "DELETE",
        headers: { "x-token": token },
      });
      const data = await res.json();
      if (data.ok) loadStores();
      else Swal.fire({ icon: "error", title: "Error", text: data.msg });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="store-manager">
      <h3 className="store-manager__title">
        <HiOutlineStore /> Gestión de Tiendas
      </h3>

      {/* Formulario nueva tienda */}
      <div className="store-manager__add">
        <input
          type="text"
          placeholder="Nombre de la tienda"
          value={newStore.name}
          onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
          className="store-manager__input"
        />
        <input
          type="text"
          placeholder="Descripción (opcional)"
          value={newStore.description}
          onChange={(e) =>
            setNewStore({ ...newStore, description: e.target.value })
          }
          className="store-manager__input"
        />
        <button
          onClick={handleCreate}
          disabled={loading || !newStore.name.trim()}
          className="store-manager__btn store-manager__btn--add"
        >
          <HiOutlinePlus /> Crear
        </button>
      </div>

      {/* Lista de tiendas */}
      <div className="store-manager__list">
        {stores.map((store) => (
          <div key={store.id} className="store-manager__item">
            {editingId === store.id ? (
              <div className="store-manager__edit-row">
                <input
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="store-manager__input"
                />
                <input
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  className="store-manager__input"
                />
                <button
                  onClick={() => handleUpdate(store.id)}
                  className="store-manager__btn--icon store-manager__btn--save"
                >
                  <HiOutlineCheck />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="store-manager__btn--icon store-manager__btn--cancel"
                >
                  <HiOutlineX />
                </button>
              </div>
            ) : (
              <div className="store-manager__row">
                <div className="store-manager__info">
                  <span className="store-manager__name">{store.name}</span>
                  <span className="store-manager__desc">
                    {store.description || "Sin descripción"}
                  </span>
                </div>
                <div className="store-manager__actions">
                  <button
                    onClick={() => {
                      setEditingId(store.id);
                      setEditData({
                        name: store.name,
                        description: store.description || "",
                      });
                    }}
                    className="store-manager__btn--icon store-manager__btn--edit"
                  >
                    <HiOutlinePencil />
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    className="store-manager__btn--icon store-manager__btn--delete"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreManager;
