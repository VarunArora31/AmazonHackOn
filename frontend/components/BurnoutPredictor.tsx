"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Loader2,
  TrendingUp,
  Moon,
  Clock,
  AlertCircle,
  Lightbulb,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Calendar,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { useNotices } from "@/lib/notices-context";

// ─── Types ──────────────────────────────────────────────────────

interface BurnoutResult {
  metrics: {
    totalHours: number;
    freeHours: number;
    utilizationPercent: number;
    sleepHours: number;
    categoryBreakdown: Record<string, number>;
    eventCount: number;
  };
  burnout: {
    score: number;
    level: "low" | "moderate" | "high" | "critical";
  };
  aiAdvice: {
    assessment: string;
    recommendations: string[];
    recovery_actions: string[];
    postponable_activities: string[];
  };
}

const levelConfig = {
  low: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", label: "Low Risk", icon: BatteryFull },
  moderate: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", label: "Moderate", icon: BatteryMedium },
  high: { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10", label: "High Risk", icon: BatteryLow },
  critical: { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", label: "Critical", icon: Battery },
};

// ─── Circular Gauge ─────────────────────────────────────────────

function BurnoutGauge({ score, level }: { score: number; level: string }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  const cfg = levelConfig[level as keyof typeof levelConfig];

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-neutral-100 dark:text-[#1a1a1a]" />
        <motion.circle
          cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
          className={cfg.color}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-lg font-bold ${cfg.color}`}>{score}</span>
        <span className="text-[9px] text-neutral-500 dark:text-neutral-400">/ 100</span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function BurnoutPredictor() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<BurnoutResult | null>(null);
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

    if (events.length === 0) {
      setError("No events in your feed yet. Add notices to analyze burnout risk.");
      setIsAnalyzing(false);
      return;
    }

    try {
      const res = await fetch("/api/ai/burnout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events, sleepHours: 6.5 }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
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

  const cfg = result ? levelConfig[result.burnout.level] : null;

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
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10">
            <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Burnout Prediction</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {hasOutput && result ? `Score: ${result.burnout.score}/100 — ${levelConfig[result.burnout.level].label}` : `Analyzing ${notices.length} events from your campus feed`}
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
            <TrendingUp className="w-4 h-4 text-neutral-400" />
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
              {isAnalyzing && (
                <div className="py-4 text-center space-y-2">
                  <Heart className="w-5 h-5 text-red-400 mx-auto animate-pulse" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Calculating workload and stress factors...</p>
                </div>
              )}

              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-white/5 text-xs text-neutral-600 dark:text-neutral-400">
                  {error}
                </div>
              )}

              {result && cfg && (
                <>
                  {/* Score + Metrics */}
                  <div className="flex items-center gap-4">
                    <BurnoutGauge score={result.burnout.score} level={result.burnout.level} />
                    <div className="flex-1 space-y-2">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                        <cfg.icon className="w-3 h-3" />
                        {cfg.label}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span className="text-[11px] text-neutral-700 dark:text-neutral-300"><strong>{result.metrics.totalHours}h</strong> busy</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          <span className="text-[11px] text-neutral-700 dark:text-neutral-300"><strong>{result.metrics.freeHours}h</strong> free</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Moon className="w-3 h-3 text-neutral-400" />
                          <span className="text-[11px] text-neutral-700 dark:text-neutral-300"><strong>{result.metrics.sleepHours}h</strong> sleep</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3 text-neutral-400" />
                          <span className="text-[11px] text-neutral-700 dark:text-neutral-300"><strong>{result.metrics.utilizationPercent}%</strong> used</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {result.aiAdvice?.assessment && (
                    <div className="px-3 py-2.5 rounded-lg bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-white/5">
                      <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-1"><AlertCircle className="w-3.5 h-3.5" />Assessment</p>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">{result.aiAdvice.assessment}</p>
                    </div>
                  )}

                  {result.aiAdvice?.recommendations?.length > 0 && (
                    <div className="px-3 py-2.5 rounded-lg bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-white/5">
                      <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-1.5"><Lightbulb className="w-3.5 h-3.5" />Recommendations</p>
                      <ul className="space-y-1">
                        {result.aiAdvice.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                            <span className="text-neutral-400 shrink-0">→</span>{rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.aiAdvice?.postponable_activities?.length > 0 && (
                    <div className="px-3 py-2.5 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5">
                      <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 mb-1">Consider postponing:</p>
                      <ul className="space-y-0.5">
                        {result.aiAdvice.postponable_activities.map((act, i) => (
                          <li key={i} className="text-[11px] text-amber-700 dark:text-amber-400">• {act}</li>
                        ))}
                      </ul>
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
