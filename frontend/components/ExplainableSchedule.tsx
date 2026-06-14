"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Loader2,
  Clock,
  Lock,
  Sparkles,
  Coffee,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { useNotices } from "@/lib/notices-context";

// ─── Types ──────────────────────────────────────────────────────

interface ScheduleSlot {
  time: string;
  activity: string;
  type: "fixed" | "recommended" | "break";
  reasons: string[];
  confidence: number;
}

interface ExplanationResult {
  optimized_schedule: ScheduleSlot[];
  key_insights: string[];
  productivity_tips: string[];
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color = confidence >= 80 ? "bg-emerald-500" : confidence >= 50 ? "bg-amber-500" : "bg-neutral-400";
  return (
    <div className="flex items-center gap-1">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[9px] text-neutral-500 dark:text-neutral-400">{confidence}%</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function ExplainableSchedule() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notices } = useNotices();

  const hasOutput = !!(result || error);

  const handleAnalyze = async () => {
    setIsExpanded(true);
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    const events = notices.map((n) => ({
      title: n.title,
      time: n.time,
      date: n.date,
      category: n.category,
    }));

    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Failed"); return; }
      setResult(data.explanation);
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

  const typeConfig = {
    fixed: { icon: Lock, label: "Fixed", color: "text-neutral-700 dark:text-neutral-300", border: "border-l-neutral-400 dark:border-l-neutral-600" },
    recommended: { icon: Sparkles, label: "AI Suggested", color: "text-emerald-700 dark:text-emerald-400", border: "border-l-emerald-500" },
    break: { icon: Coffee, label: "Break", color: "text-amber-700 dark:text-amber-400", border: "border-l-amber-500" },
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => {
          if (hasOutput) setIsExpanded(!isExpanded);
          else handleAnalyze();
        }}
        disabled={isAnalyzing}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors disabled:opacity-70"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
            <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Optimize My Day</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {hasOutput && result ? `${result.optimized_schedule?.length || 0} slots optimized` : "AI-optimized schedule with reasoning"}
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
            <Eye className="w-4 h-4 text-neutral-400" />
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
                <div className="py-6 text-center space-y-3">
                  <div className="relative w-12 h-12 mx-auto">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl"
                    />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-2 rounded-full border-2 border-transparent border-t-emerald-500 border-r-emerald-500/50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Eye className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Optimizing your schedule...</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-white/5 text-xs text-neutral-600 dark:text-neutral-400">{error}</div>
              )}

              {/* Results */}
              {result && (
                <div className="space-y-3">
                  {/* Schedule */}
                  <div className="rounded-lg border border-neutral-100 dark:border-white/5 overflow-hidden">
                    <div className="px-3 py-2 bg-neutral-50 dark:bg-[#0a0a0a] border-b border-neutral-100 dark:border-white/5">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />Optimized Plan
                      </p>
                    </div>
                    <div className="divide-y divide-neutral-100 dark:divide-white/5">
                      {result.optimized_schedule?.map((slot, i) => {
                        const cfg = typeConfig[slot.type];
                        const Icon = cfg.icon;
                        return (
                          <div key={i} className={`px-3 py-2.5 border-l-2 ${cfg.border}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-medium text-neutral-500 dark:text-neutral-400 w-14">{slot.time}</span>
                                <Icon className={`w-3 h-3 ${cfg.color}`} />
                                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{slot.activity}</span>
                              </div>
                              <ConfidenceDot confidence={slot.confidence} />
                            </div>
                            <div className="ml-[72px] space-y-0.5">
                              {slot.reasons?.map((reason, j) => (
                                <p key={j} className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-start gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{reason}</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Insights */}
                  {result.key_insights?.length > 0 && (
                    <div className="px-3 py-2.5 rounded-lg bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-white/5">
                      <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-1.5"><TrendingUp className="w-3.5 h-3.5" />Key Insights</p>
                      <ul className="space-y-1">
                        {result.key_insights.map((insight, i) => (
                          <li key={i} className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-start gap-1.5">
                            <span className="text-neutral-400 shrink-0">→</span> {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tips */}
                  {result.productivity_tips?.length > 0 && (
                    <div className="px-3 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5">
                      <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1"><Lightbulb className="w-3 h-3" />Tips</p>
                      <ul className="space-y-0.5">
                        {result.productivity_tips.map((tip, i) => (
                          <li key={i} className="text-[11px] text-emerald-700 dark:text-emerald-400">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
