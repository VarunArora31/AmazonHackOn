import type { AdminRole } from "./types";

// ─── Core Types ─────────────────────────────────────────────────

export type NoticeCategory =
  | "Hostel Admin"
  | "Academics"
  | "Placement"
  | "Club Event"
  | "Sports"
  | "General";

export type Urgency = "critical" | "high" | "normal" | "low";

/**
 * CampusEvent — the unified event/notice schema.
 * Every official notice in the system conforms to this interface.
 * Personal tasks extend this via the `source` field.
 */
export interface Notice {
  id: string;
  title: string;
  summary: string;
  category: NoticeCategory;
  urgency: Urgency;
  date: string;
  time: string;
  /** The admin role that created this event */
  authorRole?: AdminRole;
  /** 'official' = admin-created campus event, 'personal' = student-created task */
  source?: "official" | "personal";
  rawSource?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  type: "class" | "event" | "deadline" | "meeting";
  color: string;
}

export interface HostelTiming {
  label: string;
  time: string;
  active: boolean;
}

// ─── Role-to-Category mapping (for auto-tagging on creation) ────

export const roleToCategoryMap: Record<AdminRole, NoticeCategory> = {
  ADMIN_HOSTEL: "Hostel Admin",
  ADMIN_PLACEMENT: "Placement",
  ADMIN_ACADEMICS: "Academics",
  CLUB_LEAD: "Club Event",
  SPORTS_ADMIN: "Sports",
};

// ─── Mock Official Notices (Global Database) ────────────────────
// Empty by default — all real notices come from Supabase via AnnouncementLoader

export const notices: Notice[] = [];

// ─── Calendar Events ────────────────────────────────────────────

export const calendarEvents: CalendarEvent[] = [
  { id: "c1", title: "Data Structures Lecture", time: "09:00 - 10:30", date: "2026-06-14", type: "class", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "c2", title: "Microsoft Placement Drive", time: "11:00 - 13:00", date: "2026-06-15", type: "event", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "c3", title: "OS Assignment Due", time: "23:59", date: "2026-06-15", type: "deadline", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { id: "c4", title: "Coding Club Contest", time: "20:00 - 22:00", date: "2026-06-13", type: "event", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "c5", title: "DBMS Lab", time: "14:00 - 16:00", date: "2026-06-14", type: "class", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "c6", title: "TechFest Rehearsal", time: "17:00 - 19:00", date: "2026-06-16", type: "meeting", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "c7", title: "Cricket Finals", time: "16:00 - 18:00", date: "2026-06-15", type: "event", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "c8", title: "Computer Networks Lecture", time: "11:00 - 12:30", date: "2026-06-16", type: "class", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "c9", title: "Football Practice", time: "09:30 - 11:00", date: "2026-06-14", type: "event", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "c10", title: "Placement Workshop", time: "14:30 - 16:30", date: "2026-06-14", type: "event", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "c11", title: "Club Meeting", time: "11:30 - 13:00", date: "2026-06-15", type: "meeting", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "c12", title: "Basketball Tryouts", time: "17:30 - 19:00", date: "2026-06-16", type: "event", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
];

// ─── Hostel Timings ─────────────────────────────────────────────

export const hostelTimings: HostelTiming[] = [
  { label: "Main Gate Closes", time: "11:00 PM", active: true },
  { label: "Mess Breakfast", time: "7:30 - 9:30 AM", active: false },
  { label: "Mess Lunch", time: "12:00 - 2:00 PM", active: false },
  { label: "Mess Dinner", time: "7:30 - 9:30 PM", active: true },
  { label: "Library Closes", time: "10:00 PM", active: false },
  { label: "Gym Access", time: "6:00 - 8:00 AM", active: false },
];
