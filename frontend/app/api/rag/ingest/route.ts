/**
 * RAG Ingestion API
 *
 * POST /api/rag/ingest
 * Body: { title: string, category: string, content: string }
 *
 * Chunks the document, generates embeddings, stores in Supabase pgvector.
 */

import { NextRequest, NextResponse } from "next/server";
import { chunkText } from "@/lib/rag/chunker";
import { embed } from "@/lib/rag/embeddings";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { title, category, content } = (await req.json()) as {
      title: string;
      category: string;
      content: string;
    };

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Title and content are required" },
        { status: 400 }
      );
    }

    // 1. Chunk the document
    const chunks = chunkText(content, 500, 50);
    console.log(`[RAG Ingest] "${title}" → ${chunks.length} chunks`);

    // 2. Embed each chunk and store
    const supabase = getSupabaseAdmin();
    let storedCount = 0;

    for (const chunk of chunks) {
      // Generate embedding
      const embedding = await embed(chunk.text);

      // Insert into Supabase
      const { error } = await supabase.from("rag_documents").insert({
        title,
        category: category || "general",
        chunk_text: chunk.text,
        chunk_index: chunk.index,
        embedding: embedding,
        metadata: { original_title: title, chunk_of: chunks.length },
      } as any);

      if (error) {
        console.error(`[RAG Ingest] Error storing chunk ${chunk.index}:`, error.message);
      } else {
        storedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Ingested "${title}" — ${storedCount}/${chunks.length} chunks stored`,
      chunks: chunks.length,
      stored: storedCount,
    });
  } catch (err: any) {
    console.error("[RAG Ingest] Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message || "Ingestion failed" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
