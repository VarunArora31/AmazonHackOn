"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2 } from "lucide-react";

export function OmniBar() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleParse = () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);
      setInput("");
      setTimeout(() => setShowSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-muted-foreground">
            Paste any messy notice, forwarded message, or unstructured text
          </span>
        </div>

        {/* Input area */}
        <div className="omni-glow relative rounded-2xl border border-border bg-card overflow-hidden transition-all focus-within:border-accent/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='e.g. "Fwd: Chief Warden - Tomorrow mess timing changed, breakfast 8-10am, dinner will be served till 10pm due to fest..."'
            className="w-full bg-transparent px-5 pt-4 pb-14 text-sm text-card-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none min-h-[100px] md:min-h-[80px]"
            rows={3}
          />

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {input.length > 0
                  ? `${input.length} characters`
                  : "Natural language input"}
              </span>
            </div>

            <button
              onClick={handleParse}
              disabled={!input.trim() || isProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse with AI</span>
                  <Send className="w-3 h-3 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-12 left-0 right-0 flex justify-center"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success text-sm">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Notice extracted and added to your feed
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
