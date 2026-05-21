// components/admin/AdminChatManager/AdminChatManager.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  HiOutlineUserCircle,
  HiOutlinePaperAirplane,
  HiOutlineArrowLeft,
  HiOutlineChat,
  HiOutlineSearch,
  HiOutlineCheck,
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import Swal from "sweetalert2";
import "./AdminChatManager.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const AdminChatManager = ({
  token,
  selectedUserId,
  onSelectUser,
  onUnreadCountChange,
}) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

  // Cargar lista de chats (incluyendo los que necesitan atención)
  const loadChats = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/chat/admin/chats-with-orders`, {
        headers: { "x-token": token },
      });
      const data = await res.json();

      if (data.ok) {
        setChats(data.chats || []);
        const unread = (data.chats || []).reduce(
          (sum, chat) => sum + (chat.noLeidos || 0),
          0,
        );
        setTotalUnread(unread);
        if (onUnreadCountChange) {
          onUnreadCountChange(unread);
        }
      }
    } catch (err) {
      console.error("Error cargando chats:", err);
    }
  }, [token, onUnreadCountChange]);

  // Cargar mensajes de un usuario
  const loadMessages = useCallback(
    async (userId) => {
      if (!token || !userId) return;

      try {
        setLoading(true);
        const res = await fetch(
          `${API_URL}/api/chat/admin/messages/${userId}`,
          {
            headers: { "x-token": token },
          },
        );
        const data = await res.json();

        if (data.ok) {
          setMessages(data.mensajes || []);
          setChats((prev) =>
            prev.map((chat) =>
              chat.user?.id === userId ? { ...chat, noLeidos: 0 } : chat,
            ),
          );
          const remainingUnread = chats.reduce(
            (sum, chat) =>
              chat.user?.id === userId ? sum : sum + (chat.noLeidos || 0),
            0,
          );
          setTotalUnread(remainingUnread);
          if (onUnreadCountChange) {
            onUnreadCountChange(remainingUnread);
          }
        }
      } catch (err) {
        console.error("Error cargando mensajes:", err);
      } finally {
        setLoading(false);
      }
    },
    [token, chats, onUnreadCountChange],
  );

  // Crear chat desde pedido (cuando no existe)
  const createChatFromOrder = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/create-from-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();

      if (data.ok) {
        await loadChats();
        return data.userName;
      }
      return null;
    } catch (err) {
      console.error("Error creando chat:", err);
      return null;
    }
  };

  // Enviar primer mensaje (cuando no hay conversación previa)
  const handleSendFirstMessage = async (userId, message) => {
    if (!message.trim()) return false;

    try {
      const res = await fetch(`${API_URL}/api/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify({
          message: message.trim(),
          receiver_id: userId,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setNewMessage("");
        await loadMessages(userId);
        await loadChats();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo enviar el mensaje",
      });
      return false;
    }
  };

  // Enviar mensaje normal
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat?.user?.id) return;

    // Si es el primer mensaje y no hay mensajes previos
    if (messages.length === 0 && selectedChat.needsFirstMessage) {
      await handleSendFirstMessage(selectedChat.user.id, newMessage);
    } else {
      try {
        const res = await fetch(`${API_URL}/api/chat/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
          body: JSON.stringify({
            message: newMessage.trim(),
            receiver_id: selectedChat.user.id,
          }),
        });
        const data = await res.json();

        if (data.ok) {
          setNewMessage("");
          loadMessages(selectedChat.user.id);
          loadChats();
        }
      } catch (err) {
        console.error("Error enviando mensaje:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo enviar el mensaje",
        });
      }
    }
  };

  // Seleccionar usuario por ID (desde orders)
  useEffect(() => {
    const selectUser = async () => {
      if (selectedUserId && chats.length > 0) {
        let chatToSelect = chats.find(
          (chat) => chat.user?.id === selectedUserId,
        );

        if (!chatToSelect) {
          // Si no existe el chat, crearlo automáticamente
          const userName = await createChatFromOrder(selectedUserId);
          if (userName) {
            // Recargar chats después de crear
            await loadChats();
            // Buscar nuevamente
            chatToSelect = chats.find(
              (chat) => chat.user?.id === selectedUserId,
            );
          }
        }

        if (chatToSelect) {
          setSelectedChat(chatToSelect);
          loadMessages(selectedUserId);
        }
      }
    };

    selectUser();
  }, [selectedUserId, chats, loadMessages, loadChats]);

  // Polling
  useEffect(() => {
    loadChats();

    intervalRef.current = setInterval(() => {
      loadChats();
      if (selectedChat?.user?.id) {
        loadMessages(selectedChat.user.id);
      }
    }, 5000);

    return () => clearInterval(intervalRef.current);
  }, [loadChats, loadMessages, selectedChat]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    loadMessages(chat.user?.id);
    if (onSelectUser) {
      onSelectUser(chat.user?.id);
    }
  };

  const handleBack = () => {
    setSelectedChat(null);
    if (onSelectUser) {
      onSelectUser(null);
    }
    setMessages([]);
  };

  const formatTime = (dateString) => {
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
    return date.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchTerm) return true;
    const name = chat.user?.full_name || chat.user?.username || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="admin-chat">
      {!selectedChat && (
        <>
          <div className="admin-chat__header">
            <h2 className="admin-chat__title">
              <HiOutlineChat className="admin-chat__title-icon" />
              Chats de Soporte
            </h2>
            {totalUnread > 0 && (
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
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="admin-chat__list">
            {filteredChats.length === 0 ? (
              <div className="admin-chat__empty">
                <HiOutlineChat className="admin-chat__empty-icon" />
                <h3>No hay conversaciones</h3>
                <p>Los mensajes de los clientes aparecerán aquí</p>
                <p className="admin-chat__empty-hint">
                  💡 Los pedidos sin ubicación GPS crearán automáticamente un
                  chat
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.user?.id}
                  className={`admin-chat__item ${
                    chat.noLeidos > 0 ? "admin-chat__item--unread" : ""
                  } ${
                    chat.needsFirstMessage
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
                      <span className="admin-chat__item-time">
                        {chat.ultimoMensaje
                          ? formatTime(chat.ultimoMensaje.created_at)
                          : "Nuevo"}
                      </span>
                    </div>
                    <div className="admin-chat__item-footer">
                      <span className="admin-chat__item-preview">
                        {chat.ultimoMensaje?.message ||
                          "🆕 Pedido sin ubicación - Requiere contacto"}
                      </span>
                      {chat.noLeidos > 0 && (
                        <span className="admin-chat__item-badge">
                          {chat.noLeidos}
                        </span>
                      )}
                    </div>
                    {chat.needsFirstMessage && (
                      <div className="admin-chat__item-warning">
                        <HiOutlineExclamationCircle /> Requiere atención
                      </div>
                    )}
                    {chat.user?.address && (
                      <span className="admin-chat__item-address">
                        📍 {chat.user.address}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {selectedChat && (
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
                {selectedChat.needsFirstMessage && (
                  <span className="admin-chat__conv-warning">
                    ⚠️ Pedido pendiente de coordinación
                  </span>
                )}
              </div>
            </div>
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
                  Este cliente necesita ser contactado para coordinar su pedido.
                </p>
                <small>Escribe un mensaje para comenzar...</small>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`admin-chat__message ${
                    msg.sender === "admin"
                      ? "admin-chat__message--admin"
                      : "admin-chat__message--customer"
                  } ${msg.is_auto ? "admin-chat__message--auto" : ""}`}
                >
                  <div className="admin-chat__message-bubble">
                    <p className="admin-chat__message-text">{msg.message}</p>
                    {msg.is_auto && (
                      <span className="admin-chat__auto-badge">
                        🤖 Automático
                      </span>
                    )}
                  </div>
                  <div className="admin-chat__message-meta">
                    <span className="admin-chat__message-time">
                      {formatTime(msg.created_at)}
                    </span>
                    {msg.sender === "admin" && !msg.is_auto && (
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
              type="text"
              className="admin-chat__conv-input-field"
              placeholder={
                messages.length === 0
                  ? "Escribe tu primer mensaje..."
                  : "Escribe tu respuesta..."
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              type="submit"
              className="admin-chat__conv-send"
              disabled={!newMessage.trim()}
            >
              <HiOutlinePaperAirplane />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminChatManager;
