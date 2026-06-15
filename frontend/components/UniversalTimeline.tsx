"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Clock,
  Archive,
  RotateCcw,
  ChevronDown,
  GraduationCap,
  Building2,
  Briefcase,
  Users,
  Trophy,
  Info,
  Sparkles,
  CalendarClock,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { sortEventsByTime } from "@/lib/sort-utils";
import { useUser } from "@/lib/user-context";
import { useCommandPalette } from "@/lib/command-palette-context";
import { useChat } from "@/lib/chat-context";
import { useVimNavigation } from "@/hooks/useVimNavigation";
import type { Notice, NoticeCategory, Urgency } from "@/lib/data";

// ─── Visual Config ──────────────────────────────────────────────

const categoryConfig: Record<
  NoticeCategory,
  { icon: React.ElementType; color: string; bg: string }
> = {
  "Hostel Admin": { icon: Building2, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  Academics: { icon: GraduationCap, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  Placement: { icon: Briefcase, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  "Club Event": { icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  Sports: { icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  General: { icon: Info, color: "text-neutral-400", bg: "bg-neutral-100 border-neutral-200" },
};

const urgencyConfig: Record<Urgency, { dot: string; label: string }> = {
  critical: { dot: "bg-red-500 animate-pulse", label: "Urgent" },
  high: { dot: "bg-orange-500", label: "Important" },
  normal: { dot: "bg-blue-500", label: "" },
  low: { dot: "bg-neutral-400", label: "" },
};

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

function formatBannerDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return format(date, "EEEE, MMMM d, yyyy");
}

// ─── Time-Travel Banner ─────────────────────────────────────────

function TimeTravelBanner({ targetDate, onJumpToToday }: { targetDate: string; onJumpToToday: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-accent/20 bg-accent/5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <CalendarClock className="w-4 h-4 text-accent" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              Viewing schedule for {formatBannerDate(targetDate)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Click a date in the calendar or use the button to return
            </p>
          </div>
        </div>
        <button
          onClick={onJumpToToday}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-accent/20"
        >
          <ArrowLeft className="w-3 h-3" />
          Jump to Today
        </button>
      </div>
    </motion.div>
  );
}

// ─── Timeline Notice Card ───────────────────────────────────────

function TimelineCard({
  notice,
  onArchive,
  isFocused,
  timelineIndex,
}: {
  notice: Notice;
  onArchive: (id: string) => void;
  isFocused: boolean;
  timelineIndex: number;
}) {
  const cat = categoryConfig[notice.category];
  const urg = urgencyConfig[notice.urgency];
  const Icon = cat.icon;
  const { user } = useUser();

  const showBranchBadge = user.role === "STUDENT" && notice.category === "Academics";

  return (
    <motion.div
      data-timeline-index={timelineIndex}
      layout="position"
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30, scale: 0.92 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`group relative flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
        isFocused
          ? "border-neutral-400 dark:border-neutral-600 bg-neutral-100 dark:bg-[#1a1a1a] ring-1 ring-neutral-400 dark:ring-neutral-600 shadow-md dark:shadow-none scale-[1.01]"
          : "border-border bg-card card-glow"
      }`}
    >
      {/* Vim focus indicator */}
      {isFocused && (
        <div className="absolute -left-px top-3 bottom-3 w-[2px] rounded-full bg-neutral-900 dark:bg-neutral-300" />
      )}

      {/* Left: Time column */}
      <div className="shrink-0 w-14 pt-0.5">
        <span className="text-[11px] font-mono text-muted-foreground">
          {notice.time}
        </span>
      </div>

      {/* Center: Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border ${cat.bg} ${cat.color}`}>
            <Icon className="w-2.5 h-2.5" />
            {notice.category}
          </div>
          {showBranchBadge && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-accent/10 border border-accent/20 text-accent">
              <Sparkles className="w-2.5 h-2.5" />
              Your Branch
            </span>
          )}
          {(notice.urgency === "critical" || notice.urgency === "high") && (
            <div className="inline-flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />
              <span className="text-[9px] font-semibold text-destructive uppercase tracking-wider">{urg.label}</span>
            </div>
          )}
        </div>

        <h3 className="text-sm font-semibold text-card-foreground leading-snug mb-1">{notice.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">{notice.summary}</p>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
          <Clock className="w-3 h-3" />
          <span>{formatDateLabel(notice.date)}</span>
        </div>
      </div>

      {/* Right: Archive action (visible on hover OR focus) */}
      <div className={`shrink-0 transition-opacity ${isFocused ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        <button
          onClick={() => onArchive(notice.id)}
          className="p-1.5 rounded-lg hover:bg-orange-500/10 text-muted-foreground hover:text-orange-400 transition-colors"
          title="Archive (x)"
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Archived Card ──────────────────────────────────────────────

function ArchivedCard({ notice, onRestore }: { notice: Notice; onRestore: (id: string) => void }) {
  const cat = categoryConfig[notice.category];
  const Icon = cat.icon;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/40 bg-muted/20 opacity-60 grayscale-[40%] hover:opacity-80 hover:grayscale-0 transition-all"
    >
      <span className="shrink-0 text-[10px] font-mono text-muted-foreground/60 w-12">{notice.time}</span>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider border ${cat.bg} ${cat.color} opacity-60`}>
          <Icon className="w-2.5 h-2.5" />
          {notice.category}
        </div>
        <span className="text-xs text-muted-foreground truncate">{notice.title}</span>
      </div>
      <span className="shrink-0 text-[9px] text-muted-foreground/50 font-medium">{formatDateLabel(notice.date)}</span>
      <button
        onClick={() => onRestore(notice.id)}
        className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-accent/10 text-accent transition-all"
        title="Restore"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Archive Drawer ─────────────────────────────────────────────

function ArchiveDrawer({ archived, onRestore, onClearAll }: { archived: Notice[]; onRestore: (id: string) => void; onClearAll?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  if (archived.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <Archive className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">Archived Notices</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-medium">{archived.length}</span>
        <div className="flex-1" />
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-1.5">
              <AnimatePresence mode="popLayout">
                {archived.map((notice) => (
                  <ArchivedCard key={notice.id} notice={notice} onRestore={onRestore} />
                ))}
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-[10px] text-muted-foreground/50 italic">
                Archived notices are muted but never deleted.
              </p>
              {onClearAll && (
                <button onClick={onClearAll} className="text-[10px] text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium">
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

// ─── Main Component ─────────────────────────────────────────────

interface UniversalTimelineProps {
  events: Notice[];
  title: string;
  emptyMessage?: string;
}

export function UniversalTimeline({ events, title, emptyMessage = "No notices found." }: UniversalTimelineProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { open: openSearch } = useCommandPalette();
  const { isChatOpen } = useChat();

  const [userId, setUserId] = useState<string>("");
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());

  // Load userId and per-user archive/cleared state on mount
  useEffect(() => {
    async function loadState() {
      try {
        const { getCurrentUser } = await import("@/lib/auth");
        const user = await getCurrentUser();
        const uid = user?.id || "guest";
        setUserId(uid);

        const archiveKey = `archive_${uid}`;
        const clearKey = `archive_cleared_${uid}`;

        const storedArchive = localStorage.getItem(archiveKey);
        const storedCleared = localStorage.getItem(clearKey);

        if (storedArchive) setArchivedIds(new Set(JSON.parse(storedArchive)));
        if (storedCleared) setClearedIds(new Set(JSON.parse(storedCleared)));
      } catch {}
    }
    loadState();
  }, []);

  // ─── URL-driven date state ────────────────────────────────
  const targetDate = searchParams.get("date");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isTimeTravel = targetDate !== null && targetDate !== todayStr;

  const filteredByDate = useMemo(() => {
    if (targetDate) return events.filter((e) => e.date === targetDate);
    return events;
  }, [events, targetDate]);

  const activeEvents = useMemo(
    () => sortEventsByTime(filteredByDate.filter((e) => !archivedIds.has(e.id) && !clearedIds.has(e.id))),
    [filteredByDate, archivedIds, clearedIds]
  );

  const archivedEvents = useMemo(
    () => filteredByDate.filter((e) => archivedIds.has(e.id) && !clearedIds.has(e.id)),
    [filteredByDate, archivedIds, clearedIds]
  );

  // ─── Handlers ─────────────────────────────────────────────
  const archiveNotice = useCallback((id: string) => {
    setArchivedIds((prev) => {
      const next = new Set([...prev, id]);
      const key = `archive_${userId || "guest"}`;
      localStorage.setItem(key, JSON.stringify([...next]));
      return next;
    });
  }, [userId]);

  const restoreNotice = useCallback((id: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      const key = `archive_${userId || "guest"}`;
      localStorage.setItem(key, JSON.stringify([...next]));
      return next;
    });
  }, [userId]);

  const clearArchive = useCallback(() => {
    const newCleared = new Set([...clearedIds, ...archivedIds]);
    setClearedIds(newCleared);
    setArchivedIds(new Set());
    const uid = userId || "guest";
    localStorage.setItem(`archive_cleared_${uid}`, JSON.stringify([...newCleared]));
    localStorage.setItem(`archive_${uid}`, JSON.stringify([]));
  }, [archivedIds, clearedIds, userId]);

  const jumpToToday = () => {
    router.push(pathname, { scroll: false });
  };

  // ─── Vim Navigation ───────────────────────────────────────
  const onVimArchive = useCallback(
    (index: number) => {
      const event = activeEvents[index];
      if (event) archiveNotice(event.id);
    },
    [activeEvents, archiveNotice]
  );

  const { focusedIndex, isFocusActive } = useVimNavigation({
    itemCount: activeEvents.length,
    onArchive: onVimArchive,
    onOpenSearch: openSearch,
  });

  // ─── Flatten for rendering with global indices ────────────
  // Compute a map from notice.id → global index for vim focus
  const noticeIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    activeEvents.forEach((event, i) => {
      map.set(event.id, i);
    });
    return map;
  }, [activeEvents]);

  // ─── Group by date ────────────────────────────────────────
  const groupedByDate = useMemo(() => {
    const groups: { label: string; dateKey: string; items: Notice[] }[] = [];
    const map = new Map<string, Notice[]>();
    activeEvents.forEach((event) => {
      const key = event.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    const sortedKeys = [...map.keys()].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    sortedKeys.forEach((key) => {
      groups.push({ label: formatDateLabel(key), dateKey: key, items: map.get(key)! });
    });
    return groups;
  }, [activeEvents]);

  return (
    <LayoutGroup>
      <div className={`relative pl-0 sm:pl-5 space-y-5 transition-all duration-300 ${isChatOpen ? "max-w-3xl" : "max-w-4xl mx-auto"}`}>
        {/* Timeline spine line (desktop only) */}
        <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-px bg-neutral-200 dark:bg-white/10 transition-colors duration-[80ms]" />
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <div className="flex items-center gap-2">
            {isFocusActive && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 font-medium border border-neutral-300">
                Vim: {focusedIndex + 1}/{activeEvents.length}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
              {activeEvents.length} active
              {archivedEvents.length > 0 && ` · ${archivedEvents.length} archived`}
            </span>
          </div>
        </div>

        {/* Time-Travel Banner */}
        <AnimatePresence>
          {isTimeTravel && targetDate && (
            <TimeTravelBanner targetDate={targetDate} onJumpToToday={jumpToToday} />
          )}
        </AnimatePresence>

        {/* Empty state */}
        {groupedByDate.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {targetDate ? `No notices for ${formatBannerDate(targetDate)}.` : emptyMessage}
            </p>
            {targetDate && (
              <button
                onClick={jumpToToday}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                View all dates
              </button>
            )}
          </motion.div>
        )}

        {/* Timeline grouped by date */}
        {groupedByDate.map((group) => {
          return (
            <section key={group.dateKey}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-accent/70" />
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</h3>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground/60">
                  {group.items.length} {group.items.length === 1 ? "notice" : "notices"}
                </span>
              </div>

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {group.items.map((notice) => {
                    const idx = noticeIndexMap.get(notice.id) ?? -1;
                    return (
                      <TimelineCard
                        key={notice.id}
                        notice={notice}
                        onArchive={archiveNotice}
                        isFocused={isFocusActive && focusedIndex === idx}
                        timelineIndex={idx}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            </section>
          );
        })}

        {/* Archive drawer */}
        <ArchiveDrawer archived={archivedEvents} onRestore={restoreNotice} onClearAll={clearArchive} />

        {/* Vim nav hint (shown only when not active) */}
        {!isFocusActive && activeEvents.length > 0 && (
          <div className="text-center">
            <p className="text-[10px] text-neutral-700">
              Press <kbd className="px-1 py-0.5 rounded bg-neutral-200 border border-neutral-300 text-neutral-400 font-mono text-[9px]">j</kbd>/<kbd className="px-1 py-0.5 rounded bg-neutral-200 border border-neutral-300 text-neutral-400 font-mono text-[9px]">k</kbd> to navigate · <kbd className="px-1 py-0.5 rounded bg-neutral-200 border border-neutral-300 text-neutral-400 font-mono text-[9px]">x</kbd> to archive · <kbd className="px-1 py-0.5 rounded bg-neutral-200 border border-neutral-300 text-neutral-400 font-mono text-[9px]">/</kbd> to search
            </p>
          </div>
        )}
      </div>
    </LayoutGroup>
  );
}
