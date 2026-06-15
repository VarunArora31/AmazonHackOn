"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  X,
  Plus,
  Database,
  AlertCircle,
} from "lucide-react";

// ─── Category Options ───────────────────────────────────────────

const categories = [
  { value: "academics", label: "Academics" },
  { value: "placement", label: "Placement" },
  { value: "hostel", label: "Hostel & Mess" },
  { value: "clubs", label: "Clubs & Events" },
  { value: "sports", label: "Sports" },
  { value: "transport", label: "Transport" },
  { value: "general", label: "General" },
];

// ─── Main Component ─────────────────────────────────────────────

export function DocumentUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user ID for per-user knowledge base
  useEffect(() => {
    async function loadUserId() {
      try {
        const { getCurrentUser } = await import("@/lib/auth");
        const user = await getCurrentUser();
        if (user) setUserId(user.id);
      } catch {}
    }
    loadUserId();
  }, []);

  // Handle file upload — all formats parsed server-side
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTitle(file.name.replace(/\.[^/.]+$/, ""));
    setIsParsing(true);
    setParseStatus(null);
    setContent("");

    try {
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        // PDF — parse server-side
        setParseStatus("Extracting text from PDF...");
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/rag/parse-pdf", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success && data.text) {
          setContent(data.text);
          setParseStatus(`Extracted ${data.characters.toLocaleString()} characters`);
        } else {
          setParseStatus(data.error || "Could not extract text from PDF. Try pasting content manually.");
        }
      } else if (file.name.endsWith(".docx") || file.type.includes("wordprocessingml")) {
        // DOCX — parse server-side
        setParseStatus("Extracting text from DOCX...");
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/rag/parse-docx", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success && data.text) {
          setContent(data.text);
          setParseStatus(`Extracted ${data.characters.toLocaleString()} characters`);
        } else {
          setParseStatus(data.error || "Could not extract DOCX text. Try pasting manually.");
        }
      } else {
        // Text files (.txt, .md, .csv) — read directly
        setParseStatus("Reading file...");
        const text = await file.text();
        setContent(text);
        setParseStatus(`Loaded ${text.length.toLocaleString()} characters`);
      }
    } catch (err: any) {
      setParseStatus(`Error: ${err.message || "File parsing failed"}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Ingest into vector DB (per-user)
  const handleIngest = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsIngesting(true);
    setResult(null);

    try {
      const res = await fetch("/api/rag/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          content: content.trim(),
          userId: userId || undefined,
        }),
      });

      const data = await res.json();
      setResult({
        success: data.success,
        message: data.success
          ? data.message || "Document ingested successfully"
          : data.error || "Ingestion failed",
      });

      if (data.success) {
        setTimeout(() => {
          setTitle("");
          setContent("");
          setResult(null);
          setParseStatus(null);
        }, 3000);
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Network error" });
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-white/20 transition-colors"
      >
        <Database className="w-3.5 h-3.5" />
        <span>Add to Knowledge Base</span>
        <Plus className="w-3 h-3" />
      </button>

      {/* Upload Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 px-4 py-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#111111] space-y-3">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., End-Sem Exam Schedule 2026"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus:border-neutral-400 dark:focus:border-white/20"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Upload File (optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.csv,.pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                  className="flex items-center gap-2 px-3 py-2 w-full rounded-lg border border-dashed border-neutral-300 dark:border-white/10 text-neutral-500 dark:text-neutral-400 text-xs hover:border-neutral-400 dark:hover:border-white/20 hover:bg-neutral-50 dark:hover:bg-[#0a0a0a] transition-colors disabled:opacity-50"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing file...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload .txt, .md, .csv, .docx, or .pdf</span>
                    </>
                  )}
                </button>
                {parseStatus && (
                  <p className={`mt-1.5 text-[10px] flex items-center gap-1 ${
                    parseStatus.startsWith("Error") || parseStatus.includes("Could not")
                      ? "text-red-500"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {parseStatus.startsWith("Error") ? <AlertCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    {parseStatus}
                  </p>
                )}
              </div>

              {/* Content textarea */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Document Content {content && `(${content.length} characters)`}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste the document content here... exam schedules, notices, timetables, placement info, mess menus, etc."
                  rows={6}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none focus:border-neutral-400 dark:focus:border-white/20 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleIngest}
                  disabled={!title.trim() || !content.trim() || isIngesting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isIngesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Chunking & Embedding...
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      Ingest into Vector DB
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400 text-xs hover:bg-neutral-50 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                      result.success
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {result.success ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    {result.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
