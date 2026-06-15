"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Loader2, AlertTriangle, Check, X,
  ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday,
} from "date-fns";
import { parseNotice } from "@/lib/api";
import { useNotices } from "@/lib/notices-context";
import type { Notice, NoticeCategory, Urgency } from "@/lib/data";

function mapCategory(cat: string): NoticeCategory {
  const map: Record<string, NoticeCategory> = {
    Academics: "Academics", Placement: "Placement",
    Hostel: "Hostel Admin", "Club Event": "Club Event",
    Sports: "Sports", General: "General",
  };
  return map[cat] || "General";
}

function mapUrgency(urg: string): Urgency {
  const map: Record<string, Urgency> = {
    Critical: "critical", High: "high", Medium: "normal", Low: "low",
  };
  return map[urg] || "normal";
}

interface ParseResult {
  title: string; category: string; urgency: string;
  date: string | null; time: string | null; summary: string;
}

// ─── Custom Select ───────────────────────────────────────────────

function CustomSelect({ label, value, options, onChange, colorMap }: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void; colorMap?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const color = colorMap?.[value] || "text-neutral-900 dark:text-neutral-100";
  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}
        className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-[#1a1a1a] cursor-pointer hover:bg-neutral-200 dark:hover:bg-[#222] transition-colors">
        <span className="block text-[10px] text-neutral-500 dark:text-neutral-500 mb-0.5">{label}</span>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${color}`}>{value}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] shadow-xl overflow-hidden">
            {options.map((opt) => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-white/5 ${
                  opt === value ? "bg-neutral-100 dark:bg-white/5 font-semibold" : ""
                } ${colorMap?.[opt] || "text-neutral-800 dark:text-neutral-200"}`}>
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Custom Date Picker ──────────────────────────────────────────

