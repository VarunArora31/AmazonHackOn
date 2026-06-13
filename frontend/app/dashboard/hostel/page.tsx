"use client";

import { Suspense } from "react";
import { SectionFeed } from "@/components/SectionFeed";

export default function HostelPage() {
  return (
    <Suspense fallback={null}>
      <SectionFeed category="Hostel Admin" title="Hostel & Mess" />
    </Suspense>
  );
}
