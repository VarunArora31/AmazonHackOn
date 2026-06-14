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
} from "lucide-react";
import { useNotices } from "@/lib/notices-context";
import { calendarEvents } from "@/lib/data";

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

// ─── Confidence Dot ─────────────────────────────────────────────

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notices } = useNotices();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    // Read from global data sources
    const events = [
      ...notices.map((n) => ({ title: n.title, time: n.time, date: n.date, category: n.category })),
      ...calendarEvents.map((c) => ({ title: c.title, time: c.time, date: c.date, category: c.type === "class" ? "Academics" : "General" })),
    ];

    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed");
        return;
      }
      setResult(data.explanation);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const typeConfig = {
    fixed: { icon: Lock, label: "Fixed", color: "text-neutral-700 dark:text-neutral-300", border: "border-l-neutral-400 dark:border-l-neutral-600" },
    recommended: { icon: Sparkles, label: "AI Suggested", color: "text-emerald-700 dark:text-emerald-400", border: "border-l-emerald-500" },
    break: { icon: Coffee, label: "Break", color: "text-amber-700 dark:text-amber-400", border: "border-l-amber-500" },
  };

  return (
    <div className="space-y-4">
      {/* Trigger */}
      <motion.button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] hover:border-neutral-300 dark:hover:border-white/20 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
            <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Explainable AI Schedule
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              See WHY each time slot is recommended
            </p>
          </div>
        </div>
        {isAnalyzing ? <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" /> : <Eye className="w-4 h-4 text-neutral-400" />}
      </motion.button>

      {/* Loading */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-4 py-6 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] text-center space-y-3">
              <Eye className="w-6 h-6 text-emerald-400 mx-auto animate-pulse" />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Generating optimized schedule with reasoning...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] text-sm text-neutral-600 dark:text-neutral-400">{error}</div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Schedule Timeline */}
            <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-neutral-100 dark:border-white/5">
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Optimized Daily Plan
                </p>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-white/5">
                {result.optimized_schedule?.map((slot, i) => {
                  const cfg = typeConfig[slot.type];
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`px-4 py-3 border-l-2 ${cfg.border}`}
                    >
                      {/* Header row */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-medium text-neutral-500 dark:text-neutral-400 w-16">
                            {slot.time}
                          </span>
                          <Icon className={`w-3 h-3 ${cfg.color}`} />
                          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                            {slot.activity}
                          </span>
                        </div>
                        <ConfidenceDot confidence={slot.confidence} />
                      </div>

                      {/* Reasons */}
                      <div className="ml-[72px] space-y-0.5">
                        {slot.reasons?.map((reason, j) => (
                          <p key={j} className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-start gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Key Insights */}
            {result.key_insights?.length > 0 && (
              <div className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111]">
                <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Key Insights
                </p>
                <ul className="space-y-1.5">
                  {result.key_insights.map((insight, i) => (
                    <li key={i} className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-start gap-1.5">
                      <span className="text-neutral-400 shrink-0">→</span> {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Productivity Tips */}
            {result.productivity_tips?.length > 0 && (
              <div className="px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5">
                <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1.5">
                  <Lightbulb className="w-3 h-3" />
                  Productivity Tips
                </p>
                <ul className="space-y-1">
                  {result.productivity_tips.map((tip, i) => (
                    <li key={i} className="text-[11px] text-emerald-700 dark:text-emerald-400">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
