"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, CheckCheck } from "lucide-react";
import { useNotifications } from "@/lib/notifications-context";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markOneRead,
    markAllRead,
    clearOne,
    clearAll,
  } = useNotifications();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] z-50 bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-white/10">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Notifications {unreadCount > 0 && (
                  <span className="ml-1 text-xs font-normal text-neutral-500">({unreadCount} new)</span>
                )}
              </span>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                    title="Mark all read"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>All read</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => clearAll()}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="w-6 h-6 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">No notifications</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`group border-b border-neutral-50 dark:border-white/5 last:border-0 ${
                        !n.read ? "bg-neutral-50 dark:bg-white/[0.02]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2 px-4 py-3">
                        {/* Unread dot */}
                        <div className="shrink-0 mt-1.5 w-1.5 h-1.5">
                          {!n.read && (
                            <span className="block w-1.5 h-1.5 rounded-full bg-red-500" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug truncate ${!n.read ? "font-semibold text-neutral-900 dark:text-neutral-100" : "font-medium text-neutral-700 dark:text-neutral-300"}`}>
                            {n.title}
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[9px] text-neutral-400 dark:text-neutral-600 mt-1">
                            {new Date(n.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            {" · "}
                            {new Date(n.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            {n.targetBranch && n.targetBranch !== "ALL" && ` · ${n.targetBranch}`}
                          </p>
                        </div>

                        {/* Per-notification actions (show on hover) */}
                        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.read && n.sourceId && (
                            <button
                              onClick={() => markOneRead(n.sourceId!)}
                              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          {n.sourceId && (
                            <button
                              onClick={() => clearOne(n.sourceId!)}
                              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-red-500 transition-colors"
                              title="Dismiss"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
