/**
 * Announcements API
 *
 * GET /api/announcements?branch=CSE&year=3
 *   → Returns announcements targeted at that branch/year
 *
 * POST /api/announcements
 *   → Creates a new announcement (admin only, checked by email)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const ADMIN_EMAILS = [
  "admin@campusflow.com",
  "varunaroransr@gmail.com",
  "imiitian.46@gmail.com",
  "sidaqpreets007@gmail.com",
];

// ─── GET: Fetch announcements ───────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const branch = url.searchParams.get("branch") || "ALL";
    const year = url.searchParams.get("year") || "ALL";

    const supabase = getSupabaseAdmin();

    // Fetch announcements that target this student's branch/year or ALL
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[Announcements GET] Error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Filter in JS to avoid complex OR queries that duplicate rows
    const filtered = (data || []).filter((ann: any) => {
      const branchMatch = ann.target_branch === "ALL" || ann.target_branch === branch;
      const yearMatch = ann.target_year === "ALL" || ann.target_year === year;
      return branchMatch && yearMatch;
    });

    return NextResponse.json({ success: true, announcements: filtered });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── POST: Create announcement (admin only) ─────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, summary, category, urgency, targetBranch, targetYear, authorEmail } = body;

    if (!title || !summary || !authorEmail) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Verify admin
    if (!ADMIN_EMAILS.includes(authorEmail.toLowerCase())) {
      return NextResponse.json({ success: false, error: "Unauthorized — admin only" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.from("announcements").insert({
      title,
      summary,
      category: category || "General",
      urgency: urgency || "normal",
      target_branch: targetBranch || "ALL",
      target_year: targetYear || "ALL",
      author_email: authorEmail,
    } as any).select().single();

    if (error) {
      console.error("[Announcements POST] Error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, announcement: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
