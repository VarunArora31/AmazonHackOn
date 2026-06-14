"use client";

import { OmniBar } from "@/components/omni-bar";
import { CampusPulse } from "@/components/CampusPulse";
import { CampusRAG } from "@/components/CampusRAG";
import { DocumentUploader } from "@/components/DocumentUploader";
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

      {/* Campus Knowledge Base (RAG) */}
      <CampusRAG />

      {/* Document Upload for Vector DB */}
      <DocumentUploader />

      {/* Global feed — all categories, date-filtered via URL */}
      <UniversalTimeline
        events={notices}
        title="All Notices"
        emptyMessage="No notices yet. Paste something in the Omni-Bar above!"
      />
    </div>
  );
}
