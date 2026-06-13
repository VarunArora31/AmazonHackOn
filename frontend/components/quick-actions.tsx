"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  MessageCircle,
  Send,
  Shield,
  ChevronRight,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { hostelTimings } from "@/lib/data";
import { useNotices } from "@/lib/notices-context";
import { sendChatMessage } from "@/lib/api";

function HostelTimingsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl border border-border bg-card p-4 card-glow"
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Hostel & Mess
        </h3>
      </div>

      <div className="space-y-1.5">
        {hostelTimings.map((timing) => (
          <div
            key={timing.label}
            className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {timing.active && (
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              )}
              {!timing.active && <span className="w-1.5 h-1.5" />}
              <span
                className={`text-xs ${
                  timing.active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {timing.label}
              </span>
            </div>
            <span
              className={`text-[11px] font-mono ${
                timing.active ? "text-success font-medium" : "text-muted-foreground/70"
              }`}
            >
              {timing.time}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SummarizeButton() {
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const { notices } = useNotices();

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummary(null);

    try {
      const reply = await sendChatMessage(
        "Summarize all current notices in 2-3 short bullet points. Focus on deadlines and urgent items. Be concise.",
        notices.slice(0, 10).map((n) => ({
          title: n.title,
          category: n.category,
          summary: n.summary,
          date: n.date,
          time: n.time,
        })),
        []
      );
      setSummary(reply);
    } catch {
      setSummary("Could not generate summary. Ensure the backend is running on port 5000.");
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl border border-border bg-card p-4 card-glow"
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-warning" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Quick Actions
        </h3>
      </div>

      <button
        onClick={handleSummarize}
        disabled={summarizing}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-accent/5 border border-accent/20 text-xs text-accent hover:bg-accent/10 transition-all disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          {summarizing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
          <span className="font-medium">
            {summarizing ? "Summarizing..." : "Summarize all notices"}
          </span>
        </div>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {summary && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground leading-relaxed"
        >
          <p className="whitespace-pre-wrap">{summary}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function MiniChat() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([
    {
      role: "ai",
      text: "Hey! Ask me about your schedule, notices, or campus events.",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { notices } = useNotices();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    const userMsg = message.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setMessage("");
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      }));

      const reply = await sendChatMessage(
        userMsg,
        notices.slice(0, 10).map((n) => ({
          title: n.title,
          category: n.category,
          summary: n.summary,
          date: n.date,
          time: n.time,
        })),
        history
      );

      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: err.message || "Could not reach AI. Is the backend running?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-2xl border border-border bg-card p-4 flex flex-col card-glow"
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Ask AI
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 max-h-[180px] overflow-y-auto mb-3 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs px-3 py-2 rounded-xl max-w-[88%] leading-relaxed ${
              msg.role === "ai"
                ? "bg-muted text-muted-foreground"
                : "bg-accent/10 text-accent ml-auto border border-accent/20"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask anything..."
          disabled={isLoading}
          className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/40 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="p-2.5 rounded-xl bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-30 shadow-lg shadow-accent/20"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export function QuickActions() {
  return (
    <div className="space-y-4">
      <HostelTimingsCard />
      <SummarizeButton />
      <MiniChat />
    </div>
  );
}
