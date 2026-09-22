"use client";

import { motion } from "framer-motion";
import { Glass } from "@/components/glass";
import { ProgressBar } from "@/components/progress";
import { nf } from "@/lib/format";
import { CHALLENGE } from "@/lib/engine";
import { cn } from "@/lib/cn";

export type JourneyChapter = {
  label: string;
  emoji: string;
  start: number;
  end: number;
  blurb: string;
  totalDays: number;
  elapsed: number;
  status: "locked" | "active" | "completed";
  perfect: number;
  xp: number;
};

export function JourneyClient({ chapters, currentDay }: { chapters: JourneyChapter[]; currentDay: number }) {
  const pct = Math.round((currentDay / CHALLENGE.days) * 100);
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-violet">🗺️ THE JOURNEY</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          100 DAYS, <span className="gradient-text">6 CHAPTERS</span>
        </h1>
        <p className="mt-1.5 font-mono text-[10px] font-bold tracking-[0.26em] text-mist">
          DAY {currentDay} / 100 · {pct}% THROUGH THE STORY
        </p>
      </div>

      <Glass className="p-5">
        <div className="mb-2 flex items-end justify-between">
          <p className="font-display text-2xl font-extrabold text-white">
            DAY {String(currentDay).padStart(2, "0")}
            <span className="text-mist"> / 100</span>
          </p>
          <p className="font-mono text-[11px] font-bold text-mist">{pct}% COMPLETE</p>
        </div>
        <ProgressBar value={currentDay} max={CHALLENGE.days} color="violet" />
        <p className="mt-2 font-mono text-[10px] tracking-widest text-mist">SEP 22 → DEC 30 · FINALE DEC 31</p>
      </Glass>

      <div className="timeline-rail relative space-y-4 pl-0 sm:space-y-5">
        {chapters.map((c, i) => {
          const lit = c.status !== "locked";
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: lit ? 1 : 0.55, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Glass
                glow={c.status === "active" ? "violet" : undefined}
                className={cn(
                  "p-5 sm:p-6",
                  c.status === "completed" && "border-lime/25",
                  c.status === "active" && "border-violet/40",
                  c.status === "locked" && "opacity-80",
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                  <div className="flex items-center gap-3 sm:w-40 sm:shrink-0 sm:flex-col sm:items-start">
                    <span className={cn("grid h-12 w-12 place-items-center rounded-2xl text-2xl", lit ? "bg-white/[0.07]" : "bg-white/[0.03] grayscale")}>
                      {c.status === "locked" ? "🔒" : c.emoji}
                    </span>
                    <div>
                      <p className="font-mono text-[10px] font-bold tracking-[0.22em] text-mist">CHAPTER {i + 1}</p>
                      <p className="font-display text-base font-extrabold tracking-wide text-white">{c.label}</p>
                      <p className="font-mono text-[10px] font-bold text-mist">DAYS {c.start}–{c.end} · {c.totalDays}d</p>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm leading-relaxed", lit ? "text-frost" : "text-mist")}>{c.blurb}</p>
                    <div className="mt-3">
                      <ProgressBar
                        value={c.elapsed}
                        max={c.totalDays}
                        color={c.status === "completed" ? "lime" : c.status === "active" ? "violet" : "white"}
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] font-bold tracking-widest text-mist">
                        <span className={c.status === "completed" ? "text-lime" : c.status === "active" ? "text-violet" : ""}>
                          {c.status === "completed" ? "✓ COMPLETE" : c.status === "active" ? `● ACTIVE · DAY ${currentDay} INSIDE` : "○ LOCKED"}
                        </span>
                        <span>👑 {c.perfect} PERFECT (TRIO)</span>
                        <span>⚡ {nf(c.xp)} XP</span>
                        <span>{c.elapsed}/{c.totalDays} DAYS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Glass>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center font-mono text-[10px] font-bold tracking-[0.3em] text-mist/60">
        {currentDay >= 100 ? "IT ALL HAPPENED. LEGENDS." : "SCROLL TO WALK THE ROAD · THE END IS EARNED"}
      </p>
    </div>
  );
}
