"use client";

import { Suspense } from "react";
import { UserProvider } from "@/lib/user-context";
import { NoticesProvider } from "@/lib/notices-context";
import { GlobalSidebar } from "@/components/GlobalSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { InteractiveCalendar } from "@/components/InteractiveCalendar";
import { AddAnnouncementCTA } from "@/components/AddAnnouncementCTA";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <NoticesProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Left: Global Sidebar */}
          <GlobalSidebar />

          {/* Center: Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top: Persistent Header with Omni-bar */}
            <DashboardHeader />

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Feed (children routes render here) */}
              <main className="flex-1 overflow-y-auto px-6 py-5">
                <Suspense fallback={<FeedSkeleton />}>
                  {children}
                </Suspense>
              </main>

              {/* Right: Calendar Sidebar */}
              <aside className="hidden xl:block w-[280px] border-l border-border/50 overflow-y-auto px-4 py-5 shrink-0">
                <Suspense fallback={null}>
                  <InteractiveCalendar />
                </Suspense>
              </aside>
            </div>
          </div>

          {/* RBAC-aware floating CTA */}
          <AddAnnouncementCTA />
        </div>
      </NoticesProvider>
    </UserProvider>
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
