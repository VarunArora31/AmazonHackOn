"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  X,
  Clock,
  Lock,
  Wand2,
  ArrowRight,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface ScheduleSlot {
  id: string;
  time: string;
  title: string;
  type: "fixed" | "suggested";
  category?: string;
}

// ─── Mock Data: AI-Optimized Schedule ───────────────────────────

const proposedSchedule: ScheduleSlot[] = [
  { id: "s1", time: "9:00 AM", title: "DBMS Lab — Normalization", type: "fixed", category: "Academics" },
  { id: "s2", time: "10:45 AM", title: "DSA Practice — Graphs", type: "suggested" },
  { id: "s3", time: "11:00 AM", title: "AI/ML Webinar", type: "fixed", category: "General" },
  { id: "s4", time: "12:30 PM", title: "Meet Harsh for project", type: "suggested" },
  { id: "s5", time: "2:00 PM", title: "Microsoft Pre-Placement Talk", type: "fixed", category: "Placement" },
  { id: "s6", time: "4:00 PM", title: "Resume update for Microsoft", type: "suggested" },
  { id: "s7", time: "5:00 PM", title: "Basketball Tryouts", type: "fixed", category: "Sports" },
  { id: "s8", time: "6:30 PM", title: "Gym — Leg day", type: "suggested" },
  { id: "s9", time: "8:00 PM", title: "Coding Club Contest", type: "fixed", category: "Club" },
  { id: "s10", time: "10:00 PM", title: "Call home", type: "suggested" },
];

// ─── AI Thinking Steps ──────────────────────────────────────────

const thinkingSteps = [
  "Analyzing fixed timeline constraints...",
  "Calculating priority for flexible tasks...",
  "Finding optimal gaps between events...",
  "Generating time blocks for personal tasks...",
];

// ─── Component ──────────────────────────────────────────────────

interface AiScheduleOptimizerProps {
  onAccept?: (schedule: ScheduleSlot[]) => void;
}

export function AiScheduleOptimizer({ onAccept }: AiScheduleOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [accepted, setAccepted] = useState(false);

  // Simulate AI thinking sequence
  useEffect(() => {
    if (!isOptimizing) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    thinkingSteps.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setThinkingStep(i);
        }, i * 1200)
      );
    });

    // Show proposal after all steps
    timers.push(
      setTimeout(() => {
        setIsOptimizing(false);
        setShowProposal(true);
      }, thinkingSteps.length * 1200 + 400)
    );

    return () => timers.forEach(clearTimeout);
  }, [isOptimizing]);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setThinkingStep(0);
    setAccepted(false);
  };

  const handleAccept = () => {
    setAccepted(true);
    onAccept?.(proposedSchedule);
    // Close after brief success animation
    setTimeout(() => {
      setShowProposal(false);
      setAccepted(false);
    }, 1200);
  };

  const handleDiscard = () => {
    setShowProposal(false);
  };

  return (
    <>
      {/* ─── Trigger Button ────────────────────────────────── */}
      <motion.button
        onClick={handleOptimize}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-violet-500/30 hover:border-violet-500/70 text-violet-400 hover:text-violet-300 text-xs font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.08)] hover:shadow-[0_0_25px_rgba(139,92,246,0.15)] overflow-hidden"
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-violet-500/10 to-transparent" />

        <Sparkles className="w-3.5 h-3.5 relative" />
        <span className="relative">Optimize Day</span>
      </motion.button>

      {/* ─── AI Thinking Overlay ───────────────────────────── */}
      <AnimatePresence>
        {isOptimizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-md bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative flex flex-col items-center gap-6 px-10 py-8 rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl max-w-sm w-full mx-4"
            >
              {/* Animated orb */}
              <div className="relative w-16 h-16">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border-2 border-transparent border-t-violet-500 border-r-violet-500/50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-violet-400" />
                </div>
              </div>

              {/* Thinking text with animation */}
              <div className="h-6 flex items-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={thinkingStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-zinc-300 text-center"
                  >
                    {thinkingSteps[thinkingStep]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Progress dots */}
              <div className="flex items-center gap-2">
                {thinkingSteps.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: i === thinkingStep ? 1.3 : 1,
                      backgroundColor: i <= thinkingStep ? "#8b5cf6" : "#3f3f46",
                    }}
                    className="w-1.5 h-1.5 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Proposed Schedule Modal ───────────────────────── */}
      <AnimatePresence>
        {showProposal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-md bg-black/60"
            onClick={handleDiscard}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative max-w-md w-full mx-4 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                      AI Proposed Schedule
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Flexible tasks optimally placed between fixed events
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="px-6 py-4 max-h-[400px] overflow-y-auto space-y-1">
                {proposedSchedule.map((slot, i) => (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      slot.type === "suggested"
                        ? "bg-violet-500/[0.06] border-l-2 border-violet-500"
                        : "border-l-2 border-zinc-700"
                    }`}
                  >
                    {/* Time */}
                    <span className="shrink-0 w-16 text-[11px] font-mono text-zinc-500">
                      {slot.time}
                    </span>

                    {/* Icon */}
                    {slot.type === "fixed" ? (
                      <Lock className="w-3 h-3 text-zinc-600 shrink-0" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-violet-400 shrink-0" />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium truncate ${
                          slot.type === "suggested"
                            ? "text-zinc-200"
                            : "text-zinc-400"
                        }`}
                      >
                        {slot.title}
                      </p>
                      {slot.category && (
                        <span className="text-[9px] text-zinc-600 uppercase tracking-wider">
                          {slot.category}
                        </span>
                      )}
                    </div>

                    {/* Type badge */}
                    {slot.type === "suggested" && (
                      <span className="shrink-0 text-[9px] font-semibold text-violet-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/10">
                        AI
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Success overlay */}
              <AnimatePresence>
                {accepted && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-zinc-950/95 z-10"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <Check className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="text-sm font-medium text-zinc-200">
                        Schedule applied!
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-800/80 flex items-center gap-3">
                <button
                  onClick={handleDiscard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-transparent border border-zinc-700 text-zinc-400 text-xs font-semibold hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Discard
                </button>
                <button
                  onClick={handleAccept}
                  disabled={accepted}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 transition-colors disabled:opacity-50 shadow-lg shadow-violet-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept Schedule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
