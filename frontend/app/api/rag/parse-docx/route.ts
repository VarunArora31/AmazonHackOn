/**
 * DOCX Parser API
 *
 * POST /api/rag/parse-docx
 * Body: FormData with 'file' field
 *
 * Extracts text from .docx files using mammoth.
 */

import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await mammoth.extractRawText({ buffer });

    if (!result.value || result.value.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Could not extract text from DOCX." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: result.value.trim(),
      characters: result.value.length,
    });
  } catch (err: any) {
    console.error("[DOCX Parse] Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message || "DOCX parsing failed" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
