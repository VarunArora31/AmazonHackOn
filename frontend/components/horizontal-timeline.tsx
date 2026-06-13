"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  BookOpen,
  Flag,
  Users2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { calendarEvents, type CalendarEvent } from "@/lib/data";

const typeIcons: Record<CalendarEvent["type"], React.ElementType> = {
  class: BookOpen,
  event: Users2,
  deadline: Flag,
  meeting: Clock,
};

const typeColors: Record<CalendarEvent["type"], string> = {
  class: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  event: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  deadline: "bg-red-500/15 text-red-400 border-red-500/25",
  meeting: "bg-amber-500/15 text-amber-400 border-amber-500/25",
};

function getNext7Days(): { date: string; label: string; dayName: string; isToday: boolean }[] {
  const days = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    days.push({ date: dateStr, label, dayName, isToday: i === 0 });
  }

  return days;
}

export function HorizontalTimeline() {
  const days = getNext7Days();
  const [selectedDay, setSelectedDay] = useState(days[0].date);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dayEvents = calendarEvents.filter((e) => e.date === selectedDay);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-2xl border border-border bg-card p-4 card-glow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">
            7-Day Timeline
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll("left")}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Day selector — horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide"
      >
        {days.map((day) => (
          <button
            key={day.date}
            onClick={() => setSelectedDay(day.date)}
            className={`shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border transition-all ${
              selectedDay === day.date
                ? "bg-accent/10 border-accent/30 text-accent"
                : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/50"
            }`}
          >
            <span className="text-[10px] font-medium uppercase tracking-wider">
              {day.dayName}
            </span>
            <span className={`text-sm font-bold mt-0.5 ${selectedDay === day.date ? "text-accent" : "text-foreground"}`}>
              {day.label.split(" ")[0]}
            </span>
            {day.isToday && (
              <span className="w-1 h-1 rounded-full bg-accent mt-1" />
            )}
          </button>
        ))}
      </div>

      {/* Events for selected day */}
      <div className="mt-3 space-y-2 min-h-[100px]">
        <AnimatePresence mode="popLayout">
          {dayEvents.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-8 text-xs text-muted-foreground"
            >
              No events scheduled for this day
            </motion.div>
          ) : (
            dayEvents.map((event) => {
              const Icon = typeIcons[event.type];
              const color = typeColors[event.type];
              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${color}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {event.title}
                    </p>
                    <p className="text-[10px] opacity-70 mt-0.5">
                      {event.time}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-medium opacity-60 shrink-0">
                    {event.type}
                  </span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
