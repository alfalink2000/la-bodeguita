// components/admin/StoreManager/StoreManager.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  HiOutlineCollection,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineCheck,
} from "react-icons/hi";
import {
  getStores,
  insertStore,
  updateStore,
  deleteStore,
} from "../../../actions/storesActions";
import "./StoreManager.css";

const StoreManager = () => {
  const dispatch = useDispatch();
  const stores = useSelector((state) => state.stores.stores);
  const loading = useSelector((state) => state.stores.loading);

  const [newStore, setNewStore] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: "", description: "" });

  // Cargar tiendas al montar
  useEffect(() => {
    dispatch(getStores());
  }, [dispatch]);

  const handleCreate = async () => {
    if (!newStore.name.trim()) return;
    await dispatch(insertStore(newStore));
    setNewStore({ name: "", description: "" });
  };

  const handleUpdate = async (id) => {
    await dispatch(updateStore(id, editData));
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    await dispatch(deleteStore(id));
  };

  return (
    <div className="store-manager">
      <h3 className="store-manager__title">
        <HiOutlineCollection /> Gestión de Tiendas
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
