"use client";

import { useState, useMemo } from "react";
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
import { sortEventsByTime } from "@/lib/sort-utils";
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

const initialOfficialEvents: TimelineEvent[] = [
  { id: "o1", title: "DBMS Lab — Normalization Assignment", time: "09:00", timeLabel: "9:00 AM", type: "official", category: "Academics", day: "today" },
  { id: "o2", title: "Water Supply Maintenance — B-Wing", time: "10:30", timeLabel: "10:30 AM", type: "official", category: "Hostel", day: "today" },
  { id: "o3", title: "Microsoft SDE Intern — Pre-Placement Talk", time: "14:00", timeLabel: "2:00 PM", type: "official", category: "Placement", day: "today" },
  { id: "o4", title: "Coding Club — Weekly Contest #14", time: "20:00", timeLabel: "8:00 PM", type: "official", category: "Club", day: "today" },
  { id: "o5", title: "Basketball Tryouts — Main Court", time: "17:00", timeLabel: "5:00 PM", type: "official", category: "Sports", day: "today" },
  { id: "o6", title: "AI/ML Webinar — Guest Lecture", time: "11:00", timeLabel: "11:00 AM", type: "official", category: "General", day: "today" },
  { id: "o7", title: "Data Structures — End-Sem Revision", time: "09:00", timeLabel: "9:00 AM", type: "official", category: "Academics", day: "tomorrow" },
  { id: "o8", title: "Microsoft Drive — Online Assessment", time: "11:00", timeLabel: "11:00 AM", type: "official", category: "Placement", day: "tomorrow" },
  { id: "o9", title: "TechFest Rehearsal — Auditorium", time: "16:00", timeLabel: "4:00 PM", type: "official", category: "Club", day: "tomorrow" },
  { id: "o10", title: "Mess Menu: Rajma Chawal (Lunch), Paneer (Dinner)", time: "12:00", timeLabel: "12:00 PM", type: "official", category: "Hostel", day: "tomorrow" },
];

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

// ─── Progress Ring ──────────────────────────────────────────────

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const c = 2 * Math.PI * 18;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-800" />
        <motion.circle
          cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className="text-violet-500"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-zinc-100">{pct}%</span>
    </div>
  );
}

// ─── Timeline Node ──────────────────────────────────────────────

