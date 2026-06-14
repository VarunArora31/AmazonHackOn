"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, AlertTriangle, Check, Copy } from "lucide-react";
import { parseNotice } from "@/lib/api";
import { useNotices } from "@/lib/notices-context";
import { useUser } from "@/lib/user-context";
import type { Notice, NoticeCategory, Urgency } from "@/lib/data";

function mapCategory(cat: string): NoticeCategory {
  const map: Record<string, NoticeCategory> = {
    Academics: "Academics",
    Placement: "Placement",
    Hostel: "Hostel Admin",
    "Club Event": "Club Event",
    General: "General",
  };
  return map[cat] || "General";
}

function mapUrgency(urg: string): Urgency {
  const map: Record<string, Urgency> = {
    Critical: "critical",
    High: "high",
    Medium: "normal",
    Low: "low",
  };
  return map[urg] || "normal";
}

interface ParseResult {
  title: string;
  category: string;
  urgency: string;
  date: string | null;
  time: string | null;
  summary: string;
}

export function OmniBar() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParseResult | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { addNotice } = useNotices();
  const { user } = useUser();

  // Only show for admins
  useEffect(() => {
    async function check() {
      try {
        const { getCurrentUser, isAdminEmail } = await import("@/lib/auth");
        const u = await getCurrentUser();
        if (u?.email && isAdminEmail(u.email)) {
          setIsAdmin(true);
        }
      } catch {}
    }
    check();
  }, []);

  // Don't render for students
  if (!isAdmin) return null;

  const handleParse = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setError(null);
    setParsedPreview(null);

    try {
      const result = await parseNotice(input.trim());

      if (isAdmin) {
        // Admin: show preview card before publishing
        setParsedPreview(result);
      } else {
        // Student: add directly to feed
        publishNotice(result);
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse. Is the backend running?");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const publishNotice = (result: ParseResult) => {
    const newNotice: Notice = {
      id: `parsed-${Date.now()}`,
      title: result.title,
      summary: result.summary,
      category: mapCategory(result.category),
      urgency: mapUrgency(result.urgency),
      date: result.date || new Date().toISOString().split("T")[0],
      time:
        result.time ||
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      rawSource: input,
    };

    addNotice(newNotice);
    setInput("");
    setParsedPreview(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-muted-foreground">
            {isAdmin
              ? "Paste any notice to parse, categorize, and publish"
              : "Paste any messy notice, forwarded message, or unstructured text"}
          </span>
        </div>

        {/* Input area */}
        <div className="omni-glow relative rounded-2xl border border-border bg-card overflow-hidden">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleParse();
            }}
            placeholder='e.g. "Fwd: Chief Warden - Tomorrow mess timing changed, breakfast 8-10am, dinner will be served till 10pm due to fest..."'
            className="w-full bg-transparent px-5 pt-4 pb-14 text-sm text-card-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none min-h-[90px]"
            rows={3}
          />

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20 backdrop-blur-sm">
            <span className="text-[11px] text-muted-foreground">
              {input.length > 0
                ? `${input.length} chars · Ctrl+Enter to submit`
                : "Natural language input"}
            </span>

            <button
              onClick={handleParse}
              disabled={!input.trim() || isProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse with AI</span>
                  <Send className="w-3 h-3 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading skeleton (admin view) */}
        <AnimatePresence>
          {isProcessing && isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
                <span className="text-xs text-muted-foreground">
                  AI is parsing your text...
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Parsed Preview Card (admin view) */}
        <AnimatePresence>
          {parsedPreview && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mt-4 rounded-xl border border-accent/30 bg-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-accent">
                  ✨ Parsed Result
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(parsedPreview, null, 2))}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  title="Copy JSON"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div className="px-3 py-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Title</span>
                  <p className="font-medium text-foreground mt-0.5 truncate">
                    {parsedPreview.title}
                  </p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Category</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {parsedPreview.category}
                  </p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Urgency</span>
                  <p className={`font-medium mt-0.5 ${
                    parsedPreview.urgency === "Critical" ? "text-destructive" :
                    parsedPreview.urgency === "High" ? "text-orange-400" :
                    "text-foreground"
                  }`}>
                    {parsedPreview.urgency}
                  </p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {parsedPreview.date || "—"}
                  </p>
                </div>
                <div className="px-3 py-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">Time</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {parsedPreview.time || "—"}
                  </p>
                </div>
              </div>

              <div className="px-3 py-2 rounded-lg bg-muted">
                <span className="text-xs text-muted-foreground">Summary</span>
                <p className="text-xs font-medium text-foreground mt-0.5">
                  {parsedPreview.summary}
                </p>
              </div>

              {/* Publish button */}
              <button
                onClick={() => publishNotice(parsedPreview)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/30 text-success text-xs font-semibold hover:bg-success/20 transition-all"
              >
                <Check className="w-4 h-4" />
                Publish to Feed
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-12 left-0 right-0 flex justify-center"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success text-sm font-medium">
                <Check className="w-3.5 h-3.5" />
                {isAdmin ? "Published to campus feed!" : "Notice added to your feed"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-12 left-0 right-0 flex justify-center"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
