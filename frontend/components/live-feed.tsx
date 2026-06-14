"use client";

import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Clock,
  AlertCircle,
  GraduationCap,
  Building2,
  Briefcase,
  Users,
  Trophy,
  Info,
  Filter,
  Sparkles,
} from "lucide-react";
import { useNotices } from "@/lib/notices-context";
import { useUser } from "@/lib/user-context";
import type { Notice, NoticeCategory, Urgency } from "@/lib/data";

const categoryConfig: Record<
  NoticeCategory,
  { icon: React.ElementType; color: string; bg: string }
> = {
  "Hostel Admin": {
    icon: Building2,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  Academics: {
    icon: GraduationCap,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  Placement: {
    icon: Briefcase,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  "Club Event": {
    icon: Users,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  Sports: {
    icon: Trophy,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  General: {
    icon: Info,
    color: "text-neutral-400",
    bg: "bg-neutral-100 border-neutral-200",
  },
};

const urgencyConfig: Record<Urgency, { dot: string; label: string }> = {
  critical: { dot: "bg-red-500 animate-pulse", label: "Urgent" },
  high: { dot: "bg-orange-500", label: "Important" },
  normal: { dot: "bg-blue-500", label: "" },
  low: { dot: "bg-neutral-400", label: "" },
};

const filterOptions: (NoticeCategory | "All")[] = [
  "All",
  "Academics",
  "Placement",
  "Hostel Admin",
  "Club Event",
  "Sports",
  "General",
];

function NoticeCard({ notice }: { notice: Notice }) {
  const cat = categoryConfig[notice.category];
  const urg = urgencyConfig[notice.urgency];
  const Icon = cat.icon;
  const { user } = useUser();

  // Show "Your Branch" badge for students viewing academic notices
  const showBranchBadge =
    user.role === "STUDENT" && notice.category === "Academics";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="group relative rounded-xl border border-border bg-card p-4 card-glow"
    >
      {/* Urgency indicator */}
      {(notice.urgency === "critical" || notice.urgency === "high") && (
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${urg.dot}`} />
          {urg.label && (
            <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider">
              {urg.label}
            </span>
          )}
        </div>
      )}

      {/* Category + Branch badges */}
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium ${cat.bg} ${cat.color}`}
        >
          <Icon className="w-3 h-3" />
          {notice.category}
        </div>
        {showBranchBadge && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-[10px] font-semibold text-accent">
            <Sparkles className="w-2.5 h-2.5" />
            Your Branch
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-card-foreground mb-1.5 pr-16 leading-snug">
        {notice.title}
      </h3>

      {/* Summary */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {notice.summary}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{notice.time}</span>
        </div>
        <span>·</span>
        <span>{formatDate(notice.date)}</span>
      </div>
    </motion.div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function LiveFeed() {
  const { notices } = useNotices();
  const [filter, setFilter] = useState<NoticeCategory | "All">("All");

  const filtered =
    filter === "All" ? notices : notices.filter((n) => n.category === filter);

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">Live Feed</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {filterOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              filter === opt
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-muted-foreground border border-border/50 hover:bg-muted/50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Cards with layout animation */}
      <LayoutGroup>
        <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {filtered.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No notices in this category yet.
            </div>
          )}
        </div>
      </LayoutGroup>
    </div>
  );
}
