"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Workflow, Lock, Loader2, Check } from "lucide-react";
import { updatePassword } from "@/lib/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    setError(null);

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-black px-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-200 dark:border-white/10">
            <Workflow className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </div>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">CampusFlow</span>
        </div>

        <div className="bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/10 rounded-2xl p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Password Updated</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 text-center">Set New Password</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-1 mb-6">
                Enter your new password below
              </p>

              {error && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black focus-within:border-neutral-400 dark:focus-within:border-white/20 transition-colors">
                  <Lock className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    required
                    className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black focus-within:border-neutral-400 dark:focus-within:border-white/20 transition-colors">
                  <Lock className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none"
                  />
                </div>

                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
