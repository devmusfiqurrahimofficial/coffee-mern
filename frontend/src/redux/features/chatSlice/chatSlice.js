import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Customer chat (ChatBot.jsx)
  messages: [],          // customer-sent messages in current session
  adminMessages: [],     // admin replies in current session
  sendError: null,
  chatSessionId: "",     // active session id for this customer

  // Admin chat (AdminChat.jsx)
  chats: [],             // list of all customer conversations
  selectedSession: null, // currently selected conversation
  activeMessages: [],    // messages within selectedSession

  // Shared UI state
  input: "",
  adminInput: "",
  isAdminOnline: false,
  isAdminTyping: false,
  unreadCount: 0,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // --- Customer chat ---
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      const msg = action.payload;
      const exists = state.messages.some(
        (m) =>
          String(m._id) === String(msg._id) ||
          String(m.id) === String(msg.id) ||
          (m.text === msg.text && String(m.createdAt) === String(msg.createdAt))
      );
      if (!exists) state.messages.push(msg);
    },
    addAdminMessage: (state, action) => {
      const msg = action.payload;
      const exists = state.adminMessages.some(
        (m) =>
          String(m._id) === String(msg._id) ||
          String(m.id) === String(msg.id) ||
          (m.text === msg.text && String(m.createdAt) === String(msg.createdAt))
      );
      if (!exists) state.adminMessages.push(msg);
    },
    setChatSessionId: (state, action) => {
      state.chatSessionId = action.payload;
    },
    setAdminMessages: (state, action) => {
      state.adminMessages = action.payload;
    },
    setSendError: (state, action) => {
      state.sendError = action.payload;
    },
    clearCustomerChat: (state) => {
      state.messages = [];
      state.adminMessages = [];
      state.chatSessionId = "";
      state.sendError = null;
    },

    // --- Admin chat ---
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    setSelectedSession: (state, action) => {
      state.selectedSession = action.payload;
    },
    setActiveMessages: (state, action) => {
      state.activeMessages = action.payload;
    },
    addActiveMessage: (state, action) => {
      const msg = action.payload;
      const exists = state.activeMessages.some(
        (m) =>
          String(m._id) === String(msg._id) ||
          String(m.id) === String(msg.id) ||
          (m.text === msg.text && String(m.createdAt) === String(msg.createdAt))
      );
      if (!exists) state.activeMessages.push(msg);
    },
    setAdminInput: (state, action) => {
      state.adminInput = action.payload;
    },
    clearAdminChat: (state) => {
      state.chats = [];
      state.selectedSession = null;
      state.activeMessages = [];
      state.unreadCount = 0;
    },

    // --- Shared UI ---
    setInput: (state, action) => {
      state.input = action.payload;
    },
    setIsAdminOnline: (state, action) => {
      state.isAdminOnline = action.payload;
    },
    setIsAdminTyping: (state, action) => {
      state.isAdminTyping = action.payload;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    resetUnreadCount: (state) => {
      state.unreadCount = 0;
    },
  },
});

export const {
  setMessages,
  addMessage,
  addAdminMessage,
  setChatSessionId,
  setAdminMessages,
  setSendError,
  clearCustomerChat,
  setChats,
  setSelectedSession,
  setActiveMessages,
  addActiveMessage,
  setAdminInput,
  clearAdminChat,
  setInput,
  setIsAdminOnline,
  setIsAdminTyping,
  setUnreadCount,
  incrementUnreadCount,
  resetUnreadCount,
} = chatSlice.actions;

export default chatSlice.reducer;