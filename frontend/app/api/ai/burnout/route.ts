/**
 * Burnout Prediction API
 *
 * POST /api/ai/burnout
 * Body: { events: Array<{ title, time, date, category }>, sleepHours?: number }
 *
 * Calculates workload score and predicts burnout risk.
 * Uses Groq for personalized recommendations.
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
  title: string;
  time: string;
  date: string;
  category: string;
}

// ─── Workload Calculation ───────────────────────────────────────

function calculateWorkload(events: ScheduleEvent[]) {
  let totalHours = 0;
  const categoryHours: Record<string, number> = {};

  events.forEach((e) => {
    const parts = e.time.split("-").map((s) => s.trim());
    let duration = 1; // default 1 hour

    if (parts.length === 2) {
      const start = toHours(parts[0]);
      const end = toHours(parts[1]);
      if (end > start) duration = end - start;
    }

    totalHours += duration;
    categoryHours[e.category] = (categoryHours[e.category] || 0) + duration;
  });

  return { totalHours, categoryHours };
}

function toHours(t: string): number {
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return parseInt(t) || 0;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const p = match[3]?.toUpperCase();
  if (p === "PM" && h < 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return h + m / 60;
}

function getBurnoutLevel(score: number): "low" | "moderate" | "high" | "critical" {
  if (score < 30) return "low";
  if (score < 55) return "moderate";
  if (score < 75) return "high";
  return "critical";
}

// ─── POST Handler ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { events, sleepHours = 7 } = (await req.json()) as {
      events: ScheduleEvent[];
      sleepHours?: number;
    };

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { success: false, error: "Events array required" },
        { status: 400 }
      );
    }

    // 1. Calculate workload metrics
    const { totalHours, categoryHours } = calculateWorkload(events);

    // Available hours in a week (awake time)
    const awakeHoursPerDay = 24 - sleepHours;
    const weeklyAvailable = awakeHoursPerDay * 7;
    const freeHours = Math.max(0, weeklyAvailable - totalHours);
    const utilizationPercent = Math.round((totalHours / weeklyAvailable) * 100);

    // Burnout score (0-100)
    let burnoutScore = 0;
    burnoutScore += Math.min(40, utilizationPercent * 0.5); // high utilization = high burnout
    burnoutScore += totalHours > 40 ? 20 : totalHours > 30 ? 10 : 0; // overwork penalty
    burnoutScore += sleepHours < 6 ? 20 : sleepHours < 7 ? 10 : 0; // sleep deficit
    burnoutScore += Object.keys(categoryHours).length > 4 ? 10 : 0; // context switching penalty
    burnoutScore += (categoryHours["Academics"] || 0) > 20 ? 10 : 0; // academic overload
    burnoutScore = Math.min(100, Math.round(burnoutScore));

    const level = getBurnoutLevel(burnoutScore);

    // 2. Get AI recommendations
    const completion = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a student wellness AI. Given workload data, provide burnout prevention advice. Output STRICTLY valid JSON:
{
  "assessment": "1 sentence about current state",
  "recommendations": ["actionable tip 1", "actionable tip 2", "actionable tip 3"],
  "recovery_actions": ["immediate action if burnout is high"],
  "postponable_activities": ["activities that could be moved/dropped"]
}`,
        },
        {
          role: "user",
          content: `Student workload this week:
- Total committed hours: ${totalHours}h
- Free hours remaining: ${freeHours}h
- Sleep: ${sleepHours}h/night
- Breakdown: ${Object.entries(categoryHours).map(([k, v]) => `${k}: ${v.toFixed(1)}h`).join(", ")}
- Burnout score: ${burnoutScore}/100 (${level})
- Activities: ${events.map((e) => e.title).join(", ")}

Provide wellness recommendations.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 400,
      response_format: { type: "json_object" },
    });

    let aiAdvice = null;
    const content = completion.choices?.[0]?.message?.content;
    if (content) {
      try {
        aiAdvice = JSON.parse(content);
      } catch {
        aiAdvice = { assessment: content };
      }
    }

    return NextResponse.json({
      success: true,
      metrics: {
        totalHours: Math.round(totalHours * 10) / 10,
        freeHours: Math.round(freeHours * 10) / 10,
        utilizationPercent,
        sleepHours,
        categoryBreakdown: categoryHours,
        eventCount: events.length,
      },
      burnout: {
        score: burnoutScore,
        level,
      },
      aiAdvice,
    });
  } catch (err: any) {
    console.error("[Burnout API] Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message || "Analysis failed" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
