import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Glass, Chip } from "@/components/glass";
import { ProgressBar, ProgressRing } from "@/components/progress";
import { AnimatedNumber } from "@/components/animated-number";
import { nf } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getActiveProfile } from "@/lib/session";
import { getCurrentDay, loadUserWithStats } from "@/lib/data";
import { dateForDayNumber, formatDayDate } from "@/lib/engine";
import { levelForXp, levelProgress, tierForXp, levelColor } from "@/lib/levels";
import { evaluateAchievements, ACHIEVEMENT_BY_ID } from "@/lib/achievements";
import { MISSIONS } from "@/lib/stats";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const active = await getActiveProfile();
  if (!active) redirect("/login");

  const target = await prisma.user.findUnique({ where: { slug } });
  if (!target) notFound();

  const currentDay = await getCurrentDay();
  const [loaded, unlockRows, recent] = await Promise.all([
    loadUserWithStats(target, currentDay),
    prisma.achievementUnlock.findMany({
      where: { userId: target.id },
      orderBy: { unlockedAt: "desc" },
    }),
    prisma.day.findMany({
      where: { userId: target.id, dayNumber: { lte: currentDay } },
      orderBy: { dayNumber: "desc" },
      take: 14,
    }),
  ]);
  const { stats } = loaded;
  const isMe = active.slug === slug;

  const level = levelForXp(stats.totalXp);
  const tier = tierForXp(stats.totalXp);
  const prog = levelProgress(stats.totalXp);
  const color = levelColor(level);

  const evals = evaluateAchievements(loaded.rawDays, currentDay);
  const unlockedCount = evals.filter((e) => e.unlocked).length;

  const missionStats = [
    { key: "junk", emoji: "🥗", label: "CLEAN FUEL", days: stats.junkDays, rate: stats.junkRate, tone: "lime" as const },
    { key: "move", emoji: "🏃", label: "MOVE", days: stats.moveDays, rate: stats.moveRate, tone: "orange" as const },
    { key: "study", emoji: "📚", label: "LEVEL UP", days: stats.studyDays, rate: stats.studyRate, tone: "violet" as const },
  ];

  const accentRing =
    target.accent === "lime" ? "#c8ff4d" : target.accent === "orange" ? "#fb923c" : "#a78bfa";

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-mist">
          <Link href="/leaderboard" className="hover:text-frost hover:underline">
            TRIO
          </Link>
          <span className="mx-2">/</span>
          <span className="text-frost">{target.name.toUpperCase()}</span>
          {isMe && <span className="ml-2 rounded-full bg-lime/20 px-1.5 py-0.5 text-[9px] font-extrabold text-lime">YOU</span>}
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {target.emoji} {target.name.toUpperCase()}
          <span className="text-mist"> · PROFILE</span>
        </h1>
      </div>

      {/* Hero: level ring + core stats */}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Glass className="flex flex-col items-center gap-3 p-6 text-center">
          <ProgressRing value={prog.intoLevel} max={prog.totalForLevel} size={148} stroke={12} color={accentRing}>
            <div className="text-center">
              <p className="font-display text-3xl font-extrabold text-white">
                <AnimatedNumber value={level} />
              </p>
              <p className="font-mono text-[9px] font-bold tracking-[0.24em] text-mist">LEVEL</p>
            </div>
          </ProgressRing>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Chip tone={target.accent === "lime" ? "lime" : target.accent === "orange" ? "orange" : "violet"}>
              {tier}
            </Chip>
            <Chip tone="neutral">LVL {level}</Chip>
          </div>
          <p className="font-mono text-[11px] font-bold text-mist">
            <span className="text-frost">{nf(prog.intoLevel)}</span> / {nf(prog.totalForLevel)} XP TO LVL {level + 1}
          </p>
          <ProgressBar value={prog.intoLevel} max={prog.totalForLevel} color={target.accent === "lime" ? "lime" : target.accent === "orange" ? "orange" : "violet"} className="w-full" />
          <p className="font-mono text-[11px] font-extrabold text-frost">
            ⚡ <AnimatedNumber value={stats.totalXp} /> XP TOTAL
          </p>
          <p className="text-[11px] font-medium text-mist">
            Best day {stats.bestDayXp} XP · {stats.totalMissions} missions · {Math.round(stats.perfectionRate * 100)}% perfect
          </p>
        </Glass>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatBox label="CURRENT STREAK" value={`${stats.currentStreak}d`} sub={`BEST ${stats.bestStreak}d`} emoji="🔥" />
          <StatBox label="PERFECT DAYS" value={String(stats.perfectDays)} sub={`${stats.bestPerfectStreak}d BEST RUN`} emoji="👑" />
          <StatBox label="ACTIVE DAYS" value={String(stats.activeDays)} sub={`${stats.missedDays} MISSED`} emoji="📅" />
          <StatBox label="ACHIEVEMENTS" value={`${unlockedCount}/${evals.length}`} sub="UNLOCKED" emoji="🏅" />
          <div className="col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="mb-2 font-mono text-[10px] font-bold tracking-[0.22em] text-mist">STREAK PULSE · DAY {currentDay}</p>
            <div className="flex items-end gap-2">
              <p className="font-display text-2xl font-extrabold text-white" style={{ color }}>
                LVL {level} · {tier}
              </p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-mist">
              {stats.currentStreak === 0
                ? "Streak reset. Today is the comeback."
                : stats.currentStreak >= 14
                  ? "Unstoppable rhythm. Protect the streak at all costs."
                  : stats.currentStreak >= 7
                    ? "On fire. One week of proof — keep stacking."
                    : "Momentum building. Don't break the chain."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/calendar" className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-frost hover:bg-white/[0.09]">
                VIEW CALENDAR →
              </Link>
              <Link href="/achievements" className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-frost hover:bg-white/[0.09]">
                ACHIEVEMENTS →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Per-mission stats */}
      <div>
        <h2 className="mb-3 font-display text-sm font-extrabold tracking-[0.18em] text-white">PER-MISSION BREAKDOWN</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {missionStats.map((m) => {
            const def = MISSIONS.find((x) => x.key === m.key);
            return (
              <Glass key={m.key} className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-mist">
                    {m.days}/{Math.max(1, stats.elapsedDays)} DAYS
                  </span>
                </div>
                <p className="font-display text-base font-extrabold tracking-[0.1em] text-white">{m.label}</p>
                <p className="text-xs text-mist">{def?.tagline}</p>
                <div className="mt-3">
                  <ProgressBar value={m.rate * 100} max={100} color={m.tone === "lime" ? "lime" : m.tone === "orange" ? "orange" : "violet"} />
                </div>
                <p className="mt-2 font-mono text-[11px] font-extrabold text-frost">{Math.round(m.rate * 100)}% COMPLETION</p>
              </Glass>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold tracking-[0.18em] text-white">RECENT ACTIVITY</h2>
          <Link href="/calendar" className="font-mono text-[10px] font-bold tracking-widest text-lime hover:underline">
            FULL CALENDAR →
          </Link>
        </div>
        {recent.length === 0 ? (
          <Glass className="p-6 text-center text-sm text-mist">No days logged yet. Day 1 is waiting.</Glass>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {recent.map((d) => (
              <div
                key={d.dayNumber}
                className={cn(
                  "rounded-xl border p-3",
                  d.isPerfect
                    ? "border-lime/30 bg-lime/[0.07]"
                    : d.xp > 0
                      ? "border-white/[0.09] bg-white/[0.04]"
                      : "border-white/[0.06] bg-white/[0.02] opacity-70",
                )}
              >
                <p className="font-mono text-[10px] font-bold tracking-widest text-mist">
                  DAY {d.dayNumber} · {formatDayDate(d.date)}
                </p>
                <p className={cn("mt-1 font-display text-lg font-extrabold", d.isPerfect ? "text-lime" : "text-white")}>
                  {d.xp} <span className="text-[11px] font-bold text-mist">XP</span>
                </p>
                <p className="mt-1 flex items-center gap-1 text-[13px]">
                  <span title="Clean fuel">{d.junk ? "🥗✓" : "🥗✕"}</span>
                  <span title="Move">{d.move ? "🏃✓" : "🏃✕"}</span>
                  <span title="Study">{d.study ? "📚✓" : "📚✕"}</span>
                </p>
                <p className="mt-1 truncate text-[10px] text-mist">
                  {d.isPerfect ? "👑 PERFECT" : d.isMissed ? "MISSED" : d.xp > 0 ? "PARTIAL" : "—"}
                </p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 font-mono text-[10px] tracking-widest text-mist/70">
          DATES FROM {formatDayDate(dateForDayNumber(1))} · TODAY IS DAY {currentDay} · {formatDayDate(dateForDayNumber(currentDay))}
        </p>
      </div>

      {/* Achievements preview */}
      <Glass className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-extrabold tracking-[0.18em] text-white">TOP UNLOCKS</h2>
          <Link href="/achievements" className="font-mono text-[10px] font-bold tracking-widest text-violet hover:underline">
            ALL ACHIEVEMENTS →
          </Link>
        </div>
        {unlockRows.length === 0 ? (
          <p className="text-sm text-mist">Locked so far. First light is one perfect push away.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unlockRows.slice(0, 8).map((u) => {
              const def = ACHIEVEMENT_BY_ID[u.achievement];
              if (!def) return null;
              return (
                <span key={u.id} className="inline-flex items-center gap-1.5 rounded-full border border-lime/25 bg-lime/[0.08] px-3 py-1.5 text-xs font-bold text-frost">
                  <span>{def.emoji}</span> {def.title}
                </span>
              );
            })}
          </div>
        )}
      </Glass>
    </div>
  );
}

function StatBox({ label, value, sub, emoji }: { label: string; value: string; sub: string; emoji: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="mb-1 flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-[0.18em] text-mist">
        <span>{emoji}</span> {label}
      </p>
      <p className="font-display text-2xl font-extrabold text-white">{value}</p>
      <p className="font-mono text-[9px] font-bold tracking-widest text-mist">{sub}</p>
    </div>
  );
}
