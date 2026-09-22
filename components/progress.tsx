"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  max,
  className,
  barClassName,
  color = "lime",
}: {
  value: number;
  max: number;
  className?: string;
  barClassName?: string;
  color?: "lime" | "violet" | "orange" | "white";
}) {
  const pct = Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100));
  const colors: Record<string, string> = {
    lime: "bg-gradient-to-r from-lime/70 to-lime",
    violet: "bg-gradient-to-r from-violet/70 to-violet",
    orange: "bg-gradient-to-r from-orange/70 to-orange",
    white: "bg-gradient-to-r from-white/60 to-white",
  };
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <motion.div
        className={cn("h-full rounded-full", colors[color], barClassName)}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  max,
  size = 120,
  stroke = 9,
  color = "#c8ff4d",
  trackColor = "rgba(255,255,255,0.07)",
  children,
  glow = true,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  glow?: boolean;
}) {
  const pct = Math.min(1, Math.max(0, value / Math.max(1, max)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: glow ? `drop-shadow(0 0 8px ${color}66)` : undefined }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}