"use client";

import { motion } from "framer-motion";
import {
  Clock,
  AlertCircle,
  GraduationCap,
  Building2,
  Briefcase,
  Users,
  Trophy,
  Info,
} from "lucide-react";
import { notices, type Notice, type NoticeCategory, type Urgency } from "@/lib/data";

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
    color: "text-gray-400",
    bg: "bg-gray-500/10 border-gray-500/20",
  },
};

const urgencyConfig: Record<Urgency, { dot: string; label: string }> = {
  critical: { dot: "bg-red-500 animate-pulse", label: "Urgent" },
  high: { dot: "bg-orange-500", label: "Important" },
  normal: { dot: "bg-blue-500", label: "" },
  low: { dot: "bg-gray-400", label: "" },
};

function NoticeCard({ notice, index }: { notice: Notice; index: number }) {
  const cat = categoryConfig[notice.category];
  const urg = urgencyConfig[notice.urgency];
  const Icon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className="group relative rounded-xl border border-border bg-card p-4 hover:border-accent/30 transition-all hover:shadow-lg hover:shadow-accent/5"
    >
      {/* Urgency indicator */}
      {(notice.urgency === "critical" || notice.urgency === "high") && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${urg.dot}`} />
          {urg.label && (
            <span className="text-[10px] font-medium text-destructive uppercase tracking-wider">
              {urg.label}
            </span>
          )}
        </div>
      )}

      {/* Category badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${cat.bg} ${cat.color} mb-3`}
      >
        <Icon className="w-3 h-3" />
        {notice.category}
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
        <span>•</span>
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
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">Live Feed</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
            {notices.length} notices
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {notices.map((notice, i) => (
          <NoticeCard key={notice.id} notice={notice} index={i} />
        ))}
      </div>
    </div>
  );
}
