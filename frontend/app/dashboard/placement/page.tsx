"use client";

import { useMemo } from "react";
import { useNotices } from "@/lib/notices-context";
import { UniversalTimeline } from "@/components/UniversalTimeline";

export default function PlacementPage() {
  const { notices } = useNotices();

  const placementEvents = useMemo(
    () => notices.filter((n) => n.category === "Placement"),
    [notices]
  );

  return (
    <UniversalTimeline
      events={placementEvents}
      title="Placement Drives"
      emptyMessage="No placement notices found."
    />
  );
}
