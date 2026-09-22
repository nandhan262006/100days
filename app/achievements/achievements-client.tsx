"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Glass } from "@/components/glass";
import { ProgressBar } from "@/components/progress";
import { TIER_BADGE } from "@/lib/achievements";
import { cn } from "@/lib/cn";

export type AchievementItem = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "legendary";
  unlocked: boolean;
  progress: number;
  progressText: string;
  trioCount: number;
  isMine: boolean;
};

const FILTERS = [
  { id: "all", label: "ALL" },
  { id: "unlocked", label: "UNLOCKED" },
  { id: "locked", label: "LOCKED" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const TIER_ORDER: Record<string, number> = { legendary: 0, gold: 1, silver: 2, bronze: 3 };

export function AchievementsClient({
  items,
  userName,
  userEmoji,
  currentDay,
}: {
  items: AchievementItem[];
  userName: string;
  userEmoji: string;
  currentDay: number;
}) {
  const [filter, setFilter] = useState<FilterId>("all");
  const unlocked = items.filter((i) => i.unlocked).length;

  const visible = useMemo(() => {
    const list = items.filter((i) =>
      filter === "all" ? true : filter === "unlocked" ? i.unlocked : !i.unlocked,
    );
    return [...list].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9);
    });
  }, [items, filter]);

  return (
    <div className="space-y-5 sm:space-y-7">
      <div>
        <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-violet">🏅 ACHIEVEMENTS</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {userEmoji} {userName.toUpperCase()}&apos;S <span className="gradient-text">TROPHY CASE</span>
        </h1>
        <p className="mt-1.5 font-mono text-[10px] font-bold tracking-[0.26em] text-mist">
          {unlocked}/{items.length} UNLOCKED · DAY {currentDay} / 100
        </p>
      </div>

      <Glass className="p-4">
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold tracking-widest text-mist">
          <span>COMPLETION</span>
          <span>{Math.round((unlocked / Math.max(1, items.length)) * 100)}%</span>
        </div>
        <ProgressBar value={unlocked} max={items.length} color="violet" />
      </Glass>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-xl px-4 py-2 font-mono text-[11px] font-extrabold tracking-widest transition-colors",
              filter === f.id
                ? "bg-violet text-ink"
                : "border border-white/10 bg-white/[0.04] text-mist hover:text-frost",
            )}
          >
            {f.label}
            {f.id === "unlocked" ? ` · ${unlocked}` : f.id === "locked" ? ` · ${items.length - unlocked}` : ""}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a, i) => {
          const badge = TIER_BADGE[a.tier];
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Glass
                glow={a.unlocked ? "violet" : undefined}
                className={cn(
                  "h-full p-5",
                  a.unlocked
                    ? "border-violet/30 shadow-[0_0_50px_-16px_rgba(167,139,250,0.5)]"
                    : "opacity-90",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl",
                      a.unlocked ? "bg-white/[0.07]" : "bg-white/[0.03] grayscale",
                    )}
                  >
                    {a.unlocked ? a.emoji : "🔒"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate font-display text-sm font-extrabold tracking-wide", a.unlocked ? "text-white" : "text-mist")}>
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-mist">{a.description}</p>
                    <p className="mt-1.5 flex items-center gap-2 font-mono text-[9px] font-bold tracking-[0.2em]">
                      <span style={{ color: badge }}>◆ {a.tier.toUpperCase()}</span>
                      <span className="text-mist">· {a.trioCount}/3 TRIO</span>
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  {a.unlocked ? (
                    <p className="rounded-lg border border-lime/30 bg-lime/[0.08] px-3 py-2 text-center font-mono text-[10px] font-extrabold tracking-[0.2em] text-lime">
                      ✓ UNLOCKED · {a.progressText}
                    </p>
                  ) : (
                    <>
                      <ProgressBar value={a.progress * 100} max={100} color="white" />
                      <p className="mt-1.5 text-center font-mono text-[10px] font-bold tracking-widest text-mist">
                        {a.progressText} · {Math.round(a.progress * 100)}%
                      </p>
                    </>
                  )}
                </div>
              </Glass>
            </motion.div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <Glass className="p-8 text-center text-sm text-mist">Nothing here yet.</Glass>
      )}
    </div>
  );
}
