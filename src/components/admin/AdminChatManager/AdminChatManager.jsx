// components/admin/AdminChatManager/AdminChatManager.jsx
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
  const [showAllUsers, setShowAllUsers] = useState(false); // Toggle para mostrar todos los usuarios
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    chats = [],
    selectedChat = null,
    messages = [],
    loading = false,
    totalUnread = 0,
  } = useSelector((state) => state.chat) || {};

  // Cargar chats al montar
  const loadData = useCallback(async () => {
    try {
      await dispatch(startLoadChats());
      setIsInitialized(true);
    } catch (error) {
      console.error("Error cargando chats:", error);
    }
  }, [dispatch]);

  // Cargar todos los usuarios
  const loadAllUsers = useCallback(async () => {
    try {
      await dispatch(startLoadAllUsers());
      setIsInitialized(true);
    } catch (error) {
      console.error("Error cargando todos los usuarios:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Notificar cambios en el contador de no leídos
  useEffect(() => {
    if (onUnreadCountChange && typeof totalUnread === "number") {
      onUnreadCountChange(totalUnread);
    }
  }, [totalUnread, onUnreadCountChange]);

  // Seleccionar usuario por ID (desde orders)
  useEffect(() => {
    if (!selectedUserId || !dispatch || !isInitialized) return;

    const selectUserById = async () => {
      let currentChats = chats;
      if (currentChats.length === 0) {
        await dispatch(startLoadChats());
        const state = useSelector((state) => state.chat);
        currentChats = state.chats;
      }

      const chatToSelect = currentChats.find(
        (chat) => chat.user?.id === selectedUserId,
      );
      if (chatToSelect) {
        dispatch(selectChat(chatToSelect));
        if (onSelectUser) onSelectUser(selectedUserId);
      }
    };

    selectUserById();
  }, [selectedUserId, dispatch, onSelectUser, isInitialized]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enfocar input al seleccionar chat
  useEffect(() => {
    if (selectedChat && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedChat]);

  const handleSelectChat = useCallback(
    (chat) => {
      console.log("📌 Seleccionando chat del cliente:", chat.user?.id);
      dispatch(selectChat(chat));
      if (onSelectUser) {
        onSelectUser(chat.user?.id);
      }
    },
    [dispatch, onSelectUser],
  );

  const handleBack = useCallback(() => {
    dispatch(clearSelectedChat());
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
    [newMessage, selectedChat, sending, dispatch],
  );

  const handleRefresh = useCallback(async () => {
    if (showAllUsers) {
      await loadAllUsers();
    } else {
      await loadData();
    }
    if (selectedChat?.user?.id) {
      await dispatch(startLoadMessages(selectedChat.user.id));
    }
  }, [dispatch, loadData, loadAllUsers, selectedChat, showAllUsers]);

  const toggleUserView = useCallback(() => {
    setShowAllUsers(!showAllUsers);
    if (!showAllUsers) {
      loadAllUsers();
    } else {
      loadData();
    }
  }, [showAllUsers, loadAllUsers, loadData]);

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
    const name = chat.user?.full_name || chat.user?.username || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Separar chats con mensajes y usuarios nuevos
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
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                <h3>No hay usuarios registrados</h3>
                <p>Los clientes aparecerán aquí cuando se registren</p>
              </div>
            ) : (
              <>
                {/* Mostrar chats activos primero */}
                {chatsWithMessages.length > 0 && !showAllUsers && (
                  <>
                    <div className="admin-chat__section-title">
                      <span>Conversaciones activas</span>
                    </div>
                    {chatsWithMessages.map((chat) => (
                      <button
                        key={chat.user?.id}
                        className={`admin-chat__item ${
                          chat.unreadCount > 0 ? "admin-chat__item--unread" : ""
                        } ${chat.needsAttention ? "admin-chat__item--needs-attention" : ""}`}
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

                {/* Mostrar todos los usuarios (modo lista completa) */}
                {(showAllUsers || newUsers.length > 0) && (
                  <>
                    {!showAllUsers && newUsers.length > 0 && (
                      <div className="admin-chat__section-title">
                        <span>Usuarios sin conversación</span>
                      </div>
                    )}
                    {(showAllUsers ? filteredChats : newUsers).map((chat) => (
                      <button
                        key={chat.user?.id}
                        className={`admin-chat__item admin-chat__item--new ${
                          chat.needsAttention
                            ? "admin-chat__item--needs-attention"
                            : ""
                        }`}
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
        // VISTA DE CONVERSACIÓN
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
                  className={`admin-chat__message ${
                    msg.sender === "admin"
                      ? "admin-chat__message--admin"
                      : "admin-chat__message--customer"
                  }`}
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
