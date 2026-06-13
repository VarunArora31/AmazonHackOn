"use client";

import { Suspense } from "react";
import { SectionFeed } from "@/components/SectionFeed";

export default function ClubPage() {
  return (
    <Suspense fallback={null}>
      <SectionFeed category="Club Event" title="Clubs & Events" />
    </Suspense>
  );
}
