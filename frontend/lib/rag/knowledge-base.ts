/**
 * Campus Knowledge Base — In-Memory RAG
 *
 * For the hackathon demo, we use an in-memory vector-free approach:
 * chunked documents + keyword matching + Groq for reasoning.
 *
 * In production, this would connect to a vector DB (Pinecone/Supabase pgvector).
 */

// ─── Document Types ─────────────────────────────────────────────

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: "academics" | "placement" | "hostel" | "clubs" | "sports" | "transport" | "general";
  content: string;
  lastUpdated: string;
}

// ─── Campus Knowledge Base (simulates ingested PDFs/notices) ────

export const campusKnowledgeBase: KnowledgeDocument[] = [
  // ─── Academic Calendar & Exams ────────────────────────────
  {
    id: "acad-1",
    title: "End Semester Exam Schedule — June 2026",
    category: "academics",
    content: `End Semester Examination Schedule (June 2026):
- June 25: Mathematics-III (9:00 AM - 12:00 PM)
- June 26: Data Structures & Algorithms (9:00 AM - 12:00 PM)
- June 28: Operating Systems (2:00 PM - 5:00 PM)
- June 30: Database Management Systems (9:00 AM - 12:00 PM)
- July 2: Computer Networks (2:00 PM - 5:00 PM)
- July 4: Software Engineering (9:00 AM - 12:00 PM)
Reporting time: 30 minutes before exam. Carry admit card and ID.
No electronic devices allowed. Late entry: max 30 minutes.`,
    lastUpdated: "2026-06-10",
  },
  {
    id: "acad-2",
    title: "Academic Calendar 2025-26",
    category: "academics",
    content: `Key Academic Dates:
- Mid-semester exams: March 10-18, 2026
- End-semester exams: June 25 - July 4, 2026
- Summer break: July 5 - July 31, 2026
- New semester begins: August 1, 2026
- Last date to drop courses: February 28, 2026
- Project submission deadline: June 20, 2026
- Internal assessment marks submission by faculty: June 22, 2026
Minimum attendance requirement: 75% in each subject.
Students below 65% attendance debarred from end-sem exams.`,
    lastUpdated: "2026-01-15",
  },
  {
    id: "acad-3",
    title: "CSE 3rd Year Timetable",
    category: "academics",
    content: `CSE 3rd Year (Semester 6) Weekly Timetable:
Monday: DSA (9:00-10:30), OS Lab (2:00-5:00)
Tuesday: DBMS (9:00-10:30), CN (11:00-12:30), SE (2:00-3:30)
Wednesday: DSA (9:00-10:30), DBMS Lab (2:00-5:00)
Thursday: OS (9:00-10:30), CN (11:00-12:30), Math-III (2:00-3:30)
Friday: SE (9:00-10:30), Math-III (11:00-12:30), DSA Tutorial (2:00-3:00)
Saturday: CN Lab (9:00-12:00)
Room: CSE-301 (Theory), Lab-4 (Practicals)
Faculty: Prof. Verma (DSA), Prof. Gupta (OS), Dr. Singh (DBMS)`,
    lastUpdated: "2026-01-20",
  },

  // ─── Placement Information ────────────────────────────────
  {
    id: "place-1",
    title: "Placement Season 2026 — Company Schedule",
    category: "placement",
    content: `On-Campus Placement Drives (June-July 2026):
- Microsoft: June 15 (SDE Intern, CGPA 7.5+, CSE/IT only)
- Amazon: June 20 (SDE-1, CGPA 7.0+, All branches)
- Goldman Sachs: June 22 (Analyst, CGPA 8.0+, CSE/ECE)
- Google: June 28 (SWE Intern, CGPA 8.5+, CSE only)
- Flipkart: July 2 (SDE-1, CGPA 7.0+, CSE/IT/ECE)
- Uber: July 5 (Backend Engineer, CGPA 7.5+, CSE/IT)

Registration: Through ERP portal. Close 48 hours before drive.
Dress code: Formals mandatory. Carry 3 copies of resume.
Pre-placement talk: Usually 1 day before the drive.
Dream company policy: Can sit for max 2 dream companies.`,
    lastUpdated: "2026-06-01",
  },
  {
    id: "place-2",
    title: "Placement Preparation Resources",
    category: "placement",
    content: `Recommended Preparation:
- DSA: LeetCode (min 200 problems), focus on Arrays, Trees, Graphs, DP
- CS Fundamentals: OS (process, memory, deadlocks), DBMS (normalization, SQL), CN (TCP/IP, HTTP)
- System Design: Basic HLD for SDE-1 (load balancer, caching, DB sharding)
- Aptitude: Practice on PrepInsta, IndiaBIX
- Mock interviews available every Saturday 3-5 PM in Placement Cell
- Resume format: 1 page, ATS-friendly, available on college template portal
CGPA conversion: 10-point scale. 7.5 CGPA = 75% approximate.`,
    lastUpdated: "2026-05-15",
  },

  // ─── Hostel & Mess ────────────────────────────────────────
  {
    id: "hostel-1",
    title: "Hostel Rules & Timings",
    category: "hostel",
    content: `Hostel Regulations (2025-26):
- Main gate closes: 11:00 PM (weekdays), 12:00 AM (weekends)
- During fest week: Extended to 12:30 AM
- Late entry: Must sign register, 3 late entries = warden notification
- Overnight stay out: Prior written permission from warden
- Visitor timings: 4:00 PM - 7:00 PM (common room only)
- Wi-Fi curfew: None (24/7 available)
- Room inspection: Random, keep rooms clean
- Ragging: Zero tolerance, immediate expulsion
- Noise after 11 PM: Strict action, fine ₹500
Emergency contact: Warden Office - 9876543210 (24/7)`,
    lastUpdated: "2026-01-01",
  },
  {
    id: "hostel-2",
    title: "Mess Menu — June 2026 (Week 2)",
    category: "hostel",
    content: `Weekly Mess Menu (June 9-15, 2026):
Monday: Breakfast(Poha, Tea), Lunch(Dal, Rice, Roti, Aloo Gobi), Dinner(Chole Bhature, Salad)
Tuesday: Breakfast(Paratha, Curd), Lunch(Rajma, Rice, Roti, Mix Veg), Dinner(Paneer Butter Masala, Naan)
Wednesday: Breakfast(Idli Sambar), Lunch(Dal Fry, Rice, Roti, Bhindi), Dinner(Biryani, Raita)
Thursday: Breakfast(Bread Omelette), Lunch(Chole, Rice, Roti, Baingan), Dinner(Pasta, Garlic Bread)
Friday: Breakfast(Upma, Tea), Lunch(Sambar, Rice, Roti, Cabbage), Dinner(Dal Makhani, Jeera Rice, Roti)
Saturday: Breakfast(Aloo Paratha), Lunch(Kadhi Chawal, Roti, Salad), Dinner(Pav Bhaji)
Sunday: Breakfast(Chole Bhature), Lunch(Special Thali - Paneer, Dal, Rice, Roti, Sweet), Dinner(Egg Curry/Paneer, Rice, Roti)
Mess timing: Breakfast 7:30-9:30, Lunch 12:00-2:00, Dinner 7:30-9:30
Extra meals/midnight snacks: Canteen (open till 11:30 PM)`,
    lastUpdated: "2026-06-09",
  },

  // ─── Clubs & Events ───────────────────────────────────────
  {
    id: "club-1",
    title: "Technical Clubs & Events",
    category: "clubs",
    content: `Active Technical Clubs:
- Coding Club: Weekly contests (Saturday 8 PM), workshops, hackathon teams. Lead: Rahul K.
- Robotics Club: Monthly builds, competitions, lab access. Meets Wednesday 5 PM.
- AI/ML Club: Paper reading group, Kaggle competitions. Meets Friday 6 PM.
- Cybersecurity Club: CTF practice, workshops. Meets alternate Saturdays.
- Open Source Club: Contributing to FOSS, GSoC prep. Meets Thursday 5 PM.

Upcoming Events:
- TechFest 2026: June 18-22 (flagship technical festival)
- SIH (Smart India Hackathon): Registration open till June 30
- Inter-college Coding Championship: July 10
- Workshop: "System Design for Placements" by Alumni — June 16, 4 PM, Seminar Hall
Members get priority registration for all events.`,
    lastUpdated: "2026-06-05",
  },
  {
    id: "club-2",
    title: "Cultural & Sports Clubs",
    category: "clubs",
    content: `Cultural Clubs:
- Drama Club: Annual play rehearsals, open mics. Meets Tuesday 6 PM.
- Music Club: Band practice, open jam sessions. Room: Auditorium basement.
- Dance Club: Classical + Western. Practice daily 7-8 PM, Dance Room.
- Photography Club: Photowalks, exhibitions. Instagram: @campusclicks

Sports Facilities:
- Cricket ground, Football field, Basketball court, Badminton (4 courts)
- Gym: 6:00-8:00 AM, 5:00-7:00 PM (free for students)
- Swimming pool: 6:00-8:00 AM (seasonal, March-October)
- Inter-hostel tournament: Running (cricket, football, basketball, volleyball)
- Cricket Finals: Hostel 4 vs Hostel 7 — June 15, 4 PM, Main Ground`,
    lastUpdated: "2026-06-08",
  },

  // ─── Transport & General ──────────────────────────────────
  {
    id: "gen-1",
    title: "Campus Transport & Facilities",
    category: "transport",
    content: `Campus Bus Service:
- Route 1: Campus → City Center → Railway Station (7 AM, 9 AM, 5 PM, 8 PM)
- Route 2: Campus → Airport (On demand, book 24h advance via app)
- Route 3: Campus → Shopping Mall → Metro (10 AM, 2 PM, 6 PM)
Bus pass: ₹500/semester. Apply at Transport Office.

Other Facilities:
- ATM: SBI (near main gate), HDFC (hostel block C)
- Medical: Health Center 24/7, Ambulance: 9876500000
- Library: 8 AM - 10 PM (extended till midnight during exams)
- Printing: ₹2/page B&W, ₹10/page color (Stationery shop, Block A)
- Laundry: ₹500/month subscription (pickup from hostel)
- Parking: Two-wheeler free, Four-wheeler ₹200/month`,
    lastUpdated: "2026-02-01",
  },
  {
    id: "gen-2",
    title: "Important Contacts & Links",
    category: "general",
    content: `Important Contacts:
- Dean Academics: dean.acad@university.edu, 9876000001
- Placement Cell: placement@university.edu, 9876000002
- Chief Warden: warden@university.edu, 9876000003
- Anti-Ragging Helpline: 1800-180-5522 (24/7)
- Mental Health Counselor: wellness@university.edu, available Mon-Fri 10 AM-4 PM
- IT Helpdesk: ithelpdesk@university.edu (Wi-Fi, ERP issues)

Portals:
- ERP: erp.university.edu (attendance, grades, registration)
- LMS: lms.university.edu (assignments, materials)
- Placement Portal: placements.university.edu
- Library: library.university.edu (e-books, renewals)`,
    lastUpdated: "2026-01-01",
  },
];

