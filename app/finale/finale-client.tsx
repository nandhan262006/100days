"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Glass } from "@/components/glass";
import { ProgressBar } from "@/components/progress";
import { AnimatedNumber } from "@/components/animated-number";
import { nf } from "@/lib/format";
import { CHALLENGE } from "@/lib/engine";
import { cn } from "@/lib/cn";

export type FinaleStanding = {
  slug: string;
  name: string;
  emoji: string;
  accent: string;
  rank: number;
  totalXp: number;
  weekXp: number;
  streak: number;
  perfect: number;
};

function useCountdown(targetISO: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const target = new Date(targetISO).getTime();
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
    done: diff <= 0,
  };
}

export function FinaleClient({
  finaleISO,
  currentDay,
  remaining,
  standings,
  lore,
}: {
  finaleISO: string;
  currentDay: number;
  remaining: number;
  standings: FinaleStanding[];
  lore: { label: string; emoji: string; blurb: string; start: number; end: number }[];
}) {
  const cd = useCountdown(finaleISO);
  const leader = standings[0];
  const maxXp = Math.max(1, ...standings.map((s) => s.totalXp));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center">
        <p className="font-mono text-[11px] font-bold tracking-[0.34em] text-orange">🏆 GRAND FINALE · DEC 31, 2026</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          THE <span className="gradient-text">FINAL SPRINT</span>
        </h1>
        <p className="mt-2 font-mono text-[10px] font-bold tracking-[0.28em] text-mist">
          DAY {currentDay} / 100 · {remaining} DAYS REMAINING · {CHALLENGE.participants}
        </p>
      </div>

      {/* Countdown */}
      <Glass glow="orange" className="border-orange/25 p-6 text-center sm:p-8">
        {cd.done ? (
          <p className="font-display text-2xl font-extrabold text-lime text-glow-lime sm:text-3xl">
            IT ALL HAPPENED. LEGENDS. 🏆
          </p>
        ) : (
          <>
            <p className="mb-4 font-mono text-[10px] font-bold tracking-[0.3em] text-mist">COUNTDOWN TO THE FINALE</p>
            <div className="mx-auto grid max-w-lg grid-cols-4 gap-2 sm:gap-3">
              <TimeBox value={cd.days} label="DAYS" />
              <TimeBox value={cd.hours} label="HRS" />
              <TimeBox value={cd.mins} label="MIN" />
              <TimeBox value={cd.secs} label="SEC" accent />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-mist">
              Dec 31, 2026 · 00:00 UTC · When the clock hits zero, the trio with the most XP, the longest streaks
              and the most perfect days becomes immortal.
            </p>
          </>
        )}
      </Glass>

      {/* Final-sprint standings */}
      <div>
        <h2 className="mb-3 text-center font-display text-sm font-extrabold tracking-[0.22em] text-white">
          FINAL-SPRINT STANDINGS
        </h2>
        <div className="space-y-2.5">
          {standings.map((s, i) => (
            <motion.div
              key={s.slug}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/person/${s.slug}`}
                className={cn(
                  "glass glass-hover block p-4 sm:p-5",
                  i === 0 && "border-yellow-400/30 shadow-[0_0_60px_-18px_rgba(250,204,21,0.5)]",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("w-8 font-display text-2xl font-extrabold", i === 0 ? "text-yellow-300" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange" : "text-mist")}>
                    {s.rank}
                  </span>
                  <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/[0.06] text-xl">
                    {s.emoji}
                    {i === 0 && <span className="absolute -right-1.5 -top-2 text-sm">👑</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold tracking-wide text-white sm:text-base">
                      {s.name.toUpperCase()}
                    </p>
                    <p className="font-mono text-[10px] font-bold text-mist">
                      ⚡ {nf(s.totalXp)} XP · 🔥 {s.streak}d · 👑 {s.perfect} · LAST 7D +{nf(s.weekXp)}
                    </p>
                    <div className="mt-1.5">
                      <ProgressBar
                        value={s.totalXp}
                        max={maxXp}
                        color={s.accent === "lime" ? "lime" : s.accent === "orange" ? "orange" : "violet"}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg font-extrabold text-white">
                      <AnimatedNumber value={s.totalXp} />
                    </p>
                    <p className="font-mono text-[9px] font-bold tracking-widest text-mist">XP</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        {leader && (
          <p className="mt-3 text-center font-mono text-[11px] font-bold tracking-[0.2em] text-mist">
            {remaining === 0 ? "FINAL ORDER LOCKED." : `${leader.emoji} ${leader.name.toUpperCase()} LEADS BY ${nf(leader.totalXp - (standings[1]?.totalXp ?? leader.totalXp))} XP · ${remaining} DAYS TO STEAL IT`}
          </p>
        )}
      </div>

      {/* Lore strip */}
      <div>
        <h2 className="mb-3 text-center font-display text-sm font-extrabold tracking-[0.22em] text-white">
          THE LEGEND SO FAR
        </h2>
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {lore.map((c) => {
            const done = currentDay > c.end;
            const live = currentDay >= c.start && currentDay <= c.end;
            return (
              <div
                key={c.label}
                className={cn(
                  "w-64 shrink-0 rounded-2xl border p-4",
                  live
                    ? "border-violet/40 bg-violet/[0.08]"
                    : done
                      ? "border-lime/25 bg-lime/[0.05]"
                      : "border-white/[0.08] bg-white/[0.02] opacity-70",
                )}
              >
                <p className="text-2xl">{live ? c.emoji : done ? c.emoji : "🔒"}</p>
                <p className="mt-2 font-display text-sm font-extrabold tracking-wide text-white">{c.label}</p>
                <p className="font-mono text-[9px] font-bold tracking-widest text-mist">DAYS {c.start}–{c.end}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-mist">{c.blurb}</p>
                <p className={cn("mt-2 font-mono text-[9px] font-extrabold tracking-widest", live ? "text-violet" : done ? "text-lime" : "text-mist")}>
                  {live ? "● HAPPENING NOW" : done ? "✓ WRITTEN" : "○ YET TO COME"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 pb-2 text-center">
        <Link href="/journey" className="rounded-xl bg-lime px-5 py-3 text-xs font-extrabold tracking-widest text-ink shadow-lg hover:brightness-105">
          WALK THE JOURNEY →
        </Link>
        <p className="font-mono text-[10px] font-bold tracking-[0.3em] text-mist/60">
          SEP 22 — DEC 30 · NO DAY OFF
        </p>
      </div>
    </div>
  );
}

function TimeBox({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-3 sm:p-4", accent ? "border-lime/40 bg-lime/[0.08]" : "border-white/[0.09] bg-white/[0.03]")}>
      <p className={cn("font-display text-2xl font-extrabold tabular-nums sm:text-4xl", accent ? "text-lime" : "text-white")}>
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 font-mono text-[9px] font-bold tracking-[0.24em] text-mist">{label}</p>
    </div>
  );
}
