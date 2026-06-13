"use client";

import { useMemo } from "react";
import { useNotices } from "@/lib/notices-context";
import { UniversalTimeline } from "@/components/UniversalTimeline";

export default function AcademicsPage() {
  const { notices } = useNotices();

  const academicEvents = useMemo(
    () => notices.filter((n) => n.category === "Academics"),
    [notices]
  );

  return (
    <UniversalTimeline
      events={academicEvents}
      title="Academic Notices"
      emptyMessage="No academic notices found."
    />
  );
}
