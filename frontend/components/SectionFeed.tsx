"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Clock,
  GraduationCap,
  Building2,
  Briefcase,
  Users,
  Trophy,
  Info,
  Sparkles,
  MessageCircle,
  Send,
  Loader2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNotices } from "@/lib/notices-context";
import { useUser } from "@/lib/user-context";
import { sendChatMessage } from "@/lib/api";
import type { Notice, NoticeCategory, Urgency } from "@/lib/data";

const categoryConfig: Record<
  NoticeCategory,
  { icon: React.ElementType; color: string; bg: string }
> = {
  "Hostel Admin": { icon: Building2, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  Academics: { icon: GraduationCap, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  Placement: { icon: Briefcase, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  "Club Event": { icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  Sports: { icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  General: { icon: Info, color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20" },
};

const urgencyConfig: Record<Urgency, { dot: string; label: string }> = {
  critical: { dot: "bg-red-500 animate-pulse", label: "Urgent" },
  high: { dot: "bg-orange-500", label: "Important" },
  normal: { dot: "bg-blue-500", label: "" },
  low: { dot: "bg-gray-400", label: "" },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function NoticeCard({ notice }: { notice: Notice }) {
  const cat = categoryConfig[notice.category];
  const urg = urgencyConfig[notice.urgency];
  const Icon = cat.icon;
  const { user } = useUser();

  const showBranchBadge =
    user.role === "STUDENT" && notice.category === "Academics";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="group relative rounded-xl border border-border bg-card p-4 card-glow"
    >
      {(notice.urgency === "critical" || notice.urgency === "high") && (
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${urg.dot}`} />
          {urg.label && (
            <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider">
              {urg.label}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2.5">
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium ${cat.bg} ${cat.color}`}>
          <Icon className="w-3 h-3" />
          {notice.category}
        </div>
        {showBranchBadge && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-[10px] font-semibold text-accent">
            <Sparkles className="w-2.5 h-2.5" />
            Your Branch
          </span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-card-foreground mb-1.5 pr-16 leading-snug">
        {notice.title}
      </h3>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {notice.summary}
      </p>

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{notice.time}</span>
        </div>
        <span>·</span>
        <span>{formatDate(notice.date)}</span>
      </div>
    </motion.div>
  );
}

// ─── Inline AI Chat ─────────────────────────────────────────────

function InlineChat({ filteredNotices }: { filteredNotices: Notice[] }) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Ask me about anything in this feed." },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
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
        filteredNotices.slice(0, 8).map((n) => ({
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
      setMessages((prev) => [...prev, { role: "ai", text: err.message || "Error reaching AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Ask AI about this feed
        </h3>
      </div>

      <div className="space-y-2 max-h-[150px] overflow-y-auto mb-3 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs px-3 py-2 rounded-xl max-w-[85%] leading-relaxed ${
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
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask anything about these notices..."
          disabled={isLoading}
          className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/40 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="p-2.5 rounded-xl bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-30"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Section Feed ──────────────────────────────────────────

interface SectionFeedProps {
  /** If provided, only show notices matching this category */
  category?: NoticeCategory;
  /** Section title override */
  title?: string;
  /** Show inline AI chat */
  showChat?: boolean;
}

export function SectionFeed({
  category,
  title,
  showChat = true,
}: SectionFeedProps) {
  const { notices } = useNotices();
  const searchParams = useSearchParams();
  const dateFilter = searchParams.get("date");

  const filtered = useMemo(() => {
    let result = notices;

    // Category filter
    if (category) {
      result = result.filter((n) => n.category === category);
    }

    // Date filter from calendar
    if (dateFilter) {
      result = result.filter((n) => n.date === dateFilter);
    }

    return result;
  }, [notices, category, dateFilter]);

  return (
    <div className="max-w-2xl">
      {/* Section header */}
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
            {filtered.length} {filtered.length === 1 ? "notice" : "notices"}
          </span>
        </div>
      )}

      {/* Date filter indicator */}
      {dateFilter && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-accent/5 border border-accent/15 text-xs text-accent">
          Filtering by date: <span className="font-semibold">{dateFilter}</span>
          <span className="text-muted-foreground ml-2">
            (click the date again in the calendar to clear)
          </span>
        </div>
      )}

      {/* Cards */}
      <LayoutGroup>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <p className="text-sm text-muted-foreground">
                No notices found{category ? ` in ${category}` : ""}{dateFilter ? ` for ${dateFilter}` : ""}.
              </p>
            </motion.div>
          )}
        </div>
      </LayoutGroup>

      {/* Inline AI Chat */}
      {showChat && filtered.length > 0 && (
        <InlineChat filteredNotices={filtered} />
      )}
    </div>
  );
}
