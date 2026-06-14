/**
 * What-If Simulator API
 *
 * POST /api/ai/simulate
 * Body: { question: string, currentEvents: Array<{ title, time, date, category }> }
 *
 * Simulates the impact of adding a new commitment and returns
 * a multi-scenario analysis with stress scores.
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

const SYSTEM_PROMPT = `You are a What-If Simulator for an Indian university student's schedule. Given their current commitments and a hypothetical question ("What if I join X?", "Can I do Y and Z together?"), simulate the impact.

Output STRICTLY valid JSON:
{
  "question_understood": "1 sentence rephrasing of what the student wants to know",
  "scenarios": [
    {
      "name": "Scenario A: [short label]",
      "description": "1 sentence describing this scenario",
      "weekly_hours_added": number,
      "stress_score": number (0-100, higher = more stressed),
      "conflicts_introduced": number,
      "exam_prep_impact": "reduced by X hours" or "no impact",
      "feasibility": "Highly feasible" | "Feasible with trade-offs" | "Risky" | "Not recommended"
    }
  ],
  "recommendation": "2-3 sentence final advice on which scenario is best and why",
  "trade_offs": ["list of things the student would need to sacrifice or adjust"]
}

Rules:
- Always provide 2-3 scenarios (one optimistic, one realistic, one showing what happens if they overcommit)
- Base stress scores on: total hours, sleep impact, exam proximity, context switching
- Be honest about trade-offs
- Keep it practical and grounded in Indian college reality`;

export async function POST(req: NextRequest) {
  try {
    const { question, currentEvents } = (await req.json()) as {
      question: string;
      currentEvents: Array<{ title: string; time: string; date: string; category: string }>;
    };

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a what-if question" },
        { status: 400 }
      );
    }

    // Build context from current schedule
    const scheduleContext = currentEvents.length > 0
      ? currentEvents.map((e) => `- ${e.title} (${e.category}, ${e.time}, ${e.date})`).join("\n")
      : "No events currently scheduled";

    const totalCurrentHours = currentEvents.length * 1.5; // rough estimate

    const completion = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Current schedule (${currentEvents.length} events, ~${Math.round(totalCurrentHours)}h/week):\n${scheduleContext}\n\nStudent's question: "${question}"`,
        },
      ],
      temperature: 0.4,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const content = completion.choices?.[0]?.message?.content;
    let simulation = null;

    if (content) {
      try {
        simulation = JSON.parse(content);
      } catch {
        simulation = { raw: content };
      }
    }

    return NextResponse.json({ success: true, simulation });
  } catch (err: any) {
    console.error("[Simulate API] Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message || "Simulation failed" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
