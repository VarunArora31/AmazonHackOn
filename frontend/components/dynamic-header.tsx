"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Settings,
  Sun,
  Moon,
  Workflow,
  ArrowRightLeft,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useUser } from "@/lib/user-context";
import { useNotices } from "@/lib/notices-context";
import { calendarEvents } from "@/lib/data";
import { CommandPalette } from "./command-palette";

function getContextualMessage(
  notices: { title: string; urgency: string; category: string }[],
  events: typeof calendarEvents
): string {
  const hour = new Date().getHours();

  // Find next upcoming event
  const today = new Date().toISOString().split("T")[0];
  const todayEvents = events.filter((e) => e.date === today);

  // Time-based contextual awareness
  if (hour >= 7 && hour < 10) {
    const morningClass = todayEvents.find((e) => e.type === "class");
    if (morningClass) return `First class soon: ${morningClass.title} at ${morningClass.time.split(" - ")[0]}`;
    return "Good morning! No classes this morning.";
  }

  if (hour >= 19 && hour < 22) {
    const dinnerNotice = notices.find(
      (n) => n.category === "Hostel Admin" && n.title.toLowerCase().includes("dinner")
    );
    if (dinnerNotice) return `Tonight's update: ${dinnerNotice.title}`;
    return "Mess dinner is being served. Check the menu below.";
  }

  // Find urgent items
  const critical = notices.find((n) => n.urgency === "critical");
  if (critical) return `⚡ ${critical.title}`;

  if (hour >= 10 && hour < 13) return "Mid-morning. Stay focused on your lectures!";
  if (hour >= 13 && hour < 17) return "Afternoon session. Check your deadlines below.";
  if (hour >= 22) return "Late night. Don't forget curfew timings!";

  return "Your campus, organized.";
}

export function DynamicHeader() {
  const [isDark, setIsDark] = useState(true);
  const { user, switchToAdmin, switchToStudent } = useUser();
  const { notices } = useNotices();

  const contextMessage = useMemo(
    () => getContextualMessage(notices, calendarEvents),
    [notices]
  );

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleRoleSwitch = () => {
    if (user.role === "STUDENT") {
      switchToAdmin();
    } else {
      switchToStudent();
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="sticky top-0 z-50 border-b border-border/50 glass"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand + Context */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-accent/10 border border-accent/20">
              <Workflow className="w-4 h-4 text-accent" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-foreground tracking-tight leading-none">
                CampusFlow
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {user.role === "STUDENT" ? "Student Dashboard" : "Admin Panel"}
              </p>
            </div>
          </div>

          {/* Dynamic Island */}
          <motion.div
            key={contextMessage}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground max-w-[300px] truncate">
              {contextMessage}
            </span>
          </motion.div>
        </div>

        {/* Center: Command Palette trigger */}
        <CommandPalette />

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Role switch */}
          <button
            onClick={handleRoleSwitch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors border border-transparent hover:border-border"
            title="Switch role (demo)"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {user.role === "STUDENT" ? "Admin View" : "Student View"}
            </span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
          </button>

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Settings */}
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Avatar */}
          <div className="ml-1 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-background">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
