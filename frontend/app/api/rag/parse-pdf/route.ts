/**
 * PDF/File Text Extractor API
 *
 * POST /api/rag/parse-pdf
 * Body: FormData with 'file' field
 *
 * Extracts text from uploaded files (text-based PDFs, txt, md, csv).
 * For PDFs: basic text extraction from the binary stream.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Basic PDF text extraction — reads text content from PDF binary.
 * Works for text-based PDFs (not scanned images).
 */
function extractTextFromPDF(buffer: Buffer): string {
  const content = buffer.toString("latin1");
  const textParts: string[] = [];

  // Extract text between BT (Begin Text) and ET (End Text) markers
  const btRegex = /BT[\s\S]*?ET/g;
  let match;

  while ((match = btRegex.exec(content)) !== null) {
    const block = match[0];
    // Extract text from Tj and TJ operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textParts.push(tjMatch[1]);
    }

    // Extract from TJ arrays
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let arrMatch;
    while ((arrMatch = tjArrayRegex.exec(block)) !== null) {
      const items = arrMatch[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = strRegex.exec(items)) !== null) {
        textParts.push(strMatch[1]);
      }
    }
  }

  // Clean up: unescape PDF string escapes
  return textParts
    .join(" ")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\s+/g, " ")
    .trim();
}

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
    let text = "";

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // Try basic PDF text extraction
      text = extractTextFromPDF(buffer);

      if (!text || text.length < 10) {
        // Fallback: try reading as raw text (some PDFs have readable text layer)
        const rawText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
        // Look for readable words
        const words = rawText.split(" ").filter((w) => w.length > 3 && /^[a-zA-Z0-9]+$/.test(w));
        if (words.length > 5) {
          text = words.join(" ");
        } else {
          return NextResponse.json({
            success: false,
            error: "Could not extract text from this PDF. It may be image-based or encrypted. Please copy-paste the content manually.",
          });
        }
      }
    } else {
      // Plain text files
      text = buffer.toString("utf-8");
    }

    return NextResponse.json({
      success: true,
      text: text.trim(),
      characters: text.length,
      filename: file.name,
    });
  } catch (err: any) {
    console.error("[PDF Parse] Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message || "File parsing failed" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
