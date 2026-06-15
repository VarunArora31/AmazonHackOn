"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Workflow, Check, ArrowRight, Loader2, Mail, Lock } from "lucide-react";
import { signIn, signUp, signInWithGoogle, getSession } from "@/lib/auth";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // ─── Check existing session on mount ──────────────────────
  useEffect(() => {
    async function checkExistingSession() {
      try {
        // If user just logged out, don't redirect back
        const justLoggedOut = localStorage.getItem("just_logged_out");
        if (justLoggedOut) {
          localStorage.removeItem("just_logged_out");
          setCheckingSession(false);
          return;
        }

        const session = await getSession();
        if (session) {
          router.replace("/dashboard");
          return;
        }
      } catch {}
      setCheckingSession(false);
    }
    checkExistingSession();
  }, [router]);

  // ─── Google OAuth ─────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Redirects to Google — page will navigate away
    } catch (err: any) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  // ─── Email Sign In ────────────────────────────────────────

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ─── Email Sign Up ────────────────────────────────────────

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!branch || !year) { setError("Please select your branch and year"); return; }
    setLoading(true); setError(null);
    try {
      await signUp(email, password, name, branch, year);
      router.push("/dashboard");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ─── Loading while checking session ────────────────────────
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-black">
        <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
      </div>
    );
  }

  // ─── Sign In View ─────────────────────────────────────────

  if (mode === "signin") {
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
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 text-center">Welcome back</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-1 mb-6">Sign in to your account</p>

            {error && <ErrorBox message={error} />}

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 mb-4"
            >
              {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-neutral-200 dark:bg-white/10" />
              <span className="text-xs text-neutral-400 dark:text-neutral-500">or</span>
              <div className="flex-1 h-px bg-neutral-200 dark:bg-white/10" />
            </div>

            {/* Email form */}
            <form onSubmit={handleSignIn} className="space-y-3">
              <InputField icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />
              <InputField icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} />

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Sign In
              </button>
            </form>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={async () => {
                  if (!email.trim()) { setError("Enter your email first, then click Forgot Password"); return; }
                  setLoading(true); setError(null);
                  try {
                    const { resetPassword } = await import("@/lib/auth");
                    await resetPassword(email);
                    setError(`✓ Reset link sent to ${email}. Check your inbox.`);
                  } catch (err: any) { setError(err.message); }
                  finally { setLoading(false); }
                }}
                className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline underline-offset-2"
              >
                Forgot password?
              </button>
            </div>

            <div className="mt-3 text-center">
              <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                Don't have an account? <span className="font-medium">Sign up</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Sign Up View (Split screen) ──────────────────────────

  return (
    <div className="min-h-screen flex bg-white dark:bg-black">
      {/* Left: Marketing */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 px-16 bg-white dark:bg-[#111111] border-r border-neutral-200 dark:border-white/10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-200 dark:border-white/10">
              <Workflow className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </div>
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">CampusFlow</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">Try CampusFlow<br />at no cost</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-4 text-base leading-relaxed max-w-md">Start managing your college life efficiently. Parse WhatsApp notices, track deadlines, and let AI organize your day.</p>
          <div className="mt-10 space-y-4">
            {["AI-powered notice parsing from WhatsApp", "Unified timeline for all campus events", "Smart conflict resolution & burnout detection", "Real-time Campus Pulse telemetry"].map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-100 dark:bg-[#1a1a1a]">
                  <Check className="w-3 h-3 text-neutral-700 dark:text-neutral-300" />
                </div>
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{b}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-black">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Workflow className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">CampusFlow</span>
          </div>

          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Create your account</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 mb-6">Get started in seconds</p>

          {error && <ErrorBox message={error} />}

          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 mb-4"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-neutral-200 dark:bg-white/10" />
            <span className="text-xs text-neutral-400 dark:text-neutral-500">or sign up with email</span>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-white/10" />
          </div>

          {/* Email sign up form */}
          <form onSubmit={handleSignUp} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Varun Arora" required className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus:border-neutral-400 dark:focus:border-white/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus:border-neutral-400 dark:focus:border-white/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Branch</label>
                <select value={branch} onChange={(e) => setBranch(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 text-sm outline-none focus:border-neutral-400 dark:focus:border-white/20">
                  <option value="">Select</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EE">Electrical</option>
                  <option value="ME">Mechanical</option>
                  <option value="CE">Civil</option>
                  <option value="ICE">ICE</option>
                  <option value="IPE">IPE</option>
                  <option value="DS">Data Science</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Year</label>
                <select value={year} onChange={(e) => setYear(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 text-sm outline-none focus:border-neutral-400 dark:focus:border-white/20">
                  <option value="">Select</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus:border-neutral-400 dark:focus:border-white/20" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-[#FF9900] text-black text-sm font-semibold hover:bg-[#FF9900]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create account <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-4 text-center">
            <button type="button" onClick={() => { setMode("signin"); setError(null); }} className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
              Already have an account? <span className="font-medium">Sign in</span>
            </button>
          </div>

          <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-6 text-center">By continuing, you agree to CampusFlow's Terms of Service and Privacy Policy.</p>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function InputField({ icon: Icon, type, placeholder, value, onChange }: { icon: React.ElementType; type: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black focus-within:border-neutral-400 dark:focus-within:border-white/20 transition-colors">
      <Icon className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} required className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none" />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  const isSuccess = message.startsWith("✓");
  return (
    <div className={`mb-4 px-3 py-2 rounded-lg text-xs ${
      isSuccess
        ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
        : "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
    }`}>
      {message}
    </div>
  );
}
