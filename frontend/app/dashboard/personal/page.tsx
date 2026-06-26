"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Plus,
  Check,
  Archive,
  RotateCcw,
  GraduationCap,
  Building2,
  Briefcase,
  Users,
  Trophy,
  Globe,
  Sun,
  Sunset,
  Moon,
  CircleCheck,
  Target,
  ChevronDown,
  Sparkles,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@/lib/user-context";
import { useNotices } from "@/lib/notices-context";
import { useCommandPalette } from "@/lib/command-palette-context";
import { useChat } from "@/lib/chat-context";
import { sortEventsByTime } from "@/lib/sort-utils";
import { useVimNavigation } from "@/hooks/useVimNavigation";
import { ConflictResolver } from "@/components/ConflictResolver";
import { BurnoutPredictor } from "@/components/BurnoutPredictor";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";
import { ExplainableSchedule } from "@/components/ExplainableSchedule";

// ─── Types ──────────────────────────────────────────────────────

type OfficialCategory =
  | "Academics"
  | "Hostel"
  | "Placement"
  | "Club"
  | "Sports"
  | "General";

interface TimelineEvent {
  id: string;
  title: string;
  time: string;
  timeLabel: string;
  type: "official" | "personal";
  category?: OfficialCategory;
  done?: boolean;
  archived?: boolean;
  day: "today" | "tomorrow" | "upcoming";
  dateStr?: string; // YYYY-MM-DD — set for specific-date personal tasks
}

// ─── Category Config (Obsidian & Neon) ──────────────────────────

const categoryMeta: Record<
  OfficialCategory,
  { icon: React.ElementType; color: string; dotColor: string }
> = {
  Academics: { icon: GraduationCap, color: "text-blue-400", dotColor: "bg-blue-400" },
  Hostel: { icon: Building2, color: "text-orange-400", dotColor: "bg-orange-400" },
  Placement: { icon: Briefcase, color: "text-neutral-700", dotColor: "bg-violet-400" },
  Club: { icon: Users, color: "text-emerald-400", dotColor: "bg-emerald-400" },
  Sports: { icon: Trophy, color: "text-amber-400", dotColor: "bg-amber-400" },
  General: { icon: Globe, color: "text-neutral-400", dotColor: "bg-neutral-400" },
};

// ─── Mock Data ──────────────────────────────────────────────────

// ─── Mock Data: Personal Tasks (Student-local, not in global DB) ─

const initialPersonalEvents: TimelineEvent[] = [];

// ─── Helpers ────────────────────────────────────────────────────

function getGreeting(): { text: string; icon: React.ElementType } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", icon: Sun };
  if (hour < 17) return { text: "Good afternoon", icon: Sunset };
  return { text: "Good evening", icon: Moon };
}