function safeDate(value: string | null): Date | null {
  if (!value || value === "null" || value === "undefined") return null;
  try {
    const d = new Date(value + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    return d;
  } catch { return null; }
}

function CustomDatePicker({ label, value, onChange }: {
  label: string; value: string | null; onChange: (v: string | null) => void;
}) {
  const parsedValue = safeDate(value);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(parsedValue || new Date());
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      // Check if click is inside trigger or portal calendar
      const portalEl = document.getElementById("omnibar-datepicker-portal");
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        !(portalEl && portalEl.contains(target))
      ) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Position above the trigger, aligned to its right edge
      setPos({
        top: rect.top + window.scrollY - 8,
        left: rect.right + window.scrollX - 268, // 260px wide + 8px gap
      });
    }
    setOpen(!open);
  };

  const monthStart = startOfMonth(month);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const selectedDate = safeDate(value);

  const calendar = (
    <div id="omnibar-datepicker-portal"
      style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999, transform: "translateY(-100%)" }}
    >
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        className="w-[268px] rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] shadow-2xl p-3 mt-[-6px]">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={(e) => { e.stopPropagation(); setMonth(subMonths(month, 1)); }}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </button>
          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            {format(month, "MMMM yyyy")}
          </span>
          <button onClick={(e) => { e.stopPropagation(); setMonth(addMonths(month, 1)); }}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-semibold text-neutral-400 dark:text-neutral-600 py-1">{d}</div>
          ))}
        </div>
        {/* Days */}
        <div className="grid grid-cols-7 gap-px">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, month);
            const isSelected = selectedDate && format(selectedDate, "yyyy-MM-dd") === dateStr;
            const today = isToday(day);
            return (
              <button key={dateStr} disabled={!inMonth}
                onClick={(e) => { e.stopPropagation(); onChange(dateStr); setOpen(false); }}
                className={`flex items-center justify-center py-[7px] rounded-md text-[11px] transition-colors ${
                  !inMonth ? "text-neutral-300 dark:text-neutral-700 pointer-events-none" :
                  isSelected ? "bg-neutral-900 dark:bg-white text-white dark:text-black font-bold" :
                  today ? "ring-1 ring-neutral-900 dark:ring-neutral-400 font-semibold text-neutral-900 dark:text-white" :
                  "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5"
                }`}>
                {format(day, "d")}
              </button>
            );
          })}
        </div>
        {/* Clear */}
        <button onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
          className="mt-2 w-full text-center text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-red-500 transition-colors py-1">
          Clear date
        </button>
      </motion.div>
    </div>
  );

  return (
    <div ref={triggerRef} className="relative">
      <div onClick={handleOpen}
        className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-[#1a1a1a] cursor-pointer hover:bg-neutral-200 dark:hover:bg-[#222] transition-colors">
        <span className="block text-[10px] text-neutral-500 dark:text-neutral-500 mb-0.5">{label}</span>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {parsedValue ? format(parsedValue, "d MMM yyyy") : "—"}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>
      {open && typeof document !== "undefined" && createPortal(
        <AnimatePresence>{calendar}</AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ─── Custom Time Input ───────────────────────────────────────────

function CustomTimeInput({ label, value, onChange }: {
  label: string; value: string | null; onChange: (v: string | null) => void;
}) {
  return (
    <div className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-[#1a1a1a]">
      <span className="block text-[10px] text-neutral-500 dark:text-neutral-500 mb-0.5">{label}</span>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="e.g. 14:00"
        className="block w-full text-sm font-medium text-neutral-900 dark:text-neutral-100 bg-transparent outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

const urgencyColors: Record<string, string> = {
  Critical: "text-red-500",
  High: "text-orange-400",
  Medium: "text-neutral-900 dark:text-neutral-100",
  Low: "text-neutral-500 dark:text-neutral-400",
};

export function OmniBar() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParseResult | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { addNotice } = useNotices();

  useEffect(() => {
    (async () => {
      try {
        const { getCurrentUser, isAdminEmail } = await import("@/lib/auth");
        const u = await getCurrentUser();
        if (u?.email && isAdminEmail(u.email)) setIsAdmin(true);
      } catch {}
    })();
  }, []);

  if (!isAdmin) return null;

  const handleParse = async () => {
    if (!input.trim()) return;
    setIsProcessing(true); setError(null); setParsedPreview(null);
    try {
      // Inject today's date so AI can resolve relative dates like "today", "tomorrow"
      const today = new Date().toISOString().split("T")[0];
      const textWithDate = `[TODAY IS ${today}]\n${input.trim()}`;
      const result = await parseNotice(textWithDate);
      // Sanitize date/time — Groq may return "null" as a string
      setParsedPreview({
        ...result,
        date: result.date === "null" || !result.date ? null : result.date,
        time: result.time === "null" || !result.time ? null : result.time,
      });
    } catch (err: any) {
      setError(err.message || "Failed to parse. Check your connection.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!parsedPreview) return;
    try {
      const { getCurrentUser } = await import("@/lib/auth");
      const user = await getCurrentUser();
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsedPreview.title, summary: parsedPreview.summary,
          category: mapCategory(parsedPreview.category),
          urgency: mapUrgency(parsedPreview.urgency),
          targetBranch: "ALL", targetYear: "ALL",
          authorEmail: user?.email || "",
        }),
      });
    } catch (err) { console.error("[OmniBar] Save failed:", err); }

    addNotice({
      id: `parsed-${Date.now()}`,
      title: parsedPreview.title, summary: parsedPreview.summary,
      category: mapCategory(parsedPreview.category),
      urgency: mapUrgency(parsedPreview.urgency),
      date: parsedPreview.date || new Date().toISOString().split("T")[0],
      time: parsedPreview.time || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
      rawSource: input,
    } as Notice);

    setInput(""); setParsedPreview(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-muted-foreground">Paste any notice to parse, categorize, and publish</span>
        </div>

        {/* Input */}
        <div className="relative rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden">
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleParse(); }}
            placeholder='e.g. "Fwd: Chief Warden - Tomorrow mess timing changed, breakfast 8-10am, dinner will be served till 10pm..."'
            className="w-full bg-transparent px-5 pt-4 pb-14 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 resize-none focus:outline-none min-h-[90px]"
            rows={3} />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t border-neutral-200/60 dark:border-white/[0.04] bg-neutral-50/80 dark:bg-black/30">
            <span className="text-[11px] text-neutral-400 dark:text-neutral-600">
              {input.length > 0 ? `${input.length} chars · Ctrl+Enter` : "Natural language input"}
            </span>
            <button onClick={handleParse} disabled={!input.trim() || isProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
              {isProcessing ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Parsing...</span></>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /><span>Parse with AI</span><Send className="w-3 h-3" /></>
              )}
            </button>
          </div>
        </div>

        {/* Loading */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />
                <span className="text-xs text-neutral-500 dark:text-neutral-400">AI is parsing your text...</span>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-neutral-100 dark:bg-[#1a1a1a] rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-neutral-100 dark:bg-[#1a1a1a] rounded animate-pulse" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Parsed Preview — editable, theme-aware */}
        <AnimatePresence>
          {parsedPreview && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-white/[0.05]">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                  Parsed — edit if needed
                </span>
                <button onClick={() => setParsedPreview(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                  title="Discard">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {/* Editable Title */}
                <div className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-[#1a1a1a]">
                  <span className="block text-[10px] text-neutral-500 dark:text-neutral-500 mb-0.5">Title</span>
                  <input value={parsedPreview.title}
                    onChange={(e) => setParsedPreview({ ...parsedPreview, title: e.target.value })}
                    className="block w-full text-sm font-medium text-neutral-900 dark:text-neutral-100 bg-transparent outline-none border-b border-transparent focus:border-neutral-300 dark:focus:border-white/20 transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <CustomSelect label="Category" value={parsedPreview.category}
                    options={["Academics","Placement","Hostel","Club Event","Sports","General"]}
                    onChange={(v) => setParsedPreview({ ...parsedPreview, category: v })} />
                  <CustomSelect label="Urgency" value={parsedPreview.urgency}
                    options={["Critical","High","Medium","Low"]}
                    onChange={(v) => setParsedPreview({ ...parsedPreview, urgency: v })}
                    colorMap={urgencyColors} />
                  <CustomDatePicker label="Date" value={parsedPreview.date}
                    onChange={(v) => setParsedPreview({ ...parsedPreview, date: v })} />
                  <CustomTimeInput label="Time" value={parsedPreview.time}
                    onChange={(v) => setParsedPreview({ ...parsedPreview, time: v })} />
                </div>

                {/* Editable Summary */}
                <div className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-[#1a1a1a]">
                  <span className="block text-[10px] text-neutral-500 dark:text-neutral-500 mb-0.5">Summary</span>
                  <textarea value={parsedPreview.summary} rows={2}
                    onChange={(e) => setParsedPreview({ ...parsedPreview, summary: e.target.value })}
                    className="block w-full text-sm font-medium text-neutral-900 dark:text-neutral-100 bg-transparent outline-none resize-none border-b border-transparent focus:border-neutral-300 dark:focus:border-white/20 transition-colors" />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button onClick={handlePublish}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition-opacity">
                    <Check className="w-3.5 h-3.5" /> Publish to Feed
                  </button>
                  <button onClick={() => setParsedPreview(null)}
                    className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                    Discard
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-12 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                <Check className="w-3.5 h-3.5" /> Published to campus feed!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-12 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
