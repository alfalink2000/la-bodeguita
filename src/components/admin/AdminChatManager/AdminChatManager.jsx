import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  startLoadChats,
  selectChat,
  clearSelectedChat,
  startLoadMessages,
  startSendAdminMessage,
  startLoadAllUsers,
} from "../../../actions/chatActions";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const AdminChatManager = ({
  selectedUserId,
  onSelectUser,
  onUnreadCountChange,
}) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [forceRefreshKey, setForceRefreshKey] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevSelectedUserIdRef = useRef(null);

  const {
    chats = [],
    selectedChat = null,
    messages = [],
    loading = false,
    totalUnread = 0,
  } = useSelector((state) => state.chat) || {};

  const loadData = useCallback(async () => {
    try {
      await dispatch(startLoadChats());
      setIsInitialized(true);
    } catch (error) {
      console.error("Error cargando chats:", error);
    }
  }, [dispatch]);

  const forceReloadChats = useCallback(async () => {
    try {
      await dispatch(startLoadChats());
      setForceRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error recargando chats:", error);
    }
  }, [dispatch]);

  const refreshAttentionStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/orders/admin/all`, {
        headers: { "x-token": token },
      });
      const data = await res.json();
      if (data.ok) {
        const pedidos = data.pedidos || [];
        const usersNeedingAttention = new Set();
        pedidos.forEach((pedido) => {
          if (
            pedido.delivery_needs_manual_contact === true &&
            pedido.status !== "cancelled" &&
            pedido.status !== "completed"
          ) {
            if (pedido.user_id) usersNeedingAttention.add(pedido.user_id);
          }
        });
        if (selectedChat?.user?.id && !usersNeedingAttention.has(selectedChat.user.id)) {
          await forceReloadChats();
        } else {
          await dispatch(startLoadChats());
        }
      }
    } catch (err) {
      console.error("Error actualizando estado de atención:", err);
    }
  }, [dispatch, selectedChat, forceReloadChats]);

  useEffect(() => {
    const handleRefreshChats = async () => {
      await forceReloadChats();
      await refreshAttentionStatus();
    };
    window.addEventListener("admin:refresh-chats", handleRefreshChats);
    return () => window.removeEventListener("admin:refresh-chats", handleRefreshChats);
  }, [forceReloadChats, refreshAttentionStatus]);

  useEffect(() => {
    const interval = setInterval(() => { refreshAttentionStatus(); }, 30000);
    return () => clearInterval(interval);
  }, [selectedChat, refreshAttentionStatus]);

  useEffect(() => {
    loadData();
  }, [loadData, forceRefreshKey]);

  useEffect(() => {
    if (!selectedUserId || !isInitialized) return;
    if (prevSelectedUserIdRef.current === selectedUserId) return;
    prevSelectedUserIdRef.current = selectedUserId;
    const chatToSelect = chats.find(
      (chat) => chat.user?.id === selectedUserId || chat.user?.id === parseInt(selectedUserId),
    );
    if (chatToSelect) {
      dispatch(selectChat(chatToSelect));
      dispatch(startLoadMessages(selectedUserId));
    } else {
      dispatch(startLoadAllUsers()).then(() => {
        setTimeout(() => {
          const updatedChat = chats.find(
            (chat) => chat.user?.id === selectedUserId || chat.user?.id === parseInt(selectedUserId),
          );
          if (updatedChat) {
            dispatch(selectChat(updatedChat));
            dispatch(startLoadMessages(selectedUserId));
          }
        }, 500);
      });
    }
  }, [selectedUserId, isInitialized, chats, dispatch]);

  useEffect(() => {
    return () => { prevSelectedUserIdRef.current = null; };
  }, []);

  useEffect(() => {
    if (onUnreadCountChange && typeof totalUnread === "number") {
      onUnreadCountChange(totalUnread);
    }
  }, [totalUnread, onUnreadCountChange]);

  useEffect(() => {
    const updateGlobalCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/api/chat/unread-count`, {
          headers: { "x-token": token },
        });
        const data = await res.json();
        if (data.ok && onUnreadCountChange) {
          onUnreadCountChange(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Error actualizando contador global:", err);
      }
    };
    updateGlobalCount();
    const interval = setInterval(updateGlobalCount, 10000);
    return () => clearInterval(interval);
  }, [onUnreadCountChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedChat && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (!selectedChat?.user?.id) return;
    const interval = setInterval(() => {
      dispatch(startLoadMessages(selectedChat.user.id));
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedChat, dispatch]);

  const handleSelectChat = useCallback((chat) => {
    dispatch(selectChat(chat));
    dispatch(startLoadMessages(chat.user.id));
    if (onSelectUser) onSelectUser(chat.user?.id);
  }, [dispatch, onSelectUser]);

  const handleBack = useCallback(() => {
    dispatch(clearSelectedChat());
    prevSelectedUserIdRef.current = null;
    if (onSelectUser) onSelectUser(null);
  }, [dispatch, onSelectUser]);

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat?.user?.id || sending) return;
    setSending(true);
    const messageToSend = newMessage.trim();
    setNewMessage("");
    try {
      const success = await dispatch(startSendAdminMessage(selectedChat.user.id, messageToSend));
      if (success) {
        await dispatch(startLoadMessages(selectedChat.user.id));
        await dispatch(startLoadChats());
        const token = localStorage.getItem("token");
        if (token && onUnreadCountChange) {
          const res = await fetch(`${API_URL}/api/chat/unread-count`, {
            headers: { "x-token": token },
          });
          const data = await res.json();
          if (data.ok) onUnreadCountChange(data.unreadCount);
        }
        await refreshAttentionStatus();
      } else {
        setNewMessage(messageToSend);
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      setNewMessage(messageToSend);
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedChat, sending, dispatch, onUnreadCountChange, refreshAttentionStatus]);

  const handleRefresh = useCallback(async () => {
    if (showAllUsers) {
      await dispatch(startLoadAllUsers());
    } else {
      await dispatch(startLoadChats());
    }
    if (selectedChat?.user?.id) {
      await dispatch(startLoadMessages(selectedChat.user.id));
    }
    await refreshAttentionStatus();
    window.dispatchEvent(new CustomEvent("admin:refresh-complete"));
  }, [dispatch, selectedChat, showAllUsers, refreshAttentionStatus]);

  const toggleUserView = useCallback(() => {
    const newShowAllUsers = !showAllUsers;
    setShowAllUsers(newShowAllUsers);
    if (newShowAllUsers) dispatch(startLoadAllUsers());
    else dispatch(startLoadChats());
  }, [showAllUsers, dispatch]);

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "Ahora";
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = (chat.user?.full_name || "").toLowerCase();
    const username = (chat.user?.username || "").toLowerCase();
    const phone = (chat.user?.phone || "").toLowerCase();
    return fullName.includes(searchLower) || username.includes(searchLower) || phone.includes(searchLower);
  });

  const chatsWithMessages = filteredChats.filter((chat) => chat.hasMessages || !chat.isNewUser);
  const newUsers = filteredChats.filter((chat) => !chat.hasMessages && chat.isNewUser);

  if (!isInitialized && loading) {
    return (
      <div className="admin-loading" style={{ height: "100%" }}>
        <div>
          <div className="admin-spinner" style={{ margin: "0 auto" }} />
          <p className="admin-loading__text">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-chat admin-chat--split">
      {!selectedChat ? (
        <div className="admin-chat__sidebar">
          <div className="admin-chat__sidebar-header">
            <div className="admin-chat__sidebar-top">
              <h2 className="admin-chat__sidebar-title">
                <span className="material-symbols-outlined">chat</span>
                {showAllUsers ? "Todos los Usuarios" : "Chats de Soporte"}
              </h2>
              <div className="admin-chat__sidebar-actions">
                <button
                  className={`admin-btn admin-btn--icon ${showAllUsers ? "admin-btn--primary" : "admin-btn--ghost"}`}
                  onClick={toggleUserView}
                  title={showAllUsers ? "Ver solo chats activos" : "Ver todos los usuarios"}
                >
                  <span className="material-symbols-outlined">person_add</span>
                </button>
                <button
                  className="admin-btn admin-btn--icon admin-btn--ghost"
                  onClick={handleRefresh}
                  disabled={loading}
                  title="Actualizar"
                >
                  <span className="material-symbols-outlined" style={loading ? { animation: "admin-spin 0.6s linear infinite" } : {}}>refresh</span>
                </button>
              </div>
            </div>
            {totalUnread > 0 && !showAllUsers && (
              <span className="admin-chat__unread-badge">
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>mark_email_unread</span>
                {totalUnread} no leídos
              </span>
            )}
          </div>

          <div className="admin-chat__search">
            <div className="admin-input-wrapper">
              <span className="admin-input-wrapper__icon">search</span>
              <input
                type="text"
                className="admin-input"
                placeholder="Buscar por nombre, usuario o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="admin-input-wrapper__clear" onClick={() => setSearchTerm("")} title="Limpiar búsqueda">
                  <span className="admin-input-wrapper__clear-icon">close</span>
                </button>
              )}
            </div>
          </div>

          <div className="admin-chat__user-list">
            {loading && chats.length === 0 ? (
              <div className="admin-loading" style={{ padding: "32px 20px" }}>
                <div>
                  <div className="admin-spinner" style={{ margin: "0 auto" }} />
                  <p className="admin-loading__text">Cargando...</p>
                </div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="admin-empty">
                <span className="admin-empty__icon">chat</span>
                <h3 className="admin-empty__title">No se encontraron resultados</h3>
                <p className="admin-empty__text">
                  {searchTerm ? `No hay usuarios que coincidan con "${searchTerm}"` : "Los clientes aparecerán aquí cuando se registren"}
                </p>
              </div>
            ) : (
              <div>
                {chatsWithMessages.length > 0 && !showAllUsers && (
                  <>
                    <div className="admin-chat__user-group">Conversaciones activas {searchTerm && "(filtrado)"}</div>
                    {chatsWithMessages.map((chat) => (
                      <button
                        key={chat.user?.id}
                        className={`admin-chat__user-item ${chat.unreadCount > 0 ? "admin-chat__user-item--unread" : ""} ${chat.needsAttention ? "admin-chat__user-item--attention" : ""}`}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <span className="admin-chat__user-avatar">account_circle</span>
                        <div className="admin-chat__user-info">
                          <div className="admin-chat__user-top">
                            <span className="admin-chat__user-name">
                              {chat.user?.full_name || chat.user?.username || "Cliente"}
                            </span>
                            <span className="admin-chat__user-time">
                              {chat.lastMessage ? formatTime(chat.lastMessage.created_at) : "Nuevo"}
                            </span>
                          </div>
                          <div className="admin-chat__user-preview">
                            <span className="admin-chat__user-message">
                              {chat.lastMessage?.message || "Sin mensajes aún"}
                            </span>
                            {chat.unreadCount > 0 && (
                              <span className="admin-chat__user-count">{chat.unreadCount}</span>
                            )}
                          </div>
                          {chat.needsAttention && (
                            <div className="admin-chat__user-warning">
                              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>warning</span>
                              Pedido pendiente
                            </div>
                          )}
                          {chat.user?.phone && (
                            <div className="admin-chat__user-phone">
                              <span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "4px", verticalAlign: "middle" }}>phone</span>
                              {chat.user.phone}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {(showAllUsers || newUsers.length > 0) && (
                  <>
                    {!showAllUsers && newUsers.length > 0 && (
                      <div className="admin-chat__user-group">Usuarios sin conversación {searchTerm && "(filtrado)"}</div>
                    )}
                    {(showAllUsers ? filteredChats : newUsers).map((chat) => (
                      <button
                        key={chat.user?.id}
                        className={`admin-chat__user-item ${chat.needsAttention ? "admin-chat__user-item--attention" : ""}`}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <span className="admin-chat__user-avatar">account_circle</span>
                        <div className="admin-chat__user-info">
                          <div className="admin-chat__user-top">
                            <span className="admin-chat__user-name">
                              {chat.user?.full_name || chat.user?.username || "Cliente"}
                            </span>
                          </div>
                          <div style={{ fontFamily: "var(--font-label-sm)", fontSize: "var(--text-label-sm)", lineHeight: "var(--text-label-sm--line-height)", color: "var(--color-on-surface-variant)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "4px" }}>
                            {chat.needsAttention ? (
                              <span className="admin-chat__user-warning" style={{ marginTop: 0 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>warning</span>
                                Pedido sin ubicación - Requiere contacto
                              </span>
                            ) : (
                              <span>
                                <span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "4px", verticalAlign: "middle" }}>edit_note</span>
                                Nuevo usuario - Inicia una conversación
                              </span>
                            )}
                          </div>
                          {chat.user?.phone && (
                            <div className="admin-chat__user-phone">
                              <span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "4px", verticalAlign: "middle" }}>phone</span>
                              {chat.user.phone}
                            </div>
                          )}
                          {chat.user?.address && (
                            <div className="admin-chat__user-phone">
                              <span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "4px", verticalAlign: "middle" }}>location_on</span>
                              {chat.user.address}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-chat__main">
          <div className="admin-chat__conv-header">
            <button className="admin-chat__conv-back" onClick={handleBack}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="admin-chat__conv-info" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--color-on-surface-variant)", flexShrink: 0 }}>account_circle</span>
              <div style={{ minWidth: 0 }}>
                <span className="admin-chat__conv-name">
                  {selectedChat.user?.full_name || selectedChat.user?.username || "Cliente"}
                </span>
                {selectedChat.user?.phone && (
                  <span className="admin-chat__conv-detail">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "4px", verticalAlign: "middle" }}>phone</span>
                    {selectedChat.user.phone}
                  </span>
                )}
                {selectedChat.user?.address && (
                  <span className="admin-chat__conv-detail">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "4px", verticalAlign: "middle" }}>location_on</span>
                    {selectedChat.user.address}
                  </span>
                )}
                {selectedChat.user?.email && (
                  <span className="admin-chat__conv-detail">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "4px", verticalAlign: "middle" }}>mail</span>
                    {selectedChat.user.email}
                  </span>
                )}
              </div>
            </div>
            <button className="admin-btn admin-btn--icon admin-btn--ghost" onClick={handleRefresh} title="Actualizar">
              <span className="material-symbols-outlined" style={loading ? { animation: "admin-spin 0.6s linear infinite" } : {}}>refresh</span>
            </button>
          </div>

          <div className="admin-chat__messages">
            {loading && messages.length === 0 ? (
              <div className="admin-loading" style={{ height: "100%" }}>
                <div>
                  <div className="admin-spinner" style={{ margin: "0 auto" }} />
                  <span className="admin-loading__text">Cargando mensajes...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="admin-chat-empty">
                <span className="admin-chat-empty__icon">chat</span>
                <h4 className="admin-chat-empty__title">Inicia la conversación</h4>
                <p className="admin-chat-empty__text">Este es el primer mensaje. Escribe para contactar al cliente.</p>
                <small style={{ fontFamily: "var(--font-label-sm)", fontSize: "var(--text-label-sm)", lineHeight: "var(--text-label-sm--line-height)", color: "var(--color-on-surface-variant)", margin: "4px 0 0 0", maxWidth: "300px" }}>El cliente recibirá tu mensaje en su chat de soporte.</small>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`admin-chat__message ${msg.sender === "admin" ? "admin-chat__message--sent" : "admin-chat__message--received"}`}>
                  <div className="admin-chat__message-bubble">
                    <p style={{ margin: 0 }}>{msg.message}</p>
                    <div className="admin-chat__message-meta">
                      <span className="admin-chat__message-time">{formatTime(msg.created_at)}</span>
                      {msg.sender === "admin" && (
                        <span className="admin-chat__message-check">done</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="admin-chat__input-area" onSubmit={handleSend}>
            <div className="admin-chat__input-row">
              <input
                ref={inputRef}
                type="text"
                className="admin-chat__input"
                placeholder={`Escribe tu respuesta para ${selectedChat.user?.full_name || "el cliente"}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="admin-chat__send-btn"
                disabled={!newMessage.trim() || sending}
              >
                <span className="admin-chat__send-icon">
                  {sending ? "more_horiz" : "send"}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminChatManager;