/** Convert HH:mm to display label like "2:00 PM" */
function formatTimeLabel(time: string): string {
  const parts = time.split(":");
  if (parts.length < 2) return time;
  let h = parseInt(parts[0]);
  const m = parts[1];
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m} ${period}`;
}

/** Map global NoticeCategory to local OfficialCategory */
function mapNoticeCategoryToLocal(cat: string): OfficialCategory {
  const map: Record<string, OfficialCategory> = {
    "Hostel Admin": "Hostel",
    Academics: "Academics",
    Placement: "Placement",
    "Club Event": "Club",
    Sports: "Sports",
    General: "General",
  };
  return map[cat] || "General";
}

/** Determine if a date is today, tomorrow, or other */
function getRelativeDay(dateStr: string): "today" | "tomorrow" | "upcoming" {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "today";
  if (date.toDateString() === tomorrow.toDateString()) return "tomorrow";
  // Future dates get their own upcoming bucket; past dates fall into today for visibility
  if (date > tomorrow) return "upcoming";
  return "today";
}

// ─── Progress Ring ──────────────────────────────────────────────

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const c = 2 * Math.PI * 18;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-200 dark:text-neutral-800" />
        <motion.circle
          cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className="text-neutral-700 dark:text-neutral-300"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-neutral-900 dark:text-neutral-50">{pct}%</span>
    </div>
  );
}

// ─── Timeline Node ──────────────────────────────────────────────

function TimelineNode({
  event,
  onToggleDone,
  onArchive,
  onDelete,
  isFocused = false,
  timelineIndex = -1,
}: {
  event: TimelineEvent;
  onToggleDone: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete?: (id: string) => void;
  isFocused?: boolean;
  timelineIndex?: number;
}) {
  const isPersonal = event.type === "personal";
  const cat = event.category ? categoryMeta[event.category] : null;
  const Icon = cat?.icon || Target;

  return (
    <motion.div
      layout
      data-timeline-index={timelineIndex}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`group relative flex items-start gap-4 pl-8 pr-4 py-3 rounded-xl border transition-all duration-300 ${
        isFocused
          ? "border-neutral-400 dark:border-white/20 bg-neutral-100 dark:bg-neutral-200/[0.04] ring-1 ring-neutral-900/40 dark:ring-white/20 shadow-md dark:shadow-none scale-[1.01]"
          : event.done
          ? "bg-white dark:bg-neutral-900/30 border-neutral-200/60 dark:border-white/5 opacity-50"
          : "bg-white dark:bg-[#111111] border-neutral-200/60 dark:border-white/[0.05] shadow-sm dark:shadow-none hover:border-neutral-300 dark:hover:border-white/20 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(139,92,246,0.06)]"
      }`}
    >
      {/* Node dot (on the timeline line) */}
      <div className="absolute left-[14px] top-4">
        {isPersonal ? (
          <button
            onClick={() => onToggleDone(event.id)}
            className={`size-3 rounded-sm border transition-all ${
              event.done
                ? "bg-emerald-500 border-emerald-500"
                : "border-neutral-300 dark:border-zinc-600 hover:border-neutral-500 dark:hover:border-white/30"
            }`}
          >
            {event.done && <Check className="w-2 h-2 text-white" />}
          </button>
        ) : (
          <div className={`size-2.5 rounded-full ${cat?.dotColor || "bg-neutral-400 dark:bg-zinc-600"} ring-2 ring-white dark:ring-black`} />
        )}
      </div>

      {/* Time */}
      <div className="shrink-0 w-16">
        <span className={`text-[11px] font-mono tracking-tight ${event.done ? "text-neutral-400 dark:text-neutral-700 line-through" : "text-neutral-500 dark:text-neutral-500"}`}>
          {event.timeLabel}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          {cat && (
            <span className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider ${cat.color}`}>
              <Icon className="w-2.5 h-2.5" />
              {event.category}
            </span>
          )}
          {isPersonal && (
            <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Personal
            </span>
          )}
        </div>
        <p className={`text-[13px] font-medium leading-snug ${event.done ? "line-through text-neutral-400 dark:text-neutral-600" : "text-neutral-900 dark:text-neutral-100"}`}>
          {event.title}
        </p>
      </div>

      {/* Actions (hover reveal) */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-0.5">
        {isPersonal && !event.done && onDelete && (
          <button
            onClick={() => onDelete(event.id)}
            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-colors"
            title="Delete task"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {isPersonal && event.done && (
          <div className="absolute top-3 right-3">
            <CircleCheck className="w-4 h-4 text-emerald-500" />
          </div>
        )}
        {!isPersonal && (
          <button
            onClick={() => onArchive(event.id)}
            className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-white/[0.04] text-neutral-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            title="Archive"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Archive Accordion ──────────────────────────────────────────

function ArchiveAccordion({
  events,
  onRestore,
  onClearAll,
}: {
  events: TimelineEvent[];
  onRestore: (id: string) => void;
  onClearAll?: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (events.length === 0) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="mt-6"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-200/60 dark:border-white/[0.04] bg-white dark:bg-[#111111]/80 hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors"
      >
        <Archive className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600" />
        <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
          Archived
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1a1a1a] text-neutral-600 dark:text-neutral-400 font-medium">
          {events.length}
        </span>
        <div className="flex-1" />
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-1.5">
              <AnimatePresence mode="popLayout">
                {events.map((e) => (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="group flex items-center gap-3 px-3 py-2 rounded-lg border border-neutral-200/60 dark:border-white/[0.03] bg-white dark:bg-neutral-900/30 opacity-50 grayscale hover:opacity-70 hover:grayscale-0 transition-all"
                  >
                    <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-700 w-12">{e.timeLabel}</span>
                    <span className="flex-1 text-xs text-neutral-500 dark:text-neutral-500 truncate">{e.title}</span>
                    <button
                      onClick={() => onRestore(e.id)}
                      className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-neutral-200/10 text-neutral-700 dark:text-neutral-300 transition-all"
                      title="Restore"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-[10px] text-neutral-400 dark:text-neutral-700 italic">
                Muted notices are never deleted. Restore anytime.
              </p>
              {onClearAll && (
                <button
                  onClick={onClearAll}
                  className="text-[10px] text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function PersonalPage() {
  const { user } = useUser();
  const { notices: globalNotices } = useNotices();
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Track if component has mounted (to avoid hydration mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ─── LOCAL State: personal tasks + archive IDs ────────────
  // Persist personal tasks in localStorage per user
  const [personalTasks, setPersonalTasks] = useState<TimelineEvent[]>([]);
  // Archive IDs — persisted to localStorage per user so they survive refresh
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  // Cleared IDs — permanently hidden (like "clear all" in other sections)
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  // Load saved tasks from localStorage on mount (per-user, with midnight cleanup)
  useEffect(() => {
    async function loadTasks() {
      try {
        const { getCurrentUser } = await import("@/lib/auth");
        const authUser = await getCurrentUser();
        const uid = authUser?.id || "anonymous";
        setUserId(uid);

        const key = `personal_tasks_${uid}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed: TimelineEvent[] = JSON.parse(stored);

          // Midnight cleanup logic:
          const todayStr = new Date().toISOString().split("T")[0];
          const cleaned = parsed
            .filter((task) => {
              // Remove completed tasks from previous days (they fade after midnight)
              if (task.done && task.day === "today") {
                // Check if this was marked done on a previous day
                const taskDate = (task as any).completedDate;
                if (taskDate && taskDate !== todayStr) return false;
              }
              return true;
            })
            .map((task) => {
              // Re-evaluate day bucket for tasks that have a specific dateStr
              // (a task saved as "upcoming" for June 18 becomes "today" when that day arrives)
              if ((task as any).dateStr) {
                return { ...task, day: getRelativeDay((task as any).dateStr) };
              }
              // Undone tasks without a specific date stay on "today"
              return { ...task, day: task.done ? task.day : "today" as const };
            });

          setPersonalTasks(cleaned);
        }

        // Restore archive state from localStorage
        const archiveKey = `personal_archive_${uid}`;
        const clearedKey = `personal_archive_cleared_${uid}`;
        const storedArchive = localStorage.getItem(archiveKey);
        const storedCleared = localStorage.getItem(clearedKey);
        if (storedArchive) setArchivedIds(new Set(JSON.parse(storedArchive)));
        if (storedCleared) setClearedIds(new Set(JSON.parse(storedCleared)));
      } catch {}
    }
    loadTasks();
  }, []);

  // Save personal tasks to localStorage whenever they change (per-user)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!userId) return;
    try {
      const key = `personal_tasks_${userId}`;
      localStorage.setItem(key, JSON.stringify(personalTasks));
    } catch {}
  }, [personalTasks, userId]);
  const [newTask, setNewTask] = useState("");

  // ─── PROPAGATION: Merge global official events + personal tasks ──
  // Official events come from the global context (shared across all routes)
  const officialEventsAsTimeline: TimelineEvent[] = useMemo(
    () =>
      globalNotices.map((n) => ({
        id: n.id,
        title: n.title,
        time: n.time,
        timeLabel: formatTimeLabel(n.time),
        type: "official" as const,
        category: mapNoticeCategoryToLocal(n.category),
        day: getRelativeDay(n.date),
        done: false,
      })),
    [globalNotices]
  );

  // Merge: all official + all personal
  const allEvents = useMemo(
    () => [...officialEventsAsTimeline, ...personalTasks],
    [officialEventsAsTimeline, personalTasks]
  );

  // ─── GLOBAL vs LOCAL MUTATION SAFETY ──────────────────────
  // Filter out locally archived and permanently cleared items
  const activeEvents = useMemo(
    () => allEvents.filter((e) => !archivedIds.has(e.id) && !clearedIds.has(e.id)),
    [allEvents, archivedIds, clearedIds]
  );

  const archivedEvents = useMemo(
    () => allEvents.filter((e) => archivedIds.has(e.id) && !clearedIds.has(e.id)),
    [allEvents, archivedIds, clearedIds]
  );

  // ─── Derived timeline data ────────────────────────────────
  const todayEvents = useMemo(
    () => sortEventsByTime(activeEvents.filter((e) => e.day === "today")),
    [activeEvents]
  );
  const tomorrowEvents = useMemo(
    () => sortEventsByTime(activeEvents.filter((e) => e.day === "tomorrow")),
    [activeEvents]
  );
  // Upcoming: specific future dates (beyond tomorrow), grouped by dateStr
  const upcomingGroups = useMemo(() => {
    const upcoming = activeEvents.filter((e) => e.day === "upcoming" && e.dateStr);
    const grouped: Record<string, typeof upcoming> = {};
    for (const e of upcoming) {
      const key = e.dateStr!;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    }
    // Sort groups by date ascending, events within each group by time
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, events]) => ({ dateStr, events: sortEventsByTime(events) }));
  }, [activeEvents]);

  const todayPersonal = todayEvents.filter((e) => e.type === "personal");
  const completedToday = todayPersonal.filter((e) => e.done).length;
  const totalTodayTasks = todayPersonal.length;

  // Separate active vs completed for today
  const todayActive = todayEvents.filter((e) => !e.done);
  const todayCompleted = todayEvents.filter((e) => e.done);

  // ─── Handlers ─────────────────────────────────────────────

  const toggleDone = (id: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    setPersonalTasks((prev) => prev.map((e) =>
      e.id === id
        ? { ...e, done: !e.done, completedDate: !e.done ? todayStr : undefined } as any
        : e
    ));
  };

  // LOCAL archive — persisted to localStorage so it survives refresh/logout
  const archiveEvent = (id: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (userId) {
        localStorage.setItem(`personal_archive_${userId}`, JSON.stringify([...next]));
      }
      return next;
    });
  };

  // Restore from local archive
  const restoreEvent = (id: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      if (userId) {
        localStorage.setItem(`personal_archive_${userId}`, JSON.stringify([...next]));
      }
      return next;
    });
  };

  // Clear all archived items permanently (same as other sections)
  const clearAllArchived = () => {
    setArchivedIds((prev) => {
      setClearedIds((prevCleared) => {
        const next = new Set([...prevCleared, ...prev]);
        if (userId) {
          localStorage.setItem(`personal_archive_cleared_${userId}`, JSON.stringify([...next]));
        }
        return next;
      });
      if (userId) {
        localStorage.setItem(`personal_archive_${userId}`, JSON.stringify([]));
      }
      return new Set();
    });
  };

  const deleteTask = (id: string) => {
    setPersonalTasks((prev) => prev.filter((e) => e.id !== id));
  };

  const addTask = () => {
    if (!newTask.trim()) return;

    const input = newTask.trim();

    // ─── Month name map (longest first to avoid "jun" matching before "june") ──
    const MONTHS: Record<string, number> = {
      january: 1, february: 2, march: 3, april: 4, may: 5,
      june: 6, july: 7, august: 8, september: 9, october: 10,
      november: 11, december: 12,
      jan: 1, feb: 2, mar: 3, apr: 4,
      jun: 6, jul: 7, aug: 8,
      sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
    };

    // Build alternation with longest names first so "june" wins over "jun"
    const monthAlt = [
      "january","february","march","april","may","june","july",
      "august","september","october","november","december",
      "jan","feb","mar","apr","jun","jul","aug","sept","sep","oct","nov","dec",
    ].join("|");

    // ─── Parse specific date ──────────────────────────────
    // Supports: "17June", "17 June", "17th June", "17th of June",
    //           "June 17", "June17", "June 17th"
    //           Optionally preceded by "on "
    let parsedDate: string | null = null;
    let fullDatePhrase = ""; // full text consumed (including optional "on")

    // Pattern 1: [on ][dd][st/nd/rd/th][ of] MONTH[ YYYY]
    const p1 = new RegExp(
      `(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s*(${monthAlt})(?:\\s+(\\d{4}))?`,
      "i"
    );
    // Pattern 2: [on ]MONTH[ dd][st/nd/rd/th][ YYYY]
    const p2 = new RegExp(
      `(?:on\\s+)?(${monthAlt})\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?`,
      "i"
    );

    const m1 = input.match(p1);
    const m2 = input.match(p2);

    // Prefer p1 (day-first) unless p2 matches earlier in the string
    const useM1 = m1 && (!m2 || (m1.index ?? 999) <= (m2.index ?? 999));

    if (useM1 && m1) {
      const d = parseInt(m1[1]);
      const month = MONTHS[m1[2].toLowerCase()];
      const year = m1[3] ? parseInt(m1[3]) : new Date().getFullYear();
      if (d >= 1 && d <= 31 && month) {
        parsedDate = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        fullDatePhrase = m1[0];
      }
    } else if (m2) {
      const month = MONTHS[m2[1].toLowerCase()];
      const d = parseInt(m2[2]);
      const year = m2[3] ? parseInt(m2[3]) : new Date().getFullYear();
      if (d >= 1 && d <= 31 && month) {
        parsedDate = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        fullDatePhrase = m2[0];
      }
    }

    // ─── Determine day bucket ─────────────────────────────
    let dayBucket: "today" | "tomorrow" | "upcoming" = "today";
    if (parsedDate) {
      dayBucket = getRelativeDay(parsedDate);
    } else if (/\btomorrow\b/i.test(input)) {
      dayBucket = "tomorrow";
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      parsedDate = tmrw.toISOString().split("T")[0];
    } else {
      parsedDate = new Date().toISOString().split("T")[0];
    }

    // ─── Remove date phrase from string before parsing time ──
    // This prevents "17" in "17June" from being mistaken for an hour
    const withoutDate = fullDatePhrase
      ? input.replace(fullDatePhrase, "§")   // replace with a safe placeholder
      : input.replace(/\btomorrow\b/gi, "§").replace(/\btoday\b/gi, "§");

    // ─── Parse time ───────────────────────────────────────
    let time = "12:00";
    let timeLabel = "12:00 PM";

    // Match "at 3pm", "at 14:30", "3pm", "3:30pm", "3:30 PM"
    // We use a simple ordered approach: HH:MM first, then H am/pm
    const timeRegex = /(?:at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?|(?:at\s+)?(\d{1,2})\s*(am|pm)/i;
    const tm = withoutDate.match(timeRegex);

    if (tm) {
      if (tm[1] !== undefined) {
        // HH:MM[:am/pm] format
        let h = parseInt(tm[1]);
        const mins = tm[2];
        const p = tm[3]?.toLowerCase();
        if (p === "pm" && h < 12) h += 12;
        else if (p === "am" && h === 12) h = 0;
        time = `${h.toString().padStart(2, "0")}:${mins}`;
        const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
        timeLabel = `${dh}:${mins} ${h >= 12 ? "PM" : "AM"}`;
      } else if (tm[4] !== undefined) {
        // H am/pm format — explicit meridiem required
        let h = parseInt(tm[4]);
        const p = tm[5]?.toLowerCase();
        if (p === "pm" && h < 12) h += 12;
        else if (p === "am" && h === 12) h = 0;
        time = `${h.toString().padStart(2, "0")}:00`;
        const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
        timeLabel = `${dh}:00 ${h >= 12 ? "PM" : "AM"}`;
      }
    }

    // ─── Build clean title ────────────────────────────────
    const titleCleaned = input
      // Remove full date phrase (including leading "on")
      .replace(fullDatePhrase, "")
      // Remove tomorrow/today keywords
      .replace(/\btomorrow\b/gi, "")
      .replace(/\btoday\b/gi, "")
      // Remove time expressions: "at 3pm", "at 14:30", "3:30 PM", "3pm"
      .replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, "")
      .replace(/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/gi, "")
      .replace(/\b\d{1,2}\s*(?:am|pm)\b/gi, "")
      // Clean leftover punctuation and whitespace
      .replace(/\s{2,}/g, " ")
      .trim();

    setPersonalTasks((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        title: titleCleaned || input,
        time,
        timeLabel,
        type: "personal" as const,
        day: dayBucket,
        dateStr: parsedDate ?? undefined,
        done: false,
      },
    ]);
    setNewTask("");
  };

  // ─── Vim Navigation ───────────────────────────────────────
  const { open: openSearch } = useCommandPalette();
  const { isChatOpen } = useChat();

  // Combine today + tomorrow + upcoming into a flat array for vim indexing
  const allVisibleEvents = useMemo(
    () => [...todayEvents, ...tomorrowEvents, ...upcomingGroups.flatMap((g) => g.events)],
    [todayEvents, tomorrowEvents, upcomingGroups]
  );

  const onVimArchive = useCallback(
    (index: number) => {
      const event = allVisibleEvents[index];
      if (event && event.type === "official") archiveEvent(event.id);
    },
    [allVisibleEvents]
  );

  const onVimSelect = useCallback(
    (index: number) => {
      const event = allVisibleEvents[index];
      if (event && event.type === "personal") toggleDone(event.id);
    },
    [allVisibleEvents]
  );

  const { focusedIndex, isFocusActive } = useVimNavigation({
    itemCount: allVisibleEvents.length,
    onArchive: onVimArchive,
    onSelect: onVimSelect,
    onOpenSearch: openSearch,
  });

  const todayLabel = format(new Date(), "EEEE, MMMM d");
  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  const tomorrowLabel = format(tmrw, "EEEE, MMMM d");

  return (
    <LayoutGroup>
      <div className={`relative pl-0 sm:pl-5 space-y-6 transition-all duration-300 ${isChatOpen ? "max-w-3xl" : "max-w-4xl mx-auto"}`}>
        {/* Timeline spine line (desktop only) */}
        <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-px bg-neutral-200 dark:bg-white/10 transition-colors duration-[80ms]" />
        {/* ─── Briefing Hero ─────────────────────────────────── */}
        <motion.section
          layout
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="rounded-2xl border border-neutral-200/60 dark:border-white/[0.05] bg-white dark:bg-[#111111] backdrop-blur-md p-6 shadow-sm dark:shadow-none"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <GreetingIcon className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] text-neutral-500 dark:text-neutral-500 font-medium tracking-wide">
                  {todayLabel}
                </span>
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                {greeting.text}, {user.name}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                {mounted ? `${todayEvents.length} events · ${completedToday}/${totalTodayTasks} tasks done` : "\u00A0"}
              </p>
            </div>
            <ProgressRing completed={completedToday} total={totalTodayTasks} />
          </div>
        </motion.section>

        {/* ─── Quick-Capture (Terminal-style) ─────────────────── */}
        <motion.section
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0" />
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a task... e.g., 'DSA Practice at 6 PM'"
              className="flex-1 bg-transparent border-b border-neutral-200 dark:border-white/10 focus:border-neutral-900 dark:focus:border-neutral-400 transition-colors text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 py-3 outline-none"
            />
            <button
              onClick={addTask}
              disabled={!newTask.trim()}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-semibold transition-all hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </motion.section>

        {/* ─── AI Conflict Resolver ──────────────────────────── */}
        <motion.section
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.08 }}
        >
          <ConflictResolver />
        </motion.section>

        {/* ─── Burnout Prediction ────────────────────────────── */}
        <motion.section
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.09 }}
        >
          <BurnoutPredictor />
        </motion.section>

        {/* ─── What-If Simulator ─────────────────────────────── */}
        <motion.section
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.095 }}
        >
          <WhatIfSimulator />
        </motion.section>

        {/* ─── Explainable AI Schedule ───────────────────────── */}
        <motion.section
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        >
          <ExplainableSchedule />
        </motion.section>

        {/* ─── Today Timeline (Active) ────────────────────────── */}
        <motion.section
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="size-2 rounded-full bg-neutral-800 dark:bg-neutral-200" />
            <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Today
            </h3>
            <div className="flex-1 h-px bg-neutral-200/60 dark:bg-[#1a1a1a]/60" />
            <span className="text-[10px] text-neutral-400 dark:text-neutral-600">{todayActive.length} active</span>
          </div>

          <div className="timeline-line space-y-2">
            <AnimatePresence mode="popLayout">
              {todayActive.map((e, i) => (
                <TimelineNode key={e.id} event={e} onToggleDone={toggleDone} onArchive={archiveEvent} onDelete={e.type === "personal" ? deleteTask : undefined} isFocused={isFocusActive && focusedIndex === i} timelineIndex={i} />
              ))}
            </AnimatePresence>
            {todayActive.length === 0 && (
              <p className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-700">All tasks done for today! 🎉</p>
            )}
          </div>
        </motion.section>

        {/* ─── Completed Today ────────────────────────────────── */}
        {todayCompleted.length > 0 && (
          <motion.section layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="size-2 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Completed Today
              </h3>
              <div className="flex-1 h-px bg-neutral-200/60 dark:bg-[#1a1a1a]/60" />
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{todayCompleted.length}</span>
            </div>
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {todayCompleted.map((e) => (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 0.6, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg border border-neutral-200/50 dark:border-white/5 bg-neutral-50 dark:bg-[#0a0a0a]"
                  >
                    <CircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-xs text-neutral-500 dark:text-neutral-500 line-through flex-1 truncate">{e.title}</span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-600 font-mono">{e.timeLabel}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}

        {/* ─── Tomorrow Timeline ─────────────────────────────── */}
        <motion.section
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="size-2 rounded-full bg-neutral-300 dark:bg-zinc-700" />
            <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
              Tomorrow — {tomorrowLabel}
            </h3>
            <div className="flex-1 h-px bg-neutral-200/60 dark:bg-[#1a1a1a]/60" />
            <span className="text-[10px] text-neutral-400 dark:text-neutral-600">{tomorrowEvents.length}</span>
          </div>

          <div className="timeline-line space-y-2">
            <AnimatePresence mode="popLayout">
              {tomorrowEvents.map((e, i) => {
                const globalIdx = todayEvents.length + i;
                return (
                  <TimelineNode key={e.id} event={e} onToggleDone={toggleDone} onArchive={archiveEvent} isFocused={isFocusActive && focusedIndex === globalIdx} timelineIndex={globalIdx} />
                );
              })}
            </AnimatePresence>
            {tomorrowEvents.length === 0 && (
              <p className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-700">Nothing yet for tomorrow</p>
            )}
          </div>
        </motion.section>

        {/* ─── Upcoming (specific future dates beyond tomorrow) ── */}
        {upcomingGroups.map((group, gi) => {
          const groupStart =
            todayEvents.length +
            tomorrowEvents.length +
            upcomingGroups.slice(0, gi).reduce((acc, g) => acc + g.events.length, 0);
          const groupDate = new Date(group.dateStr + "T00:00:00");
          const groupLabel = format(groupDate, "EEEE, MMMM d");
          return (
            <motion.section
              key={group.dateStr}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.18 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="size-2 rounded-full bg-neutral-200 dark:bg-zinc-800" />
                <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">
                  {groupLabel}
                </h3>
                <div className="flex-1 h-px bg-neutral-200/60 dark:bg-[#1a1a1a]/60" />
                <span className="text-[10px] text-neutral-400 dark:text-neutral-600">{group.events.length}</span>
              </div>
              <div className="timeline-line space-y-2">
                <AnimatePresence mode="popLayout">
                  {group.events.map((e, i) => {
                    const globalIdx = groupStart + i;
                    return (
                      <TimelineNode
                        key={e.id}
                        event={e}
                        onToggleDone={toggleDone}
                        onArchive={archiveEvent}
                        onDelete={e.type === "personal" ? deleteTask : undefined}
                        isFocused={isFocusActive && focusedIndex === globalIdx}
                        timelineIndex={globalIdx}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.section>
          );
        })}

        {/* ─── Archive Drawer ────────────────────────────────── */}
        <ArchiveAccordion events={archivedEvents} onRestore={restoreEvent} onClearAll={clearAllArchived} />
      </div>
    </LayoutGroup>
  );
}
