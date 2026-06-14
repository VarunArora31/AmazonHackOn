"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  Loader2,
  Send,
  AlertTriangle,
  Check,
  X,
  Lightbulb,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { useNotices } from "@/lib/notices-context";

// ─── Types ──────────────────────────────────────────────────────

interface Scenario {
  name: string;
  description: string;
  weekly_hours_added: number;
  stress_score: number;
  conflicts_introduced: number;
  exam_prep_impact: string;
  feasibility: "Highly feasible" | "Feasible with trade-offs" | "Risky" | "Not recommended";
}

interface SimulationResult {
  question_understood: string;
  scenarios: Scenario[];
  recommendation: string;
  trade_offs: string[];
}

const feasibilityConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  "Highly feasible": { color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: Check },
  "Feasible with trade-offs": { color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", icon: AlertTriangle },
  "Risky": { color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10", icon: AlertTriangle },
  "Not recommended": { color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10", icon: X },
};

function StressMeter({ score }: { score: number }) {
  const getColor = () => {
    if (score < 30) return "bg-emerald-500";
    if (score < 55) return "bg-amber-500";
    if (score < 75) return "bg-orange-500";
    return "bg-red-500";
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-neutral-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className={`h-full rounded-full ${getColor()}`} />
      </div>
      <span className="text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-300 w-8 text-right">{score}%</span>
    </div>
  );
}

const presetQuestions = [
  "What if I join the coding club?",
  "Can I do SIH hackathon and prepare for placements?",
  "What if I take up a part-time internship?",
  "Can I attend all sports events and still maintain my GPA?",
];

// ─── Main Component ─────────────────────────────────────────────

export function WhatIfSimulator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { notices } = useNotices();

  const hasOutput = !!(result || error);

  const handleSimulate = async (q?: string) => {
    const queryText = q || question;
    if (!queryText.trim()) return;

    setIsExpanded(true);
    setIsSimulating(true);
    setError(null);
    setResult(null);

    const currentEvents = notices.map((n) => ({
      title: n.title,
      time: n.time,
      date: n.date,
      category: n.category,
    }));

    try {
      const res = await fetch("/api/ai/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: queryText, currentEvents }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Simulation failed"); return; }
      setResult(data.simulation);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setIsExpanded(false);
    setQuestion("");
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10">
            <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">What-If Simulator</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Simulate the impact before committing</p>
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
          {isSimulating ? (
            <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
          ) : (
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </motion.div>
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
              {/* Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSimulate()}
                  placeholder="What if I join the robotics club?"
                  disabled={isSimulating}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus:border-neutral-400 dark:focus:border-white/20 transition-colors disabled:opacity-50"
                />
                <button
                  onClick={() => handleSimulate()}
                  disabled={!question.trim() || isSimulating}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black shrink-0 hover:opacity-80 transition-opacity disabled:opacity-30"
                >
                  {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {presetQuestions.map((pq) => (
                  <button
                    key={pq}
                    onClick={() => { setQuestion(pq); handleSimulate(pq); }}
                    disabled={isSimulating}
                    className="px-2.5 py-1 text-[10px] rounded-full border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
                  >
                    {pq}
                  </button>
                ))}
              </div>

              {/* Loading */}
              {isSimulating && (
                <div className="py-4 text-center space-y-2">
                  <FlaskConical className="w-5 h-5 text-purple-400 mx-auto animate-pulse" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Running simulation...</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-white/5 text-xs text-neutral-600 dark:text-neutral-400">{error}</div>
              )}

              {/* Results */}
              {result && (
                <div className="space-y-3">
                  {result.question_understood && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic px-1">"{result.question_understood}"</p>
                  )}

                  {result.scenarios?.map((scenario, i) => {
                    const fCfg = feasibilityConfig[scenario.feasibility] || feasibilityConfig["Risky"];
                    const FIcon = fCfg.icon;
                    return (
                      <div key={i} className="px-3 py-3 rounded-lg border border-neutral-100 dark:border-white/5 bg-neutral-50 dark:bg-[#0a0a0a] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{scenario.name}</h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${fCfg.bg} ${fCfg.color}`}>
                            <FIcon className="w-2.5 h-2.5" />{scenario.feasibility}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400">{scenario.description}</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center px-2 py-1.5 rounded-md bg-white dark:bg-[#111111]">
                            <p className="text-[10px] text-neutral-500">Hours</p>
                            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">+{scenario.weekly_hours_added}h</p>
                          </div>
                          <div className="text-center px-2 py-1.5 rounded-md bg-white dark:bg-[#111111]">
                            <p className="text-[10px] text-neutral-500">Conflicts</p>
                            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{scenario.conflicts_introduced}</p>
                          </div>
                          <div className="text-center px-2 py-1.5 rounded-md bg-white dark:bg-[#111111]">
                            <p className="text-[10px] text-neutral-500">Exam</p>
                            <p className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300 mt-0.5">{scenario.exam_prep_impact}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-500 mb-1">Stress</p>
                          <StressMeter score={scenario.stress_score} />
                        </div>
                      </div>
                    );
                  })}

                  {result.recommendation && (
                    <div className="px-3 py-2.5 rounded-lg bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-100 dark:border-white/5">
                      <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-1"><Lightbulb className="w-3.5 h-3.5" />Recommendation</p>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">{result.recommendation}</p>
                    </div>
                  )}

                  {result.trade_offs?.length > 0 && (
                    <div className="px-3 py-2.5 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5">
                      <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 mb-1">Trade-offs:</p>
                      <ul className="space-y-0.5">
                        {result.trade_offs.map((t, i) => (
                          <li key={i} className="text-[11px] text-amber-700 dark:text-amber-400">• {t}</li>
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
