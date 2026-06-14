"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (n: Omit<Notification, "id" | "read"> & { _preRead?: boolean }) => {
    const { _preRead, timestamp: providedTimestamp, ...rest } = n as any;
    setNotifications((prev) => {
      if (rest.sourceId && prev.some((p) => p.sourceId === rest.sourceId)) return prev;
      const updated = [
        {
          ...rest,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: providedTimestamp || new Date().toISOString(),
          read: _preRead || false,
        },
        ...prev,
      ];
      // Sort by timestamp descending (newest first)
      return updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
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
