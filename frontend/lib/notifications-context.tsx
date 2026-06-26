"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";

export interface Notification {
  id: string;
  sourceId?: string; // Supabase announcement ID — stable across sessions
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
  isReady: boolean; // true once userId is loaded and flags are initialized
  addNotification: (n: any) => void;
  markOneRead: (sourceId: string) => void;
  markAllRead: () => void;
  clearOne: (sourceId: string) => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// ─── Per-user localStorage helpers ─────────────────────────────

function storageGet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); }
  catch { return new Set(); }
}

function storageSet(key: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify([...ids])); } catch {}
}

function keys(uid: string) {
  return {
    read: `notif_read_${uid}`,
    cleared: `notif_cleared_${uid}`,
  };
}

// ─── Provider ───────────────────────────────────────────────────

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isReady, setIsReady] = useState(false);
  const uidRef = useRef<string>("");

  // On mount: load user ID, then mark context as ready
  useEffect(() => {
    (async () => {
      try {
        const { getCurrentUser } = await import("@/lib/auth");
        const user = await getCurrentUser();
        // Use a guaranteed non-empty fallback so per-user keys never collapse to "notif_read_"
        uidRef.current = user?.id || "anonymous";
      } catch {
        uidRef.current = "anonymous";
      }
      setIsReady(true);
    })();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Called by AnnouncementLoader — only after isReady
  const addNotification = useCallback((n: any) => {
    if (!isReady) return; // Don't accept notifications before userId is loaded
    const uid = uidRef.current;
    const { timestamp: ts, ...rest } = n as any;
    const sourceId: string | undefined = rest.sourceId;

    // Skip if cleared
    if (sourceId) {
      const { cleared } = keys(uid);
      if (storageGet(cleared).has(sourceId)) return;
    }

    setNotifications((prev) => {
      // Deduplicate
      if (sourceId && prev.some((p) => p.sourceId === sourceId)) return prev;

      // Check read state from localStorage
      let isRead = false;
      if (sourceId) {
        const { read } = keys(uid);
        isRead = storageGet(read).has(sourceId);
      }

      const newNotif: Notification = {
        ...rest,
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: ts || new Date().toISOString(),
        read: isRead,
      };

      return [newNotif, ...prev].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });
  }, [isReady]);

  const markOneRead = useCallback((sourceId: string) => {
    const uid = uidRef.current;
    const { read } = keys(uid);
    const ids = storageGet(read);
    ids.add(sourceId);
    storageSet(read, ids);
    setNotifications((prev) =>
      prev.map((n) => n.sourceId === sourceId ? { ...n, read: true } : n)
    );
  }, []);

  const markAllRead = useCallback(() => {
    const uid = uidRef.current;
    setNotifications((prev) => {
      const { read } = keys(uid);
      const ids = storageGet(read);
      prev.forEach((n) => { if (n.sourceId) ids.add(n.sourceId); });
      storageSet(read, ids);
      return prev.map((n) => ({ ...n, read: true }));
    });
  }, []);

  const clearOne = useCallback((sourceId: string) => {
    const uid = uidRef.current;
    const { cleared, read } = keys(uid);
    const c = storageGet(cleared); c.add(sourceId); storageSet(cleared, c);
    const r = storageGet(read); r.add(sourceId); storageSet(read, r);
    setNotifications((prev) => prev.filter((n) => n.sourceId !== sourceId));
  }, []);

  const clearAll = useCallback(() => {
    const uid = uidRef.current;
    setNotifications((prev) => {
      const { cleared, read } = keys(uid);
      const c = storageGet(cleared);
      const r = storageGet(read);
      prev.forEach((n) => { if (n.sourceId) { c.add(n.sourceId); r.add(n.sourceId); } });
      storageSet(cleared, c);
      storageSet(read, r);
      return [];
    });
  }, []);

  return (
    <NotificationsContext.Provider value={{
      notifications, unreadCount, isReady,
      addNotification, markOneRead, markAllRead, clearOne, clearAll,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be within NotificationsProvider");
  return ctx;
}
