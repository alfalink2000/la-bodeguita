// components/admin/AdminChatManager/AdminChatManager.jsx - VERSIÓN OPTIMIZADA
import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  HiOutlineUserCircle,
  HiOutlinePaperAirplane,
  HiOutlineArrowLeft,
  HiOutlineChat,
  HiOutlineSearch,
  HiOutlineCheck,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineUserAdd,
} from "react-icons/hi";
import {
  startLoadChats,
  selectChat,
  clearSelectedChat,
  startLoadMessages,
  startSendAdminMessage,
  startLoadAllUsers,
} from "../../../actions/chatActions";
import "./AdminChatManager.css";

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
            if (pedido.user_id) {
              usersNeedingAttention.add(pedido.user_id);
            }
          }
        });

        if (
          selectedChat?.user?.id &&
          !usersNeedingAttention.has(selectedChat.user.id)
        ) {
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
    return () =>
      window.removeEventListener("admin:refresh-chats", handleRefreshChats);
  }, [forceReloadChats, refreshAttentionStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshAttentionStatus();
    }, 30000);
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
      (chat) =>
        chat.user?.id === selectedUserId ||
        chat.user?.id === parseInt(selectedUserId),
    );

    if (chatToSelect) {
      dispatch(selectChat(chatToSelect));
      dispatch(startLoadMessages(selectedUserId));
    } else {
      dispatch(startLoadAllUsers()).then(() => {
        setTimeout(() => {
          const updatedChat = chats.find(
            (chat) =>
              chat.user?.id === selectedUserId ||
              chat.user?.id === parseInt(selectedUserId),
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
    return () => {
      prevSelectedUserIdRef.current = null;
    };
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
          const count = data.unreadCount || 0;
          onUnreadCountChange(count);
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

  const handleSelectChat = useCallback(
    (chat) => {
      dispatch(selectChat(chat));
      dispatch(startLoadMessages(chat.user.id));
      if (onSelectUser) {
        onSelectUser(chat.user?.id);
      }
    },
    [dispatch, onSelectUser],
  );

  const handleBack = useCallback(() => {
    dispatch(clearSelectedChat());
    prevSelectedUserIdRef.current = null;
    if (onSelectUser) {
      onSelectUser(null);
    }
  }, [dispatch, onSelectUser]);

  const handleSend = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedChat?.user?.id || sending) return;

      setSending(true);
      const messageToSend = newMessage.trim();
      setNewMessage("");

      try {
        const success = await dispatch(
          startSendAdminMessage(selectedChat.user.id, messageToSend),
        );
        if (success) {
          await dispatch(startLoadMessages(selectedChat.user.id));
          await dispatch(startLoadChats());

          const token = localStorage.getItem("token");
          if (token && onUnreadCountChange) {
            const res = await fetch(`${API_URL}/api/chat/unread-count`, {
              headers: { "x-token": token },
            });
            const data = await res.json();
            if (data.ok) {
              onUnreadCountChange(data.unreadCount);
            }
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
    },
    [
      newMessage,
      selectedChat,
      sending,
      dispatch,
      onUnreadCountChange,
      refreshAttentionStatus,
    ],
  );

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
    if (newShowAllUsers) {
      dispatch(startLoadAllUsers());
    } else {
      dispatch(startLoadChats());
    }
  }, [showAllUsers, dispatch]);

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "Ahora";
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000)
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = (chat.user?.full_name || "").toLowerCase();
    const username = (chat.user?.username || "").toLowerCase();
    const phone = (chat.user?.phone || "").toLowerCase();
    return (
      fullName.includes(searchLower) ||
      username.includes(searchLower) ||
      phone.includes(searchLower)
    );
  });

  const chatsWithMessages = filteredChats.filter(
    (chat) => chat.hasMessages || !chat.isNewUser,
  );
  const newUsers = filteredChats.filter(
    (chat) => !chat.hasMessages && chat.isNewUser,
  );

  if (!isInitialized && loading) {
    return (
      <div className="admin-chat__loading-state">
        <div className="admin-chat__spinner"></div>
        <p>Cargando conversaciones...</p>
      </div>
    );
  }

  return (
    <div className="admin-chat">
      {!selectedChat ? (
        <>
          <div className="admin-chat__header">
            <h2 className="admin-chat__title">
              <HiOutlineChat className="admin-chat__title-icon" />
              {showAllUsers ? "Todos los Usuarios" : "Chats de Soporte"}
            </h2>
            <div className="admin-chat__header-actions">
              <button
                className={`admin-chat__view-toggle ${showAllUsers ? "active" : ""}`}
                onClick={toggleUserView}
                title={
                  showAllUsers
                    ? "Ver solo chats activos"
                    : "Ver todos los usuarios"
                }
              >
                <HiOutlineUserAdd />
              </button>
              <button
                className="admin-chat__refresh-btn"
                onClick={handleRefresh}
                disabled={loading}
                title="Actualizar"
              >
                <HiOutlineRefresh
                  className={loading ? "admin-chat__refresh-spin" : ""}
                />
              </button>
            </div>
            {totalUnread > 0 && !showAllUsers && (
              <span className="admin-chat__unread-badge">
                {totalUnread} no leídos
              </span>
            )}
          </div>

          <div className="admin-chat__search">
            <HiOutlineSearch className="admin-chat__search-icon" />
            <input
              type="text"
              className="admin-chat__search-input"
              placeholder="🔍 Buscar por nombre, usuario o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="admin-chat__search-clear"
                onClick={() => setSearchTerm("")}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          <div className="admin-chat__list">
            {loading && chats.length === 0 ? (
              <div className="admin-chat__loading">
                <div className="admin-chat__spinner"></div>
                <p>Cargando...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="admin-chat__empty">
                <HiOutlineChat className="admin-chat__empty-icon" />
                <h3>No se encontraron resultados</h3>
                <p>
                  {searchTerm
                    ? `No hay usuarios que coincidan con "${searchTerm}"`
                    : "Los clientes aparecerán aquí cuando se registren"}
                </p>
              </div>
            ) : (
              <>
                {chatsWithMessages.length > 0 && !showAllUsers && (
                  <>
                    <div className="admin-chat__section-title">
                      <span>
                        Conversaciones activas {searchTerm && `(filtrado)`}
                      </span>
                    </div>
                    {chatsWithMessages.map((chat) => (
                      <button
                        key={chat.user?.id}
                        className={`admin-chat__item ${chat.unreadCount > 0 ? "admin-chat__item--unread" : ""} ${chat.needsAttention ? "admin-chat__item--needs-attention" : ""}`}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <div className="admin-chat__item-avatar">
                          <HiOutlineUserCircle />
                        </div>
                        <div className="admin-chat__item-content">
                          <div className="admin-chat__item-header">
                            <span className="admin-chat__item-name">
                              {chat.user?.full_name ||
                                chat.user?.username ||
                                "Cliente"}
                            </span>
                            <span className="admin-chat__item-time">
                              {chat.lastMessage
                                ? formatTime(chat.lastMessage.created_at)
                                : "Nuevo"}
                            </span>
                          </div>
                          <div className="admin-chat__item-footer">
                            <span className="admin-chat__item-preview">
                              {chat.lastMessage?.message || "Sin mensajes aún"}
                            </span>
                            {chat.unreadCount > 0 && (
                              <span className="admin-chat__item-badge">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                          {chat.needsAttention && (
                            <div className="admin-chat__item-warning">
                              <HiOutlineExclamationCircle /> Pedido pendiente
                            </div>
                          )}
                          {chat.user?.phone && (
                            <span className="admin-chat__item-address">
                              📱 {chat.user.phone}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {(showAllUsers || newUsers.length > 0) && (
                  <>
                    {!showAllUsers && newUsers.length > 0 && (
                      <div className="admin-chat__section-title">
                        <span>
                          Usuarios sin conversación {searchTerm && `(filtrado)`}
                        </span>
                      </div>
                    )}
                    {(showAllUsers ? filteredChats : newUsers).map((chat) => (
                      <button
                        key={chat.user?.id}
                        className={`admin-chat__item admin-chat__item--new ${chat.needsAttention ? "admin-chat__item--needs-attention" : ""}`}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <div className="admin-chat__item-avatar">
                          <HiOutlineUserCircle />
                        </div>
                        <div className="admin-chat__item-content">
                          <div className="admin-chat__item-header">
                            <span className="admin-chat__item-name">
                              {chat.user?.full_name ||
                                chat.user?.username ||
                                "Cliente"}
                            </span>
                          </div>
                          <div className="admin-chat__item-footer">
                            <span className="admin-chat__item-preview">
                              {chat.needsAttention
                                ? "⚠️ Pedido sin ubicación - Requiere contacto"
                                : "📝 Nuevo usuario - Inicia una conversación"}
                            </span>
                          </div>
                          {chat.user?.phone && (
                            <span className="admin-chat__item-address">
                              📱 {chat.user.phone}
                            </span>
                          )}
                          {chat.user?.address && (
                            <span className="admin-chat__item-address">
                              📍 {chat.user.address}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="admin-chat__conversation">
          <div className="admin-chat__conv-header">
            <button className="admin-chat__back" onClick={handleBack}>
              <HiOutlineArrowLeft />
            </button>
            <div className="admin-chat__conv-user">
              <div className="admin-chat__conv-avatar">
                <HiOutlineUserCircle />
              </div>
              <div className="admin-chat__conv-info">
                <span className="admin-chat__conv-name">
                  {selectedChat.user?.full_name ||
                    selectedChat.user?.username ||
                    "Cliente"}
                </span>
                {selectedChat.user?.phone && (
                  <span className="admin-chat__conv-phone">
                    📱 {selectedChat.user.phone}
                  </span>
                )}
                {selectedChat.user?.address && (
                  <span className="admin-chat__conv-address">
                    📍 {selectedChat.user.address}
                  </span>
                )}
                {selectedChat.user?.email && (
                  <span className="admin-chat__conv-email">
                    ✉️ {selectedChat.user.email}
                  </span>
                )}
              </div>
            </div>
            <button
              className="admin-chat__refresh-small"
              onClick={handleRefresh}
              title="Actualizar"
            >
              <HiOutlineRefresh />
            </button>
          </div>

          <div className="admin-chat__conv-messages">
            {loading && messages.length === 0 ? (
              <div className="admin-chat__conv-loading">
                <div className="admin-chat__conv-spinner"></div>
                <span>Cargando mensajes...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="admin-chat__conv-empty">
                <div className="admin-chat__conv-empty-icon">
                  <HiOutlineChat />
                </div>
                <h4>Inicia la conversación</h4>
                <p>
                  Este es el primer mensaje. Escribe para contactar al cliente.
                </p>
                <small>
                  El cliente recibirá tu mensaje en su chat de soporte.
                </small>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`admin-chat__message ${msg.sender === "admin" ? "admin-chat__message--admin" : "admin-chat__message--customer"}`}
                >
                  <div className="admin-chat__message-bubble">
                    <p className="admin-chat__message-text">{msg.message}</p>
                  </div>
                  <div className="admin-chat__message-meta">
                    <span className="admin-chat__message-time">
                      {formatTime(msg.created_at)}
                    </span>
                    {msg.sender === "admin" && (
                      <span className="admin-chat__message-check">
                        <HiOutlineCheck />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="admin-chat__conv-input" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              className="admin-chat__conv-input-field"
              placeholder={`Escribe tu respuesta para ${selectedChat.user?.full_name || "el cliente"}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              className="admin-chat__conv-send"
              disabled={!newMessage.trim() || sending}
            >
              {sending ? "..." : <HiOutlinePaperAirplane />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminChatManager;
