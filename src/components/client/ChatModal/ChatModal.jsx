// components/client/ChatModal/ChatModal.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  HiOutlineX,
  HiOutlinePaperAirplane,
  HiOutlineChat,
  HiOutlineUserCircle,
} from "react-icons/hi";
import "./ChatModal.css";

const API_URL = import.meta.env.VITE_API_URL;

const ChatModal = ({ isOpen, onClose, token, userData }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Cargar mensajes
  const loadMessages = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/chat/messages`, {
        headers: { "x-token": token },
      });
      const data = await res.json();

      if (data.ok) {
        setMessages(data.mensajes || []);
      }
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Cargar al abrir
  useEffect(() => {
    if (isOpen) {
      loadMessages();
      // Enfocar input
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, loadMessages]);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling cada 5 segundos
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, loadMessages]);

  // Enviar mensaje
  const handleSend = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !token) return;

    try {
      const res = await fetch(`${API_URL}/api/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      const data = await res.json();

      if (data.ok) {
        setNewMessage("");
        // Recargar mensajes
        await loadMessages();
      }
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      setError("Error al enviar mensaje");
    }
  };

  // Formatear hora
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="chat-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="chat-modal">
        {/* Header */}
        <div className="chat-modal__header">
          <div className="chat-modal__header-left">
            <div className="chat-modal__header-icon">
              <HiOutlineChat />
            </div>
            <div className="chat-modal__header-text">
              <h3 className="chat-modal__title">Soporte FarmaExpress</h3>
              <p className="chat-modal__subtitle">Respondemos en minutos</p>
            </div>
          </div>
          <button
            className="chat-modal__close"
            onClick={onClose}
            aria-label="Cerrar chat"
          >
            <HiOutlineX />
          </button>
        </div>

        {/* Mensajes */}
        <div className="chat-modal__messages">
          {loading && messages.length === 0 && (
            <div className="chat-modal__loading">
              <div className="chat-modal__spinner"></div>
              <span>Cargando conversación...</span>
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="chat-modal__empty">
              <HiOutlineChat className="chat-modal__empty-icon" />
              <h4>¡Bienvenido al soporte!</h4>
              <p>Escribe tu consulta y te responderemos lo antes posible.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.sender === "customer" ? "chat-message--customer" : "chat-message--admin"}`}
            >
              <div className="chat-message__avatar">
                {msg.sender === "customer" ? (
                  <HiOutlineUserCircle />
                ) : (
                  <div className="chat-message__admin-badge">FA</div>
                )}
              </div>
              <div className="chat-message__content">
                <div className="chat-message__bubble">
                  <p className="chat-message__text">{msg.message}</p>
                </div>
                <span className="chat-message__time">
                  {formatTime(msg.created_at)}
                  {msg.sender === "admin" && " • FarmaExpress"}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="chat-modal__error">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Input */}
        <form className="chat-modal__input" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            className="chat-modal__input-field"
            placeholder="Escribe tu mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!token}
          />
          <button
            type="submit"
            className="chat-modal__send-button"
            disabled={!newMessage.trim() || !token}
          >
            <HiOutlinePaperAirplane />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
