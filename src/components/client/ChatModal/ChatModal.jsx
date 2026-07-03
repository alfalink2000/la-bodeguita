import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  startLoadClientMessages,
  startSendClientMessage,
} from "../../../actions/chatActions";
import "./ChatModal.css";

const ChatModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { messages = [], loading = false } =
    useSelector((state) => state.chat) || {};

  // Cargar mensajes al abrir
  useEffect(() => {
    if (isOpen) {
      dispatch(startLoadClientMessages());
    }
  }, [isOpen, dispatch]);

  // Polling cada 5 segundos
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      dispatch(startLoadClientMessages());
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, dispatch]);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enfocar input al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Enviar mensaje
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageToSend = newMessage.trim();
    setNewMessage("");

    const success = await dispatch(startSendClientMessage(messageToSend));
    if (!success) {
      setNewMessage(messageToSend);
    }
    setSending(false);
  };

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isOpen) return null;

  return (
    <div
      className="chat-modal"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Chat de soporte"
    >
      <div className="chat-modal__container">
        {/* ============================================ */}
        {/* HEADER                                        */}
        {/* ============================================ */}
        <header className="chat-modal__header">
          <div className="chat-modal__agent">
            <div className="chat-modal__agent-avatar">
              <span className="chat-modal__agent-avatar-icon material-symbols-outlined">
                support_agent
              </span>
            </div>
            <div className="chat-modal__agent-info">
              <h3 className="chat-modal__agent-name">Elena M.</h3>
              <p className="chat-modal__agent-role">Agente de Soporte</p>
            </div>
          </div>
          <button
            className="chat-modal__close-btn"
            onClick={onClose}
            aria-label="Cerrar chat"
            type="button"
          >
            <span className="chat-modal__close-icon material-symbols-outlined">
              close
            </span>
          </button>
        </header>

        {/* ============================================ */}
        {/* MENSAJES                                      */}
        {/* ============================================ */}
        <div className="chat-modal__messages">
          {/* Loading */}
          {loading && messages.length === 0 && (
            <div className="chat-modal__state">
              <span className="chat-modal__state-icon material-symbols-outlined chat-modal__pulse">
                chat
              </span>
              <span className="chat-modal__state-text">
                Cargando conversación...
              </span>
            </div>
          )}

          {/* Empty */}
          {!loading && messages.length === 0 && (
            <div className="chat-modal__state">
              <span className="chat-modal__state-icon material-symbols-outlined">
                chat
              </span>
              <h4 className="chat-modal__state-title">Bienvenido al soporte</h4>
              <p className="chat-modal__state-description">
                Escribe tu consulta y te responderemos lo antes posible.
              </p>
            </div>
          )}

          {/* Lista de mensajes */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-modal__message ${msg.sender === "customer" ? "chat-modal__message--sent" : "chat-modal__message--received"}`}
            >
              {/* Avatar */}
              <div
                className={`chat-modal__message-avatar ${msg.sender === "customer" ? "chat-modal__message-avatar--sent" : "chat-modal__message-avatar--received"}`}
              >
                <span className="material-symbols-outlined chat-modal__message-avatar-icon">
                  {msg.sender === "customer" ? "person" : "support_agent"}
                </span>
              </div>

              {/* Contenido */}
              <div
                className={`chat-modal__message-content ${msg.sender === "customer" ? "chat-modal__message-content--sent" : "chat-modal__message-content--received"}`}
              >
                <div
                  className={`chat-modal__bubble ${msg.sender === "customer" ? "chat-modal__bubble--sent" : "chat-modal__bubble--received"}`}
                >
                  <p className="chat-modal__bubble-text">{msg.message}</p>
                </div>
                <span className="chat-modal__message-time">
                  {formatTime(msg.created_at)}
                  {msg.sender === "admin" && " · Soporte"}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ============================================ */}
        {/* INPUT                                         */}
        {/* ============================================ */}
        <form className="chat-modal__input" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            className="chat-modal__input-field"
            placeholder="Escribe tu mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            aria-label="Escribe tu mensaje"
            autoComplete="off"
          />
          <button
            type="submit"
            className="chat-modal__send-btn"
            disabled={!newMessage.trim() || sending}
            aria-label="Enviar mensaje"
          >
            <span
              className={`chat-modal__send-icon material-symbols-outlined ${sending ? "chat-modal__send-icon--loading" : ""}`}
            >
              {sending ? "sync" : "send"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
