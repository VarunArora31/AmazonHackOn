"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  Briefcase,
  Users,
  Trophy,
  Workflow,
  Settings,
  LogOut,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "All Feed" },
  { href: "/dashboard/academics", icon: GraduationCap, label: "Academics" },
  { href: "/dashboard/hostel", icon: Building2, label: "Hostel" },
  { href: "/dashboard/placement", icon: Briefcase, label: "Placement" },
  { href: "/dashboard/club", icon: Users, label: "Clubs" },
  { href: "/dashboard/sports", icon: Trophy, label: "Sports" },
];

export function GlobalSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="hidden lg:flex flex-col items-center py-6 px-2 w-[68px] border-r border-border/50 bg-sidebar shrink-0 sticky top-0 h-screen">
      {/* Logo */}
      <Link href="/dashboard" className="mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 border border-accent/20">
          <Workflow className="w-5 h-5 text-accent" />
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} title={item.label}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-accent"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        <button
          className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Settings"
        >
          <Settings className="w-[18px] h-[18px]" />
        </button>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-sidebar"
          title={`${user.name} (${user.role})`}
        >
          {user.name.charAt(0)}
        </div>
      </div>
    </aside>
  );
}
