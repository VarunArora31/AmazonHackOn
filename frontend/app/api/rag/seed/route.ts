/**
 * RAG Seed API — Bulk ingest the campus knowledge base
 *
 * POST /api/rag/seed
 *
 * Takes all documents from the knowledge base and ingests them
 * into Supabase pgvector. Run once to populate the vector DB.
 */

import { NextRequest, NextResponse } from "next/server";
import { campusKnowledgeBase } from "@/lib/rag/knowledge-base";
import { chunkText } from "@/lib/rag/chunker";
import { embed } from "@/lib/rag/embeddings";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    let totalChunks = 0;
    let storedChunks = 0;
    const errors: string[] = [];

    for (const doc of campusKnowledgeBase) {
      const chunks = chunkText(doc.content, 500, 50);
      totalChunks += chunks.length;

      for (const chunk of chunks) {
        try {
          const embedding = await embed(chunk.text);

          const { error } = await supabase.from("rag_documents").insert({
            title: doc.title,
            category: doc.category,
            chunk_text: chunk.text,
            chunk_index: chunk.index,
            embedding: embedding,
            metadata: { source_id: doc.id, last_updated: doc.lastUpdated },
          } as any);

          if (error) {
            errors.push(`${doc.id}[${chunk.index}]: ${error.message}`);
          } else {
            storedChunks++;
          }
        } catch (e: any) {
          errors.push(`${doc.id}[${chunk.index}]: ${e.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${storedChunks}/${totalChunks} chunks from ${campusKnowledgeBase.length} documents`,
      documents: campusKnowledgeBase.length,
      totalChunks,
      storedChunks,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  } catch (err: any) {
    console.error("[RAG Seed] Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
