"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Workflow, Check, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: skip auth, go to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-black">
      {/* ─── Left Column: Marketing ──────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 px-16 bg-white dark:bg-[#111111] border-r border-neutral-200 dark:border-white/10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-200 dark:border-white/10">
              <Workflow className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </div>
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              CampusFlow
            </span>
          </div>

          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">
            Try CampusFlow<br />at no cost
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-4 text-base leading-relaxed max-w-md">
            Start managing your college life efficiently. Parse WhatsApp notices, track deadlines, and let AI organize your day.
          </p>

          {/* Benefits */}
          <div className="mt-10 space-y-4">
            {[
              "AI-powered notice parsing from WhatsApp",
              "Unified timeline for all campus events",
              "Keyboard-first navigation (Vim bindings)",
              "Real-time Campus Pulse telemetry",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-100 dark:bg-[#1a1a1a]">
                  <Check className="w-3 h-3 text-neutral-700 dark:text-neutral-300" />
                </div>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── Right Column: Form ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-black">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Workflow className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              CampusFlow
            </span>
          </div>

          <h2 className="text-2xl font-normal text-neutral-900 dark:text-neutral-100">
            {isSignUp ? "Sign up for CampusFlow" : "Sign in to CampusFlow"}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            {isSignUp
              ? "Create your account to get started."
              : "Welcome back. Enter your credentials."}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Varun Arora"
                  className="w-full px-3 py-2 rounded-sm border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:focus:ring-white/20 transition-shadow"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                Email address
              </label>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-1.5">
                Used for account recovery and notifications.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="varunaroransr@gmail.com"
                className="w-full px-3 py-2 rounded-sm border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:focus:ring-white/20 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-sm border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:focus:ring-white/20 transition-shadow"
              />
            </div>

            {/* Primary Button */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-sm bg-[#FF9900] text-black text-sm font-semibold hover:bg-[#FF9900]/90 transition-colors flex items-center justify-center gap-2"
            >
              {isSignUp ? "Create account" : "Sign in"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-neutral-200 dark:bg-white/10" />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">or</span>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-white/10" />
          </div>

          {/* Secondary Button */}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full py-2.5 rounded-sm border border-neutral-300 dark:border-white/10 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-[#111111] transition-colors"
          >
            {isSignUp ? "Sign in to an existing account" : "Create a new account"}
          </button>

          {/* Terms */}
          <p className="text-[11px] text-neutral-400 dark:text-neutral-600 mt-6 text-center leading-relaxed">
            By continuing, you agree to CampusFlow's Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
