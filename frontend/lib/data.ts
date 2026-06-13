export type NoticeCategory =
  | "Hostel Admin"
  | "Academics"
  | "Placement"
  | "Club Event"
  | "Sports"
  | "General";

export type Urgency = "critical" | "high" | "normal" | "low";

export interface Notice {
  id: string;
  title: string;
  summary: string;
  category: NoticeCategory;
  urgency: Urgency;
  date: string;
  time: string;
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

export const notices: Notice[] = [
  {
    id: "1",
    title: "Mess Menu Changed — Dinner Updated",
    summary:
      "Tonight's dinner has been changed from Paneer Butter Masala to Chole Bhature due to supply issues. Breakfast remains unchanged.",
    category: "Hostel Admin",
    urgency: "high",
    date: "2026-06-13",
    time: "14:30",
    rawSource: "Fwd: Chief Warden msg - dinner menu changed today paneer not available so chole bhature will be served instead",
  },
  {
    id: "2",
    title: "Microsoft SDE Intern — Registration Link Live",
    summary:
      "Microsoft on-campus drive for SDE Intern role. Register on the placement portal by June 15, 11:59 PM. CGPA cutoff: 7.5+.",
    category: "Placement",
    urgency: "critical",
    date: "2026-06-13",
    time: "10:00",
  },
  {
    id: "3",
    title: "End-Sem Exam Schedule Released",
    summary:
      "End semester exams begin June 25. Data Structures on June 26 (9 AM), Operating Systems on June 28 (2 PM). Full schedule on ERP.",
    category: "Academics",
    urgency: "high",
    date: "2026-06-12",
    time: "18:00",
  },
  {
    id: "4",
    title: "Hostel Curfew Extended for Fest Week",
    summary:
      "Hostel curfew extended to 12:30 AM from June 18-22 during TechFest. Late entry requires warden approval.",
    category: "Hostel Admin",
    urgency: "normal",
    date: "2026-06-12",
    time: "16:45",
  },
  {
    id: "5",
    title: "Coding Club — Weekly Contest #14",
    summary:
      "This week's competitive programming contest is on Saturday 8 PM. Platform: Codeforces. Top 3 get swag.",
    category: "Club Event",
    urgency: "normal",
    date: "2026-06-13",
    time: "12:00",
  },
  {
    id: "6",
    title: "Library Books Return Deadline",
    summary:
      "All issued books must be returned by June 20 before end-sem exams. Fine: ₹5/day after deadline.",
    category: "General",
    urgency: "low",
    date: "2026-06-11",
    time: "09:00",
  },
  {
    id: "7",
    title: "Inter-Hostel Cricket Finals",
    summary:
      "Finals between Hostel 4 and Hostel 7 at the main ground, June 15 at 4 PM. All are welcome to cheer.",
    category: "Sports",
    urgency: "low",
    date: "2026-06-11",
    time: "11:30",
  },
];

export const calendarEvents: CalendarEvent[] = [
  {
    id: "c1",
    title: "Data Structures Lecture",
    time: "09:00 - 10:30",
    date: "2026-06-14",
    type: "class",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    id: "c2",
    title: "Microsoft Placement Drive",
    time: "11:00 - 13:00",
    date: "2026-06-15",
    type: "event",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    id: "c3",
    title: "OS Assignment Due",
    time: "23:59",
    date: "2026-06-15",
    type: "deadline",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  {
    id: "c4",
    title: "Coding Club Contest",
    time: "20:00 - 22:00",
    date: "2026-06-13",
    type: "event",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "c5",
    title: "DBMS Lab",
    time: "14:00 - 16:00",
    date: "2026-06-14",
    type: "class",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    id: "c6",
    title: "TechFest Rehearsal",
    time: "17:00 - 19:00",
    date: "2026-06-16",
    type: "meeting",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  {
    id: "c7",
    title: "Cricket Finals",
    time: "16:00 - 18:00",
    date: "2026-06-15",
    type: "event",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "c8",
    title: "Computer Networks Lecture",
    time: "11:00 - 12:30",
    date: "2026-06-16",
    type: "class",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
];

export const hostelTimings: HostelTiming[] = [
  { label: "Main Gate Closes", time: "11:00 PM", active: true },
  { label: "Mess Breakfast", time: "7:30 - 9:30 AM", active: false },
  { label: "Mess Lunch", time: "12:00 - 2:00 PM", active: false },
  { label: "Mess Dinner", time: "7:30 - 9:30 PM", active: true },
  { label: "Library Closes", time: "10:00 PM", active: false },
  { label: "Gym Access", time: "6:00 - 8:00 AM", active: false },
];
