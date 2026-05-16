// components/admin/AdminChatManager/AdminChatManager.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  HiOutlineUserCircle,
  HiOutlinePaperAirplane,
  HiOutlineArrowLeft,
  HiOutlineChat,
  HiOutlineSearch,
  HiOutlineCheck,
} from "react-icons/hi";
import "./AdminChatManager.css";

const API_URL = import.meta.env.VITE_API_URL || "https://minimarket-backend-6z9m.onrender.com";

const AdminChatManager = ({ token }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

  // Cargar lista de chats
  const loadChats = useCallback(async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/api/chat/admin/chats`, {
        headers: { "x-token": token },
      });
      const data = await res.json();
      
      if (data.ok) {
        setChats(data.chats || []);
        // Calcular total no leídos
        const unread = (data.chats || []).reduce((sum, chat) => sum + (chat.noLeidos || 0), 0);
        setTotalUnread(unread);
      }
    } catch (err) {
      console.error("Error cargando chats:", err);
    }
  }, [token]);

  // Cargar mensajes de un usuario
  const loadMessages = useCallback(async (userId) => {
    if (!token || !userId) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/chat/admin/messages/${userId}`, {
        headers: { "x-token": token },
      });
      const data = await res.json();
      
      if (data.ok) {
        setMessages(data.mensajes || []);
        // Actualizar contador de no leídos para este chat
        setChats(prev => prev.map(chat => 
          chat.user?.id === userId ? { ...chat, noLeidos: 0 } : chat
        ));
        // Actualizar total
        setTotalUnread(prev => {
          const chatActual = chats.find(c => c.user?.id === userId);
          return Math.max(0, prev - (chatActual?.noLeidos || 0));
        });
      }
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Polling cada 5 segundos
  useEffect(() => {
    loadChats();
    
    intervalRef.current = setInterval(() => {
      loadChats();
      // Si hay un chat seleccionado, recargar sus mensajes
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

  // Seleccionar chat
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    loadMessages(chat.user?.id);
  };

  // Volver a lista
  const handleBack = () => {
    setSelectedChat(null);
    setMessages([]);
  };

  // Enviar mensaje
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat?.user?.id) return;
    
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
      }
    } catch (err) {
      console.error("Error enviando mensaje:", err);
    }
  };

  // Formatear hora
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "Ahora";
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  // Filtrar chats
  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    const name = chat.user?.full_name || chat.user?.username || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="admin-chat">
      {/* Vista de lista de chats */}
      {!selectedChat && (
        <>
          <div className="admin-chat__header">
            <h2 className="admin-chat__title">
              <HiOutlineChat className="admin-chat__title-icon" />
              Chats de Soporte
            </h2>
            {totalUnread > 0 && (
              <span className="admin-chat__unread-badge">{totalUnread} no leídos</span>
            )}
          </div>

          {/* Búsqueda */}
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

          {/* Lista de chats */}
          <div className="admin-chat__list">
            {filteredChats.length === 0 ? (
              <div className="admin-chat__empty">
                <HiOutlineChat className="admin-chat__empty-icon" />
                <h3>No hay conversaciones</h3>
                <p>Los mensajes de los clientes aparecerán aquí</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.user?.id}
                  className={`admin-chat__item ${chat.noLeidos > 0 ? "admin-chat__item--unread" : ""}`}
                  onClick={() => handleSelectChat(chat)}
                >
                  <div className="admin-chat__item-avatar">
                    <HiOutlineUserCircle />
                  </div>
                  <div className="admin-chat__item-content">
                    <div className="admin-chat__item-header">
                      <span className="admin-chat__item-name">
                        {chat.user?.full_name || chat.user?.username || "Cliente"}
                      </span>
                      <span className="admin-chat__item-time">
                        {chat.ultimoMensaje ? formatTime(chat.ultimoMensaje.created_at) : ""}
                      </span>
                    </div>
                    <div className="admin-chat__item-footer">
                      <span className="admin-chat__item-preview">
                        {chat.ultimoMensaje?.message || "Sin mensajes"}
                      </span>
                      {chat.noLeidos > 0 && (
                        <span className="admin-chat__item-badge">{chat.noLeidos}</span>
                      )}
                    </div>
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

      {/* Vista de conversación */}
      {selectedChat && (
        <div className="admin-chat__conversation">
          {/* Header de conversación */}
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
                  {selectedChat.user?.full_name || selectedChat.user?.username || "Cliente"}
                </span>
                {selectedChat.user?.phone && (
                  <span className="admin-chat__conv-phone">📱 {selectedChat.user.phone}</span>
                )}
                {selectedChat.user?.address && (
                  <span className="admin-chat__conv-address">📍 {selectedChat.user.address}</span>
                )}
              </div>
            </div>
          </div>

          {/* Mensajes */}
          <div className="admin-chat__conv-messages">
            {loading && messages.length === 0 ? (
              <div className="admin-chat__conv-loading">
                <div className="admin-chat__conv-spinner"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="admin-chat__conv-empty">
                <p>No hay mensajes aún</p>
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

          {/* Input */}
          <form className="admin-chat__conv-input" onSubmit={handleSend}>
            <input
              type="text"
              className="admin-chat__conv-input-field"
              placeholder="Escribe tu respuesta..."
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