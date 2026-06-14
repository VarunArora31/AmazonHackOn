/**
 * Unified AI Dispatcher — Omnichannel Inbound Processing
 *
 * Receives raw chaotic text from WhatsApp/Email webhooks,
 * extracts structured event data via Groq LLM, and persists
 * to Supabase with proper user attribution.
 */

import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// ─── Supabase Admin Client (server-side, bypasses RLS for inserts) ──

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

// ─── Groq Client (lazy init) ────────────────────────────────────

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  }
  return groqClient;
}

// ─── Output Schema Validation ───────────────────────────────────

const EventSchema = z.object({
  title: z.string().max(100),
  description: z.string().max(300),
  category: z.enum(["Academics", "Placement", "Hostel", "Club Event", "Sports", "General"]),
  eventDate: z.string().nullable(),
  isUrgent: z.boolean(),
});

type ExtractedEvent = z.infer<typeof EventSchema>;

// ─── System Prompt ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI assistant for a university campus application called CampusFlow. Your job is to extract scheduling information from chaotic forwarded messages (WhatsApp, emails, notice board forwards).

Output STRICTLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "title": "Short event title (max 60 chars)",
  "description": "1-2 sentence summary of action required",
  "category": "Academics" | "Placement" | "Hostel" | "Club Event" | "Sports" | "General",
  "eventDate": "ISO 8601 date string (YYYY-MM-DD) or null if not determinable",
  "isUrgent": true if deadline is within 48 hours or requires immediate action, else false
}

Rules:
- Infer dates from relative expressions ("tomorrow", "next Monday", etc.) based on today's date
- "Fwd:", signatures, phone numbers, "share in groups" — ignore meta-content
- If category is ambiguous, use "General"
- If no date can be extracted, set eventDate to null
- Keep title under 60 characters`;

// ─── Main Processing Function ───────────────────────────────────

export async function processInboundAI(
  rawText: string,
  userId: string,
  source: "whatsapp" | "email"
): Promise<{ success: boolean; event?: ExtractedEvent; error?: string }> {
  try {
    // 1. Call Groq LLM for structured extraction
    const completion = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: rawText },
      ],
      temperature: 0.1,
      max_tokens: 512,
      response_format: { type: "json_object" },
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      return { success: false, error: "Empty LLM response" };
    }

    // 2. Parse and validate with Zod
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { success: false, error: "LLM returned invalid JSON" };
    }

    const result = EventSchema.safeParse(parsed);
    if (!result.success) {
      console.error("[processInbound] Zod validation failed:", result.error.flatten());
      return { success: false, error: "Schema validation failed" };
    }

    const event = result.data;

    // 3. Insert into Supabase with user attribution
    const { error: dbError } = await getSupabase().from("campus_events").insert({
      user_id: userId,
      title: event.title,
      description: event.description,
      category: event.category,
      event_date: event.eventDate,
      is_urgent: event.isUrgent,
      source_channel: source,
      raw_text: rawText.substring(0, 2000), // Cap storage
      created_at: new Date().toISOString(),
    } as any);

    if (dbError) {
      console.error("[processInbound] Supabase insert error:", dbError);
      return { success: false, error: "Database insertion failed" };
    }

    return { success: true, event };
  } catch (err: any) {
    console.error("[processInbound] Unexpected error:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── User Resolution ────────────────────────────────────────────

/**
 * Resolve a phone number or email to a Supabase user_id.
 * Returns null if no matching user found.
 */
export async function resolveUser(
  identifier: string,
  type: "phone" | "email"
): Promise<string | null> {
  const column = type === "phone" ? "phone_number" : "email";

  const { data, error } = await getSupabase()
    .from("profiles")
    .select("user_id")
    .eq(column, identifier)
    .single() as { data: { user_id: string } | null; error: any };

  if (error || !data) {
    return null;
  }

  return data.user_id;
}
