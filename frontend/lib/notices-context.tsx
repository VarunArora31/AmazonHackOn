"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { notices as initialNotices, roleToCategoryMap, type Notice, type NoticeCategory } from "./data";
import type { AdminRole } from "./types";

// ─── Context Interface ──────────────────────────────────────────

interface NoticesContextType {
  /** The global notices array (single source of truth) */
  notices: Notice[];

  /**
   * Add a notice to the global feed.
   * If `authorRole` is provided, automatically tags category + source.
   */
  addNotice: (notice: Notice, authorRole?: AdminRole) => void;

  /**
   * Global delete — removes from the central database.
   * Only admins should call this. Instantly disappears from all feeds.
   */
  deleteNotice: (id: string) => void;
}

const NoticesContext = createContext<NoticesContextType | undefined>(undefined);

export function NoticesProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>(initialNotices);

  const addNotice = useCallback((notice: Notice, authorRole?: AdminRole) => {
    const enrichedNotice: Notice = {
      ...notice,
      source: notice.source || "official",
      authorRole: authorRole || notice.authorRole,
      category:
        notice.category ||
        (authorRole ? roleToCategoryMap[authorRole] : "General"),
    };

    setNotices((prev) => {
      // Prevent duplicates by ID
      if (prev.some((n) => n.id === enrichedNotice.id)) {
        return prev;
      }
      return [enrichedNotice, ...prev];
    });
  }, []);

  const deleteNotice = useCallback((id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NoticesContext.Provider value={{ notices, addNotice, deleteNotice }}>
      {children}
    </NoticesContext.Provider>
  );
}

export function useNotices() {
  const context = useContext(NoticesContext);
  if (!context) {
    throw new Error("useNotices must be used within a NoticesProvider");
  }
  return context;
}
