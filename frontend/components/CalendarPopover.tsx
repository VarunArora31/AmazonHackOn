"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { InteractiveCalendar } from "./InteractiveCalendar";

function CalendarPopoverInner() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  // Derive display date from URL or today
  const urlDate = searchParams.get("date");
  const displayDate = urlDate
    ? format(new Date(urlDate + "T00:00:00"), "MMM d, yyyy")
    : format(new Date(), "MMM d, yyyy");

  // Click-outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-neutral-200 bg-white text-neutral-700 rounded-lg hover:bg-neutral-50 dark:bg-[#111111] dark:border-white/10 dark:text-neutral-300 dark:hover:bg-[#1a1a1a] transition-colors"
      >
        <CalendarIcon className="w-3.5 h-3.5" />
        <span>{displayDate}</span>
      </button>

      {/* Popover Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 sm:right-0 z-50 mt-2 w-[280px] max-w-[calc(100vw-2rem)] bg-white border border-neutral-200 shadow-xl rounded-xl p-2 dark:bg-[#111111] dark:border-white/10 dark:shadow-2xl"
          >
            <InteractiveCalendar />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CalendarPopover() {
  return (
    <Suspense fallback={<CalendarTriggerFallback />}>
      <CalendarPopoverInner />
    </Suspense>
  );
}

function CalendarTriggerFallback() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-neutral-200 bg-white text-neutral-700 rounded-lg dark:bg-[#111111] dark:border-white/10 dark:text-neutral-300">
      <CalendarIcon className="w-3.5 h-3.5" />
      <span>{format(new Date(), "MMM d, yyyy")}</span>
    </div>
  );
}
