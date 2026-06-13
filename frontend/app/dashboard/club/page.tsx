"use client";

import { useMemo } from "react";
import { useNotices } from "@/lib/notices-context";
import { UniversalTimeline } from "@/components/UniversalTimeline";

export default function ClubPage() {
  const { notices } = useNotices();

  const clubEvents = useMemo(
    () => notices.filter((n) => n.category === "Club Event"),
    [notices]
  );

  return (
    <UniversalTimeline
      events={clubEvents}
      title="Clubs & Events"
      emptyMessage="No club events found."
    />
  );
}
