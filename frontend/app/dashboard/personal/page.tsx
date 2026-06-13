"use client";

import { useState, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@/lib/user-context";
import { useNotices } from "@/lib/notices-context";
import { useCommandPalette } from "@/lib/command-palette-context";
import { sortEventsByTime } from "@/lib/sort-utils";
import { useVimNavigation } from "@/hooks/useVimNavigation";
import { AiScheduleOptimizer } from "@/components/AiScheduleOptimizer";

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
  day: "today" | "tomorrow";
}

// ─── Category Config (Obsidian & Neon) ──────────────────────────

const categoryMeta: Record<
  OfficialCategory,
  { icon: React.ElementType; color: string; dotColor: string }
> = {
  Academics: { icon: GraduationCap, color: "text-blue-400", dotColor: "bg-blue-400" },
  Hostel: { icon: Building2, color: "text-orange-400", dotColor: "bg-orange-400" },
  Placement: { icon: Briefcase, color: "text-violet-400", dotColor: "bg-violet-400" },
  Club: { icon: Users, color: "text-emerald-400", dotColor: "bg-emerald-400" },
  Sports: { icon: Trophy, color: "text-amber-400", dotColor: "bg-amber-400" },
  General: { icon: Globe, color: "text-zinc-400", dotColor: "bg-zinc-400" },
};

// ─── Mock Data ──────────────────────────────────────────────────

// ─── Mock Data: Personal Tasks (Student-local, not in global DB) ─

const initialPersonalEvents: TimelineEvent[] = [
  { id: "p1", title: "DSA Practice — Graphs & Trees", time: "06:00", timeLabel: "6:00 AM", type: "personal", day: "today" },
  { id: "p2", title: "Meet Harsh for project discussion", time: "12:30", timeLabel: "12:30 PM", type: "personal", day: "today" },
  { id: "p3", title: "Gym — Leg day", time: "18:00", timeLabel: "6:00 PM", type: "personal", day: "today" },
  { id: "p4", title: "Call home", time: "21:00", timeLabel: "9:00 PM", type: "personal", day: "today" },
  { id: "p5", title: "Resume update for Microsoft", time: "08:00", timeLabel: "8:00 AM", type: "personal", day: "tomorrow" },
  { id: "p6", title: "Library — Return DBMS book", time: "14:00", timeLabel: "2:00 PM", type: "personal", day: "tomorrow" },
];

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
function getRelativeDay(dateStr: string): "today" | "tomorrow" {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "today";
  if (date.toDateString() === tomorrow.toDateString()) return "tomorrow";
  // Default older/future events to "today" for visibility in demo
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
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-200 dark:text-zinc-800" />
        <motion.circle
          cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className="text-indigo-500 dark:text-violet-500"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-stone-800 dark:text-zinc-100">{pct}%</span>
    </div>
  );
}

// ─── Timeline Node ──────────────────────────────────────────────

