"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Workflow, ArrowRight, Loader2, GraduationCap } from "lucide-react";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  // Check if user is logged in and if they already have branch/year
  useEffect(() => {
    async function check() {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      // Admins skip onboarding entirely
      if (user.email && isAdminEmail(user.email)) {
        router.push("/dashboard");
        return;
      }
      // If already has branch/year, skip onboarding
      if (user.user_metadata?.branch && user.user_metadata?.year) {
        router.push("/dashboard");
        return;
      }
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "");
    }
    check();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch || !year) { setError("Please select both branch and year"); return; }
    setLoading(true); setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          branch,
          year,
        },
      });

      if (updateError) throw updateError;
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-200 dark:border-white/10">
            <Workflow className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </div>
          <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">CampusFlow</span>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-[#1a1a1a] mx-auto mb-4">
            <GraduationCap className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
          </div>

          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 text-center">
            Complete your profile
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-1 mb-6">
            {userName ? `Hey ${userName}! ` : ""}Tell us about your academics
          </p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Branch */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Your Branch
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 text-sm outline-none focus:border-neutral-400 dark:focus:border-white/20"
              >
                <option value="">Select your branch</option>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ECE">Electronics & Communication (ECE)</option>
                <option value="EE">Electrical Engineering (EE)</option>
                <option value="ME">Mechanical Engineering (ME)</option>
                <option value="CE">Civil Engineering (CE)</option>
                <option value="ICE">Instrumentation (ICE)</option>
                <option value="IPE">Industrial & Production (IPE)</option>
                <option value="DS">Data Science (DS)</option>
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Current Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 text-sm outline-none focus:border-neutral-400 dark:focus:border-white/20"
              >
                <option value="">Select your year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !branch || !year}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Continue to Dashboard
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
