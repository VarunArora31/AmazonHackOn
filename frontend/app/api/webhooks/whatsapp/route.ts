/**
 * WhatsApp Webhook — Bi-directional Twilio Integration
 *
 * POST /api/webhooks/whatsapp
 *
 * Simplified flow (works without Supabase):
 * 1. Receive WhatsApp message from Twilio
 * 2. Pass to Groq for AI response
 * 3. Return reply as TwiML
 */

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// ─── Groq Client ────────────────────────────────────────────────

let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");
    groq = new Groq({ apiKey });
  }
  return groq;
}

// ─── System Prompt ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are CampusFlow AI, a smart university assistant on WhatsApp. You help Indian college students manage their campus life.

RULES:
- Keep replies SHORT (2-3 sentences max) since this is WhatsApp
- If the student sends a notice/announcement, acknowledge it and summarize the key action item
- If they ask about scheduling, help them organize
- Be friendly, use casual Indian English
- Always end with a brief confirmation or next step
- Current date: June 2026`;

// ─── TwiML Builder ──────────────────────────────────────────────

function buildTwiML(message: string): string {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}

// ─── POST Handler ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Parse Twilio's form-encoded payload
    const formData = await req.formData();
    const body = formData.get("Body")?.toString()?.trim() || "";
    const from = formData.get("From")?.toString()?.trim() || "";

    console.log(`[WhatsApp] Message from ${from}: "${body}"`);

    // 2. Validate
    if (!body) {
      return new NextResponse(buildTwiML("Send me a message and I'll help you out!"), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // 3. Call Groq
    const completion = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: body },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim()
      || "Got your message! I'll process it shortly.";

    console.log(`[WhatsApp] Reply: "${reply}"`);

    // 4. Return TwiML
    return new NextResponse(buildTwiML(reply), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("[WhatsApp Webhook] Error:", err.message);

    const fallback = err.message?.includes("GROQ_API_KEY")
      ? "AI not configured. Ask the admin to add the GROQ_API_KEY."
      : "Something went wrong, try again in a sec!";

    return new NextResponse(buildTwiML(fallback), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
