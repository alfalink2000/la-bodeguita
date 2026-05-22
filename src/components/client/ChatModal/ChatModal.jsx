// components/client/ChatModal/ChatModal.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  HiOutlineX,
  HiOutlinePaperAirplane,
  HiOutlineChat,
  HiOutlineUserCircle,
} from "react-icons/hi";
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

  // Polling solo cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      dispatch(startLoadClientMessages());
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, dispatch]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enfocar input al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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

        {/* Input */}
        <form className="chat-modal__input" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            className="chat-modal__input-field"
            placeholder="Escribe tu mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            className="chat-modal__send-button"
            disabled={!newMessage.trim() || sending}
          >
            {sending ? "..." : <HiOutlinePaperAirplane />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
