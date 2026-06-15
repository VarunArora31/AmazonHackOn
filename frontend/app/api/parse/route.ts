/**
 * Notice Parser API
 *
 * POST /api/parse
 * Body: { rawText: string }
 *
 * Uses Groq to parse raw/messy text into a structured notice.
 * Replaces the Express backend /api/parse endpoint.
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

const SYSTEM_PROMPT = `You are a campus notice parser for an Indian university. Parse the given raw/messy text (forwarded WhatsApp messages, emails, notices) into a clean structured notice.

Extract and return ONLY valid JSON in this exact format:
{
  "title": "Short, clear title (max 10 words)",
  "summary": "Clear 1-2 sentence summary of what students need to know",
  "category": one of ["Academics", "Placement", "Hostel", "Club Event", "Sports", "General"],
  "urgency": one of ["Critical", "High", "Medium", "Low"],
  "date": "YYYY-MM-DD format if date mentioned, else null",
  "time": "HH:MM 24h format if time mentioned, else null"
}

Rules:
- Title should be action-oriented
- Summary should include the most important detail (deadline, venue, timing)
- Category: Hostel for mess/hostel notices, Academics for exams/lectures/assignments
- Urgency: Critical for same-day or emergency, High for within 3 days, Medium for within a week, Low for general info
- ONLY return the JSON object, no other text`;

export async function POST(req: NextRequest) {
  try {
    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return NextResponse.json({ success: false, error: "rawText is required" }, { status: 400 });
    }

    const completion = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: rawText.trim() },
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ success: false, error: "Empty AI response" }, { status: 500 });
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ success: false, error: "Could not parse AI response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error("[Parse API] Error:", err.message);
    return NextResponse.json({ success: false, error: err.message || "Parse failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
