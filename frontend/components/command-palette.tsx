"use client";

import { useEffect } from "react";
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
} from "lucide-react";
import { useNotices } from "@/lib/notices-context";
import { useCommandPalette } from "@/lib/command-palette-context";
import { calendarEvents, hostelTimings } from "@/lib/data";

// ─── Hybrid Search Button (Trigger) ────────────────────────────

export function SearchTriggerButton() {
  const { open } = useCommandPalette();

  return (
    <button
      onClick={open}
      className="flex items-center gap-2.5 w-full max-w-[260px] px-3 py-2 rounded-lg bg-stone-50/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-stone-200/50 dark:border-white/[0.05] text-stone-500 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 hover:border-stone-300 dark:hover:border-white/[0.1] shadow-sm dark:shadow-none transition-all"
    >
      <Search className="w-3.5 h-3.5 shrink-0" />
      <span className="text-xs flex-1 text-left truncate">
        Search CampusFlow...
      </span>
      {/* Desktop-only shortcut badge */}
      <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 text-[10px] font-mono text-stone-600 dark:text-zinc-400 shrink-0">
        /
      </kbd>
    </button>
  );
}

// ─── Command Palette Dialog ─────────────────────────────────────

export function CommandPaletteDialog() {
  const { isOpen, close, toggle } = useCommandPalette();
  const { notices } = useNotices();

  // ⌘K / Ctrl+K and Escape handlers
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, close, toggle]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
          onClick={close}
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
            <Command className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950 shadow-2xl overflow-hidden">
              <div className="flex items-center border-b border-stone-200 dark:border-zinc-800/80 px-4">
                <Search className="w-4 h-4 text-stone-400 dark:text-zinc-500 mr-3 shrink-0" />
                <Command.Input
                  placeholder="Search notices, schedule, mess menu, timings..."
                  className="flex-1 bg-transparent text-sm py-4 outline-none text-stone-800 dark:text-zinc-200 placeholder:text-stone-400 dark:placeholder:text-zinc-600"
                  autoFocus
                />
              </div>

              <Command.List className="max-h-[360px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-stone-400 dark:text-zinc-600">
                  No results found.
                </Command.Empty>

                {/* Notices */}
                <Command.Group heading="Notices">
                  {notices.slice(0, 5).map((notice) => (
                    <Command.Item
                      key={notice.id}
                      value={`${notice.title} ${notice.category} ${notice.summary}`}
                      onSelect={close}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-stone-600 dark:text-zinc-400 data-[selected=true]:bg-stone-100 dark:data-[selected=true]:bg-zinc-800/50 data-[selected=true]:text-indigo-600 dark:data-[selected=true]:text-violet-400"
                    >
                      <div className="shrink-0">
                        {notice.category === "Placement" && <Briefcase className="w-4 h-4 text-purple-400" />}
                        {notice.category === "Academics" && <GraduationCap className="w-4 h-4 text-blue-400" />}
                        {notice.category === "Hostel Admin" && <Building2 className="w-4 h-4 text-orange-400" />}
                        {notice.category === "Club Event" && <Trophy className="w-4 h-4 text-emerald-400" />}
                        {(notice.category === "General" || notice.category === "Sports") && <Bell className="w-4 h-4 text-stone-400 dark:text-zinc-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-stone-800 dark:text-zinc-200">{notice.title}</p>
                        <p className="truncate text-xs text-stone-500 dark:text-zinc-500 mt-0.5">{notice.summary}</p>
                      </div>
                      {notice.urgency === "critical" && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-2 h-px bg-slate-200 dark:bg-zinc-800/60" />

                {/* Schedule */}
                <Command.Group heading="Schedule">
                  {calendarEvents.slice(0, 4).map((event) => (
                    <Command.Item
                      key={event.id}
                      value={`${event.title} ${event.date} ${event.time}`}
                      onSelect={close}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-stone-600 dark:text-zinc-400 data-[selected=true]:bg-stone-100 dark:data-[selected=true]:bg-zinc-800/50 data-[selected=true]:text-indigo-600 dark:data-[selected=true]:text-violet-400"
                    >
                      <Calendar className="w-4 h-4 text-indigo-500 dark:text-violet-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-stone-800 dark:text-zinc-200">{event.title}</p>
                        <p className="text-xs text-stone-500 dark:text-zinc-500 mt-0.5">{event.time}</p>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-2 h-px bg-slate-200 dark:bg-zinc-800/60" />

                {/* Hostel */}
                <Command.Group heading="Hostel & Mess">
                  {hostelTimings.map((timing) => (
                    <Command.Item
                      key={timing.label}
                      value={`${timing.label} ${timing.time} mess hostel`}
                      onSelect={close}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-stone-600 dark:text-zinc-400 data-[selected=true]:bg-stone-100 dark:data-[selected=true]:bg-zinc-800/50 data-[selected=true]:text-indigo-600 dark:data-[selected=true]:text-violet-400"
                    >
                      {timing.label.includes("Mess") ? (
                        <UtensilsCrossed className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-stone-400 dark:text-zinc-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-stone-800 dark:text-zinc-200">{timing.label}</p>
                      </div>
                      <span className="text-xs font-mono text-stone-500 dark:text-zinc-600">{timing.time}</span>
                      {timing.active && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              {/* Footer */}
              <div className="border-t border-stone-200 dark:border-zinc-800/80 px-4 py-2.5 flex items-center justify-between text-[10px] text-stone-400 dark:text-zinc-600">
                <div className="flex items-center gap-3">
                  <span>↑↓ Navigate</span>
                  <span>↵ Select</span>
                  <span className="hidden md:inline">j/k Vim nav</span>
                </div>
                <span>ESC close</span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Legacy export for backward compat ──────────────────────────
export function CommandPalette() {
  return <SearchTriggerButton />;
}
