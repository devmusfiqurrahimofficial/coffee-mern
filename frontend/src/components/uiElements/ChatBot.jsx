import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  PaperAirplaneIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { io } from "socket.io-client";
import { useSelector, useDispatch } from "react-redux";
import {
  setMessages,
  setAdminMessages,
  addMessage,
  addAdminMessage,
  setChatSessionId,
  setSendError,
  setIsAdminOnline,
  setIsAdminTyping,
  clearCustomerChat,
  setInput,
} from "../../redux/features/chatSlice/chatSlice";
import { useGetMessagesQuery } from "../../redux/api/chatApi/chatApi";

const API_BASE = import.meta.env.VITE_API_BASE || "https://coffee-mern.onrender.com";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://coffee-mern.onrender.com";

const formatTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const safeFormatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "" : formatTime.format(date);
};

const ChatBot = () => {
  const dispatch = useDispatch();
  const token = localStorage.getItem("access-token");

  const input = useSelector((state) => state.chat.input);
  const messages = useSelector((state) => state.chat.messages);
  const adminMessages = useSelector((state) => state.chat.adminMessages);
  const sendError = useSelector((state) => state.chat.sendError);
  const chatSessionId = useSelector((state) => state.chat.chatSessionId);
  const isAdminTyping = useSelector((state) => state.chat.isAdminTyping);
  const isAdminOnline = useSelector((state) => state.chat.isAdminOnline);

  const [open, setOpen] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Persist chat session across page refreshes so history is not lost
  const savedSessionId = localStorage.getItem("chatSessionId");
  useEffect(() => {
    if (savedSessionId && !chatSessionId) {
      dispatch(setChatSessionId(savedSessionId));
    }
  }, [savedSessionId, chatSessionId, dispatch]);

  const socketRef = useRef(null);
  const adminMessagesEndRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatSessionIdRef = useRef(chatSessionId);
  useEffect(() => {
    chatSessionIdRef.current = chatSessionId;
  }, [chatSessionId]);

  useEffect(() => {
    // Lock body scroll when chat panel is open so the whole screen doesn't scroll
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const { data: historyData, refetch: refetchMessages } = useGetMessagesQuery(chatSessionId, {
    skip: !chatSessionId,
  });

  // Refetch messages whenever the chat session is set/restored (e.g. after page refresh)
  useEffect(() => {
    if (chatSessionId) {
      refetchMessages();
    }
  }, [chatSessionId, refetchMessages]);

  useEffect(() => {
    if (!historyData || !Array.isArray(historyData)) return;
    dispatch(
      setMessages(
        historyData.filter(
          (m) => m.sender === "customer" || m.sender === "user"
        )
      )
    );
    dispatch(
      setAdminMessages(historyData.filter((m) => m.sender === "admin"))
    );
  }, [historyData, dispatch]);

  const handleDragStart = (event) => {
    setIsDragging(true);
  };
  const handleDragMove = (event) => {
    if (!isDragging) return;
    setDragPos({ x: event.clientX - 160, y: event.clientY - 20 });
  };
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!token) return;

    const createChatSession = async () => {
      try {
        const listRes = await fetch(`${API_BASE}/admin/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (listRes.status === 401) {
          localStorage.removeItem("access-token");
          window.location.href = "/login";
          return;
        }
        let sessionId = null;
        if (listRes.ok) {
          const chats = await listRes.json();
          const existing = chats.find(
            (c) =>
              c.customerEmail === localStorage.getItem("userEmail") ||
              c.customer_email === localStorage.getItem("userEmail") ||
              c.email === localStorage.getItem("userEmail")
          );
          if (existing) {
            sessionId = existing._id || existing.id || existing.sessionId;
          }
        }
        if (!sessionId) {
          const res = await fetch(`${API_BASE}/admin/chats`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              customerName: "Customer",
              customerEmail: localStorage.getItem("userEmail") || "",
              status: "active",
            }),
          });
          if (!res.ok) throw new Error("Failed to create chat session");
          const data = await res.json();
          sessionId = data._id || data.id || data.sessionId;
        }
        if (!sessionId) throw new Error("Invalid session id received from server");
        let sid = sessionId;
        if (sid && typeof sid === "object" && sid.$oid) sid = sid.$oid;
        if (typeof sid === "string" && /^[0-9a-fA-F]{24}$/.test(sid)) {
          dispatch(setChatSessionId(sid));
          localStorage.setItem("chatSessionId", sid);
          return sid;
        }
        throw new Error("Invalid session id received from server");
      } catch (error) {
        console.error("Error creating chat session:", error);
        dispatch(setSendError("Unable to start chat session. Please try again."));
        return null;
      }
    };

    const init = async () => {
      // Use saved session from localStorage first to preserve history on refresh
      let sessionId = savedSessionId;
      if (!sessionId) {
        sessionId = await createChatSession();
        if (!sessionId) return;
        localStorage.setItem("chatSessionId", sessionId);
      }
      dispatch(setChatSessionId(sessionId));

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        if (sessionId) {
          socket.emit("join:customer", { sessionId });
        }
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected, attempt:", attemptNumber);
        if (sessionId) {
          socket.emit("join:customer", { sessionId });
        }
      });

      socket.on("reconnect_error", (err) => {
        console.error("Socket reconnect error:", err.message);
      });

      socket.on("reconnect_failed", () => {
        console.error("Socket reconnection failed");
        dispatch(setSendError("Connection lost. Please refresh the page."));
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        if (reason === "io server disconnect") {
          // Server initiated disconnect — will attempt reconnect
          socket.connect();
        }
      });

      socket.on("admin:online", () => {
        dispatch(setIsAdminOnline(true));
      });

      socket.on("admin:offline", () => {
        dispatch(setIsAdminOnline(false));
      });

      socket.on("chat:history", (msgs) => {
        const history = msgs || [];
        dispatch(
          setMessages(
            history.filter(
              (m) => m.sender === "customer" || m.sender === "user"
            )
          )
        );
        dispatch(
          setAdminMessages(history.filter((m) => m.sender === "admin"))
        );
      });

      socket.on("chat:message", (msg) => {
        if (!msg) return;
        // Normalize sessionId comparison (server may send ObjectId string, frontend stores hex)
        const msgSessionId = String(msg.sessionId || "");
        const currentSessionId = String(chatSessionIdRef.current || "");
        if (msgSessionId !== currentSessionId) return;
        if (msg.sender === "customer") {
          dispatch(addMessage(msg));
        } else if (msg.sender === "admin") {
          dispatch(addAdminMessage(msg));
        }
        // Fallback: refetch from API so missed socket messages always recover
        if (chatSessionId) {
          refetchMessages();
        }
      });

      socket.on("chat:typing", ({ isTyping: typing, senderName }) => {
        dispatch(setIsAdminTyping(typing));
      });

      socket.on("chat:error", ({ message }) => {
        console.error("Chat error:", message);
        dispatch(setSendError(message));
      });
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, dispatch]);

  useEffect(() => {
    if (open) {
      const endEl = adminMessagesEndRef.current || messagesEndRef.current;
      if (endEl) {
        endEl.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [messages, adminMessages, open]);

  const sendUserMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userEmail = localStorage.getItem("userEmail") || "Customer";
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      dispatch(setSendError("Not connected to chat server. Please try again."));
      return;
    }

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      text: trimmed,
      sender: "customer",
      senderName: userEmail,
      senderRole: "customer",
      createdAt: new Date().toISOString(),
    };
    dispatch(addMessage(optimisticMsg));
    socket.emit("chat:send", {
      sessionId: chatSessionId,
      text: trimmed,
      sender: "customer",
      senderName: userEmail,
      senderRole: "customer",
    });
    dispatch(setInput(""));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token) {
      dispatch(setSendError("Please log in to chat"));
      return;
    }
    if (!chatSessionId) {
      dispatch(setSendError("No active chat session. Please try again."));
      return;
    }
    sendUserMessage(input);
  };

  const clearChat = () => {
    dispatch(clearCustomerChat());
  };

  if (!token) {
    return (
      <div className="fixed bottom-4 right-4 w-80 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 text-sm text-neutral-600">
        <p className="font-medium text-neutral-900 mb-2">Please log in to chat</p>
        <p className="text-neutral-500">
          You need to be logged in to start a conversation with our support team.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Sticky launcher button */}
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          aria-label="Open support chat"
          onMouseDown={handleDragStart}
          style={{
            position: "fixed",
            top: dragPos.y || window.innerHeight - 100,
            left: dragPos.x || window.innerWidth - 200,
            zIndex: 40,
            cursor: isDragging ? "grabbing" : "grab",
          }}
          className="fixed bottom-1 right-1 z-50 h-10 w-10 rounded-full bg-[#e11d48] flex items-center justify-center p-2 text-white shadow-xl shadow-black/20 transition hover:bg-[#c81a40] md:h-auto md:w-auto md:rounded-full md:px-4 md:py-2.5 md:text-sm md:font-semibold md:gap-2"
        >
          <UserCircleIcon className="h-6 w-6" />
          <span className="hidden md:inline">Support Chat</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <section
          aria-label="Support chat"
          style={{
            position: "fixed",
            width: window.innerWidth < 768 ? "90vw" : "400px",
            maxWidth: window.innerWidth < 768 ? "90vw" : "400px",
            top:
              dragPos.y ||
              (window.innerWidth < 768
                ? (window.innerHeight - 520) / 2
                : window.innerHeight - 600),
            left:
              dragPos.x ||
              (window.innerWidth < 768
                ? (window.innerWidth - 360) / 2
                : window.innerWidth - 400),
            zIndex: 40,
          }}
          className="flex h-[min(560px,calc(100vh-2.5rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-2xl shadow-black/25"
        >
          {/* Header */}
          <header
            className="flex items-center gap-3 bg-[#1d1d1d] px-5 py-4 text-white"
            onMouseDown={handleDragStart}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#e11d48]">
              <UserCircleIcon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold leading-tight">Support Chat</p>
              <p className="flex items-center gap-1.5 text-[11px] text-white/70">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isAdminOnline ? "bg-green-400" : "bg-neutral-500"}`}
                />
                {isAdminOnline ? "Admin online" : "Admin offline"}
              </p>
            </div>
            <button
              type="button"
              onClick={clearChat}
              className="rounded-full px-2 py-1 text-[11px] font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </header>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#EAE7DE] px-4 py-4">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`flex ${item.sender === "user" || item.sender === "customer" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    item.sender === "user" || item.sender === "customer"
                      ? "rounded-br-md bg-[#e11d48] text-white"
                      : "rounded-bl-md bg-white text-[#1d1d1d]"
                  }`}
                >
                  <p className="whitespace-pre-line">{item.text}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      item.sender === "user" || item.sender === "customer"
                        ? "text-white/70"
                        : "text-neutral-400"
                    }`}
                  >
                    {safeFormatTime(item.time)}
                  </p>
                </div>
              </div>
            ))}
            {adminMessages.map((item) => (
              <div key={item.id} className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm rounded-bl-md bg-white text-[#1d1d1d]">
                  <p className="whitespace-pre-line">{item.text}</p>
                  <p className="mt-1 text-[10px] text-neutral-400">
                    {safeFormatTime(item.createdAt || item.time)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={adminMessagesEndRef} />
            {isAdminTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm rounded-bl-md bg-white text-[#1d1d1d]">
                  <p className="text-neutral-400">Admin is typing…</p>
                </div>
              </div>
            )}
            {sendError && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm rounded-bl-md bg-red-50 text-red-700 border border-red-100">
                  <p>{sendError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-black/5 bg-white px-4 py-3"
          >
            <UserCircleIcon className="h-5 w-5 flex-shrink-0 text-neutral-300" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => dispatch(setInput(event.target.value))}
              placeholder="Type your message to support…"
              className="w-full bg-transparent text-sm text-[#1d1d1d] outline-none placeholder:text-neutral-400"
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || !chatSessionId}
              aria-label="Send message"
              className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full transition disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 bg-[#e11d48] text-white hover:bg-[#c81a40]"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </>
  );
};

export default ChatBot;