// ─── RAG Retrieval (keyword + category matching) ────────────────

export function retrieveRelevantDocs(query: string, topK: number = 3): KnowledgeDocument[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

  // Score each document by relevance
  const scored = campusKnowledgeBase.map((doc) => {
    let score = 0;
    const contentLower = (doc.title + " " + doc.content).toLowerCase();

    // Keyword matching
    queryWords.forEach((word) => {
      if (contentLower.includes(word)) score += 2;
      if (doc.title.toLowerCase().includes(word)) score += 3; // title match is stronger
    });

    // Category boosting based on query intent
    if ((queryLower.includes("exam") || queryLower.includes("test") || queryLower.includes("schedule")) && doc.category === "academics") score += 5;
    if ((queryLower.includes("placement") || queryLower.includes("company") || queryLower.includes("interview")) && doc.category === "placement") score += 5;
    if ((queryLower.includes("mess") || queryLower.includes("food") || queryLower.includes("hostel") || queryLower.includes("curfew")) && doc.category === "hostel") score += 5;
    if ((queryLower.includes("club") || queryLower.includes("event") || queryLower.includes("hackathon") || queryLower.includes("fest")) && doc.category === "clubs") score += 5;
    if ((queryLower.includes("bus") || queryLower.includes("transport") || queryLower.includes("library") || queryLower.includes("gym")) && (doc.category === "transport" || doc.category === "general")) score += 5;
    if ((queryLower.includes("sport") || queryLower.includes("cricket") || queryLower.includes("football")) && doc.category === "clubs") score += 4;

    return { doc, score };
  });

  // Sort by score descending, return top K
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((s) => s.score > 0)
    .map((s) => s.doc);
}
