// actions/chatActions.js - VERSIÓN OPTIMIZADA
import { types } from "../types/types";
import Swal from "sweetalert2";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://minimarket-backend-6z9m.onrender.com";

const fetchWithToken = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-token": token,
      ...options.headers,
    },
  });
  return response.json();
};

// 🔥 OPTIMIZACIÓN: Acciones síncronas agrupadas
export const setLoading = (isLoading) => ({
  type: types.chatSetLoading,
  payload: isLoading,
});
export const loadChats = (chats) => ({
  type: types.chatLoadChats,
  payload: chats,
});
export const loadMessages = (messages) => ({
  type: types.chatLoadMessages,
  payload: messages,
});
export const selectChat = (chat) => ({
  type: types.chatSelectChat,
  payload: chat,
});
export const clearSelectedChat = () => ({ type: types.chatClearSelected });
export const addMessage = (message) => ({
  type: types.chatAddMessage,
  payload: message,
});
export const updateUnreadCount = (count) => ({
  type: types.chatUpdateUnreadCount,
  payload: count,
});
export const resetChat = () => ({ type: types.chatReset });

// Cargar TODOS los usuarios registrados (para admin)
export const startLoadAllUsers = () => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const data = await fetchWithToken("/api/chat/admin/users");
      if (data.ok && data.users) {
        const chatsFromUsers = data.users.map((user) => ({
          user: {
            id: user.id,
            full_name: user.full_name || user.username,
            username: user.username,
            phone: user.phone,
            address: user.address,
            email: user.email,
          },
          lastMessage: null,
          unreadCount: 0,
          hasMessages: false,
          needsAttention: false,
          isNewUser: true,
        }));

        dispatch(loadChats(chatsFromUsers));
        return chatsFromUsers;
      }
      return [];
    } catch (error) {
      console.error("❌ Error cargando usuarios:", error);
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// Cargar todos los chats (admin)
export const startLoadChats = () => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const data = await fetchWithToken("/api/chat/admin/chats");

      if (data?.ok) {
        const chats = data.chats || [];
        const totalUnread = chats.reduce(
          (sum, chat) => sum + (chat.unreadCount || 0),
          0,
        );

        dispatch(loadChats(chats));
        dispatch(updateUnreadCount(totalUnread));
      } else {
        await dispatch(startLoadAllUsers());
      }
    } catch (error) {
      console.error("❌ Error en startLoadChats:", error);
      await dispatch(startLoadAllUsers());
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// Cargar mensajes de un usuario específico
export const startLoadMessages = (userId) => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const data = await fetchWithToken(`/api/chat/admin/messages/${userId}`);
      if (data.ok) {
        dispatch(loadMessages(data.messages || []));
      }
    } catch (error) {
      console.error("❌ Error cargando mensajes:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// Enviar mensaje como admin
export const startSendAdminMessage = (userId, message) => {
  return async (dispatch) => {
    try {
      const data = await fetchWithToken("/api/chat/admin/send", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, message: message.trim() }),
      });

      if (data.ok) {
        dispatch(addMessage(data.message));
        await dispatch(startLoadChats());
        return true;
      } else {
        Swal.fire("Error", data.msg, "error");
        return false;
      }
    } catch (error) {
      console.error("❌ Error enviando mensaje:", error);
      Swal.fire("Error", "Error de conexión", "error");
      return false;
    }
  };
};

// Cargar mensajes del cliente
export const startLoadClientMessages = () => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const data = await fetchWithToken("/api/chat/messages");
      if (data.ok) {
        dispatch(loadMessages(data.messages || []));
      }
    } catch (error) {
      console.error("❌ Error cargando mensajes:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// Enviar mensaje como cliente
export const startSendClientMessage = (message) => {
  return async (dispatch) => {
    try {
      const data = await fetchWithToken("/api/chat/send", {
        method: "POST",
        body: JSON.stringify({ message: message.trim() }),
      });

      if (data.ok) {
        dispatch(addMessage(data.message));
        return true;
      } else {
        Swal.fire("Error", data.msg, "error");
        return false;
      }
    } catch (error) {
      console.error("❌ Error enviando mensaje:", error);
      Swal.fire("Error", "Error de conexión", "error");
      return false;
    }
  };
};

// Obtener contador de no leídos
export const startGetUnreadCount = () => {
  return async (dispatch) => {
    try {
      const data = await fetchWithToken("/api/chat/unread-count");
      if (data.ok) {
        dispatch(updateUnreadCount(data.unreadCount || 0));
      }
    } catch (error) {
      console.error("❌ Error obteniendo contador:", error);
    }
  };
};