function TimelineNode({
  event,
  onToggleDone,
  onArchive,
}: {
  event: TimelineEvent;
  onToggleDone: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const isPersonal = event.type === "personal";
  const cat = event.category ? categoryMeta[event.category] : null;
  const Icon = cat?.icon || Target;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`group relative flex items-start gap-4 pl-8 pr-4 py-3 rounded-xl border transition-all duration-300 ${
        event.done
          ? "bg-zinc-900/20 border-zinc-800/30 opacity-50"
          : "bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1] hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(139,92,246,0.06)]"
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
                : "border-zinc-600 hover:border-violet-500"
            }`}
          >
            {event.done && <Check className="w-2 h-2 text-white" />}
          </button>
        ) : (
          <div className={`size-2.5 rounded-full ${cat?.dotColor || "bg-zinc-600"} ring-2 ring-zinc-900`} />
        )}
      </div>

      {/* Time */}
      <div className="shrink-0 w-16">
        <span className={`text-[11px] font-mono tracking-tight ${event.done ? "text-zinc-700 line-through" : "text-zinc-500"}`}>
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
            <span className="text-[9px] font-semibold uppercase tracking-wider text-violet-400">
              Personal
            </span>
          )}
        </div>
        <p className={`text-[13px] font-medium leading-snug ${event.done ? "line-through text-zinc-600" : "text-zinc-200"}`}>
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
            className="p-1.5 rounded-md hover:bg-white/[0.04] text-zinc-600 hover:text-orange-400 transition-colors"
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
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-white/[0.04] bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors"
      >
        <Archive className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          Archived
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">
          {events.length}
        </span>
        <div className="flex-1" />
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
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
                    className="group flex items-center gap-3 px-3 py-2 rounded-lg border border-white/[0.03] bg-zinc-900/20 opacity-50 grayscale hover:opacity-70 hover:grayscale-0 transition-all"
                  >
                    <span className="text-[10px] font-mono text-zinc-700 w-12">{e.timeLabel}</span>
                    <span className="flex-1 text-xs text-zinc-500 truncate">{e.title}</span>
                    <button
                      onClick={() => onRestore(e.id)}
                      className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-violet-500/10 text-violet-400 transition-all"
                      title="Restore"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <p className="text-[10px] text-zinc-700 mt-3 px-1 italic">
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
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const [activeEvents, setActiveEvents] = useState<TimelineEvent[]>([
    ...initialOfficialEvents,
    ...initialPersonalEvents,
  ]);
  const [archivedEvents, setArchivedEvents] = useState<TimelineEvent[]>([]);
  const [newTask, setNewTask] = useState("");

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

  const toggleDone = (id: string) => {
    setActiveEvents((prev) => prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e)));
  };

  const archiveEvent = (id: string) => {
    setActiveEvents((prev) => {
      const event = prev.find((e) => e.id === id);
      if (event) {
        setArchivedEvents((a) => {
          // Prevent duplicates
          if (a.some((item) => item.id === id)) return a;
          return [...a, { ...event, archived: true }];
        });
      }
      return prev.filter((e) => e.id !== id);
    });
  };

  const restoreEvent = (id: string) => {
    setArchivedEvents((prev) => {
      const event = prev.find((e) => e.id === id);
      if (event) {
        setActiveEvents((a) => {
          if (a.some((item) => item.id === id)) return a;
          return [...a, { ...event, archived: false }];
        });
      }
      return prev.filter((e) => e.id !== id);
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
    setActiveEvents((prev) => [
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
          className="rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-md p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <GreetingIcon className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] text-zinc-500 font-medium tracking-wide">
                  {todayLabel}
                </span>
              </div>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                {greeting.text}, {user.name}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
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
            <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a task... e.g., 'DSA Practice at 6 PM'"
              className="flex-1 bg-transparent border-b border-zinc-800 focus:border-violet-500 transition-colors text-sm text-zinc-200 placeholder:text-zinc-600 py-3 outline-none"
            />
            <button
              onClick={addTask}
              disabled={!newTask.trim()}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-600 text-white text-xs font-semibold transition-all hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed"
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
            <div className="size-2 rounded-full bg-violet-500" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Today
            </h3>
            <div className="flex-1 h-px bg-zinc-800/60" />
            <span className="text-[10px] text-zinc-600">{todayEvents.length}</span>
          </div>

          <div className="timeline-line space-y-2">
            <AnimatePresence mode="popLayout">
              {todayEvents.map((e) => (
                <TimelineNode key={e.id} event={e} onToggleDone={toggleDone} onArchive={archiveEvent} />
              ))}
            </AnimatePresence>
            {todayEvents.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-700">All clear for today 🎉</p>
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
            <div className="size-2 rounded-full bg-zinc-700" />
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Tomorrow — {tomorrowLabel}
            </h3>
            <div className="flex-1 h-px bg-zinc-800/60" />
            <span className="text-[10px] text-zinc-600">{tomorrowEvents.length}</span>
          </div>

          <div className="timeline-line space-y-2">
            <AnimatePresence mode="popLayout">
              {tomorrowEvents.map((e) => (
                <TimelineNode key={e.id} event={e} onToggleDone={toggleDone} onArchive={archiveEvent} />
              ))}
            </AnimatePresence>
            {tomorrowEvents.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-700">Nothing yet for tomorrow</p>
            )}
          </div>
        </motion.section>

        {/* ─── Archive Drawer ────────────────────────────────── */}
        <ArchiveAccordion events={archivedEvents} onRestore={restoreEvent} />
      </div>
    </LayoutGroup>
  );
}
