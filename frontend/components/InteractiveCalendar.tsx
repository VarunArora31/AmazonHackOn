"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from "lucide-react";
import { calendarEvents, notices } from "@/lib/data";
import { routeToCategoryMap, type DashboardSection } from "@/lib/types";

// ─── Helpers ────────────────────────────────────────────────────

function getAllEventDates(filterCategory?: string): Set<string> {
  const dates = new Set<string>();
  calendarEvents.forEach((event) => {
    if (!filterCategory || event.type === "event" || event.type === "class") {
      dates.add(event.date);
    }
  });
  notices.forEach((notice) => {
    if (!filterCategory || notice.category === filterCategory) {
      dates.add(notice.date);
    }
  });
  return dates;
}

function getCategoryFromPath(pathname: string): string | undefined {
  const segment = pathname.split("/").pop() as DashboardSection | undefined;
  if (segment && segment in routeToCategoryMap) {
    return routeToCategoryMap[segment];
  }
  return undefined;
}

// ─── Z-Axis Depth Morph Variants ────────────────────────────────

const depthVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    scale: direction > 0 ? 0.9 : 1.1,
    filter: "blur(10px)",
  }),
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    scale: direction > 0 ? 1.1 : 0.9,
    filter: "blur(10px)",
    position: "absolute" as const,
  }),
};

const depthTransition = {
  type: "spring" as const,
  stiffness: 250,
  damping: 25,
};

// ─── Component ──────────────────────────────────────────────────

export function InteractiveCalendar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─── Active date: URL is source of truth, fallback to today ──
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const urlDateParam = searchParams.get("date");
  const activeDateString = urlDateParam || todayStr;
  const isShowingToday = activeDateString === todayStr;

  // ─── Month navigation (local, visual only) ───────────────────
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date(activeDateString + "T00:00:00");
  });
  const [direction, setDirection] = useState(0);

  // Sync calendar month view when URL active date changes
  useEffect(() => {
    const activeDate = new Date(activeDateString + "T00:00:00");
    if (!isSameMonth(activeDate, currentMonth)) {
      setDirection(activeDate > currentMonth ? 1 : -1);
      setCurrentMonth(activeDate);
    }
  }, [activeDateString]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Route-based dot filter ───────────────────────────────────
  const filterCategory = getCategoryFromPath(pathname);
  const eventDates = useMemo(
    () => getAllEventDates(filterCategory),
    [filterCategory]
  );

  // ─── Calendar grid ────────────────────────────────────────────
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const monthKey = format(currentMonth, "yyyy-MM");

  // ─── Handlers ─────────────────────────────────────────────────

  const goNextMonth = () => {
    setDirection(1);
    setCurrentMonth((m) => addMonths(m, 1));
  };

  const goPrevMonth = () => {
    setDirection(-1);
    setCurrentMonth((m) => subMonths(m, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    if (!isSameMonth(currentMonth, today)) {
      setDirection(today > currentMonth ? 1 : -1);
      setCurrentMonth(today);
    }
    // Strip ?date= param — calendar will reactively fallback to todayStr
    router.push(pathname, { scroll: false });
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    // If clicking the currently active date, deselect (go back to today)
    if (dateStr === activeDateString) {
      router.push(pathname, { scroll: false });
    } else {
      router.push(`${pathname}?date=${dateStr}`, { scroll: false });
    }
  };

  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div
      className="relative rounded-2xl border border-zinc-800/80 backdrop-blur-xl overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(139,92,246,0.04) 0%, transparent 60%), rgba(24,24,27,0.3)",
      }}
    >
      <div className="p-4">
        {/* ─── Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-violet-400/80" />
            <h2 className="text-[13px] font-semibold text-zinc-200 tracking-tight">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={goPrevMonth}
              className="p-1.5 rounded-lg hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-zinc-500" />
            </button>
            <button
              onClick={jumpToToday}
              className="px-2 py-1 rounded-lg text-[10px] font-medium text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300 transition-colors"
            >
              Today
            </button>
            <button
              onClick={goNextMonth}
              className="p-1.5 rounded-lg hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* ─── Route context indicator ───────────────────────── */}
        {filterCategory && (
          <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-violet-500/[0.06] border border-violet-500/10 text-[10px] text-violet-400/90 font-medium">
            Showing: {filterCategory}
          </div>
        )}

        {/* ─── Weekday headers ───────────────────────────────── */}
        <div className="grid grid-cols-7 mb-1.5">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-[9px] font-semibold text-zinc-600 uppercase tracking-widest py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* ─── Z-Axis Depth Morph Grid ───────────────────────── */}
        <div className="relative overflow-hidden rounded-xl">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={monthKey}
              custom={direction}
              variants={depthVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={depthTransition}
              className="grid grid-cols-7 gap-px p-0.5"
            >
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const hasEvent = eventDates.has(dateStr);

                // ── KEY FIX: derive selection strictly from URL-synced activeDateString
                const isSelected = dateStr === activeDateString;

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateClick(day)}
                    className={`
                      relative flex flex-col items-center justify-center py-[7px] rounded-md text-[11px] transition-all duration-150
                      ${
                        !inMonth
                          ? "text-zinc-700/50 pointer-events-none"
                          : "text-zinc-200 hover:bg-white/[0.05] active:bg-white/[0.08]"
                      }
                      ${
                        isSelected
                          ? "bg-violet-600 text-white font-bold shadow-[0_0_12px_rgba(139,92,246,0.35)] ring-1 ring-violet-400/50"
                          : ""
                      }
                      ${
                        today && !isSelected
                          ? "ring-1 ring-violet-500/60 text-violet-300 font-semibold"
                          : ""
                      }
                    `}
                  >
                    <span>{format(day, "d")}</span>
                    {hasEvent && inMonth && (
                      <span
                        className={`absolute bottom-[3px] size-[3px] rounded-full ${
                          isSelected
                            ? "bg-white/80"
                            : "bg-violet-400 shadow-[0_0_5px_rgba(139,92,246,0.7)]"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── Selected date detail (only when viewing non-today) */}
        <AnimatePresence>
          {!isShowingToday && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="mt-3 pt-3 border-t border-white/[0.04] space-y-1.5 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  {format(new Date(activeDateString + "T00:00:00"), "EEEE, MMM d")}
                </p>
                <button
                  onClick={jumpToToday}
                  className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Back to today
                </button>
              </div>
              {calendarEvents
                .filter((e) => e.date === activeDateString)
                .map((event) => (
                  <div
                    key={event.id}
                    className="px-2.5 py-1.5 rounded-lg border border-white/[0.04] bg-white/[0.02] text-[11px] text-zinc-300"
                  >
                    <span className="font-medium">{event.title}</span>
                    <span className="ml-2 text-zinc-600">{event.time}</span>
                  </div>
                ))}
              {calendarEvents.filter((e) => e.date === activeDateString)
                .length === 0 && (
                <p className="text-[11px] text-zinc-700 py-2">
                  No scheduled events for this date
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
