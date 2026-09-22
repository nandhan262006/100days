"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Glass } from "@/components/glass";
import { AnimatedNumber } from "@/components/animated-number";
import { nf } from "@/lib/format";
import { dateForDayNumber, formatDayDate } from "@/lib/engine";
import { cn } from "@/lib/cn";

export type BattleRow = {
  slug: string;
  name: string;
  emoji: string;
  accent: string;
  xp: number;
};

export type BattleWeek = {
  week: number;
  start: number;
  end: number;
  startLabel: string;
  endLabel: string;
  isCurrent: boolean;
  isFuture: boolean;
  rows: BattleRow[];
  winners: string[];
  totalXp: number;
};

const ACCENT_BAR: Record<string, string> = {
  lime: "from-lime/70 to-lime",
  violet: "from-violet/70 to-violet",
  orange: "from-orange/70 to-orange",
};

export function BattleClient({
  current,
  past,
  currentWeek,
  currentDay,
  activeSlug,
  winCounts,
}: {
  current: BattleWeek;
  past: BattleWeek[];
  currentWeek: number;
  currentDay: number;
  activeSlug: string;
  winCounts: Record<string, number>;
}) {
  const sorted = [...current.rows].sort((a, b) => b.xp - a.xp);
  const leader = sorted[0];
  const maxXp = Math.max(2100, ...sorted.map((r) => r.xp));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-orange">⚔️ WEEKLY BATTLE</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          WEEK {currentWeek} <span className="gradient-text">LIVE</span>
        </h1>
        <p className="mt-1.5 font-mono text-[10px] font-bold tracking-[0.26em] text-mist">
          DAY {currentDay} / 100 · {formatDayDate(dateForDayNumber(current.start)).toUpperCase()} →{" "}
          {formatDayDate(dateForDayNumber(Math.min(current.end, 100))).toUpperCase()} · 2,100 XP UP FOR GRABS
        </p>
      </div>

      {/* Current week animated bars */}
      <Glass glow="orange" className="border-orange/25 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold tracking-[0.18em] text-white">
            THIS WEEK · WEEK {current.week}
          </h2>
          <span className="flex items-center gap-1.5 rounded-full border border-orange/30 bg-orange/10 px-3 py-1 font-mono text-[10px] font-extrabold tracking-widest text-orange">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange" /> LIVE
          </span>
        </div>
        <div className="space-y-4">
          {sorted.map((r, i) => {
            const pct = Math.min(100, (r.xp / maxXp) * 100);
            const isLeader = r.slug === leader?.slug && r.xp > 0;
            const isMe = r.slug === activeSlug;
            return (
              <Link key={r.slug} href={`/person/${r.slug}`} className="block">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-extrabold text-white">
                    <span className={cn("font-display text-lg", i === 0 ? "text-yellow-300" : "text-mist")}>{i + 1}</span>
                    <span className="text-lg">{r.emoji}</span>
                    <span className="truncate">{r.name.toUpperCase()}</span>
                    {isLeader && <span className="text-base">👑</span>}
                    {isMe && <span className="rounded-full bg-lime/20 px-1.5 py-0.5 text-[9px] font-extrabold text-lime">YOU</span>}
                    {current.winners.includes(r.slug) && r.xp > 0 && (
                      <span className="rounded-full bg-orange/20 px-1.5 py-0.5 text-[9px] font-extrabold text-orange">LEADING</span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-sm font-extrabold text-frost">
                    <AnimatedNumber value={r.xp} /> <span className="text-[10px] text-mist">XP</span>
                  </span>
                </div>
                <div className="h-3.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className={cn("h-full rounded-full bg-gradient-to-r", ACCENT_BAR[r.accent] ?? ACCENT_BAR.violet)}
                    style={isLeader ? { boxShadow: "0 0 18px rgba(251,146,60,0.55)" } : undefined}
                  />
                </div>
                <p className="mt-1 font-mono text-[9px] font-bold tracking-widest text-mist">
                  {Math.round((r.xp / 2100) * 100)}% OF WEEKLY MAX · {winCounts[r.slug] ?? 0} PAST WINS
                </p>
              </Link>
            );
          })}
        </div>
        <p className="mt-4 rounded-xl border border-orange/20 bg-orange/[0.07] px-3.5 py-2.5 text-[11px] font-semibold leading-relaxed text-orange">
          Top score when the week closes takes the brag right. 7 days × 300 XP = 2,100 max. No recounts.
        </p>
      </Glass>

      {/* History */}
      <div>
        <h2 className="mb-3 font-display text-sm font-extrabold tracking-[0.18em] text-white">
          BATTLE HISTORY · {past.length} WEEKS SETTLED
        </h2>
        {past.length === 0 ? (
          <Glass className="p-6 text-center text-sm text-mist">Week 1 is still being written. Make it yours.</Glass>
        ) : (
          <div className="space-y-2.5">
            {past.map((w) => {
              const ordered = [...w.rows].sort((a, b) => b.xp - a.xp);
              return (
                <Glass key={w.week} className="p-4">
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-sm font-extrabold tracking-wider text-white">
                      WEEK {w.week}
                      <span className="ml-2 font-mono text-[10px] font-bold text-mist">
                        DAYS {w.start}–{w.end} · {formatDayDate(dateForDayNumber(w.start))} → {formatDayDate(dateForDayNumber(w.end))}
                      </span>
                    </p>
                    <p className="font-mono text-[10px] font-bold tracking-widest text-mist">
                      {w.winners.length > 0 ? (
                        <span className="text-yellow-300">
                          👑 {w.winners.map((s) => ordered.find((r) => r.slug === s)?.name.toUpperCase()).join(" + ")} · {nf(Math.max(...ordered.map((r) => r.xp)))} XP
                        </span>
                      ) : (
                        "NO WINNER"
                      )}
                    </p>
                  </div>
                  {/* Desktop table / mobile stacked bars */}
                  <div className="grid gap-2 sm:grid-cols-3">
                    {ordered.map((r) => (
                      <div
                        key={r.slug}
                        className={cn(
                          "rounded-xl border px-3 py-2.5",
                          w.winners.includes(r.slug)
                            ? "border-yellow-400/30 bg-yellow-400/[0.06]"
                            : "border-white/[0.07] bg-white/[0.03]",
                        )}
                      >
                        <p className="flex items-center gap-1.5 text-xs font-bold text-frost">
                          <span>{r.emoji}</span> {r.name.toUpperCase()}
                          {w.winners.includes(r.slug) && <span>👑</span>}
                        </p>
                        <p className="mt-0.5 font-mono text-sm font-extrabold text-white">{nf(r.xp)} XP</p>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                          <div
                            className={cn("h-full rounded-full bg-gradient-to-r", ACCENT_BAR[r.accent] ?? ACCENT_BAR.violet)}
                            style={{ width: `${Math.min(100, (r.xp / 2100) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Glass>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
