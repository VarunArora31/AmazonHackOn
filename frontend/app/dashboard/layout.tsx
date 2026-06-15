"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, GraduationCap, Building2,
  Briefcase, Users, Trophy, User, Loader2,
} from "lucide-react";
import { UserProvider } from "@/lib/user-context";
import { NoticesProvider } from "@/lib/notices-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { CommandPaletteProvider } from "@/lib/command-palette-context";
import { ChatProvider } from "@/lib/chat-context";
import { GlobalSidebar } from "@/components/GlobalSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SidebarChat } from "@/components/SidebarChat";
import { AdminAnnouncement } from "@/components/AdminAnnouncement";
import { AnnouncementLoader } from "@/components/AnnouncementLoader";
import { CommandPaletteDialog } from "@/components/command-palette";

// ─── Auth Guard ──────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const { getSession } = await import("@/lib/auth");
        const session = await getSession();
        if (session) {
          setAuthed(true);
        } else {
          router.replace("/auth");
        }
      } catch {
        router.replace("/auth");
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
      </div>
    );
  }

  if (!authed) return null;
  return <>{children}</>;
}

// ─── Layout ──────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <UserProvider>
        <NoticesProvider>
          <NotificationsProvider>
            <CommandPaletteProvider>
              <ChatProvider>
                <div className="flex h-screen overflow-hidden bg-background">
                  <AnnouncementLoader />
                  <GlobalSidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <DashboardHeader />
                    <div className="flex-1 flex overflow-hidden">
                      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 pb-20 lg:pb-5">
                        <Suspense fallback={<FeedSkeleton />}>
                          {children}
                        </Suspense>
                      </main>
                    </div>
                  </div>
                  <MobileNav />
                  <SidebarChat />
                  <AdminAnnouncement />
                  <CommandPaletteDialog />
                </div>
              </ChatProvider>
            </CommandPaletteProvider>
          </NotificationsProvider>
        </NoticesProvider>
      </UserProvider>
    </AuthGuard>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-5 w-3/4 bg-muted rounded" />
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-2/3 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Mobile Bottom Navigation ────────────────────────────────────

const mobileNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Feed" },
  { href: "/dashboard/personal", icon: User, label: "My Space" },
  { href: "/dashboard/academics", icon: GraduationCap, label: "Academics" },
  { href: "/dashboard/hostel", icon: Building2, label: "Hostel" },
  { href: "/dashboard/placement", icon: Briefcase, label: "Placement" },
  { href: "/dashboard/club", icon: Users, label: "Clubs" },
  { href: "/dashboard/sports", icon: Trophy, label: "Sports" },
];

function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-black/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-2">
        {mobileNavItems.slice(0, 5).map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                isActive ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-600"
              }`}>
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
