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
import { useNotices } from "@/lib/notices-context";
import { routeToCategoryMap, type DashboardSection } from "@/lib/types";

// ─── Time Format Helper ─────────────────────────────────────────

function formatTo12h(time: string): string {
  // Handles "14:00", "09:30 - 10:30", "14:00 - 16:00"
  const convert = (t: string): string => {
    const match = t.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return t.trim();
    let h = parseInt(match[1]);
    const m = match[2];
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${m} ${period}`;
  };

  if (time.includes("-")) {
    const parts = time.split("-");
    return `${convert(parts[0])} - ${convert(parts[1])}`;
  }
  return convert(time);
}

// ─── Helpers ────────────────────────────────────────────────────

function getAllEventDates(noticesList: Array<{ date: string; category: string }>, filterCategory?: string): Set<string> {
  const dates = new Set<string>();
  noticesList.forEach((notice) => {
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

  // Active date: URL is source of truth, fallback to today
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const urlDateParam = searchParams.get("date");
  const activeDateString = urlDateParam || todayStr;
  const isShowingToday = activeDateString === todayStr;

  // Month navigation (local, visual only)
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date(activeDateString + "T00:00:00");
  });
  const [direction, setDirection] = useState(0);

  // Sync month view when URL changes
  useEffect(() => {
    const activeDate = new Date(activeDateString + "T00:00:00");
    if (!isSameMonth(activeDate, currentMonth)) {
      setDirection(activeDate > currentMonth ? 1 : -1);
      setCurrentMonth(activeDate);
    }
  }, [activeDateString]); // eslint-disable-line react-hooks/exhaustive-deps

  // Route-based dot filter — uses real notices from context
  const { notices: contextNotices } = useNotices();
  const filterCategory = getCategoryFromPath(pathname);
  const eventDates = useMemo(
    () => getAllEventDates(contextNotices, filterCategory),
    [contextNotices, filterCategory]
  );

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const monthKey = format(currentMonth, "yyyy-MM");

  // Handlers
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
    router.push(pathname, { scroll: false });
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (dateStr === activeDateString) {
      router.push(pathname, { scroll: false });
    } else {
      router.push(`${pathname}?date=${dateStr}`, { scroll: false });
    }
  };

  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div className="overflow-hidden">
      <div className="p-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
            <h2 className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={goPrevMonth}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            </button>
            <button
              onClick={jumpToToday}
              className="px-2 py-1 rounded-lg text-[10px] font-medium text-neutral-500 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              Today
            </button>
            <button
              onClick={goNextMonth}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Route context */}
        {filterCategory && (
          <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-200/[0.06] border border-neutral-200 dark:border-white/5 text-[10px] text-neutral-900 dark:text-neutral-300 font-medium">
            Showing: {filterCategory}
          </div>
        )}

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1.5">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-[9px] font-semibold text-neutral-400 dark:text-neutral-600 uppercase tracking-widest py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Z-Axis Depth Morph Grid */}
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
                const isSelected = dateStr === activeDateString;

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateClick(day)}
                    className={`
                      relative flex flex-col items-center justify-center py-[7px] rounded-md text-[11px]
                      ${
                        !inMonth
                          ? "text-neutral-300 dark:text-neutral-700/50 pointer-events-none"
                          : "text-neutral-700 dark:text-neutral-100"
                      }
                      ${
                        isSelected
                          ? "bg-neutral-900 dark:bg-[#1a1a1a] text-white dark:text-neutral-100 font-bold ring-1 ring-neutral-900/50 dark:ring-neutral-500"
                          : ""
                      }
                      ${
                        today && !isSelected
                          ? "ring-2 ring-neutral-900 dark:ring-neutral-500 text-neutral-900 dark:text-neutral-100 font-semibold"
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
                            : "bg-neutral-800 dark:bg-neutral-400 shadow-none dark:shadow-none"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Selected date detail — always show (including today) */}
        {contextNotices.filter((e) => e.date === activeDateString).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mt-3 pt-3 border-t border-neutral-200/60 dark:border-white/[0.04] space-y-1.5 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
                {format(new Date(activeDateString + "T00:00:00"), "EEEE, MMM d")}
              </p>
              {!isShowingToday && (
                <button
                  onClick={jumpToToday}
                  className="flex items-center gap-1 text-[10px] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Back to today
                </button>
              )}
            </div>
            {contextNotices
              .filter((e) => e.date === activeDateString)
              .sort((a, b) => {
                const getStart = (t: string) => {
                  const part = t.split("-")[0].trim();
                  const m = part.match(/^(\d{1,2}):(\d{2})/);
                  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0;
                };
                return getStart(a.time) - getStart(b.time);
              })
              .map((event) => (
                <div
                  key={event.id}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200/60 dark:border-white/[0.04] bg-white dark:bg-zinc-900/40 text-[11px] text-neutral-700 dark:text-neutral-300"
                >
                  <span className="font-medium">{event.title}</span>
                  <span className="ml-2 text-neutral-400 dark:text-neutral-600">{formatTo12h(event.time)}</span>
                </div>
              ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
