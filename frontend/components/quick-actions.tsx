"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Zap,
  MessageCircle,
  Send,
  Shield,
  ChevronRight,
} from "lucide-react";
import { hostelTimings } from "@/lib/data";

function HostelTimingsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          Hostel Timings
        </h3>
      </div>

      <div className="space-y-2">
        {hostelTimings.map((timing) => (
          <div
            key={timing.label}
            className="flex items-center justify-between py-1.5"
          >
            <div className="flex items-center gap-2">
              {timing.active && (
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              )}
              <span
                className={`text-xs ${
                  timing.active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {timing.label}
              </span>
            </div>
            <span
              className={`text-xs font-mono ${
                timing.active ? "text-success" : "text-muted-foreground/70"
              }`}
            >
              {timing.time}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SummarizeButton() {
  const [summarizing, setSummarizing] = useState(false);
  const [done, setDone] = useState(false);

  const handleSummarize = () => {
    setSummarizing(true);
    setTimeout(() => {
      setSummarizing(false);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
      </div>

      <button
        onClick={handleSummarize}
        disabled={summarizing}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-accent/5 border border-accent/20 text-sm text-accent hover:bg-accent/10 transition-all disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          <span className="font-medium">
            {summarizing
              ? "Summarizing..."
              : done
              ? "✓ Summary ready!"
              : "Summarize unread notices"}
          </span>
        </div>
        <ChevronRight className="w-4 h-4" />
      </button>

      {done && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 p-3 rounded-lg bg-muted border border-border text-xs text-muted-foreground leading-relaxed"
        >
          <p className="font-medium text-foreground mb-1">Today's Summary:</p>
          <p>
            3 new notices today. Microsoft placement registration closes June 15
            (CGPA 7.5+). Dinner menu changed to Chole Bhature. Coding contest
            tonight at 8 PM.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

function MiniChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([
    {
      role: "ai",
      text: "Hey! Ask me anything about your campus schedule, notices, or events.",
    },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    const userMsg = message;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setMessage("");

    // Simulate AI response
    setTimeout(() => {
      let response =
        "I'll look that up for you. Based on recent notices, ";
      if (userMsg.toLowerCase().includes("placement")) {
        response =
          "The Microsoft SDE Intern drive is scheduled for June 15 at 11 AM. Make sure you've registered on the placement portal by tonight!";
      } else if (userMsg.toLowerCase().includes("mess") || userMsg.toLowerCase().includes("dinner")) {
        response =
          "Tonight's dinner is Chole Bhature (changed from Paneer Butter Masala). Mess timing is 7:30 - 9:30 PM.";
      } else if (userMsg.toLowerCase().includes("exam")) {
        response =
          "End-sem exams start June 25. Your first exam is Data Structures on June 26 at 9 AM.";
      } else {
        response +=
          "I don't have specific info on that yet. Try pasting the relevant notice in the Omni-Bar above!";
      }
      setMessages((prev) => [...prev, { role: "ai", text: response }]);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-xl border border-border bg-card p-4 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Ask AI</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 max-h-[200px] overflow-y-auto mb-3 pr-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs px-3 py-2 rounded-lg max-w-[90%] ${
              msg.role === "ai"
                ? "bg-muted text-muted-foreground"
                : "bg-accent/10 text-accent ml-auto"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="What time is the placement drive?"
          className="flex-1 text-xs px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent/50"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="p-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-30"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export function QuickActions() {
  return (
    <div className="space-y-4">
      <HostelTimingsCard />
      <SummarizeButton />
      <MiniChat />
    </div>
  );
}
