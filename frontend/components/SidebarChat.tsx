"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUp, Bot } from "lucide-react";
import { useNotices } from "@/lib/notices-context";
import { sendChatMessage } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

// ─── Component ──────────────────────────────────────────────────

export function SidebarChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hey! I'm your campus AI. Ask me about schedules, notices, deadlines, or mess timings.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const { notices } = useNotices();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userMsg,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      }));

      const reply = await sendChatMessage(
        userMsg,
        notices.slice(0, 8).map((n) => ({
          title: n.title,
          category: n.category,
          summary: n.summary,
          date: n.date,
          time: n.time,
        })),
        history
      );

      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: "ai", text: reply },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: "ai",
          text: err.message || "Couldn't reach the AI. Is the backend running?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-80 border-l border-neutral-200 dark:border-white/10 bg-white dark:bg-black h-full shrink-0">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-neutral-200 dark:border-white/10 shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-100 dark:bg-[#1a1a1a]">
          <Sparkles className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-none">
            Campus AI
          </h2>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-500 mt-0.5">
            Powered by Groq
          </p>
        </div>
      </div>

      {/* ─── Message Feed ────────────────────────────────────── */}
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

      {/* ─── Input Area ──────────────────────────────────────── */}
      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-neutral-200 dark:border-white/10">
        <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-black px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything..."
            disabled={isLoading}
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
    </aside>
  );
}
