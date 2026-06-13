"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, AlertTriangle } from "lucide-react";
import { parseNotice } from "@/lib/api";
import { useNotices } from "@/lib/notices-context";
import type { Notice, NoticeCategory, Urgency } from "@/lib/data";

// Map backend response categories to our frontend types
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

export function OmniBar() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotice } = useNotices();

  const handleParse = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      const result = await parseNotice(input.trim());

      // Convert backend response to frontend Notice format
      const newNotice: Notice = {
        id: `parsed-${Date.now()}`,
        title: result.title,
        summary: result.summary,
        category: mapCategory(result.category),
        urgency: mapUrgency(result.urgency),
        date: result.date || new Date().toISOString().split("T")[0],
        time: result.time || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        rawSource: input,
      };

      addNotice(newNotice);
      setInput("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to parse. Is the backend running?");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsProcessing(false);
    }
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
            Paste any messy notice, forwarded message, or unstructured text
          </span>
        </div>

        {/* Input area */}
        <div className="omni-glow relative rounded-2xl border border-border bg-card overflow-hidden transition-all focus-within:border-accent/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleParse();
            }}
            placeholder='e.g. "Fwd: Chief Warden - Tomorrow mess timing changed, breakfast 8-10am, dinner will be served till 10pm due to fest..."'
            className="w-full bg-transparent px-5 pt-4 pb-14 text-sm text-card-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none min-h-[100px] md:min-h-[80px]"
            rows={3}
          />

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {input.length > 0
                  ? `${input.length} characters · Ctrl+Enter to submit`
                  : "Natural language input"}
              </span>
            </div>

            <button
              onClick={handleParse}
              disabled={!input.trim() || isProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
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
                  <Send className="w-3 h-3 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-12 left-0 right-0 flex justify-center"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success text-sm">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Notice extracted and added to your feed
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
