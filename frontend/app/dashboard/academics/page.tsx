"use client";

import { Suspense } from "react";
import { SectionFeed } from "@/components/SectionFeed";

export default function AcademicsPage() {
  return (
    <Suspense fallback={null}>
      <SectionFeed category="Academics" title="Academic Notices" />
    </Suspense>
  );
}
