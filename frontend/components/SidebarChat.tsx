"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUp, Trash2, X, MessageCircle } from "lucide-react";
import { useNotices } from "@/lib/notices-context";
import { useChat } from "@/lib/chat-context";

// ─── Types ──────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp?: number;
}

const WELCOME_MSG: Message = {
  id: "welcome",
  role: "ai",
  text: "Hey! I'm your campus AI. Ask me about schedules, notices, deadlines, or mess timings.",
};

// ─── Storage Helpers ────────────────────────────────────────────

function getChatStorageKey(): string {
  if (typeof window === "undefined") return "campus_chat_messages";
  try {
    const key = localStorage.getItem("_chat_user_key");
    return key || "campus_chat_messages";
  } catch {
    return "campus_chat_messages";
  }
}

function loadMessages(): Message[] {
  if (typeof window === "undefined") return [WELCOME_MSG];
  try {
    const key = getChatStorageKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as Message[];
      if (parsed.length > 0) return parsed;
    }
  } catch {}
  return [WELCOME_MSG];
}

function saveMessages(messages: Message[]) {
  try {
    const key = getChatStorageKey();
    const toSave = messages.slice(-50);
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch {}
}

// ─── Component ──────────────────────────────────────────────────

export function SidebarChat() {
  const { isChatOpen: isOpen, openChat, closeChat } = useChat();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const { notices } = useNotices();
  const initialLoadDone = useRef(false);

  // Load saved messages + set up per-user key on mount
  useEffect(() => {
    async function init() {
      try {
        const { getCurrentUser } = await import("@/lib/auth");
        const user = await getCurrentUser();
        if (user) {
          const userKey = `campus_chat_${user.id}`;
          localStorage.setItem("_chat_user_key", userKey);
        }
      } catch {}
      const loaded = loadMessages();
      setMessages(loaded);
      initialLoadDone.current = true;
    }
    init();
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    if (!initialLoadDone.current) return;
    saveMessages(messages);
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeChat();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MSG]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userMsg,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      }));

      let reply: string;
      const today = new Date().toISOString().split("T")[0];
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      const tomorrow = tmrw.toISOString().split("T")[0];

      const currentNotices = notices.filter((n) => n.date === today || n.date === tomorrow);
      const olderNotices = notices.filter((n) => n.date !== today && n.date !== tomorrow);

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          notices: currentNotices.slice(0, 15).map((n) => ({
            title: n.title,
            category: n.category,
            summary: n.summary,
            date: n.date,
            time: n.time,
            urgency: n.urgency,
          })),
          olderNotices: olderNotices.slice(0, 10).map((n) => ({
            title: n.title,
            category: n.category,
            date: n.date,
          })),
          today,
          history,
        }),
      });
      const chatData = await chatRes.json();

      if (chatData.success && chatData.reply) {
        reply = chatData.reply;
      } else {
        try {
          const ragRes = await fetch("/api/ai/rag", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: userMsg }),
          });
          const ragData = await ragRes.json();
          if (ragData.success && ragData.answer) {
            reply = ragData.answer;
          } else {
            reply = "Couldn't get a response. Try again.";
          }
        } catch {
          reply = "Couldn't get a response. Try again.";
        }
      }

      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: "ai", text: reply, timestamp: Date.now() },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: "ai",
          text: err.message || "Couldn't reach the AI. Is the backend running?",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Unread indicator (messages since last close)
  const hasMessages = messages.length > 1;

  // Track drag state to distinguish click from drag
  const isDragging = useRef(false);

  return (
    <>
      {/* ─── Floating Draggable Trigger Button ────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={() => { setTimeout(() => { isDragging.current = false; }, 100); }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { if (!isDragging.current) openChat(); }}
            style={{ touchAction: "none" }}
            className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black shadow-lg cursor-grab active:cursor-grabbing"
          >
            <MessageCircle className="w-5 h-5 pointer-events-none" />
            {hasMessages && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-black pointer-events-none" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Slide-in Chat Panel (no backdrop blur) ──────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-away layer (transparent, no blur) */}
            <div
              onClick={() => closeChat()}
              className="fixed inset-0 z-40"
            />

            {/* Panel */}
            <motion.aside
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed top-0 right-0 z-50 flex flex-col w-full sm:w-[22rem] h-full border-l border-neutral-200 dark:border-white/10 bg-white dark:bg-black shadow-2xl dark:shadow-none"
            >
              {/* ─── Header ──────────────────────────────────── */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-neutral-200 dark:border-white/10 shrink-0">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-100 dark:bg-[#1a1a1a]">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-none">
                    Campus AI
                  </h2>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-500 mt-0.5">
                    Powered by Groq
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 1 && (
                    <button
                      onClick={clearChat}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                      title="Clear chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => closeChat()}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    title="Close (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ─── Message Feed ────────────────────────────── */}
              <div
                ref={feedRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] text-[13px] leading-relaxed px-3.5 py-2.5 ${
                          msg.role === "user"
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-black rounded-2xl rounded-tr-sm"
                            : "bg-neutral-100 text-neutral-800 dark:bg-[#1a1a1a] dark:text-neutral-200 rounded-2xl rounded-tl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Loading indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-100 dark:bg-[#1a1a1a] rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* ─── Input Area ──────────────────────────────── */}
              <div className="shrink-0 px-3 pb-3 pt-2 border-t border-neutral-200 dark:border-white/10">
                <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-black px-4 py-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask anything..."
                    disabled={isLoading}
                    autoFocus
                    className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black shrink-0 hover:opacity-80 transition-opacity disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[9px] text-neutral-400 dark:text-neutral-600 text-center mt-1.5">
                  AI can make mistakes. Verify important info.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
