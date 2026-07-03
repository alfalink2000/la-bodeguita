import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getStores,
  insertStore,
  updateStore,
  deleteStore,
} from "../../../actions/storesActions";

const StoreManager = () => {
  const dispatch = useDispatch();
  const stores = useSelector((state) => state.stores.stores);
  const loading = useSelector((state) => state.stores.loading);

  const [newStore, setNewStore] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: "", description: "" });

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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="admin-page-header">
        <h2 className="admin-page-header__title">
          <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>store</span>
          Gestión de Tiendas
        </h2>
      </div>

      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px", backgroundColor: "var(--color-surface-bright)", borderRadius: "12px", border: "1px solid var(--color-outline-variant)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            type="text"
            placeholder="Nombre de la tienda"
            value={newStore.name}
            onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
            className="admin-input"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={newStore.description}
            onChange={(e) =>
              setNewStore({ ...newStore, description: e.target.value })
            }
            className="admin-input"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={loading || !newStore.name.trim()}
          className="admin-btn admin-btn--primary"
          style={{ alignSelf: "flex-start" }}
        >
          <span className="admin-btn__icon material-symbols-outlined">add</span>
          Crear
        </button>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {stores.map((store) => (
          <div key={store.id} className="admin-card">
            {editingId === store.id ? (
              <div className="admin-card__body" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="admin-input"
                />
                <input
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  className="admin-input"
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleUpdate(store.id)}
                    className="admin-btn admin-btn--primary admin-btn--icon"
                  >
                    <span className="admin-btn__icon material-symbols-outlined">check</span>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="admin-btn admin-btn--secondary admin-btn--icon"
                  >
                    <span className="admin-btn__icon material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="admin-card__body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontFamily: "var(--font-label-md)", fontSize: "var(--text-label-md)", fontWeight: "var(--text-label-md--font-weight)", color: "var(--color-on-surface)" }}>{store.name}</span>
                  <span style={{ fontFamily: "var(--font-label-sm)", fontSize: "var(--text-label-sm)", color: "var(--color-on-surface-variant)" }}>
                    {store.description || "Sin descripción"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setEditingId(store.id);
                      setEditData({
                        name: store.name,
                        description: store.description || "",
                      });
                    }}
                    className="admin-btn admin-btn--ghost admin-btn--icon"
                  >
                    <span className="admin-btn__icon material-symbols-outlined">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    className="admin-btn admin-btn--ghost admin-btn--icon"
                    style={{ color: "var(--color-error)" }}
                  >
                    <span className="admin-btn__icon material-symbols-outlined">delete</span>
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
