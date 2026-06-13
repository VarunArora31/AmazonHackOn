"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UtensilsCrossed,
  GraduationCap,
  Briefcase,
  Calendar,
  Clock,
  Building2,
  Trophy,
  Bell,
  Command as CommandIcon,
} from "lucide-react";
import { useNotices } from "@/lib/notices-context";
import { calendarEvents, hostelTimings } from "@/lib/data";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { notices } = useNotices();

  // Toggle on ⌘K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      {/* Trigger hint */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-xs text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search anything...</span>
        <kbd className="ml-4 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono">
          <CommandIcon className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      {/* Command dialog */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
            onClick={() => setOpen(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-[560px] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Command className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                <div className="flex items-center border-b border-border px-4">
                  <Search className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
                  <Command.Input
                    placeholder="Search notices, schedule, mess menu, timings..."
                    className="flex-1 bg-transparent text-sm py-4 outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <Command.List className="max-h-[360px] overflow-y-auto p-2">
                  <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                    No results found. Try a different search.
                  </Command.Empty>

                  {/* Notices */}
                  <Command.Group heading="Notices">
                    {notices.slice(0, 5).map((notice) => (
                      <Command.Item
                        key={notice.id}
                        value={`${notice.title} ${notice.category} ${notice.summary}`}
                        onSelect={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm data-[selected=true]:bg-muted"
                      >
                        <div className="shrink-0">
                          {notice.category === "Placement" && (
                            <Briefcase className="w-4 h-4 text-purple-400" />
                          )}
                          {notice.category === "Academics" && (
                            <GraduationCap className="w-4 h-4 text-blue-400" />
                          )}
                          {notice.category === "Hostel Admin" && (
                            <Building2 className="w-4 h-4 text-orange-400" />
                          )}
                          {notice.category === "Club Event" && (
                            <Trophy className="w-4 h-4 text-emerald-400" />
                          )}
                          {(notice.category === "General" || notice.category === "Sports") && (
                            <Bell className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-card-foreground">
                            {notice.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground mt-0.5">
                            {notice.summary}
                          </p>
                        </div>
                        {notice.urgency === "critical" && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>

                  <Command.Separator className="my-2 h-px bg-border" />

                  {/* Schedule */}
                  <Command.Group heading="Schedule">
                    {calendarEvents.slice(0, 4).map((event) => (
                      <Command.Item
                        key={event.id}
                        value={`${event.title} ${event.date} ${event.time}`}
                        onSelect={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm data-[selected=true]:bg-muted"
                      >
                        <Calendar className="w-4 h-4 text-accent shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-card-foreground">
                            {event.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {event.time}
                          </p>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>

                  <Command.Separator className="my-2 h-px bg-border" />

                  {/* Hostel */}
                  <Command.Group heading="Hostel & Mess">
                    {hostelTimings.map((timing) => (
                      <Command.Item
                        key={timing.label}
                        value={`${timing.label} ${timing.time} mess hostel`}
                        onSelect={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm data-[selected=true]:bg-muted"
                      >
                        {timing.label.includes("Mess") ? (
                          <UtensilsCrossed className="w-4 h-4 text-warning shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-card-foreground">
                            {timing.label}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {timing.time}
                        </span>
                        {timing.active && (
                          <span className="w-2 h-2 rounded-full bg-success" />
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                </Command.List>

                {/* Footer */}
                <div className="border-t border-border px-4 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Navigate with ↑↓ · Select with ↵</span>
                  <span>ESC to close</span>
                </div>
              </Command>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
