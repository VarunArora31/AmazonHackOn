"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

export interface Notification {
  id: string;
  sourceId?: string; // Supabase announcement ID (stable, for read tracking)
  title: string;
  message: string;
  category: string;
  timestamp: string;
  read: boolean;
  targetBranch?: string;
  targetYear?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: any) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// ─── Per-user storage helpers ───────────────────────────────────

function getUserKey(suffix: string): string {
  if (typeof window === "undefined") return suffix;
  return localStorage.getItem("_notif_user_key_prefix") || suffix;
}

function getReadIds(): string[] {
  try {
    const key = getUserKey("read_announcements");
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch { return []; }
}

function getClearedIds(): string[] {
  try {
    const key = getUserKey("cleared_announcements");
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch { return []; }
}

function saveReadIds(ids: string[]) {
  try {
    const key = getUserKey("read_announcements");
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {}
}

function saveClearedIds(ids: string[]) {
  try {
    const key = getUserKey("cleared_announcements");
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {}
}

// ─── Provider ───────────────────────────────────────────────────

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const userKeySet = useRef(false);

  // Set up per-user key prefix on mount
  useEffect(() => {
    async function initUserKey() {
      try {
        const { getCurrentUser } = await import("@/lib/auth");
        const user = await getCurrentUser();
        if (user) {
          localStorage.setItem("_notif_user_key_prefix", `read_announcements_${user.id}`);
          localStorage.setItem("_notif_cleared_key", `cleared_announcements_${user.id}`);
        }
      } catch {}
      userKeySet.current = true;
    }
    initUserKey();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (n: Omit<Notification, "id" | "read"> & { _preRead?: boolean }) => {
    const { _preRead, timestamp: providedTimestamp, ...rest } = n as any;

    // Skip if this notification was previously cleared by this user
    const clearedIds = getClearedIds();
    if (rest.sourceId && clearedIds.includes(rest.sourceId)) return;

    setNotifications((prev) => {
      if (rest.sourceId && prev.some((p) => p.sourceId === rest.sourceId)) return prev;

      // Check if previously read
      const readIds = getReadIds();
      const isRead = _preRead || (rest.sourceId && readIds.includes(rest.sourceId));

      const updated = [
        {
          ...rest,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: providedTimestamp || new Date().toISOString(),
          read: isRead || false,
        },
        ...prev,
      ];
      return updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
  };

  const markAllRead = () => {
    // Persist read state
    const sourceIds = notifications.filter(n => n.sourceId).map(n => n.sourceId!);
    const existing = getReadIds();
    const merged = [...new Set([...existing, ...sourceIds])];
    saveReadIds(merged);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    // Persist cleared state — these won't come back on refresh
    const sourceIds = notifications.filter(n => n.sourceId).map(n => n.sourceId!);
    const existing = getClearedIds();
    const merged = [...new Set([...existing, ...sourceIds])];
    saveClearedIds(merged);

    // Also mark them as read
    const readExisting = getReadIds();
    const readMerged = [...new Set([...readExisting, ...sourceIds])];
    saveReadIds(readMerged);

    setNotifications([]);
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, clearAll }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be within NotificationsProvider");
  return ctx;
}
