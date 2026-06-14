"use client";

import { useEffect } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
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

// ─── Hybrid Search Button (Trigger) ────────────────────────────

export function SearchTriggerButton() {
  const { open } = useCommandPalette();

  return (
    <button
      onClick={open}
      className="flex items-center gap-2.5 w-full max-w-[260px] px-3 py-2 rounded-lg bg-white/70 dark:bg-[#111111] backdrop-blur-xl border border-neutral-200/50 dark:border-white/[0.05] text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-zinc-300 hover:border-neutral-300 dark:hover:border-white/20 shadow-sm dark:shadow-none transition-all"
    >
      <Search className="w-3.5 h-3.5 shrink-0" />
      <span className="text-xs flex-1 text-left truncate">
        Search CampusFlow...
      </span>
      {/* Desktop-only shortcut badge */}
      <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-300 dark:border-neutral-800 text-[10px] font-mono text-neutral-600 dark:text-neutral-400 shrink-0">
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
            <Command className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] shadow-2xl overflow-hidden">
              <div className="flex items-center border-b border-neutral-200 dark:border-white/10 px-4">
                <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 mr-3 shrink-0" />
                <Command.Input
                  placeholder="Search notices, schedule, mess menu, timings..."
                  className="flex-1 bg-transparent text-sm py-4 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  autoFocus
                />
              </div>

              <Command.List className="max-h-[360px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-600">
                  No results found.
                </Command.Empty>

                {/* Notices */}
                <Command.Group heading="Notices">
                  {notices.slice(0, 5).map((notice) => (
                    <Command.Item
                      key={notice.id}
                      value={`${notice.title} ${notice.category} ${notice.summary}`}
                      onSelect={close}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-neutral-600 dark:text-neutral-400 data-[selected=true]:bg-neutral-100 dark:data-[selected=true]:bg-[#1a1a1a] data-[selected=true]:text-neutral-900 dark:data-[selected=true]:text-neutral-100"
                    >
                      <div className="shrink-0">
                        {notice.category === "Placement" && <Briefcase className="w-4 h-4 text-purple-400" />}
                        {notice.category === "Academics" && <GraduationCap className="w-4 h-4 text-blue-400" />}
                        {notice.category === "Hostel Admin" && <Building2 className="w-4 h-4 text-orange-400" />}
                        {notice.category === "Club Event" && <Trophy className="w-4 h-4 text-emerald-400" />}
                        {(notice.category === "General" || notice.category === "Sports") && <Bell className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{notice.title}</p>
                        <p className="truncate text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">{notice.summary}</p>
                      </div>
                      {notice.urgency === "critical" && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-2 h-px bg-neutral-200 dark:bg-[#1a1a1a]/60" />

                {/* All Events (from real notices) */}
                <Command.Group heading="Events & Schedule">
                  {notices.filter((n) => n.category === "Academics" || n.category === "Placement" || n.category === "Sports").slice(0, 4).map((event) => (
                    <Command.Item
                      key={event.id}
                      value={`${event.title} ${event.date} ${event.time} ${event.category}`}
                      onSelect={close}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-neutral-600 dark:text-neutral-400 data-[selected=true]:bg-neutral-100 dark:data-[selected=true]:bg-[#1a1a1a] data-[selected=true]:text-neutral-900 dark:data-[selected=true]:text-neutral-100"
                    >
                      <Calendar className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{event.title}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">{event.category} · {event.time}</p>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-2 h-px bg-neutral-200 dark:bg-[#1a1a1a]/60" />

                {/* Hostel & General */}
                <Command.Group heading="Hostel & General">
                  {notices.filter((n) => n.category === "Hostel Admin" || n.category === "General" || n.category === "Club Event").slice(0, 4).map((event) => (
                    <Command.Item
                      key={event.id}
                      value={`${event.title} ${event.summary} ${event.category} hostel mess general club`}
                      onSelect={close}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-neutral-600 dark:text-neutral-400 data-[selected=true]:bg-neutral-100 dark:data-[selected=true]:bg-[#1a1a1a] data-[selected=true]:text-neutral-900 dark:data-[selected=true]:text-neutral-100"
                    >
                      <Clock className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{event.title}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">{event.category}</p>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              {/* Footer */}
              <div className="border-t border-neutral-200 dark:border-white/10 px-4 py-2.5 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-600">
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
