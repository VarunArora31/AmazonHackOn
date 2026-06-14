/**
 * Chat API Route — Campus AI (Groq LLM)
 *
 * POST /api/chat
 * Body: { message: string, notices?: array, history?: array }
 * Returns: { success: true, reply: string }
 */

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// Lazy-init Groq client
let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

const SYSTEM_PROMPT = `You are Campus AI, a helpful assistant for Indian university students using CampusFlow. Keep your answers concise (2-3 sentences max), energetic, and helpful. You have access to the student's current notices (today & tomorrow) provided below. IMPORTANT RULES:
- When asked about "today", "new", "latest", or general questions, ONLY reference events from TODAY and TOMORROW.
- Only mention older/past notices if the user EXPLICITLY asks about a specific past date.
- Use specific dates, times, and details from the context when answering.
- If you don't have info about something, say so honestly.
- Use Indian English conventions.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, notices = [], olderNotices = [], history = [], today } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing message field" },
        { status: 400 }
      );
    }

    // Build context — prioritize today/tomorrow events
    const dateStr = today || new Date().toISOString().split("T")[0];
    const dateContext = `\nTODAY'S DATE: ${dateStr}\n`;

    let contextStr = dateContext;

    if (notices.length > 0) {
      contextStr += `\nACTIVE NOTICES (Today & Tomorrow — ${notices.length} events):\n${notices
        .map(
          (n: any) =>
            `- [${n.category}${n.urgency ? ` | ${n.urgency}` : ""}] ${n.title}: ${n.summary || ""} (Date: ${n.date || "N/A"}, Time: ${n.time || "N/A"})`
        )
        .join("\n")}`;
    } else {
      contextStr += "\nNo active notices for today or tomorrow.";
    }

    if (olderNotices.length > 0) {
      contextStr += `\n\nPAST NOTICES (only mention if user asks about these dates):\n${olderNotices
        .map((n: any) => `- [${n.category}] ${n.title} (${n.date})`)
        .join("\n")}`;
    }

    const systemWithContext = SYSTEM_PROMPT + contextStr;

    // Build messages array
    const messages = [
      { role: "system" as const, content: systemWithContext },
      ...history.slice(-6).map((h: any) => ({
        role: h.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: h.content,
      })),
      { role: "user" as const, content: message.trim() },
    ];

    const completion = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 256,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json(
        { success: false, error: "Empty AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    console.error("[/api/chat] Error:", err.message);

    if (err.message?.includes("GROQ_API_KEY")) {
      return NextResponse.json(
        { success: false, error: "AI not configured. Add GROQ_API_KEY to .env.local" },
        { status: 503 }
      );
    }

    if (err.status === 429) {
      return NextResponse.json(
        { success: false, error: "Rate limited. Wait a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: "AI request failed. Try again." },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
