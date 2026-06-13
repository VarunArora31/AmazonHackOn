"use client";

import { Header } from "@/components/header";
import { OmniBar } from "@/components/omni-bar";
import { LiveFeed } from "@/components/live-feed";
import { CalendarWidget } from "@/components/calendar-widget";
import { QuickActions } from "@/components/quick-actions";
import { NoticesProvider } from "@/lib/notices-context";

export default function Dashboard() {
  return (
    <NoticesProvider>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Omni-Bar Hero Section */}
          <section>
            <OmniBar />
          </section>

          {/* Bento Grid Dashboard */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Feed — takes up majority of space */}
            <div className="lg:col-span-5 xl:col-span-5">
              <LiveFeed />
            </div>

            {/* Calendar — center column */}
            <div className="lg:col-span-4 xl:col-span-4">
              <CalendarWidget />
            </div>

            {/* Quick Actions Sidebar */}
            <div className="lg:col-span-3 xl:col-span-3">
              <QuickActions />
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-border py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Built for Amazon HackOn 2026</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              All systems operational
            </span>
          </div>
        </footer>
      </div>
    </NoticesProvider>
  );
}
