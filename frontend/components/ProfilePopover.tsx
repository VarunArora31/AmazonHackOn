"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const router = useRouter();

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

  const handleLogout = () => {
    setIsOpen(false);
    // Clear any local session data
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_phone");
      localStorage.removeItem("user_session");
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
    { icon: Settings, label: "Settings", shortcut: "⇧⌘P" },
    { icon: Command, label: "Command Menu", shortcut: "⌘K", onClick: handleCommandMenu },
    { icon: Palette, label: "Toggle Theme", onClick: handleThemeToggle },
  ];

  const integrationItems: MenuItem[] = [
    { icon: Smartphone, label: "WhatsApp Integration", onClick: handleWhatsAppSetup },
    { icon: Key, label: "API Keys" },
    { icon: Sparkles, label: "AI Preferences" },
  ];

  const accountItems: MenuItem[] = [
    { icon: HelpCircle, label: "Help & Support", shortcut: "?" },
    { icon: LogOut, label: "Log Out", danger: true, onClick: handleLogout },
  ];

  return (
    <>
      <div ref={containerRef} className="relative">
        {/* Trigger: Avatar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 dark:from-neutral-200 dark:to-neutral-400 flex items-center justify-center text-[11px] font-bold text-white dark:text-black ring-2 ring-transparent focus:ring-neutral-200 dark:focus:ring-white/20 transition-all"
        >
          {user.name.charAt(0)}
        </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 mt-2 w-72 z-50 bg-white border border-neutral-200 shadow-xl rounded-xl dark:bg-[#111111] dark:border-white/10 dark:shadow-2xl overflow-hidden"
          >
            {/* Section 1: Identity Block */}
            <div className="px-4 pt-4 pb-3 border-b border-neutral-100 dark:border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 dark:from-neutral-200 dark:to-neutral-400 flex items-center justify-center text-xs font-bold text-white dark:text-black shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {user.name} {user.role === "STUDENT" ? "Arora" : ""}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-neutral-400 shrink-0">
                      Beta
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                    varunaroransr@gmail.com
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
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-100 dark:bg-[#1a1a1a]">
              <Smartphone className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              WhatsApp Integration
            </h3>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
            Follow these steps to connect your environment to the Twilio WhatsApp Sandbox:
          </p>

          {/* Steps */}
          <div className="space-y-4">
            <StepItem
              number={1}
              title="Set up Twilio Sandbox"
              description={<>Go to <InlineCode>twilio.com/console/sms/whatsapp/learn</InlineCode> and join the sandbox by sending a WhatsApp message.</>}
            />
            <StepItem
              number={2}
              title="Add auth token"
              description={<>Copy your Twilio Auth Token and add <InlineCode>TWILIO_AUTH_TOKEN=xxx</InlineCode> to <InlineCode>.env.local</InlineCode></>}
            />
            <StepItem
              number={3}
              title="Expose localhost"
              description={<>Run <InlineCode>ngrok http 3000</InlineCode> and set the public URL as your Twilio webhook endpoint.</>}
            />
            <StepItem
              number={4}
              title="Set webhook URL"
              description={<>In Twilio Sandbox settings, set &quot;When a message comes in&quot; to <InlineCode>https://your-url/api/webhooks/whatsapp</InlineCode></>}
            />
          </div>

          {/* Footer button */}
          <button
            onClick={() => setIsWhatsAppModalOpen(false)}
            className="w-full mt-6 py-2.5 rounded-lg text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors"
          >
            Got it
          </button>
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
