"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, Loader2, Shield, Brain, ChevronDown, RotateCcw } from "lucide-react";
import { useNotices } from "@/lib/notices-context";

// ─── Types ──────────────────────────────────────────────────────

interface ConflictResolution {
  event1_title: string;
  event2_title: string;
  recommendation: "ATTEND_EVENT1" | "ATTEND_EVENT2" | "PARTIAL_BOTH";
  reasoning: string;
  event1_score: number;
  event2_score: number;
  alternative_suggestion?: string;
}

interface ResolutionResult {
  conflicts: Array<{ event1: string; event2: string; overlapMinutes: number; date: string }>;
  resolution: { conflicts: ConflictResolution[]; overall_advice: string };
}

// ─── Score Bar ──────────────────────────────────────────────────

function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${score >= 70 ? "bg-neutral-900 dark:bg-white" : score >= 40 ? "bg-neutral-400" : "bg-neutral-300 dark:bg-neutral-600"}`}
        />
      </div>
      <span className="text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300 w-6 text-right">{score}</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function ConflictResolver() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ResolutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notices } = useNotices();

  const hasOutput = !!(result || error);

  const handleAnalyze = async () => {
    setIsExpanded(true);
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    const allEvents = notices.map((n) => ({
      id: n.id,
      title: n.title,
      time: n.time,
      date: n.date,
      category: n.category,
      priority: n.urgency === "critical" || n.urgency === "high" ? "high" as const : n.urgency === "normal" ? "medium" as const : "low" as const,
    }));

    if (allEvents.length < 2) {
      setError("Need at least 2 events to detect conflicts.");
      setIsAnalyzing(false);
      return;
    }

    try {
      const res = await fetch("/api/ai/conflict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: allEvents }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Analysis failed"); return; }
      if (!data.hasConflicts) { setError("No scheduling conflicts detected — your schedule is clear!"); return; }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setIsExpanded(false);
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden">
      {/* Header (always visible, clickable) */}
      <button
        onClick={() => {
          if (hasOutput) setIsExpanded(!isExpanded);
          else handleAnalyze();
        }}
        disabled={isAnalyzing}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors disabled:opacity-70"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">AI Conflict Resolver</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {hasOutput ? (result ? `${result.conflicts.length} conflict${result.conflicts.length !== 1 ? "s" : ""} found` : "Analysis complete") : `Scans your schedule for overlaps (${notices.length} events)`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {hasOutput && (
            <span
              onClick={(e) => { e.stopPropagation(); handleReset(); }}
              className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </span>
          )}
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
          ) : hasOutput ? (
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </motion.div>
          ) : (
            <Zap className="w-4 h-4 text-neutral-400" />
          )}
        </div>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-neutral-100 dark:border-white/5 pt-3">
              {/* Loading */}
              {isAnalyzing && (
                <div className="py-4 text-center space-y-2">
                  <Brain className="w-5 h-5 text-neutral-400 mx-auto animate-pulse" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Analyzing schedule for conflicts...</p>
                </div>
              )}

              {/* Error / Info */}
              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-white/5 text-xs text-neutral-600 dark:text-neutral-400">
                  {error}
                </div>
              )}

              {/* Results */}
              {result && (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                      {result.conflicts.length} conflict{result.conflicts.length > 1 ? "s" : ""} detected
                    </span>
                  </div>

                  {result.resolution?.conflicts?.map((res, i) => (
                    <div key={i} className="px-3 py-3 rounded-lg border border-neutral-100 dark:border-white/5 bg-neutral-50 dark:bg-[#0a0a0a] space-y-2.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{res.event1_title}</span>
                        <span className="text-neutral-400 shrink-0">vs</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{res.event2_title}</span>
                      </div>
                      <div className="space-y-1.5">
                        <ScoreBar score={res.event1_score} label={res.event1_title} />
                        <ScoreBar score={res.event2_score} label={res.event2_title} />
                      </div>
                      <div className="flex items-start gap-2 px-2.5 py-2 rounded-md bg-white dark:bg-[#111111] border border-neutral-100 dark:border-white/5">
                        <Shield className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">
                            {res.recommendation === "ATTEND_EVENT1" ? `→ Attend ${res.event1_title}` : res.recommendation === "ATTEND_EVENT2" ? `→ Attend ${res.event2_title}` : "→ Attend parts of both"}
                          </p>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">{res.reasoning}</p>
                          {res.alternative_suggestion && <p className="text-[10px] text-neutral-500 mt-1 italic">💡 {res.alternative_suggestion}</p>}
                        </div>
                      </div>
                    </div>
                  ))}

                  {result.resolution?.overall_advice && (
                    <div className="px-3 py-2.5 rounded-lg bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-white/5">
                      <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2"><Brain className="w-3.5 h-3.5" />AI Strategy</p>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">{result.resolution.overall_advice}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
