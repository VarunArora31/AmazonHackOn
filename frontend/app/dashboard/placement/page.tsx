"use client";

import { Suspense } from "react";
import { SectionFeed } from "@/components/SectionFeed";

export default function PlacementPage() {
  return (
    <Suspense fallback={null}>
      <SectionFeed category="Placement" title="Placement Drives" />
    </Suspense>
  );
}
