// reducers/chatReducer.js - VERSIÓN OPTIMIZADA (sin cambios, ya está bien)
import { types } from "../types/types";

const initialState = {
  chats: [],
  selectedChat: null,
  messages: [],
  loading: false,
  unreadCount: 0,
};

export const chatReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.chatSetLoading:
      return { ...state, loading: action.payload };

    case types.chatLoadChats:
      return { ...state, chats: action.payload };

    case types.chatLoadMessages:
      return { ...state, messages: action.payload };

    case types.chatSelectChat:
      return { ...state, selectedChat: action.payload, messages: [] };

    case types.chatClearSelected:
      return { ...state, selectedChat: null, messages: [] };

    case types.chatAddMessage:
      return { ...state, messages: [...state.messages, action.payload] };

    case types.chatUpdateUnreadCount:
      return { ...state, unreadCount: action.payload };

    case types.chatReset:
      return initialState;

    default:
      return state;
  }
};
