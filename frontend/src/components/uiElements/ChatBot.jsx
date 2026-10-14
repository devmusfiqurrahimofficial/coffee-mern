import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useGetProductsQuery } from "../../redux/api/productsApi/productsApi";
import { useGetSettingsQuery } from "../../redux/api/settingsApi/settingsApi";

const STORAGE_KEY = "chatbot-history";
const MAX_HISTORY = 50;

const currency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const SUGGESTIONS = [
  "Show me coffee beans",
  "Delivery charges?",
  "How can I pay?",
  "Best sellers?",
  "Where is my order?",
];

const QUICK_LINKS = [
  { label: "Shop", to: "/shop" },
  { label: "Contact", to: "/contact" },
  { label: "My orders", to: "/profile" },
];

const loadHistory = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const saveHistory = (messages) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_HISTORY))
    );
  } catch {
    // storage unavailable — chat simply will not persist
  }
};

const now = () => new Date().toISOString();

const message = (sender, text, extra = {}) => ({
  id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  sender,
  text,
  time: now(),
  ...extra,
});

const has = (text, words) => words.some((word) => text.includes(word));

const buildReply = (rawText, { products, settings }) => {
  const text = ` ${rawText.toLowerCase().replace(/[?!.,]+/g, " ").trim()} `;
  const name = settings?.storeName || "Coffee Mern";

  const findProducts = (terms) =>
    products.filter((product) =>
      terms.some((term) => product.name?.toLowerCase().includes(term))
    );

  const priceOf = (term) => {
    const match = products.find((product) =>
      product.name?.toLowerCase().includes(term)
    );
    return match ? `${match.name} — ${currency(match.price)}` : null;
  };

  const topRated = [...products]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  // Greetings
  if (has(text, ["hi", "hello", "hey", "salam", "assalam", "good morning", "good evening"]) && text.trim().length <= 22) {
    return `Hello! Welcome to ${name}. I can help you find products, prices, delivery details and more. What are you looking for?`;
  }

  // Thanks / bye
  if (has(text, ["thank", "thanks", "thank you"])) {
    return "You're welcome! Let me know if you need anything else. Enjoy your coffee!";
  }
  if (has(text, ["bye", "good bye", "see you"])) {
    return "Goodbye! Your next cup is waiting. See you soon.";
  }

  // Delivery / shipping
  if (has(text, ["delivery", "deliver", "shipping", "ship", "courier", "how long"])) {
    const prices = settings?.deliveryPrices || {};
    return `We offer three options:\n• Standard Delivery — ${currency(
      prices.standard ?? 60
    )} (3-5 business days)\n• Express Delivery — ${currency(
      prices.express ?? 150
    )} (1-2 business days)\n• Store Pickup — ${
      (prices.pickup ?? 0) === 0 ? "Free" : currency(prices.pickup)
    } (ready in 2 hours)\n\nYou pick one at checkout.`;
  }

  // Payment
  if (has(text, ["pay", "payment", "card", "bkash", "nagad", "cash", "cod"])) {
    return "You can pay by Credit / Debit Card or Cash on Delivery. Card details are only used for the transaction — we store just the brand and last 4 digits with your order.";
  }

  // Order status
  if (has(text, ["order status", "my order", "track", "where is my order", "order details"])) {
    return "All your orders live under My Profile → My Orders, where you can see the status (pending, accepted, on process, delivered) with full details. Once accepted, we send it out for delivery and then mark it delivered.";
  }

  // Wishlist
  if (has(text, ["wishlist", "wish list", "favourite", "favorite", "saved"])) {
    return "Tap the heart on any product to save it. Your wishlist lives in My Profile → Wishlist, and you can move items to the cart from there.";
  }

  // Cart
  if (has(text, ["cart", "basket"])) {
    return "You can open the cart anytime from the bag icon in the top menu. Adjust quantities, remove items, then hit Checkout.";
  }

  // Returns / support
  if (has(text, ["return", "refund", "replace", "problem", "issue"])) {
    return "Sorry about that! Please share the details on our Contact page and our team will get back to you — or email us and we will sort it out quickly.";
  }

  // Contact / hours
  if (has(text, ["contact", "email", "phone", "call", "support", "open", "hours"])) {
    return `You can reach us on the Contact page${
      settings?.supportEmail ? ` or at ${settings.supportEmail}` : ""
    }${settings?.phone ? ` / ${settings.phone}` : ""}. We reply to every message.`;
  }

  // Recommendations
  if (has(text, ["best", "recommend", "popular", "top", "suggestion", "what should"])) {
    if (topRated.length === 0) return "Our catalogue is brand new — check the Shop page for everything we offer!";
    return `Customer favourites right now:\n${topRated
      .map((p, index) => `${index + 1}. ${p.name} — ${currency(p.price)}`)
      .join("\n")}\n\nSee the full list in the Shop.`;
  }

  // Price question
  if (has(text, ["price", "cost", "how much", "rate"])) {
    const words = text.split(" ").filter((word) => word.length > 3);
    for (const word of words) {
      const match = priceOf(word);
      if (match) return `${match} — you can order it from the product page.`;
    }
    return "Tell me the product name and I will check the price for you.";
  }

  // Product search
  if (has(text, ["show", "find", "search", "looking for", "do you have", "have any", "latte", "coffee", "espresso", "tea", "beans", "machine", "grinder"])) {
    const words = text.split(" ").filter((word) => word.length > 3);
    const stopWords = ["show", "find", "search", "looking", "have", "want", "need", "please", "some", "with"];
    const terms = words.filter((word) => !stopWords.includes(word));
    const matches = (terms.length ? findProducts(terms) : products).slice(0, 3);

    if (matches.length === 0) {
      return `I could not find that in our catalogue. Popular picks: ${topRated
        .slice(0, 2)
        .map((p) => p.name)
        .join(", ")}. Ask me for something else!`;
    }

    return `Here is what I found:\n${matches
      .map((p) => `• ${p.name} — ${currency(p.price)}`)
      .join("\n")}\n\nOpen the Shop to see all ${products.length} products.`;
  }

  // Fallback
  return `I am the ${name} assistant. You can ask me about products, prices, delivery charges, payment options, or your orders — or pick one of the suggestions below.`;
};

