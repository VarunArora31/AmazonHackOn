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

const branchOptions = ["CSE", "IT", "ECE", "EE", "ME", "CE", "ICE", "IPE", "DS"];
const yearOptions = ["1", "2", "3", "4"];

// ─── Multi-select chip component ────────────────────────────────

function ChipSelect({
  label,
  options,
  selected,
  onToggle,
  allLabel = "All",
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  allLabel?: string;
}) {
  const allSelected = selected.length === 0;

  return (
    <div>
      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {/* "All" chip */}
        <button
          type="button"
          onClick={() => onToggle("ALL")}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
            allSelected
              ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white"
              : "border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400 hover:border-neutral-400"
          }`}
        >
          {allLabel}
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              selected.includes(opt)
                ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white"
                : "border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400 hover:border-neutral-400"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function AdminAnnouncement() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<NoticeCategory>("General");
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]); // empty = ALL
  const [selectedYears, setSelectedYears] = useState<string[]>([]);       // empty = ALL
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { addNotice } = useNotices();
  const { addNotification } = useNotifications();

  useEffect(() => {
    async function checkAdmin() {
      const user = await getCurrentUser();
      if (user?.email && isAdminEmail(user.email)) setIsAdmin(true);
    }
    checkAdmin();
  }, []);

  if (!isAdmin) return null;

  const toggleBranch = (val: string) => {
    if (val === "ALL") { setSelectedBranches([]); return; }
    setSelectedBranches((prev) =>
      prev.includes(val) ? prev.filter((b) => b !== val) : [...prev, val]
    );
  };

  const toggleYear = (val: string) => {
    if (val === "ALL") { setSelectedYears([]); return; }
    setSelectedYears((prev) =>
      prev.includes(val) ? prev.filter((y) => y !== val) : [...prev, val]
    );
  };

  const targetBranchLabel = selectedBranches.length === 0 ? "ALL" : selectedBranches.join(",");
  const targetYearLabel = selectedYears.length === 0 ? "ALL" : selectedYears.join(",");

  const handlePublish = async () => {
    if (!title.trim() || !summary.trim()) return;
    setLoading(true);

    try {
      const user = await getCurrentUser();
      const authorEmail = user?.email || "";

      // Create one announcement per branch/year combination
      // Or use "ALL" if none selected
      const branchesToPost = selectedBranches.length > 0 ? selectedBranches : ["ALL"];
      const yearsToPost = selectedYears.length > 0 ? selectedYears : ["ALL"];

      const promises = [];
      for (const branch of branchesToPost) {
        for (const year of yearsToPost) {
          promises.push(
            fetch("/api/announcements", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: title.trim(),
                summary: summary.trim(),
                category,
                urgency,
                targetBranch: branch,
                targetYear: year,
                authorEmail,
              }),
            }).then((r) => r.json())
          );
        }
      }

      const results = await Promise.all(promises);
      const allSucceeded = results.every((r) => r.success);

      if (!allSucceeded) {
        console.error("[AdminAnnouncement] Some posts failed:", results);
        setLoading(false);
        return;
      }

      // Add to local context (use first result's ID)
      const firstId = results[0]?.announcement?.id || `admin-${Date.now()}`;
      const newNotice: Notice = {
        id: firstId,
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
      addNotification({
        sourceId: firstId,
        title: `📢 ${title.trim()}`,
        message: summary.trim(),
        category,
        targetBranch: targetBranchLabel,
        targetYear: targetYearLabel,
        timestamp: new Date().toISOString(),
      } as any);

      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setTitle("");
        setSummary("");
        setCategory("General");
        setUrgency("normal");
        setSelectedBranches([]);
        setSelectedYears([]);
      }, 1500);
    } catch {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="fixed bottom-20 lg:bottom-6 right-20 lg:right-20 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity"
      >
        <Megaphone className="w-4 h-4" />
        <span className="hidden sm:inline">New Announcement</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#111111] border border-neutral-200 dark:border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
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
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Sent to {targetBranchLabel} · Year {targetYearLabel}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-5">
                <Megaphone className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">New Announcement</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam schedule updated" className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus:border-neutral-400 dark:focus:border-white/20" />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Summary</label>
                  <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Brief description..." rows={3} className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus:border-neutral-400 dark:focus:border-white/20 resize-none" />
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

                {/* Multi-select branches */}
                <ChipSelect
                  label="Target Branches"
                  options={branchOptions}
                  selected={selectedBranches}
                  onToggle={toggleBranch}
                  allLabel="All Branches"
                />

                {/* Multi-select years */}
                <ChipSelect
                  label="Target Years"
                  options={yearOptions}
                  selected={selectedYears}
                  onToggle={(val) => toggleYear(val)}
                  allLabel="All Years"
                />

                {/* Preview */}
                {(selectedBranches.length > 0 || selectedYears.length > 0) && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 px-1">
                    Will be sent to:{" "}
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {selectedBranches.length > 0 ? selectedBranches.join(", ") : "All branches"}{" "}
                      · {selectedYears.length > 0 ? selectedYears.map(y => `Year ${y}`).join(", ") : "All years"}
                    </span>
                  </p>
                )}

                <button
                  onClick={handlePublish}
                  disabled={!title.trim() || !summary.trim() || loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
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
