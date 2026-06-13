"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useState } from "react";
import { calendarEvents, notices } from "@/lib/data";
import { routeToCategoryMap, type DashboardSection } from "@/lib/types";

// Merge calendar events + notice dates for dot indicators
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

// Determine which category to filter by based on route
function getCategoryFromPath(pathname: string): string | undefined {
  const segment = pathname.split("/").pop() as DashboardSection | undefined;
  if (segment && segment in routeToCategoryMap) {
    return routeToCategoryMap[segment];
  }
  return undefined; // Show all on /dashboard
}

export function InteractiveCalendar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const selectedDateStr = searchParams.get("date");
  const selectedDate = selectedDateStr ? new Date(selectedDateStr) : null;

  // Determine active filter from route
  const filterCategory = getCategoryFromPath(pathname);

  // Get all event dates for dot rendering
  const eventDates = useMemo(
    () => getAllEventDates(filterCategory),
    [filterCategory]
  );

  // Generate calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    // Toggle: click same date again to deselect
    if (selectedDateStr === dateStr) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("date");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", dateStr);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-2 py-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Context indicator */}
      {filterCategory && (
        <div className="mb-3 px-2 py-1.5 rounded-lg bg-accent/5 border border-accent/10 text-[10px] text-accent font-medium">
          Showing: {filterCategory} events
        </div>
      )}

      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;
          const hasEvent = eventDates.has(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => handleDateClick(day)}
              className={`
                relative flex flex-col items-center justify-center py-1.5 rounded-lg text-[11px] transition-all
                ${!inMonth ? "text-muted-foreground/30" : "text-foreground"}
                ${today && !selected ? "bg-accent/10 text-accent font-bold" : ""}
                ${selected ? "bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/20" : ""}
                ${inMonth && !today && !selected ? "hover:bg-muted" : ""}
              `}
            >
              <span>{format(day, "d")}</span>
              {/* Event dot */}
              {hasEvent && inMonth && (
                <span
                  className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                    selected ? "bg-accent-foreground/70" : "bg-accent"
                  }`}
                  style={
                    !selected
                      ? { boxShadow: "0 0 4px rgba(129, 140, 248, 0.6)" }
                      : undefined
                  }
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date events */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 pt-3 border-t border-border space-y-1.5"
        >
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {format(selectedDate, "EEEE, MMM d")}
          </p>
          {calendarEvents
            .filter((e) => e.date === selectedDateStr)
            .map((event) => (
              <div
                key={event.id}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] ${event.color}`}
              >
                <span className="font-medium">{event.title}</span>
                <span className="ml-2 opacity-70">{event.time}</span>
              </div>
            ))}
          {calendarEvents.filter((e) => e.date === selectedDateStr).length === 0 && (
            <p className="text-[11px] text-muted-foreground/60 py-2">
              No scheduled events
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