const ChatBot = () => {
  const { data: products = [] } = useGetProductsQuery();
  const { data: settings } = useGetSettingsQuery();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    const history = loadHistory();
    return history.length > 0
      ? history
      : [
          message(
            "bot",
            "Hi there! I am your Coffee Mern assistant. Ask me about products, prices, delivery or your orders."
          ),
        ];
  });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping, open]);

  const send = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, message("user", trimmed)]);
    setInput("");
    setIsTyping(true);

    const reply = buildReply(trimmed, { products, settings });
    const delay = Math.min(1200, 450 + reply.length * 4);

    window.setTimeout(() => {
      setMessages((current) => [...current, message("bot", reply)]);
      setIsTyping(false);
    }, delay);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    send(input);
  };

  const clearChat = () => {
    setMessages([
      message(
        "bot",
        "Chat cleared. How can I help you with your coffee today?"
      ),
    ]);
  };

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    []
  );

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
          aria-label="Open chat assistant"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#1d1d1d] py-3.5 pl-4 pr-5 text-sm font-semibold text-white shadow-xl shadow-black/20 transition hover:scale-105 hover:bg-[#e11d48]"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6" />
          <span className="hidden sm:inline">Ask us anything</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <section
          aria-label="Chat assistant"
          className="fixed bottom-5 right-5 z-40 flex h-[min(560px,calc(100vh-2.5rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-2xl shadow-black/25"
        >
          {/* Header */}
          <header className="flex items-center gap-3 bg-[#1d1d1d] px-5 py-4 text-white">
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#e11d48]">
              <SparklesIcon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold leading-tight">Coffee Assistant</p>
              <p className="flex items-center gap-1.5 text-[11px] text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Online — replies instantly
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
                className={`flex ${item.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    item.sender === "user"
                      ? "rounded-br-md bg-[#e11d48] text-white"
                      : "rounded-bl-md bg-white text-[#1d1d1d]"
                  }`}
                >
                  <p className="whitespace-pre-line">{item.text}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      item.sender === "user" ? "text-white/70" : "text-neutral-400"
                    }`}
                  >
                    {formattedTime.format(new Date(item.time))}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400"
                      style={{ animationDelay: `${dot * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-1.5 border-t border-black/5 bg-white px-4 pt-3">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="rounded-full border border-black/10 px-3 py-1.5 text-[11px] font-medium text-neutral-600 transition hover:border-[#e11d48] hover:text-[#e11d48]"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-3 bg-white px-4 pb-2 pt-2 text-[11px]">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="font-semibold text-neutral-400 transition hover:text-[#e11d48]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-black/5 bg-white px-4 py-3"
          >
            <FaceSmileIcon className="h-5 w-5 flex-shrink-0 text-neutral-300" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your message…"
              className="w-full bg-transparent text-sm text-[#1d1d1d] outline-none placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#e11d48] text-white transition hover:bg-[#c81a40] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
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
