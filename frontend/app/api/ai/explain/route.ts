/**
 * Explainable AI API
 *
 * POST /api/ai/explain
 * Body: { events: Array<{ title, time, date, category }>, preferences?: object }
 *
 * Generates an AI-optimized daily schedule with full reasoning
 * for each decision — shows WHY each time slot was chosen.
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

const SYSTEM_PROMPT = `You are an Explainable AI Schedule Advisor for an Indian university student. Your job is to analyze their current schedule and provide an optimized daily plan WITH full reasoning for each recommendation.

For each recommendation, you MUST explain WHY using concrete factors.

Output STRICTLY valid JSON:
{
  "optimized_schedule": [
    {
      "time": "HH:MM AM/PM",
      "activity": "activity name",
      "type": "fixed" | "recommended" | "break",
      "reasons": [
        "✓ Reason 1 (e.g., 'Exam in 3 days — high priority')",
        "✓ Reason 2 (e.g., 'You perform better at night')",
        "✓ Reason 3 (e.g., 'No conflicting activities')"
      ],
      "confidence": number (0-100, how confident the AI is about this slot)
    }
  ],
  "key_insights": [
    "insight about their schedule pattern (e.g., 'Your mornings are overloaded')",
    "insight about optimization (e.g., 'Moving revision to 8 PM increases retention by 20%')"
  ],
  "productivity_tips": [
    "actionable tip based on their schedule"
  ]
}

Rules:
- Include 6-8 time slots covering a full day
- Mix fixed (cannot move) with recommended (AI suggested)
- Add at least 1 break recommendation
- Each activity must have 2-3 concrete reasons
- Reference exams, deadlines, attendance, energy levels, and sleep
- Keep reasons concise (under 15 words each)
- Current date context: June 2026, end-semester exams approaching`;

export async function POST(req: NextRequest) {
  try {
    const { events, preferences } = (await req.json()) as {
      events: Array<{ title: string; time: string; date: string; category: string }>;
      preferences?: { morningPerson?: boolean; preferredStudyTime?: string };
    };

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { success: false, error: "Events array required" },
        { status: 400 }
      );
    }

    const scheduleContext = events
      .map((e) => `- ${e.time} | ${e.title} [${e.category}]`)
      .join("\n");

    const prefContext = preferences
      ? `\nStudent preferences: ${JSON.stringify(preferences)}`
      : "\nStudent preferences: prefers evening study, averages 6.5h sleep, exam period approaching.";

    const completion = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here is the student's schedule (${events.length} events):\n${scheduleContext}${prefContext}\n\nGenerate an optimized daily plan with full reasoning.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices?.[0]?.message?.content;
    let explanation = null;

    if (content) {
      try {
        explanation = JSON.parse(content);
      } catch {
        explanation = { raw: content };
      }
    }

    return NextResponse.json({ success: true, explanation });
  } catch (err: any) {
    console.error("[Explain API] Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate explanation" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
