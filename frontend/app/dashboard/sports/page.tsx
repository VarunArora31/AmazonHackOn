"use client";

import { useMemo } from "react";
import { useNotices } from "@/lib/notices-context";
import { UniversalTimeline } from "@/components/UniversalTimeline";

export default function SportsPage() {
  const { notices } = useNotices();

  const sportsEvents = useMemo(
    () => notices.filter((n) => n.category === "Sports"),
    [notices]
  );

  return (
    <UniversalTimeline
      events={sportsEvents}
      title="Sports"
      emptyMessage="No sports notices found."
    />
  );
}
