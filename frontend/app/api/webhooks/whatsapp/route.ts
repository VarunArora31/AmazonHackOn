/**
 * WhatsApp Webhook — Bi-directional Twilio Integration
 *
 * POST /api/webhooks/whatsapp
 *
 * Flow:
 * 1. Receive WhatsApp message from Twilio
 * 2. Look up user by phone number → get their notices context
 * 3. Pass to Groq with user-specific context
 * 4. Return reply as TwiML
 */

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getSupabaseAdmin } from "@/lib/supabase/server";

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

// ─── TwiML Builder ──────────────────────────────────────────────

function buildTwiML(message: string): string {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}

// ─── Get User Context by Phone ──────────────────────────────────

async function getUserContext(phoneNumber: string): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();

    // Look up user by whatsapp_number in auth metadata
    // Supabase admin can list users — find the one with matching phone
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (error || !users) return "";

    const user = users.find((u) => {
      const meta = u.user_metadata || {};
      const storedPhone = meta.whatsapp_number || "";
      // Normalize: remove spaces, compare last 10 digits
      const normalize = (p: string) => p.replace(/[\s\-\+]/g, "").slice(-10);
      return normalize(storedPhone) === normalize(phoneNumber);
    });

    if (!user) return "\nNo linked account found for this number.";

    const meta = user.user_metadata || {};
    const branch = meta.branch || "ALL";
    const year = meta.year || "ALL";
    const name = meta.full_name || meta.name || "Student";

    // Fetch announcements for this user's branch/year
    const { data: announcements } = await supabase
      .from("announcements")
      .select("title, summary, category, urgency, created_at, target_branch, target_year")
      .order("created_at", { ascending: false })
      .limit(15);

    const filtered = (announcements || []).filter((ann: any) => {
      const branchMatch = ann.target_branch === "ALL" || ann.target_branch === branch;
      const yearMatch = ann.target_year === "ALL" || ann.target_year === year;
      return branchMatch && yearMatch;
    });

    const today = new Date().toISOString().split("T")[0];
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const tomorrow = tmrw.toISOString().split("T")[0];

    const todayAnn = filtered.filter((a: any) => a.created_at?.split("T")[0] === today || a.created_at?.split("T")[0] === tomorrow);
    const olderAnn = filtered.filter((a: any) => a.created_at?.split("T")[0] !== today && a.created_at?.split("T")[0] !== tomorrow);

    let context = `\nUSER: ${name} | ${branch} Year ${year}`;
    context += `\nTODAY: ${today}`;

    if (todayAnn.length > 0) {
      context += `\n\nTODAY'S NOTICES:\n${todayAnn.map((a: any) => `- [${a.category}] ${a.title}: ${a.summary}`).join("\n")}`;
    }

    if (olderAnn.length > 0) {
      context += `\n\nRECENT NOTICES:\n${olderAnn.slice(0, 5).map((a: any) => `- [${a.category}] ${a.title} (${a.created_at?.split("T")[0]})`).join("\n")}`;
    }

    return context;
  } catch (err) {
    console.error("[WhatsApp] Context fetch error:", err);
    return "";
  }
}

// ─── POST Handler ───────────────────────────────────────────────

const SYSTEM_PROMPT = `You are CampusFlow AI on WhatsApp. You help Indian college students with their campus schedule, notices, deadlines, and queries.

RULES:
- Keep replies SHORT (2-3 sentences max) — this is WhatsApp
- Use the user's notices context below to answer accurately
- If asked about schedule/today/deadlines, reference specific events from context
- Be friendly, casual Indian English
- If no context available, provide general helpful response
- Current date is provided below`;

export async function POST(req: NextRequest) {
  try {
    // 1. Parse Twilio's form-encoded payload
    const formData = await req.formData();
    const body = formData.get("Body")?.toString()?.trim() || "";
    const from = formData.get("From")?.toString()?.trim() || "";

    // Extract phone number (Twilio sends as "whatsapp:+91XXXXXXXXXX")
    const phoneNumber = from.replace("whatsapp:", "").trim();

    console.log(`[WhatsApp] Message from ${phoneNumber}: "${body}"`);

    if (!body) {
      return new NextResponse(buildTwiML("Hey! Send me a message and I'll help you with your campus schedule, notices, and more."), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // 2. Get user-specific context
    const userContext = await getUserContext(phoneNumber);

    // 3. Call Groq with user context
    const completion = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + userContext },
        { role: "user", content: body },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim()
      || "Got your message! Try asking about your schedule or notices.";

    console.log(`[WhatsApp] Reply to ${phoneNumber}: "${reply}"`);

    // 4. Return TwiML
    return new NextResponse(buildTwiML(reply), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err: any) {
    console.error("[WhatsApp Webhook] Error:", err.message);

    const fallback = err.message?.includes("GROQ_API_KEY")
      ? "AI not configured. Ask the admin to set up the GROQ_API_KEY."
      : "Something went wrong, try again in a moment!";

    return new NextResponse(buildTwiML(fallback), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
