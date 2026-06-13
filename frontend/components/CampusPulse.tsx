"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Utensils,
  Dumbbell,
  Coffee,
  Activity,
  Wifi,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

type FacilityStatus = "LOW" | "MODERATE" | "PEAK" | "CLOSED";

interface Facility {
  id: string;
  name: string;
  shortName: string;
  icon: React.ElementType;
  status: FacilityStatus;
  occupancy: number;
  maxCapacity: number;
  metric: string;
  lastUpdated: number;
}

// ─── Status Config (Obsidian & Neon) ────────────────────────────

const statusConfig: Record<
  FacilityStatus,
  { color: string; dotColor: string; label: string; textHint: string }
> = {
  LOW: {
    color: "text-emerald-400",
    dotColor: "bg-emerald-500",
    label: "Low",
    textHint: "text-zinc-200",
  },
  MODERATE: {
    color: "text-amber-400",
    dotColor: "bg-amber-500",
    label: "Busy",
    textHint: "text-zinc-300",
  },
  PEAK: {
    color: "text-red-400",
    dotColor: "bg-red-500",
    label: "Peak",
    textHint: "text-zinc-200",
  },
  CLOSED: {
    color: "text-zinc-600",
    dotColor: "bg-zinc-600",
    label: "Closed",
    textHint: "text-zinc-500",
  },
};

// ─── Initial Data ───────────────────────────────────────────────

const initialFacilities: Facility[] = [
  {
    id: "library",
    name: "Central Library",
    shortName: "Library",
    icon: BookOpen,
    status: "LOW",
    occupancy: 42,
    maxCapacity: 200,
    metric: "seats open",
    lastUpdated: Date.now(),
  },
  {
    id: "mess",
    name: "Boys Hostel 1 Mess",
    shortName: "Mess",
    icon: Utensils,
    status: "PEAK",
    occupancy: 85,
    maxCapacity: 100,
    metric: "in queue",
    lastUpdated: Date.now(),
  },
  {
    id: "gym",
    name: "Campus Gym",
    shortName: "Gym",
    icon: Dumbbell,
    status: "MODERATE",
    occupancy: 28,
    maxCapacity: 50,
    metric: "active",
    lastUpdated: Date.now(),
  },
  {
    id: "cafeteria",
    name: "IT Cafeteria",
    shortName: "Café",
    icon: Coffee,
    status: "LOW",
    occupancy: 15,
    maxCapacity: 80,
    metric: "occupied",
    lastUpdated: Date.now(),
  },
];

// ─── Telemetry Engine ───────────────────────────────────────────

function getRandomStatus(current: FacilityStatus): FacilityStatus {
  const weights: Record<FacilityStatus, FacilityStatus[]> = {
    LOW: ["LOW", "LOW", "MODERATE", "MODERATE"],
    MODERATE: ["LOW", "MODERATE", "MODERATE", "PEAK"],
    PEAK: ["MODERATE", "PEAK", "PEAK", "PEAK"],
    CLOSED: ["CLOSED", "CLOSED", "LOW", "LOW"],
  };
  const pool = weights[current];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getOccupancy(status: FacilityStatus, max: number): number {
  switch (status) {
    case "LOW":
      return Math.floor(max * (0.1 + Math.random() * 0.25));
    case "MODERATE":
      return Math.floor(max * (0.4 + Math.random() * 0.2));
    case "PEAK":
      return Math.floor(max * (0.7 + Math.random() * 0.25));
    case "CLOSED":
      return 0;
  }
}

// ─── Animated Number ────────────────────────────────────────────

function AnimatedValue({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="inline-block tabular-nums font-semibold"
    >
      {value}
    </motion.span>
  );
}

// ─── Facility Pill ──────────────────────────────────────────────

function FacilityPill({ facility }: { facility: Facility }) {
  const cfg = statusConfig[facility.status];
  const Icon = facility.icon;
  const isRecent = Date.now() - facility.lastUpdated < 2500;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`
        relative flex items-center gap-3 rounded-full shrink-0
        px-4 py-2 border backdrop-blur-md
        bg-zinc-900/50 border-white/[0.05]
        hover:border-white/[0.1] hover:bg-zinc-900/70
        transition-colors duration-300
      `}
    >
      {/* Flash highlight on update */}
      <AnimatePresence>
        {isRecent && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 rounded-full bg-violet-500/10 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Status dot */}
      <div className="relative shrink-0">
        <div
          className={`size-2 rounded-full ${cfg.dotColor} ${
            facility.status !== "CLOSED" ? "animate-pulse" : ""
          }`}
        />
      </div>

      {/* Icon */}
      <Icon className={`w-3.5 h-3.5 ${cfg.color} shrink-0`} />

      {/* Text */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`text-xs font-medium ${cfg.textHint} whitespace-nowrap`}>
          {facility.shortName}:
        </span>
        {facility.status === "CLOSED" ? (
          <span className="text-xs text-zinc-600">Closed</span>
        ) : (
          <span className="text-xs text-zinc-400 whitespace-nowrap">
            <AnimatedValue value={facility.occupancy} />{" "}
            <span className="text-zinc-500">{facility.metric}</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function CampusPulse() {
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);

  const tick = useCallback(() => {
    setFacilities((prev) => {
      const updated = [...prev];
      const count = Math.random() > 0.5 ? 2 : 1;
      const indices = new Set<number>();
      while (indices.size < count) {
        indices.add(Math.floor(Math.random() * updated.length));
      }
      indices.forEach((i) => {
        const f = updated[i];
        const newStatus = getRandomStatus(f.status);
        updated[i] = {
          ...f,
          status: newStatus,
          occupancy: getOccupancy(newStatus, f.maxCapacity),
          lastUpdated: Date.now(),
        };
      });
      return updated;
    });
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        tick();
        schedule();
      }, 5000 + Math.random() * 3000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [tick]);

  return (
    <motion.section
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          Campus Pulse
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-500/80 font-medium">
            Live
          </span>
        </div>
      </div>

      {/* Pills row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {facilities.map((f) => (
          <FacilityPill key={f.id} facility={f} />
        ))}
      </div>
    </motion.section>
  );
}
