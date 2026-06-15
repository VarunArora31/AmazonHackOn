"use client";

import { useEffect, useRef, useCallback } from "react";
import { useNotices } from "@/lib/notices-context";
import { useNotifications } from "@/lib/notifications-context";

export function AnnouncementLoader() {
  const { addNotice } = useNotices();
  const { addNotification, isReady } = useNotifications();
  const loadedIdsRef = useRef<Set<string>>(new Set());
  const userRef = useRef<{ branch: string; year: string } | null>(null);

  const loadAnnouncements = useCallback(async () => {
    if (!isReady) return; // Wait until userId + flags are loaded

    try {
      if (!userRef.current) {
        const { getCurrentUser } = await import("@/lib/auth");
        const user = await getCurrentUser();
        if (!user) return;
        userRef.current = {
          branch: user.user_metadata?.branch || "ALL",
          year: user.user_metadata?.year || "ALL",
        };
      }

      const { branch, year } = userRef.current;
      const res = await fetch(`/api/announcements?branch=${branch}&year=${year}`);
      const data = await res.json();

      if (!data.success || !data.announcements?.length) return;

      data.announcements.forEach((ann: any) => {
        if (loadedIdsRef.current.has(ann.id)) return;
        loadedIdsRef.current.add(ann.id);

        addNotice({
          id: ann.id,
          title: ann.title,
          summary: ann.summary,
          category: ann.category,
          urgency: ann.urgency,
          date: ann.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
          time: new Date(ann.created_at).toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit", hour12: false,
          }),
          source: "official",
        });

        addNotification({
          sourceId: ann.id,
          title: `📢 ${ann.title}`,
          message: ann.summary,
          category: ann.category,
          timestamp: ann.created_at,
          targetBranch: ann.target_branch,
          targetYear: ann.target_year,
        });
      });
    } catch (err) {
      console.error("[AnnouncementLoader] Failed:", err);
    }
  }, [isReady, addNotice, addNotification]);

  useEffect(() => {
    loadAnnouncements();
    const interval = setInterval(loadAnnouncements, 30_000);
    return () => clearInterval(interval);
  }, [loadAnnouncements]);

  return null;
}
