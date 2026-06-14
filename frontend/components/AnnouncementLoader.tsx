"use client";

import { useEffect, useRef } from "react";
import { useNotices } from "@/lib/notices-context";
import { useNotifications } from "@/lib/notifications-context";

/**
 * Loads announcements from Supabase into notices + notifications.
 * Read state is stored per-user in localStorage (keyed by user ID).
 */
export function AnnouncementLoader() {
  const { addNotice } = useNotices();
  const { addNotification } = useNotifications();
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    async function load() {
      try {
        const { getCurrentUser } = await import("@/lib/auth");
        const user = await getCurrentUser();
        if (!user) return;

        const branch = user.user_metadata?.branch || "ALL";
        const year = user.user_metadata?.year || "ALL";
        // Per-user localStorage key
        const userKey = `read_announcements_${user.id}`;

        const res = await fetch(`/api/announcements?branch=${branch}&year=${year}`);
        const data = await res.json();

        if (data.success && data.announcements?.length > 0) {
          const readIds: string[] = JSON.parse(localStorage.getItem(userKey) || "[]");

          data.announcements.forEach((ann: any) => {
            addNotice({
              id: ann.id,
              title: ann.title,
              summary: ann.summary,
              category: ann.category,
              urgency: ann.urgency,
              date: ann.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
              time: new Date(ann.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
              source: "official",
            });

            // Always add notification, but mark as read if previously seen
            const isRead = readIds.includes(ann.id);
            addNotification({
              sourceId: ann.id,
              title: `📢 ${ann.title}`,
              message: ann.summary,
              category: ann.category,
              timestamp: ann.created_at, // Preserve original time from Supabase
              targetBranch: ann.target_branch,
              targetYear: ann.target_year,
              _preRead: isRead,
            } as any);
          });
        }
      } catch (err) {
        console.error("[AnnouncementLoader] Failed:", err);
      }
    }

    load();
  }, [addNotice, addNotification]);

  return null;
}
