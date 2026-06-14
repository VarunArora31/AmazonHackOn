"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Send, Loader2, X, Check } from "lucide-react";
import { useNotices } from "@/lib/notices-context";
import { useNotifications } from "@/lib/notifications-context";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import type { Notice, NoticeCategory, Urgency } from "@/lib/data";

const categories: { value: NoticeCategory; label: string }[] = [
  { value: "Academics", label: "Academics" },
  { value: "Placement", label: "Placement" },
  { value: "Hostel Admin", label: "Hostel & Mess" },
  { value: "Club Event", label: "Club Event" },
  { value: "Sports", label: "Sports" },
  { value: "General", label: "General" },
];

const branches = ["ALL", "CSE", "IT", "ECE", "EE", "ME", "CE", "ICE", "IPE", "DS"];
const years = ["ALL", "1", "2", "3", "4"];

export function AdminAnnouncement() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<NoticeCategory>("General");
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [targetBranch, setTargetBranch] = useState("ALL");
  const [targetYear, setTargetYear] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { addNotice } = useNotices();
  const { addNotification } = useNotifications();

  // Check if current user is admin
  useEffect(() => {
    async function checkAdmin() {
      const user = await getCurrentUser();
      if (user?.email && isAdminEmail(user.email)) {
        setIsAdmin(true);
      }
    }
    checkAdmin();
  }, []);

  // Don't render for non-admins
  if (!isAdmin) return null;

  const handlePublish = async () => {
    if (!title.trim() || !summary.trim()) return;
    setLoading(true);

    try {
      // Get admin email
      const user = await getCurrentUser();
      const authorEmail = user?.email || "";

      // Save to Supabase via API
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          category,
          urgency,
          targetBranch,
          targetYear,
          authorEmail,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setLoading(false);
        return;
      }

      // Also add to local state for immediate display
      const newNotice: Notice = {
        id: data.announcement?.id || `admin-${Date.now()}`,
        title: title.trim(),
        summary: summary.trim(),
        category,
        urgency,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
        authorRole: "ADMIN_ACADEMICS",
        source: "official",
      };

      addNotice(newNotice);

      // Add notification for local session
      addNotification({
        title: `📢 ${title.trim()}`,
        message: summary.trim(),
        category,
        targetBranch,
        targetYear,
      });

      // Success
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setTitle("");
        setSummary("");
        setCategory("General");
        setUrgency("normal");
        setTargetBranch("ALL");
        setTargetYear("ALL");
      }, 1500);
    } catch {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (admin only) */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity"
      >
        <Megaphone className="w-4 h-4" />
        <span className="hidden sm:inline">New Announcement</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/10 rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Success overlay */}
              <AnimatePresence>
                {success && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 dark:bg-[#111111]/95 rounded-2xl">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Announcement published!</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close */}
              <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2 mb-5">
                <Megaphone className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">New Announcement</h3>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam schedule updated" className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus:border-neutral-400 dark:focus:border-white/20" />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Summary</label>
                  <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Brief description of the announcement..." rows={3} className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus:border-neutral-400 dark:focus:border-white/20 resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value as NoticeCategory)} className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-sm text-neutral-900 dark:text-neutral-100 outline-none">
                      {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Urgency</label>
                    <select value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)} className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-sm text-neutral-900 dark:text-neutral-100 outline-none">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Targeting */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Target Branch</label>
                    <select value={targetBranch} onChange={(e) => setTargetBranch(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-sm text-neutral-900 dark:text-neutral-100 outline-none">
                      {branches.map((b) => <option key={b} value={b}>{b === "ALL" ? "All Branches" : b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Target Year</label>
                    <select value={targetYear} onChange={(e) => setTargetYear(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-sm text-neutral-900 dark:text-neutral-100 outline-none">
                      {years.map((y) => <option key={y} value={y}>{y === "ALL" ? "All Years" : `Year ${y}`}</option>)}
                    </select>
                  </div>
                </div>

                {/* Publish */}
                <button
                  onClick={handlePublish}
                  disabled={!title.trim() || !summary.trim() || loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish Announcement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
