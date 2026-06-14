/**
 * AI Conflict Resolver API
 *
 * POST /api/ai/conflict
 * Body: { events: Array<{ title, time, date, category, priority? }> }
 *
 * Detects scheduling conflicts and uses Groq to reason
 * about which events to prioritize with explanations.
 */

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");
    groq = new Groq({ apiKey });
  }
  return groq;
}

interface ScheduleEvent {
  id: string;
  title: string;
  time: string; // "09:00" or "09:00 - 10:30"
  date: string; // "2026-06-14"
  category: string;
  priority?: "high" | "medium" | "low";
}

interface Conflict {
  event1: ScheduleEvent;
  event2: ScheduleEvent;
  overlapMinutes: number;
}

// ─── Time Parsing ───────────────────────────────────────────────

function parseTime(timeStr: string): { start: number; end: number } {
  const parts = timeStr.split("-").map((s) => s.trim());
  const startMinutes = toMinutes(parts[0]);
  const endMinutes = parts[1] ? toMinutes(parts[1]) : startMinutes + 60; // default 1hr
  return { start: startMinutes, end: endMinutes };
}

function toMinutes(t: string): number {
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) {
    const hourOnly = parseInt(t);
    if (!isNaN(hourOnly)) return hourOnly * 60;
    return 0;
  }
  let hours = parseInt(match[1]);
  const mins = parseInt(match[2]);
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + mins;
}

// ─── Conflict Detection ─────────────────────────────────────────

function detectConflicts(events: ScheduleEvent[]): Conflict[] {
  const conflicts: Conflict[] = [];

  // Group by date
  const byDate = new Map<string, ScheduleEvent[]>();
  events.forEach((e) => {
    const group = byDate.get(e.date) || [];
    group.push(e);
    byDate.set(e.date, group);
  });

  // Check overlaps within each date
  byDate.forEach((dayEvents) => {
    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const a = parseTime(dayEvents[i].time);
        const b = parseTime(dayEvents[j].time);

        const overlapStart = Math.max(a.start, b.start);
        const overlapEnd = Math.min(a.end, b.end);
        const overlap = overlapEnd - overlapStart;

        if (overlap > 0) {
          conflicts.push({
            event1: dayEvents[i],
            event2: dayEvents[j],
            overlapMinutes: overlap,
          });
        }
      }
    }
  });

  return conflicts;
}

// ─── Groq Reasoning ─────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI campus schedule conflict resolver for Indian university students. You analyze scheduling conflicts and provide intelligent recommendations.

For each conflict, you must:
1. Assess importance of each event (academic weight, career impact, personal wellbeing)
2. Consider deadline proximity, attendance requirements, availability of recordings/alternatives
3. Calculate a "conflict score" for each event
4. Provide a clear recommendation with reasoning

Output STRICTLY valid JSON matching this schema:
{
  "conflicts": [
    {
      "event1_title": "string",
      "event2_title": "string",
      "recommendation": "ATTEND_EVENT1" | "ATTEND_EVENT2" | "PARTIAL_BOTH",
      "reasoning": "2-3 sentence explanation of why",
      "event1_score": number (0-100, higher = more important),
      "event2_score": number (0-100, higher = more important),
      "alternative_suggestion": "optional suggestion for the skipped event"
    }
  ],
  "overall_advice": "1 sentence summary of the day's strategy"
}`;

// ─── POST Handler ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { events } = (await req.json()) as { events: ScheduleEvent[] };

    if (!events || !Array.isArray(events) || events.length < 2) {
      return NextResponse.json(
        { success: false, error: "Need at least 2 events to detect conflicts" },
        { status: 400 }
      );
    }

    // 1. Detect conflicts
    const conflicts = detectConflicts(events);

    if (conflicts.length === 0) {
      return NextResponse.json({
        success: true,
        hasConflicts: false,
        conflicts: [],
        resolution: null,
        message: "No scheduling conflicts detected!",
      });
    }

    // 2. Ask Groq to reason about the conflicts
    const conflictContext = conflicts
      .map(
        (c, i) =>
          `Conflict ${i + 1}: "${c.event1.title}" (${c.event1.category}, ${c.event1.time}) overlaps with "${c.event2.title}" (${c.event2.category}, ${c.event2.time}) by ${c.overlapMinutes} minutes on ${c.event1.date}`
      )
      .join("\n");

    const allEventsContext = events
      .map((e) => `- ${e.time} | ${e.title} [${e.category}]${e.priority ? ` (${e.priority} priority)` : ""}`)
      .join("\n");

    const completion = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here is the student's schedule:\n${allEventsContext}\n\nDetected conflicts:\n${conflictContext}\n\nResolve these conflicts intelligently.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const content = completion.choices?.[0]?.message?.content;
    let resolution = null;

    if (content) {
      try {
        resolution = JSON.parse(content);
      } catch {
        resolution = { raw: content };
      }
    }

    return NextResponse.json({
      success: true,
      hasConflicts: true,
      conflicts: conflicts.map((c) => ({
        event1: c.event1.title,
        event2: c.event2.title,
        overlapMinutes: c.overlapMinutes,
        date: c.event1.date,
      })),
      resolution,
    });
  } catch (err: any) {
    console.error("[Conflict API] Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to resolve conflicts" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
