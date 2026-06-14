"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { CommandPalette } from "./command-palette";
import { CalendarPopover } from "./CalendarPopover";
import { ProfilePopover } from "./ProfilePopover";
import { NotificationBell } from "./NotificationBell";

const routeTitles: Record<string, string> = {
  "/dashboard": "All Notices",
  "/dashboard/personal": "My Space",
  "/dashboard/academics": "Academics",
  "/dashboard/hostel": "Hostel & Mess",
  "/dashboard/placement": "Placements",
  "/dashboard/club": "Clubs & Events",
  "/dashboard/sports": "Sports",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isDark, setIsDark] = useState(true);
  const [userMeta, setUserMeta] = useState<{ branch?: string; year?: string; isAdmin?: boolean } | null>(null);

  // Load real user metadata from Supabase
  useEffect(() => {
    async function loadMeta() {
      try {
        const { getCurrentUser, isAdminEmail } = await import("@/lib/auth");
        const u = await getCurrentUser();
        if (u?.user_metadata) {
          setUserMeta({
            branch: u.user_metadata.branch || "",
            year: u.user_metadata.year || "",
            isAdmin: u.email ? isAdminEmail(u.email) : false,
          });
        }
      } catch {}
    }
    loadMeta();
  }, []);

  const pageTitle = routeTitles[pathname] || "Dashboard";
  const badgeText = userMeta?.isAdmin
    ? "Admin"
    : userMeta?.branch && userMeta?.year
    ? `${userMeta.branch} · Year ${userMeta.year}`
    : userMeta?.branch || "Student";

  const toggleTheme = () => {
    document.documentElement.classList.add("transitioning");
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
    setTimeout(() => {
      document.documentElement.classList.remove("transitioning");
    }, 120);
  };

  return (
    <header className="shrink-0 border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 gap-2 sm:gap-4">
        {/* Left: Page title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <motion.h1
            key={pageTitle}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm sm:text-base font-bold text-foreground truncate"
          >
            {pageTitle}
          </motion.h1>
          <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium shrink-0">
            {badgeText}
          </span>
        </div>

        {/* Center: Command Palette trigger (hidden on very small screens) */}
        <div className="hidden sm:block">
          <CommandPalette />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Calendar Popover */}
          <CalendarPopover />

          <NotificationBell />

          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors">
            {isDark ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          <div className="ml-1 sm:ml-1.5">
            <ProfilePopover />
          </div>
        </div>
      </div>
    </header>
  );
}
