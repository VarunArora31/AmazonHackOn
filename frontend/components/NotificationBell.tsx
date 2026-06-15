"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2 } from "lucide-react";
import { useNotifications } from "@/lib/notifications-context";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();

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
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] z-50 bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-white/10">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </span>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={() => markAllRead()} className="p-1 rounded text-[10px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white" title="Mark all read">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={() => clearAll()} className="p-1 rounded text-[10px] text-neutral-500 hover:text-red-500" title="Clear all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-neutral-50 dark:border-white/5 ${!n.read ? "bg-neutral-50 dark:bg-white/[0.02]" : ""}`}>
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">{n.title}</p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[9px] text-neutral-400 dark:text-neutral-600 mt-1">
                          {new Date(n.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                          {new Date(n.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          {n.targetBranch && n.targetBranch !== "ALL" && ` · ${n.targetBranch}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
