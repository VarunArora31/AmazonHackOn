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
// Seed notices use relative dates so they always appear current when evaluators view the app.
// These are merged with real Supabase announcements via AnnouncementLoader.

function getRelativeDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().split("T")[0];
}

export const notices: Notice[] = [
  // ─── TODAY ──────────────────────────────────────────────────
  {
    id: "seed-1",
    title: "Mess Menu Changed — Dinner Updated",
    summary: "Tonight's dinner changed from Paneer Butter Masala to Chole Bhature due to supply issues. Breakfast unchanged.",
    category: "Hostel Admin",
    urgency: "high",
    date: getRelativeDate(0),
    time: "14:30",
    authorRole: "ADMIN_HOSTEL",
    source: "official",
  },
  {
    id: "seed-2",
    title: "Microsoft SDE Intern — Registration Link Live",
    summary: "Microsoft on-campus drive for SDE Intern role. Register on placement portal by end of week. CGPA cutoff: 7.5+.",
    category: "Placement",
    urgency: "critical",
    date: getRelativeDate(0),
    time: "10:00",
    authorRole: "ADMIN_PLACEMENT",
    source: "official",
  },
  {
    id: "seed-3",
    title: "Data Structures Lecture",
    summary: "Regular DS lecture covering Graphs & Trees in Room 204.",
    category: "Academics",
    urgency: "normal",
    date: getRelativeDate(0),
    time: "09:00 - 10:30",
    authorRole: "ADMIN_ACADEMICS",
    source: "official",
  },
  {
    id: "seed-4",
    title: "Coding Club — Weekly Contest #14",
    summary: "This week's competitive programming contest at 8 PM. Platform: Codeforces. Top 3 get swag.",
    category: "Club Event",
    urgency: "normal",
    date: getRelativeDate(0),
    time: "20:00 - 22:00",
    authorRole: "CLUB_LEAD",
    source: "official",
  },
  // ─── TOMORROW ───────────────────────────────────────────────
  {
    id: "seed-5",
    title: "End-Sem Exam Schedule Released",
    summary: "End semester exams begin next week. Data Structures first (9 AM), Operating Systems two days later (2 PM). Full schedule on ERP.",
    category: "Academics",
    urgency: "high",
    date: getRelativeDate(1),
    time: "09:00",
    authorRole: "ADMIN_ACADEMICS",
    source: "official",
  },
  {
    id: "seed-6",
    title: "DBMS Lab",
    summary: "Database Management Systems lab session in Lab 3. Bring your ER diagrams.",
    category: "Academics",
    urgency: "normal",
    date: getRelativeDate(1),
    time: "14:00 - 16:00",
    authorRole: "ADMIN_ACADEMICS",
    source: "official",
  },
  {
    id: "seed-7",
    title: "Placement Workshop — Resume Building",
    summary: "Resume building and mock interview workshop by T&P Cell in Seminar Hall. Open to all years.",
    category: "Placement",
    urgency: "normal",
    date: getRelativeDate(1),
    time: "14:30 - 16:30",
    authorRole: "ADMIN_PLACEMENT",
    source: "official",
  },
  {
    id: "seed-8",
    title: "Football Practice",
    summary: "Regular football practice session at the main ground. All team members mandatory.",
    category: "Sports",
    urgency: "low",
    date: getRelativeDate(1),
    time: "09:30 - 11:00",
    authorRole: "SPORTS_ADMIN",
    source: "official",
  },
  // ─── DAY AFTER TOMORROW ─────────────────────────────────────
  {
    id: "seed-9",
    title: "Hostel Curfew Extended for Fest Week",
    summary: "Hostel curfew extended to 12:30 AM for the upcoming TechFest week. Late entry requires warden approval.",
    category: "Hostel Admin",
    urgency: "normal",
    date: getRelativeDate(2),
    time: "16:45",
    authorRole: "ADMIN_HOSTEL",
    source: "official",
  },
  {
    id: "seed-10",
    title: "Computer Networks Lecture",
    summary: "CN lecture on TCP/IP and socket programming in Room 301.",
    category: "Academics",
    urgency: "normal",
    date: getRelativeDate(2),
    time: "11:00 - 12:30",
    authorRole: "ADMIN_ACADEMICS",
    source: "official",
  },
  {
    id: "seed-11",
    title: "TechFest Rehearsal",
    summary: "Final rehearsal for TechFest opening ceremony in the main auditorium.",
    category: "Club Event",
    urgency: "normal",
    date: getRelativeDate(2),
    time: "17:00 - 19:00",
    authorRole: "CLUB_LEAD",
    source: "official",
  },
  {
    id: "seed-12",
    title: "Basketball Tryouts",
    summary: "Open tryouts for the inter-college basketball team at the indoor court.",
    category: "Sports",
    urgency: "low",
    date: getRelativeDate(2),
    time: "17:30 - 19:00",
    authorRole: "SPORTS_ADMIN",
    source: "official",
  },
  // ─── 3 DAYS FROM NOW ────────────────────────────────────────
  {
    id: "seed-13",
    title: "OS Assignment Due",
    summary: "Operating Systems assignment submission deadline. Submit on ERP portal by 11:59 PM.",
    category: "Academics",
    urgency: "high",
    date: getRelativeDate(3),
    time: "23:59",
    authorRole: "ADMIN_ACADEMICS",
    source: "official",
  },
  {
    id: "seed-14",
    title: "Inter-Hostel Cricket Finals",
    summary: "Finals between Hostel 4 and Hostel 7 at the main ground, 4 PM. All are welcome to cheer.",
    category: "Sports",
    urgency: "low",
    date: getRelativeDate(3),
    time: "16:00 - 18:00",
    authorRole: "SPORTS_ADMIN",
    source: "official",
  },
  {
    id: "seed-15",
    title: "Club Meeting — Monthly Planning",
    summary: "Monthly planning meeting for all club heads in Conference Room B.",
    category: "Club Event",
    urgency: "low",
    date: getRelativeDate(3),
    time: "11:30 - 13:00",
    authorRole: "CLUB_LEAD",
    source: "official",
  },
  // ─── 5 DAYS FROM NOW ────────────────────────────────────────
  {
    id: "seed-16",
    title: "Library Books Return Deadline",
    summary: "All issued books must be returned before end-sem exams. Fine: ₹5/day after deadline.",
    category: "General",
    urgency: "low",
    date: getRelativeDate(5),
    time: "09:00",
    source: "official",
  },
];

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
