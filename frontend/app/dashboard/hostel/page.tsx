"use client";

import { useMemo } from "react";
import { useNotices } from "@/lib/notices-context";
import { UniversalTimeline } from "@/components/UniversalTimeline";

export default function HostelPage() {
  const { notices } = useNotices();

  const hostelEvents = useMemo(
    () => notices.filter((n) => n.category === "Hostel Admin"),
    [notices]
  );

  return (
    <UniversalTimeline
      events={hostelEvents}
      title="Hostel & Mess"
      emptyMessage="No hostel notices found."
    />
  );
}
