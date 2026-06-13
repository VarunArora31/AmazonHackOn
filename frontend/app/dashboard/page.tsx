"use client";

import { OmniBar } from "@/components/omni-bar";
import { CampusPulse } from "@/components/CampusPulse";
import { useNotices } from "@/lib/notices-context";
import { UniversalTimeline } from "@/components/UniversalTimeline";

export default function DashboardPage() {
  const { notices } = useNotices();

  return (
    <div className="space-y-6">
      {/* Live Campus Telemetry */}
      <CampusPulse />

      {/* Omni-bar for parsing */}
      <OmniBar />

      {/* Global feed — all categories, date-filtered via URL */}
      <UniversalTimeline
        events={notices}
        title="All Notices"
        emptyMessage="No notices yet. Paste something in the Omni-Bar above!"
      />
    </div>
  );
}
