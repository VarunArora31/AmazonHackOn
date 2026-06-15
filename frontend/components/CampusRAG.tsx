"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Loader2,
  FileText,
  Send,
  Sparkles,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface RAGSource {
  title: string;
  category: string;
  similarity?: number;
  preview?: string;
  lastUpdated?: string;
  id?: string;
}

interface RAGResult {
  answer: string;
  sources: RAGSource[];
}

// ─── Preset Questions ───────────────────────────────────────────

const presetQuestions = [
  "When is the DSA exam?",
  "What companies are coming for placement?",
  "What's the mess menu today?",
  "Can I participate in SIH hackathon?",
  "What time does the library close?",
  "What is the CGPA cutoff for Microsoft?",
];

// ─── Category Badge Colors ──────────────────────────────────────

const categoryColors: Record<string, string> = {
  academics: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  placement: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  hostel: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  clubs: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  sports: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  transport: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
  general: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
};

// ─── Main Component ─────────────────────────────────────────────

export function CampusRAG() {
  const [question, setQuestion] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<RAGResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user ID for per-user knowledge base
  useEffect(() => {
    (async () => {
      try {
        const { getCurrentUser } = await import("@/lib/auth");
        const user = await getCurrentUser();
        if (user) setUserId(user.id);
      } catch {}
    })();
  }, []);

  const handleAsk = async (q?: string) => {
    const queryText = q || question;
    if (!queryText.trim()) return;

    setIsSearching(true);
    setError(null);
    setResult(null);
    setQuestion(queryText);

    try {
      // Use vector search (Supabase pgvector)
      const vectorRes = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: queryText, userId: userId || undefined }),
      });
      
      const data = await vectorRes.json();
      
      if (data.success) {
        setResult(data);
      } else {
        // Vector search failed — show the error, don't silently fallback
        console.error("[CampusRAG] Vector query error:", data.error);
        // Try keyword fallback
        const fallbackRes = await fetch("/api/ai/rag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: queryText }),
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success) {
          setResult(fallbackData);
        } else {
          setError(data.error || "Search failed");
        }
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="px-4 py-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Campus Knowledge Base
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Ask anything — powered by RAG over campus documents
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask about exams, placements, mess menu, clubs..."
              disabled={isSearching}
              className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => handleAsk()}
            disabled={!question.trim() || isSearching}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black shrink-0 hover:opacity-80 transition-opacity disabled:opacity-30"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {presetQuestions.map((pq) => (
            <button
              key={pq}
              onClick={() => handleAsk(pq)}
              disabled={isSearching}
              className="px-2.5 py-1 text-[10px] rounded-full border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
            >
              {pq}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      <AnimatePresence>
        {isSearching && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-4 py-5 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] text-center space-y-2">
              <BookOpen className="w-5 h-5 text-blue-400 mx-auto animate-pulse" />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Searching campus knowledge base...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] text-sm text-neutral-600 dark:text-neutral-400">
          {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Answer */}
            <div className="px-4 py-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">AI Answer</p>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {result.answer}
              </p>
            </div>

            {/* Sources */}
            {result.sources.length > 0 && (
              <div className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111]">
                <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                  Sources ({result.sources.length} documents retrieved)
                </p>
                <div className="space-y-1.5">
                  {result.sources.map((src, i) => (
                    <div key={`${src.title}-${i}`} className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="text-[11px] text-neutral-700 dark:text-neutral-300 flex-1 truncate">
                        {src.title}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${categoryColors[src.category] || categoryColors.general}`}>
                        {src.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
