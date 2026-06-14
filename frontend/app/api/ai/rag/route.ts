/**
 * Campus RAG API
 *
 * POST /api/ai/rag
 * Body: { question: string }
 *
 * Retrieves relevant campus documents, then uses Groq
 * to reason over the context and answer the student's question.
 */

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { retrieveRelevantDocs } from "@/lib/rag/knowledge-base";

let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");
    groq = new Groq({ apiKey });
  }
  return groq;
}

const SYSTEM_PROMPT = `You are CampusFlow RAG Assistant — an AI that answers student questions using retrieved campus documents as context.

RULES:
- Answer ONLY based on the provided context. If the context doesn't contain the answer, say "I don't have that information in my knowledge base."
- Be concise (3-5 sentences max)
- Cite specific details: dates, times, rooms, names when available
- If the student asks about feasibility (e.g., "Can I do X?"), cross-reference multiple documents to reason
- Format important info clearly (use bullet points if listing multiple items)
- Be helpful and proactive — suggest related info the student might need`;

export async function POST(req: NextRequest) {
  try {
    const { question } = (await req.json()) as { question: string };

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a question" },
        { status: 400 }
      );
    }

    // 1. Retrieve relevant documents
    const relevantDocs = retrieveRelevantDocs(question, 3);

    // 2. Build context from retrieved docs
    const context = relevantDocs.length > 0
      ? relevantDocs
          .map((doc) => `[Source: ${doc.title} | Updated: ${doc.lastUpdated}]\n${doc.content}`)
          .join("\n\n---\n\n")
      : "No relevant documents found in the knowledge base.";

    // 3. Call Groq with RAG context
    const completion = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `RETRIEVED CONTEXT:\n${context}\n\n---\n\nSTUDENT QUESTION: ${question.trim()}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const answer = completion.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json(
        { success: false, error: "Empty AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      answer,
      sources: relevantDocs.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        lastUpdated: d.lastUpdated,
      })),
    });
  } catch (err: any) {
    console.error("[RAG API] Error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message || "RAG query failed" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
