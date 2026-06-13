"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Send, Loader2, Check, X } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { useNotices } from "@/lib/notices-context";
import { parseNotice } from "@/lib/api";
import { roleToRoutesMap, type AdminRole } from "@/lib/types";
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

export function AddAnnouncementCTA() {
  const { user } = useUser();
  const pathname = usePathname();
  const { addNotice } = useNotices();
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // RBAC: only show if user role has publish access on this route
  if (user.role === "STUDENT") return null;

  const allowedRoutes = roleToRoutesMap[user.role as AdminRole] || [];
  if (!allowedRoutes.includes(pathname)) return null;

  const handlePublish = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);

    try {
      const result = await parseNotice(input.trim());

      const newNotice: Notice = {
        id: `admin-${Date.now()}`,
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
      setExpanded(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // Silently fail for demo — error shown in omni-bar
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!expanded && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpanded(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent text-accent-foreground text-sm font-semibold shadow-xl shadow-accent/30 hover:shadow-accent/40 transition-shadow"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Announcement</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Input Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold text-foreground">
                  Quick Publish — {user.role.replace("ADMIN_", "").replace("_", " ")}
                </span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Textarea */}
            <div className="p-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste the announcement text here... AI will parse & categorize it."
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-accent/40 min-h-[80px]"
                rows={3}
                autoFocus
              />

              <button
                onClick={handlePublish}
                disabled={!input.trim() || isProcessing}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Parsing & Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Parse & Publish
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-success/10 border border-success/20 text-success text-sm font-medium shadow-lg"
          >
            <Check className="w-4 h-4" />
            Announcement published!
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
