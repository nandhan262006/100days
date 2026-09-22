"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { TrendingUp, Flame, Crown, Zap, ChevronRight } from "lucide-react";
import type { UserWithStats } from "@/lib/data";
import { levelForXp, tierForXp } from "@/lib/levels";
import { nf } from "@/lib/format";
import { cn } from "@/lib/cn";

export type RankChange = { slug: string; before: number; after: number };

const TABS = [
  { id: "overall", label: "OVERALL", icon: Zap },
  { id: "week", label: "THIS WEEK", icon: Flame },
  { id: "month", label: "THIS MONTH", icon: TrendingUp },
  { id: "streak", label: "STREAK", icon: Flame },
  { id: "perfect", label: "PERFECT DAYS", icon: Crown },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function LeaderboardClient({
  users,
  currentDay,
  changes,
  activeSlug,
}: {
  users: UserWithStats[];
  currentDay: number;
  changes: RankChange[];
  activeSlug: string;
}) {
  const [tab, setTab] = useState<TabId>("overall");

  const ranked = useMemo(() => {
    const arr = [...users];
    switch (tab) {
      case "week":
        arr.sort((a, b) => b.stats.weekXp - a.stats.weekXp);
        break;
      case "month":
        arr.sort((a, b) => b.stats.monthXp - a.stats.monthXp);
        break;
      case "streak":
        arr.sort((a, b) => b.stats.currentStreak - a.stats.currentStreak);
        break;
      case "perfect":
        arr.sort((a, b) => b.stats.perfectDays - a.stats.perfectDays);
        break;
      default:
        arr.sort((a, b) => b.stats.totalXp - a.stats.totalXp);
    }
    return arr.map((u, i) => ({ ...u, rank: i + 1 }));
  }, [users, tab]);

  return (
    <div className="space-y-5 sm:space-y-7">
      <div>
        <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-yellow-300">🏆 LEADERBOARD</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          WHO&apos;S <span className="gradient-text">HUNTING</span> WHOM
        </h1>
        <p className="mt-1.5 font-mono text-[10px] font-bold tracking-[0.26em] text-mist">
          DAY {currentDay} / 100 · RANKS UPDATE LIVE AS MISSIONS LAND
        </p>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative shrink-0 rounded-xl px-3.5 py-2 text-xs font-extrabold tracking-wider transition-colors",
                active ? "text-ink" : "border border-white/10 bg-white/[0.04] text-mist hover:text-frost",
              )}
            >
              {active && <motion.span layoutId="lb-tab" className="absolute inset-0 rounded-xl bg-lime" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Rows */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {ranked.map((u, i) => (
            <motion.div
              key={`${u.user.slug}-${tab}`}
              layout
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.32, delay: i * 0.045, ease: [0.22, 1, 0.36, 1] }}
            >
              <Row u={u} rank={u.rank} tab={tab} isMe={u.user.slug === activeSlug} change={changes.find((c) => c.slug === u.user.slug)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({ u, rank, tab, isMe, change }: { u: UserWithStats & { rank: number }; rank: number; tab: TabId; isMe: boolean; change?: RankChange }) {
  const level = levelForXp(u.stats.totalXp);
  const tier = tierForXp(u.stats.totalXp);
  const barColor =
    u.user.accent === "lime" ? "bg-lime" : u.user.accent === "orange" ? "bg-orange" : "bg-violet";

  const value = {
    overall: nf(u.stats.totalXp),
    week: nf(u.stats.weekXp),
    month: nf(u.stats.monthXp),
    streak: `${u.stats.currentStreak}d`,
    perfect: String(u.stats.perfectDays),
  }[tab];

  const mainMetric = {
    overall: `${value} XP`,
    week: `${value} XP THIS WEEK`,
    month: `${value} XP THIS MONTH`,
    streak: `${value} STREAK`,
    perfect: `${value} PERFECT DAYS`,
  }[tab];

  const medal = rank === 1 ? "text-yellow-300" : rank === 2 ? "text-slate-300" : rank === 3 ? "text-orange" : "text-mist";

  return (
    <Link
      href={`/person/${u.user.slug}`}
      className={cn(
        "glass glass-hover relative block overflow-hidden px-4 py-3.5 sm:px-5",
        rank === 1 && "border-lime/30 shadow-[0_0_50px_-16px_rgba(200,255,77,0.4)]",
        isMe && "ring-1 ring-lime/40",
      )}
    >
      {/* leader bar */}
      <div className="absolute inset-y-0 left-0 w-1">
        <div className={cn("h-full", barColor, rank === 1 && "shadow-[0_0_12px_rgba(200,255,77,0.9)]")} />
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex w-12 flex-col items-center sm:w-14">
          <span className={cn("font-display text-2xl font-extrabold", medal)}>{rank}</span>
          {change && (change.before !== change.after) && tab === "overall" && (
            <span className={cn("font-mono text-[9px] font-extrabold", change.after < change.before ? "text-lime" : "text-red-400")}>
              {change.after < change.before ? `▲ #${change.before}→#${change.after}` : `▼ #${change.after}`}
            </span>
          )}
        </div>

        <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-xl sm:h-12 sm:w-12 sm:text-2xl">
          {u.user.emoji}
          {rank === 1 && (
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-1.5 text-sm"
            >
              👑
            </motion.span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-extrabold tracking-wide text-white sm:text-base">
              {u.user.name.toUpperCase()}
            </p>
            {isMe && <span className="rounded-full bg-lime/20 px-1.5 py-0.5 text-[9px] font-extrabold text-lime">YOU</span>}
            <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] font-bold text-mist sm:inline">
              LVL {level} · {tier}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10px] font-bold text-mist">
            <span className="text-frost">⚡ {mainMetric}</span>
            <span className="text-orange">🔥 {u.stats.currentStreak}d</span>
            <span className="text-violet">👑 {u.stats.perfectDays}</span>
            <span>🎯 {u.stats.totalMissions}</span>
          </div>
        </div>

        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex" style={{ width: 130 }}>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metricPct(u, tab)}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={cn("h-full rounded-full", barColor)}
            />
          </div>
          <span className="font-mono text-[9px] font-bold tracking-widest text-mist">
            {tab === "overall" ? `${Math.round(metricPct(u, tab))}% TO 10K` : tab === "streak" ? `BEST ${u.stats.bestStreak}d` : tab === "perfect" ? `${Math.round(u.stats.perfectionRate * 100)}% RATE` : `${pctOfWeek(u, tab)}% OF WEEK`}
          </span>
        </div>

        <ChevronRight className="hidden h-4 w-4 text-mist sm:block" />
      </div>
    </Link>
  );
}

function metricPct(u: UserWithStats, tab: TabId): number {
  if (tab === "overall") return Math.min(100, (u.stats.totalXp / 10000) * 100);
  if (tab === "week") return Math.min(100, (u.stats.weekXp / 2100) * 100);
  if (tab === "month") return Math.min(100, (u.stats.monthXp / 9000) * 100);
  if (tab === "streak") return Math.min(100, (u.stats.currentStreak / 100) * 100);
  return Math.min(100, (u.stats.perfectDays / 100) * 100);
}

function pctOfWeek(u: UserWithStats, tab: TabId): number {
  if (tab === "week") return Math.round((u.stats.weekXp / 2100) * 100);
  if (tab === "month") return Math.round((u.stats.monthXp / 9000) * 100);
  return 0;
}