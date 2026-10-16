import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSelector, useDispatch } from "react-redux";
import {
  setChats,
  setSelectedSession,
  setActiveMessages,
  addActiveMessage,
  setAdminInput,
  setUnreadCount,
  incrementUnreadCount,
  resetUnreadCount,
} from "../../../redux/features/chatSlice/chatSlice";
import { useGetChatsQuery, useGetMessagesQuery } from "../../../redux/api/chatApi/chatApi";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const formatTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const AdminChat = () => {
  const dispatch = useDispatch();
  const token = localStorage.getItem("access-token");
  const userEmail = localStorage.getItem("userEmail") || "Admin";

  const chats = useSelector((state) => state.chat.chats);
  const selectedSession = useSelector((state) => state.chat.selectedSession);
  const activeMessages = useSelector((state) => state.chat.activeMessages);
  const adminInput = useSelector((state) => state.chat.adminInput);
  const unreadCount = useSelector((state) => state.chat.unreadCount);

  const [isTyping, setIsTyping] = useState(false);
  const [isAdminOnline] = useState(true);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedSessionRef = useRef(selectedSession);
  useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);

  const { data: chatsData } = useGetChatsQuery(undefined, { skip: !token });
  const { data: messagesData } = useGetMessagesQuery(selectedSession, {
    skip: !selectedSession,
  });

  useEffect(() => {
    if (!chatsData || !Array.isArray(chatsData)) return;
    const deduped = chatsData.reduce((acc, chat) => {
      const email = chat.customerEmail || chat.customer_name || chat.email;
      if (!acc.some((c) => (c.customerEmail || c.customer_name || c.email) === email)) {
        acc.push(chat);
      }
      return acc;
    }, []);
    dispatch(setChats(deduped));
  }, [chatsData, dispatch]);

  useEffect(() => {
    if (!messagesData || !Array.isArray(messagesData)) return;
    dispatch(setActiveMessages(messagesData));
    dispatch(resetUnreadCount());
    const socket = socketRef.current;
    if (socket && selectedSession) {
      socket.emit("chat:read", { sessionId: selectedSession });
    }
  }, [messagesData, dispatch, selectedSession]);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      console.log("Admin socket connected:", socket.id);
      if (selectedSessionRef.current) {
        socket.emit("join:admin", { sessionId: selectedSessionRef.current });
      }
    });
    socket.on("chat:message", (msg) => {
      if (
        selectedSessionRef.current &&
        String(msg.sessionId) === String(selectedSessionRef.current)
      ) {
        dispatch(addActiveMessage(msg));
        if (msg.sender !== "admin") dispatch(incrementUnreadCount());
      }
    });
    socket.on("chat:read", ({ sessionId }) => {
      if (String(sessionId) === String(selectedSessionRef.current)) {
        dispatch(resetUnreadCount());
      }
    });
    socket.on("chat:error", ({ message }) => console.error("Chat error:", message));
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, dispatch]);

  useEffect(() => {
    if (selectedSessionRef.current) {
      const socket = socketRef.current;
      if (socket) {
        socket.emit("join:admin", { sessionId: selectedSessionRef.current });
      }
    }
  }, [selectedSession]);

  const selectSession = (session) => {
    dispatch(setSelectedSession(session._id || session.id));
    dispatch(setActiveMessages([]));
    dispatch(resetUnreadCount());
  };

  const resolveChat = async () => {
    if (!selectedSession) return;
    try {
      await fetch(`${API_BASE}/admin/chats/${selectedSession}/resolve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch(
        setChats(
          chats.map((c) =>
            (c._id || c.id) === selectedSession
              ? { ...c, status: "resolved" }
              : c
          )
        )
      );
      dispatch(setSelectedSession(null));
      dispatch(setActiveMessages([]));
    } catch (error) {
      console.error("Error resolving chat:", error);
    }
  };

  const activeChat = chats.find((c) => (c._id || c.id) === selectedSession);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!adminInput.trim() || !selectedSession) return;
    const socket = socketRef.current;
    if (!socket) {
      console.error("Socket not connected");
      return;
    }
    const message = {
      text: adminInput.trim(),
      sessionId: selectedSession,
      sender: "admin",
      senderName: userEmail,
      senderRole: "admin",
      createdAt: new Date().toISOString(),
    };
    socket.emit("chat:send", message);
    dispatch(setAdminInput(""));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isAdminOnline ? "bg-green-500" : "bg-neutral-400"}`} />
          <h2 className="text-lg font-semibold text-neutral-800">Live Chat Support</h2>
        </div>
        <div className="text-xs text-neutral-500">
          {chats.length} active chat{chats.length !== 1 ? "s" : ""}
          {unreadCount > 0 && (
            <span className="ml-2 text-[#e11d48] font-medium">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-black/5 bg-neutral-50 flex flex-col">
          <div className="p-4 border-b border-black/5">
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
              Conversations
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chats.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-8">
                No active chats
              </p>
            ) : (
              chats.map((chat) => {
                const isActive = (chat._id || chat.id) === selectedSession;
                const unread = chat.unreadCount || 0;
                return (
                  <div
                    key={chat._id || chat.id}
                    onClick={() => selectSession(chat)}
                    className={`cursor-pointer p-3 rounded-lg transition ${isActive ? "bg-[#e11d48]/10 border border-[#e11d48]/30" : "hover:bg-neutral-100"} border border-transparent`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-neutral-800">
                        {chat.customerName || "Customer"}
                      </span>
                      {unread > 0 && (
                        <span className="text-[10px] bg-[#e11d48] text-white px-1.5 py-0.5 rounded-full">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 truncate">
                      {chat.customerEmail || ""}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {chat.status === "resolved" ? "Resolved" : "Active"}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white">
          {!selectedSession ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium">Select a customer to start chatting</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-black/5 bg-[#f3f4f6] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-800">
                    Chatting with {activeChat?.customerName || "Customer"}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeChat?.status === "resolved" ? "bg-neutral-200 text-neutral-600" : "bg-green-100 text-green-700"}`}
                  >
                    {activeChat?.status === "resolved" ? "Resolved" : "Active"}
                  </span>
                </div>
                <button
                  onClick={resolveChat}
                  disabled={activeChat?.status === "resolved"}
                  className="text-[10px] font-medium text-[#e11d48] hover:underline disabled:text-neutral-400"
                >
                  Resolve Chat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={messagesEndRef}>
                {activeMessages.length === 0 && (
                  <p className="text-xs text-neutral-400 text-center py-8">
                    No messages yet. Start the conversation!
                  </p>
                )}
                {activeMessages.map((msg) => (
                  <div
                    key={msg._id || msg.text + msg.createdAt}
                    className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === "admin" ? "bg-[#e11d48] text-white rounded-bl-none" : "bg-[#f3f4f6] text-neutral-800 rounded-br-none"}`}
                    >
                      <p className="text-sm whitespace-pre-line">{msg.text}</p>
                      <p className="mt-1 text-[10px] opacity-70">
                        {msg.sender === "admin" ? "You" : msg.senderName || "Customer"} •{" "}
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-1 p-3 bg-[#f3f4f6] rounded-2xl rounded-bl-none w-fit">
                    <span className="text-xs text-neutral-500">Customer typing…</span>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
              <form
                onSubmit={sendMessage}
                className="flex items-center gap-2 border-t border-black/5 bg-white px-4 py-3"
              >
                <input
                  type="text"
                  value={adminInput}
                  onChange={(e) => dispatch(setAdminInput(e.target.value))}
                  placeholder="Type your reply…"
                  className="w-full bg-transparent text-sm text-[#1d1d1d] outline-none placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  disabled={!adminInput.trim()}
                  className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#e11d48] text-white transition hover:bg-[#c81a40] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
