"use client";

import { motion } from "framer-motion";
import { Calendar, BookOpen, Flag, Users2, Clock } from "lucide-react";
import { calendarEvents, type CalendarEvent } from "@/lib/data";

const typeIcons: Record<CalendarEvent["type"], React.ElementType> = {
  class: BookOpen,
  event: Users2,
  deadline: Flag,
  meeting: Clock,
};

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

function groupByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const groups: Record<string, CalendarEvent[]> = {};
  events.forEach((event) => {
    const key = event.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  });
  return groups;
}

export function CalendarWidget() {
  const grouped = groupByDate(calendarEvents);
  const sortedDates = Object.keys(grouped).sort();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">
          Unified Timeline
        </h2>
      </div>

      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
        {sortedDates.map((date) => (
          <div key={date}>
            {/* Day header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {getDayLabel(date)}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Events for this day */}
            <div className="space-y-2 ml-1">
              {grouped[date].map((event) => {
                const Icon = typeIcons[event.type];
                return (
                  <div
                    key={event.id}
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${event.color} transition-all hover:scale-[1.01]`}
                  >
                    <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {event.title}
                      </p>
                      <p className="text-[10px] opacity-70 mt-0.5">
                        {event.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
