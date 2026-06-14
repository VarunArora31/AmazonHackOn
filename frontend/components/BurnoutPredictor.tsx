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

// ─── Level Config ───────────────────────────────────────────────

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
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<BurnoutResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notices } = useNotices();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    // Read events from the global notices context (synced with all sections)
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
      if (!data.success) {
        setError(data.error);
        return;
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cfg = result ? levelConfig[result.burnout.level] : null;

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
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10">
            <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Burnout Prediction
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Analyzing {notices.length} events from your campus feed
            </p>
          </div>
        </div>
        {isAnalyzing ? (
          <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
        ) : (
          <TrendingUp className="w-4 h-4 text-neutral-400" />
        )}
      </motion.button>

      {/* Loading */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-6 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] text-center space-y-3">
              <Heart className="w-6 h-6 text-red-400 mx-auto animate-pulse" />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Calculating workload, stress factors, and recovery capacity...
              </p>
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
        {result && cfg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Score + Metrics Card */}
            <div className="px-4 py-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111]">
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
                      <span className="text-[11px] text-neutral-700 dark:text-neutral-300">
                        <strong>{result.metrics.totalHours}h</strong> /week busy
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-neutral-400" />
                      <span className="text-[11px] text-neutral-700 dark:text-neutral-300">
                        <strong>{result.metrics.freeHours}h</strong> /week free
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Moon className="w-3 h-3 text-neutral-400" />
                      <span className="text-[11px] text-neutral-700 dark:text-neutral-300">
                        <strong>{result.metrics.sleepHours}h</strong> /night sleep
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-neutral-400" />
                      <span className="text-[11px] text-neutral-700 dark:text-neutral-300">
                        <strong>{result.metrics.utilizationPercent}%</strong> time used
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Assessment */}
            {result.aiAdvice?.assessment && (
              <div className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111]">
                <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Assessment
                </p>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {result.aiAdvice.assessment}
                </p>
              </div>
            )}

            {/* Recommendations */}
            {result.aiAdvice?.recommendations?.length > 0 && (
              <div className="px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111]">
                <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-2">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Recommendations
                </p>
                <ul className="space-y-1.5">
                  {result.aiAdvice.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                      <span className="text-neutral-400 dark:text-neutral-500 shrink-0">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Postponable */}
            {result.aiAdvice?.postponable_activities?.length > 0 && (
              <div className="px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5">
                <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 mb-1">
                  Consider postponing:
                </p>
                <ul className="space-y-1">
                  {result.aiAdvice.postponable_activities.map((act, i) => (
                    <li key={i} className="text-[11px] text-amber-700 dark:text-amber-400">
                      • {act}
                    </li>
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
