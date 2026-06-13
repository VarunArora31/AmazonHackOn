"use client";

import { Suspense } from "react";
import { OmniBar } from "@/components/omni-bar";
import { SectionFeed } from "@/components/SectionFeed";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Omni-bar for parsing */}
      <OmniBar />

      {/* Global feed — all categories */}
      <Suspense fallback={null}>
        <SectionFeed title="All Notices" />
      </Suspense>
    </div>
  );
}
