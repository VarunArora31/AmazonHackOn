/**
 * RAG Vector Query API
 *
 * POST /api/rag/query
 * Body: { question: string, category?: string }
 *
 * Embeds the question, searches Supabase pgvector for similar chunks,
 * passes them as context to Groq for a grounded answer.
 */

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { embed } from "@/lib/rag/embeddings";
import { getSupabaseAdmin } from "@/lib/supabase/server";

let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");
    groq = new Groq({ apiKey });
  }
  return groq;
}

const SYSTEM_PROMPT = `You are CampusFlow RAG Assistant. Answer the student's question using ONLY the retrieved context below. If the context doesn't contain enough info, say so honestly.

Rules:
- Be concise (3-5 sentences)
- Cite specific details: dates, times, names, requirements
- If multiple sources are relevant, synthesize them
- Format with bullet points for lists
- Be proactive — mention related info the student might need`;

export async function POST(req: NextRequest) {
  try {
    const { question, category, userId } = (await req.json()) as {
      question: string;
      category?: string;
      userId?: string;
    };

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { success: false, error: "Question is required" },
        { status: 400 }
      );
    }

    // 1. Embed the question
    let questionEmbedding: number[];
    try {
      questionEmbedding = await embed(question);
    } catch (embedErr: any) {
      console.error("[RAG Query] Embedding error:", embedErr.message);
      return NextResponse.json(
        { success: false, error: "Embedding model failed: " + embedErr.message },
        { status: 500 }
      );
    }

    // 2. Similarity search in Supabase
    const supabase = getSupabaseAdmin();
    
    let matches: any[] | null = null;

    // Try RPC vector search first (searches all docs or user-specific)
    const { data: rpcMatches, error: searchError } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: questionEmbedding,
        match_count: 8,
        filter_category: category || null,
      }
    );

    if (!searchError && rpcMatches && rpcMatches.length > 0) {
      // Filter by user_id client-side if provided (RPC returns all)
      matches = userId
        ? rpcMatches.filter((m: any) => !m.user_id || m.user_id === userId)
        : rpcMatches;
      
      // If user filter eliminated all results, try without filter
      if (matches && matches.length === 0) {
        matches = rpcMatches;
      }
    }

    // Fallback: text search if RPC failed or returned nothing
    if (!matches || matches.length === 0) {
      console.warn("[RAG Query] RPC failed or empty:", searchError?.message, "— trying text search");
      let query = supabase
        .from("rag_documents")
        .select("id, title, category, chunk_text, user_id")
        .limit(8);

      // Filter by user if provided
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }

      const keyword = question.split(/\s+/).filter(w => w.length > 2)[0];
      if (keyword) {
        query = query.or(`chunk_text.ilike.%${keyword}%,title.ilike.%${keyword}%`);
      }

      const { data: textMatches } = await query;
      if (textMatches && textMatches.length > 0) {
        matches = textMatches.map((m: any) => ({ ...m, similarity: 0.5 }));
      }
    }

    console.log(`[RAG Query] Question: "${question}"`);
    console.log(`[RAG Query] Matches found: ${matches?.length || 0}`);

    // 3. Build context from matched chunks
    const context = matches && matches.length > 0
      ? matches
          .map((m: any) => `[${m.title} | similarity: ${((m.similarity || 0) * 100).toFixed(1)}%]\n${m.chunk_text}`)
          .join("\n\n---\n\n")
      : "No relevant documents found in the database.";

    // 4. Call Groq with RAG context
    const completion = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `RETRIEVED CONTEXT:\n${context}\n\n---\n\nQUESTION: ${question.trim()}` },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || "No answer generated.";

    return NextResponse.json({
      success: true,
      answer,
      sources: matches?.map((m: any) => ({
        title: m.title,
        category: m.category,
        similarity: Math.round(m.similarity * 100),
        preview: m.chunk_text.substring(0, 100) + "...",
      })) || [],
      totalChunksSearched: matches?.length || 0,
    });
  } catch (err: any) {
    console.error("[RAG Query] Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message || "Query failed" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
