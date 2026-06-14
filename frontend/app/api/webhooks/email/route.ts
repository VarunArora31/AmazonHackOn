/**
 * Email Webhook Endpoint — SendGrid Inbound Parse
 *
 * POST /api/webhooks/email
 *
 * Security: Validates via shared webhook secret in headers.
 * Flow: Authenticate → Resolve User → AI Extract → Store → 200 OK
 */

import { NextRequest, NextResponse } from "next/server";
import { processInboundAI, resolveUser } from "@/lib/ai/processInbound";
import { createHmac, timingSafeEqual } from "crypto";

// ─── Webhook Secret Validation ──────────────────────────────────

function validateWebhookSecret(req: NextRequest): boolean {
  const secret = process.env.SENDGRID_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Email Webhook] SENDGRID_WEBHOOK_SECRET not configured");
    return false;
  }

  const signature = req.headers.get("x-twilio-email-event-webhook-signature");
  const timestamp = req.headers.get("x-twilio-email-event-webhook-timestamp");

  if (!signature || !timestamp) {
    // Fallback: check for a simple shared secret header
    const authHeader = req.headers.get("x-webhook-secret");
    return authHeader === secret;
  }

  // SendGrid/Twilio signature verification
  try {
    const payload = timestamp + req.url;
    const expectedSig = createHmac("sha256", secret)
      .update(payload)
      .digest("base64");

    const sigBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSig, "base64");

    if (sigBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// ─── POST Handler ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Validate webhook authenticity
    if (!validateWebhookSecret(req)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 2. Parse multipart form data (SendGrid Inbound Parse format)
    const formData = await req.formData();

    const fromEmail = formData.get("from")?.toString() || "";
    const subject = formData.get("subject")?.toString() || "";
    const textBody = formData.get("text")?.toString() || "";
    const htmlBody = formData.get("html")?.toString() || "";

    // Prefer plain text, fall back to HTML stripped of tags
    const rawText = textBody.trim()
      || htmlBody.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    if (!rawText || !fromEmail) {
      return new NextResponse("OK", { status: 200 });
    }

    // 3. Extract email address from "Name <email@example.com>" format
    const emailMatch = fromEmail.match(/<(.+?)>/) || [null, fromEmail];
    const email = emailMatch[1]?.trim().toLowerCase() || fromEmail.trim().toLowerCase();

    // 4. Resolve sender to a registered user
    const userId = await resolveUser(email, "email");

    if (!userId) {
      console.log(`[Email Webhook] Unknown sender: ${email} — dropping`);
      return new NextResponse("OK", { status: 200 });
    }

    // 5. Combine subject + body for richer context
    const fullText = subject ? `Subject: ${subject}\n\n${rawText}` : rawText;

    // 6. Process through AI pipeline
    processInboundAI(fullText, userId, "email").then((result) => {
      if (result.success) {
        console.log(`[Email Webhook] ✓ Event created for ${email}: ${result.event?.title}`);
      } else {
        console.error(`[Email Webhook] ✗ Failed: ${result.error}`);
      }
    });

    return new NextResponse("OK", { status: 200 });
  } catch (err: any) {
    console.error("[Email Webhook] Unhandled error:", err.message);
    return new NextResponse("OK", { status: 200 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
