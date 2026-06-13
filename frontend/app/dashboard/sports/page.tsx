"use client";

import { Suspense } from "react";
import { SectionFeed } from "@/components/SectionFeed";

export default function SportsPage() {
  return (
    <Suspense fallback={null}>
      <SectionFeed category="Sports" title="Sports" />
    </Suspense>
  );
}
