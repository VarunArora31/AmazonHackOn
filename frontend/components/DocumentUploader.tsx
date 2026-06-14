"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  X,
  Plus,
  Database,
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
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set title from filename
    setTitle(file.name.replace(/\.[^/.]+$/, ""));

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // PDF parsing is unreliable in browser — prompt user to paste
      setContent("");
      alert("PDF uploaded! For best results:\n\n1. Open the PDF in Chrome/Edge\n2. Select All (Ctrl+A)\n3. Copy (Ctrl+C)\n4. Paste here (Ctrl+V)\n\nThis ensures clean text for the AI.");
    } else if (file.name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // DOCX — parse server-side with mammoth
      setContent("Extracting text from DOCX...");
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/rag/parse-docx", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          setContent(data.text);
        } else {
          setContent("");
          alert(`DOCX extraction failed: ${data.error}. Please paste the text manually.`);
        }
      } catch {
        setContent("");
        alert("DOCX extraction failed. Please paste the text manually.");
      }
    } else {
      // Text files — read directly
      try {
        const text = await file.text();
        setContent(text);
      } catch {
        setContent("[Could not read file. Please paste the text manually.]");
      }
    }
  };

  // Ingest into vector DB
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
        }),
      });

      const data = await res.json();
      setResult({
        success: data.success,
        message: data.success
          ? `✓ ${data.message}`
          : `✗ ${data.error || "Ingestion failed"}`,
      });

      if (data.success) {
        // Clear form after success
        setTimeout(() => {
          setTitle("");
          setContent("");
          setResult(null);
        }, 3000);
      }
    } catch (err: any) {
      setResult({ success: false, message: `✗ ${err.message || "Network error"}` });
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
                  className="flex items-center gap-2 px-3 py-2 w-full rounded-lg border border-dashed border-neutral-300 dark:border-white/10 text-neutral-500 dark:text-neutral-400 text-xs hover:border-neutral-400 dark:hover:border-white/20 hover:bg-neutral-50 dark:hover:bg-[#0a0a0a] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .txt, .md, .csv, .docx, or .pdf</span>
                </button>
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
