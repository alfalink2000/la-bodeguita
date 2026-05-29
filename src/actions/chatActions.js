// actions/chatActions.js
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

// Cargar TODOS los usuarios registrados (para admin)
export const startLoadAllUsers = () => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const data = await fetchWithToken("/api/chat/admin/users");
      if (data.ok && data.users) {
        // Convertir usuarios a formato de chat
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
          isNewUser: true, // Marcar como usuario sin conversación
        }));

        dispatch(loadChats(chatsFromUsers));
        return chatsFromUsers;
      }
      return [];
    } catch (error) {
      console.error("Error cargando todos los usuarios:", error);
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// ============================================
// ACCIONES SÍNCRONAS
// ============================================
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

export const clearSelectedChat = () => ({
  type: types.chatClearSelected,
});

export const addMessage = (message) => ({
  type: types.chatAddMessage,
  payload: message,
});

export const updateUnreadCount = (count) => ({
  type: types.chatUpdateUnreadCount,
  payload: count,
});

export const resetChat = () => ({
  type: types.chatReset,
});

// ============================================
// ACCIONES ASÍNCRONAS - ADMIN
// ============================================

// Cargar todos los chats (admin)
// Modificar startLoadChats para intentar cargar todos los usuarios si no hay chats
export const startLoadChats = () => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      console.log("📥 Cargando chats...");
      const data = await fetchWithToken("/api/chat/admin/chats");

      if (data && data.ok) {
        const chats = data.chats || [];
        const totalUnread = chats.reduce(
          (sum, chat) => sum + (chat.unreadCount || 0),
          0,
        );

        console.log(
          `✅ Chats cargados: ${chats.length}, No leídos: ${totalUnread}`,
        );
        dispatch(loadChats(chats));
        dispatch(updateUnreadCount(totalUnread));
      } else {
        console.warn(
          "⚠️ No se pudieron cargar los chats, cargando todos los usuarios",
        );
        // Si no hay chats, cargar todos los usuarios
        await dispatch(startLoadAllUsers());
      }
    } catch (error) {
      console.error("❌ Error en startLoadChats:", error);
      // Si hay error, intentar cargar todos los usuarios
      await dispatch(startLoadAllUsers());
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// Cargar mensajes de un usuario específico (admin)
export const startLoadMessages = (userId) => {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const data = await fetchWithToken(`/api/chat/admin/messages/${userId}`);
      if (data.ok) {
        dispatch(loadMessages(data.messages || []));
      }
    } catch (error) {
      console.error("Error cargando mensajes:", error);
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
        // Agregar mensaje optimistamente
        dispatch(addMessage(data.message));
        // Recargar chats para actualizar último mensaje
        await dispatch(startLoadChats());
        return true;
      } else {
        Swal.fire({ icon: "error", title: "Error", text: data.msg });
        return false;
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Error de conexión" });
      return false;
    }
  };
};

// ============================================
// ACCIONES ASÍNCRONAS - CLIENTE
// ============================================

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
      console.error("Error cargando mensajes:", error);
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
        Swal.fire({ icon: "error", title: "Error", text: data.msg });
        return false;
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Error de conexión" });
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
      console.error("Error obteniendo contador:", error);
    }
  };
};
