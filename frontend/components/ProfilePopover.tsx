"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Key,
  Command,
  Palette,
  HelpCircle,
  LogOut,
  Sparkles,
  X,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  danger?: boolean;
}

export function ProfilePopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [authUser, setAuthUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const router = useRouter();

  // Fetch real user data from Supabase auth
  useEffect(() => {
    async function loadUser() {
      try {
        const { getCurrentUser } = await import("@/lib/auth");
        const u = await getCurrentUser();
        if (u) {
          setAuthUser({
            name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "User",
            email: u.email || "",
            avatar: u.user_metadata?.avatar_url || undefined,
          });
        }
      } catch {}
    }
    loadUser();
  }, []);

  // Click-outside to close
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  // ─── Handlers ─────────────────────────────────────────────

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      const { signOut } = await import("@/lib/auth");
      await signOut();
    } catch {}
    // Clear per-user localStorage data
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_phone");
      localStorage.removeItem("user_session");
      // Flag that this was a deliberate logout
      localStorage.setItem("just_logged_out", "1");
    }
    router.push("/auth");
  };

  const handleWhatsAppSetup = () => {
    setIsOpen(false);
    setIsWhatsAppModalOpen(true);
  };

  const handleThemeToggle = () => {
    setIsOpen(false);
    document.documentElement.classList.add("transitioning");
    document.documentElement.classList.toggle("dark");
    setTimeout(() => {
      document.documentElement.classList.remove("transitioning");
    }, 120);
  };

  const handleCommandMenu = () => {
    setIsOpen(false);
    // Dispatch a keyboard event to open the command palette
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  // ─── Menu Items ───────────────────────────────────────────

  const workspaceItems: MenuItem[] = [
    { icon: Command, label: "Command Menu", shortcut: "⌘K", onClick: handleCommandMenu },
    { icon: Palette, label: "Toggle Theme", onClick: handleThemeToggle },
  ];

  const integrationItems: MenuItem[] = [
    { icon: Smartphone, label: "WhatsApp Integration", onClick: handleWhatsAppSetup },
  ];

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const accountItems: MenuItem[] = [
    { icon: HelpCircle, label: "Forgot Password", onClick: async () => {
      setIsOpen(false);
      try {
        const { resetPassword, getCurrentUser } = await import("@/lib/auth");
        const user = await getCurrentUser();
        const email = user?.email;
        if (email) {
          await resetPassword(email);
          setToastMessage(`Reset link sent to ${email}`);
          setTimeout(() => setToastMessage(null), 4000);
        } else {
          router.push("/auth");
        }
      } catch (err: any) {
        setToastMessage(err.message || "Failed to send reset email");
        setTimeout(() => setToastMessage(null), 4000);
      }
    }},
    { icon: LogOut, label: "Log Out", danger: true, onClick: handleLogout },
  ];

  return (
    <>
      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} className="relative">
        {/* Trigger: Avatar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-neutral-700 to-neutral-900 dark:from-neutral-200 dark:to-neutral-400 flex items-center justify-center text-[11px] font-bold text-white dark:text-black ring-2 ring-transparent focus:ring-neutral-200 dark:focus:ring-white/20 transition-all"
        >
          {authUser?.avatar ? (
            <img src={authUser.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            (authUser?.name || user.name).charAt(0).toUpperCase()
          )}
        </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] z-50 bg-white border border-neutral-200 shadow-xl rounded-xl dark:bg-[#111111] dark:border-white/10 dark:shadow-2xl overflow-hidden"
          >
            {/* Section 1: Identity Block */}
            <div className="px-4 pt-4 pb-3 border-b border-neutral-100 dark:border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-neutral-700 to-neutral-900 dark:from-neutral-200 dark:to-neutral-400 flex items-center justify-center text-xs font-bold text-white dark:text-black shrink-0">
                  {authUser?.avatar ? (
                    <img src={authUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (authUser?.name || user.name).charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {authUser?.name || user.name}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                    {authUser?.email || "Not signed in"}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Workspace */}
            <div className="px-2 py-1.5">
              <p className="px-2 py-1 text-[10px] font-semibold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">
                Workspace
              </p>
              {workspaceItems.map((item) => (
                <MenuRow key={item.label} item={item} onClose={() => setIsOpen(false)} />
              ))}
            </div>

            <div className="mx-3 border-t border-neutral-100 dark:border-white/10" />

            {/* Section 3: Integrations */}
            <div className="px-2 py-1.5">
              <p className="px-2 py-1 text-[10px] font-semibold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">
                Integrations
              </p>
              {integrationItems.map((item) => (
                <MenuRow key={item.label} item={item} onClose={() => setIsOpen(false)} />
              ))}
            </div>

            <div className="mx-3 border-t border-neutral-100 dark:border-white/10" />

            {/* Section 4: Account + Danger */}
            <div className="px-2 py-1.5 pb-2">
              {accountItems.map((item) => (
                <MenuRow key={item.label} item={item} onClose={() => setIsOpen(false)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* ─── WhatsApp Integration Modal (Portal to body) ──────── */}
    {isWhatsAppModalOpen && typeof document !== "undefined" && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={() => setIsWhatsAppModalOpen(false)}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div
          className="relative w-full max-w-md bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/10 rounded-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={() => setIsWhatsAppModalOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              WhatsApp Integration
            </h3>
          </div>

          <WhatsAppSetupContent onClose={() => setIsWhatsAppModalOpen(false)} />
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

// ─── Menu Row ───────────────────────────────────────────────────

function MenuRow({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const Icon = item.icon;

  return (
    <button
      onClick={() => {
        item.onClick?.();
        onClose();
      }}
      className={`flex items-center justify-between w-full px-2.5 py-2 text-sm rounded-md transition-colors ${
        item.danger
          ? "text-neutral-700 dark:text-neutral-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1a1a1a]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 opacity-60" />
        <span>{item.label}</span>
      </div>
      {item.shortcut && (
        <kbd className="text-[10px] text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
          {item.shortcut}
        </kbd>
      )}
    </button>
  );
}

// ─── Step Item ──────────────────────────────────────────────────

// ─── WhatsApp Setup Content ─────────────────────────────────────

function WhatsAppSetupContent({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingPhone, setExistingPhone] = useState<string | null>(null);

  // Load existing phone on mount
  useEffect(() => {
    (async () => {
      try {
        const { getCurrentUser } = await import("@/lib/auth");
        const user = await getCurrentUser();
        if (user?.user_metadata?.whatsapp_number) {
          setExistingPhone(user.user_metadata.whatsapp_number);
          setPhone(user.user_metadata.whatsapp_number);
        }
      } catch {}
    })();
  }, []);

  const handleSave = async () => {
    if (!phone.trim()) return;
    setSaving(true);
    try {
      const { supabase } = await import("@/lib/supabase/client");
      await supabase.auth.updateUser({
        data: { whatsapp_number: phone.trim() },
      });
      setSaved(true);
      setExistingPhone(phone.trim());
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Link your WhatsApp number to get AI responses directly on WhatsApp with your campus context.
      </p>

      {/* Phone input */}
      <div>
        <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Your WhatsApp Number
        </label>
        <div className="flex gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus:border-neutral-400 dark:focus:border-white/20"
          />
          <button
            onClick={handleSave}
            disabled={saving || !phone.trim()}
            className="px-3 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 disabled:opacity-30 transition-opacity"
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Link"}
          </button>
        </div>
        {existingPhone && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
            ✓ Linked: {existingPhone}
          </p>
        )}
      </div>

      {/* Setup steps */}
      <div className="border-t border-neutral-100 dark:border-white/5 pt-4 space-y-3">
        <p className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Setup Steps</p>
        <StepItem
          number={1}
          title="Join Twilio Sandbox"
          description={<>Send <InlineCode>join hour-fought</InlineCode> to <InlineCode>+1 415 523 8886</InlineCode> on WhatsApp</>}
        />
        <StepItem
          number={2}
          title="Link your number above"
          description="Enter the same WhatsApp number you used to join the sandbox"
        />
        <StepItem
          number={3}
          title="Start chatting!"
          description="Send any message on WhatsApp — the AI will respond with your campus context"
        />
      </div>

      <button
        onClick={onClose}
        className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors"
      >
        Done
      </button>
    </div>
  );
}

function StepItem({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 dark:bg-[#1a1a1a] text-[11px] font-bold text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {title}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Inline Code ────────────────────────────────────────────────

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-1 py-0.5 rounded text-[11px] font-mono">
      {children}
    </code>
  );
}