function TimelineNode({
  event,
  onToggleDone,
  onArchive,
  isFocused = false,
  timelineIndex = -1,
}: {
  event: TimelineEvent;
  onToggleDone: (id: string) => void;
  onArchive: (id: string) => void;
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
          ? "border-indigo-500/50 dark:border-violet-500/50 bg-indigo-50 dark:bg-violet-500/[0.04] ring-1 ring-indigo-500/40 dark:ring-violet-500/40 shadow-md dark:shadow-[0_0_20px_rgba(139,92,246,0.1)] scale-[1.01]"
          : event.done
          ? "bg-stone-50 dark:bg-zinc-900/20 border-stone-200/60 dark:border-zinc-800/30 opacity-50"
          : "bg-stone-50 dark:bg-white/[0.02] border-stone-200/60 dark:border-white/[0.05] shadow-sm dark:shadow-none hover:border-stone-300 dark:hover:border-white/[0.1] hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(139,92,246,0.06)]"
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
                : "border-stone-300 dark:border-zinc-600 hover:border-indigo-500 dark:hover:border-violet-500"
            }`}
          >
            {event.done && <Check className="w-2 h-2 text-white" />}
          </button>
        ) : (
          <div className={`size-2.5 rounded-full ${cat?.dotColor || "bg-slate-400 dark:bg-zinc-600"} ring-2 ring-white dark:ring-zinc-900`} />
        )}
      </div>

      {/* Time */}
      <div className="shrink-0 w-16">
        <span className={`text-[11px] font-mono tracking-tight ${event.done ? "text-stone-400 dark:text-zinc-700 line-through" : "text-stone-500 dark:text-zinc-500"}`}>
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
            <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-violet-400">
              Personal
            </span>
          )}
        </div>
        <p className={`text-[13px] font-medium leading-snug ${event.done ? "line-through text-stone-400 dark:text-zinc-600" : "text-stone-800 dark:text-zinc-200"}`}>
          {event.title}
        </p>
      </div>

      {/* Actions (hover reveal) */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {isPersonal && event.done && (
          <div className="absolute top-3 right-3">
            <CircleCheck className="w-4 h-4 text-emerald-500" />
          </div>
        )}
        {!isPersonal && (
          <button
            onClick={() => onArchive(event.id)}
            className="p-1.5 rounded-md hover:bg-stone-50/[0.04] text-zinc-600 hover:text-orange-400 transition-colors"
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
}: {
  events: TimelineEvent[];
  onRestore: (id: string) => void;
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
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-stone-200/60 dark:border-white/[0.04] bg-stone-50 dark:bg-zinc-900/30 hover:bg-stone-100 dark:hover:bg-zinc-900/50 transition-colors"
      >
        <Archive className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-600" />
        <span className="text-[11px] font-semibold text-stone-500 dark:text-zinc-500 uppercase tracking-wider">
          Archived
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 font-medium">
          {events.length}
        </span>
        <div className="flex-1" />
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-600" />
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
                    className="group flex items-center gap-3 px-3 py-2 rounded-lg border border-stone-200/60 dark:border-white/[0.03] bg-stone-50 dark:bg-zinc-900/20 opacity-50 grayscale hover:opacity-70 hover:grayscale-0 transition-all"
                  >
                    <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-700 w-12">{e.timeLabel}</span>
                    <span className="flex-1 text-xs text-stone-500 dark:text-zinc-500 truncate">{e.title}</span>
                    <button
                      onClick={() => onRestore(e.id)}
                      className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-indigo-50 dark:hover:bg-violet-500/10 text-indigo-500 dark:text-violet-400 transition-all"
                      title="Restore"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <p className="text-[10px] text-stone-400 dark:text-zinc-700 mt-3 px-1 italic">
              Muted notices are never deleted. Restore anytime.
            </p>
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

  // ─── LOCAL State: personal tasks + archive IDs ────────────
  // Personal tasks are private to this student (not in global DB)
  const [personalTasks, setPersonalTasks] = useState<TimelineEvent[]>(initialPersonalEvents);
  // Archive is LOCAL ONLY — never mutates the global database
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
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
  // Filter out locally archived items (never touches global DB)
  const activeEvents = useMemo(
    () => allEvents.filter((e) => !archivedIds.has(e.id)),
    [allEvents, archivedIds]
  );

  const archivedEvents = useMemo(
    () => allEvents.filter((e) => archivedIds.has(e.id)),
    [allEvents, archivedIds]
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

  const todayPersonal = todayEvents.filter((e) => e.type === "personal");
  const completedToday = todayPersonal.filter((e) => e.done).length;
  const totalTodayTasks = todayPersonal.length;

  // ─── Handlers ─────────────────────────────────────────────

  const toggleDone = (id: string) => {
    setPersonalTasks((prev) => prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e)));
  };

  // LOCAL archive — only hides from this student's view, never deletes globally
  const archiveEvent = (id: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Restore from local archive
  const restoreEvent = (id: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    let time = "12:00";
    let timeLabel = "12:00 PM";
    const match = newTask.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/);
    if (match) {
      let h = parseInt(match[1]);
      const m = match[2] || "00";
      const p = match[3]?.toLowerCase();
      if (p === "pm" && h < 12) h += 12;
      if (p === "am" && h === 12) h = 0;
      time = `${h.toString().padStart(2, "0")}:${m}`;
      const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
      timeLabel = `${dh}:${m} ${h >= 12 ? "PM" : "AM"}`;
    }
    setPersonalTasks((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        title: newTask.replace(/(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?/, "").trim() || newTask,
        time,
        timeLabel,
        type: "personal",
        day: "today",
        done: false,
      },
    ]);
    setNewTask("");
  };

  // ─── Vim Navigation ───────────────────────────────────────
  const { open: openSearch } = useCommandPalette();

  // Combine today + tomorrow into a flat array for vim indexing
  const allVisibleEvents = useMemo(
    () => [...todayEvents, ...tomorrowEvents],
    [todayEvents, tomorrowEvents]
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
      <div className="max-w-2xl space-y-6">
        {/* ─── Briefing Hero ─────────────────────────────────── */}
        <motion.section
          layout
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="rounded-2xl border border-stone-200/60 dark:border-white/[0.05] bg-stone-50 dark:bg-white/[0.02] backdrop-blur-md p-6 shadow-sm dark:shadow-none"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <GreetingIcon className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] text-stone-500 dark:text-zinc-500 font-medium tracking-wide">
                  {todayLabel}
                </span>
              </div>
              <h2 className="text-xl font-bold text-stone-800 dark:text-zinc-100 tracking-tight">
                {greeting.text}, {user.name}
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-500 mt-1">
                {todayEvents.length} events · {completedToday}/{totalTodayTasks} tasks done
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
            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-violet-500 shrink-0" />
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a task... e.g., 'DSA Practice at 6 PM'"
              className="flex-1 bg-transparent border-b border-stone-200 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-violet-500 transition-colors text-sm text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 dark:placeholder:text-zinc-600 py-3 outline-none"
            />
            <button
              onClick={addTask}
              disabled={!newTask.trim()}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 dark:bg-violet-600 text-white text-xs font-semibold transition-all hover:bg-indigo-500 dark:hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
            <AiScheduleOptimizer />
          </div>
        </motion.section>

        {/* ─── Today Timeline ────────────────────────────────── */}
        <motion.section
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="size-2 rounded-full bg-indigo-500 dark:bg-violet-500" />
            <h3 className="text-xs font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
              Today
            </h3>
            <div className="flex-1 h-px bg-slate-200/60 dark:bg-zinc-800/60" />
            <span className="text-[10px] text-stone-400 dark:text-zinc-600">{todayEvents.length}</span>
          </div>

          <div className="timeline-line space-y-2">
            <AnimatePresence mode="popLayout">
              {todayEvents.map((e, i) => (
                <TimelineNode key={e.id} event={e} onToggleDone={toggleDone} onArchive={archiveEvent} isFocused={isFocusActive && focusedIndex === i} timelineIndex={i} />
              ))}
            </AnimatePresence>
            {todayEvents.length === 0 && (
              <p className="py-8 text-center text-sm text-stone-400 dark:text-zinc-700">All clear for today 🎉</p>
            )}
          </div>
        </motion.section>

        {/* ─── Tomorrow Timeline ─────────────────────────────── */}
        <motion.section
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="size-2 rounded-full bg-slate-300 dark:bg-zinc-700" />
            <h3 className="text-xs font-semibold text-stone-500 dark:text-zinc-500 uppercase tracking-wider">
              Tomorrow — {tomorrowLabel}
            </h3>
            <div className="flex-1 h-px bg-slate-200/60 dark:bg-zinc-800/60" />
            <span className="text-[10px] text-stone-400 dark:text-zinc-600">{tomorrowEvents.length}</span>
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
              <p className="py-8 text-center text-sm text-stone-400 dark:text-zinc-700">Nothing yet for tomorrow</p>
            )}
          </div>
        </motion.section>

        {/* ─── Archive Drawer ────────────────────────────────── */}
        <ArchiveAccordion events={archivedEvents} onRestore={restoreEvent} />
      </div>
    </LayoutGroup>
  );
}
