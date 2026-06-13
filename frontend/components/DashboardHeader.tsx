"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Sun,
  Moon,
  ArrowRightLeft,
  Sparkles,
  Search,
  Command as CommandIcon,
} from "lucide-react";
import { useState } from "react";
import { useUser } from "@/lib/user-context";
import { CommandPalette } from "./command-palette";

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
  const { user, switchToAdmin, switchToStudent } = useUser();
  const [isDark, setIsDark] = useState(true);

  const pageTitle = routeTitles[pathname] || "Dashboard";

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleRoleSwitch = () => {
    if (user.role === "STUDENT") switchToAdmin();
    else switchToStudent();
  };

  return (
    <header className="shrink-0 border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        {/* Left: Page title */}
        <div className="flex items-center gap-3 min-w-0">
          <motion.h1
            key={pageTitle}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-base font-bold text-foreground truncate"
          >
            {pageTitle}
          </motion.h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium shrink-0">
            {user.role === "STUDENT"
              ? `${(user as any).branch} · Year ${(user as any).year}`
              : user.role.replace("ADMIN_", "").replace("_", " ")}
          </span>
        </div>

        {/* Center: Command Palette trigger */}
        <CommandPalette />

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleRoleSwitch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:bg-muted transition-colors border border-transparent hover:border-border"
            title="Switch role (demo)"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {user.role === "STUDENT" ? "Admin" : "Student"}
            </span>
          </button>

          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
          </button>

          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors">
            {isDark ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          <div className="ml-1.5 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-card">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
