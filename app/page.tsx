import Link from "next/link";
import { redirect } from "next/navigation";
import { MissionGrid } from "@/components/missions";
import { Glass } from "@/components/glass";
import { ProgressBar } from "@/components/progress";
import { Logo } from "@/components/logo";
import { getActiveProfile } from "@/lib/session";
import { getCurrentDay, getDashboardData, getPrevStandings } from "@/lib/data";
import { CHALLENGE, daysRemaining, weekForDay, formatDayDate, dateForDayNumber } from "@/lib/engine";
import { levelForXp, tierForXp } from "@/lib/levels";
import { nf } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Trophy, ArrowRight, Flame, Zap, Crown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await getActiveProfile();
  if (!profile) redirect("/login");

  const currentDay = await getCurrentDay();
  const data = await getDashboardData(profile.slug, currentDay);
  if (!data) redirect("/login");

  const { me, allUsers, todayRow } = data;
  const remaining = daysRemaining(currentDay);
  const pct = Math.round((currentDay / CHALLENGE.days) * 100);
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12 ? "GOOD MORNING" : hour >= 12 && hour < 17 ? "GOOD AFTERNOON" : hour >= 17 && hour < 22 ? "GOOD EVENING" : "LATE NIGHT GRIND";
  const level = levelForXp(me.stats.totalXp);
  const week = weekForDay(currentDay);

  const prev = await getPrevStandings();
  const prevRank = prev?.find((p) => p.slug === profile.slug)?.rank ?? null;
  const rankDelta = prevRank != null && data.myRank != null ? data.myRank - prevRank : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-lime">
            {greeting}, {profile.name.toUpperCase()} 👋
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            THE 100-DAY TRIO <span className="gradient-text">CHALLENGE</span>
          </h1>
          <p className="mt-1.5 font-mono text-[10px] font-bold tracking-[0.26em] text-mist">
            {CHALLENGE.title} · LEKHANA × AKSHAYA × NANDHAN
          </p>
        </div>
        <Link href="/battle" className="group inline-flex items-center gap-2 self-start">
          <span className="rounded-xl border border-orange/30 bg-orange/10 px-3 py-2 font-mono text-[11px] font-extrabold tracking-widest text-orange transition-shadow hover:shadow-[0_0_24px_-6px_rgba(251,146,60,0.6)]">
            ⚔️ WEEK {week} BATTLE LIVE
          </span>
          <ArrowRight className="h-4 w-4 text-orange transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Day progress */}
      <Glass className="p-5 sm:p-6">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              DAY {String(currentDay).padStart(2, "0")}
              <span className="text-mist"> / 100</span>
            </p>
            <p className="mt-1 font-mono text-[11px] font-bold tracking-[0.24em] text-mist">
              {formatDayDate(dateForDayNumber(currentDay))} · WEEK {week} OF {Math.ceil(CHALLENGE.days / 7)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold text-violet text-glow-violet">{remaining}</p>
            <p className="font-mono text-[10px] font-bold tracking-[0.22em] text-mist">DAYS REMAINING</p>
          </div>
        </div>
        <ProgressBar value={currentDay} max={CHALLENGE.days} color="violet" barClassName="shadow-[0_0_14px_rgba(167,139,250,0.5)]" />
        <div className="mt-2 flex justify-between font-mono text-[10px] font-bold tracking-widest text-mist">
          <span>SEP 22</span>
          <span>{pct}% COMPLETE</span>
          <span>DEC 30</span>
        </div>
      </Glass>

      {/* Stat chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip
          icon={<Flame className="h-4 w-4 text-orange" />}
          label="CURRENT STREAK"
          value={`${me.stats.currentStreak} days`}
          sub={`BEST ${me.stats.bestStreak}`}
          tone="orange"
        />
        <StatChip
          icon={<Zap className="h-4 w-4 text-lime" />}
          label="TOTAL XP"
          value={nf(me.stats.totalXp)}
          sub={`LEVEL ${level} · ${tierForXp(me.stats.totalXp)}`}
          tone="lime"
        />
        <StatChip
          icon={<Trophy className="h-4 w-4 text-yellow-300" />}
          label="RANKING"
          value={data.myRank ? `#${data.myRank}` : "—"}
          sub={
            !data.myRank || !rankDelta
              ? "HOLDING"
              : rankDelta < 0
                ? `⚡ UP ${-rankDelta}`
                : `▼ DOWN ${rankDelta}`
          }
          tone="gold"
        />
        <StatChip
          icon={<Crown className="h-4 w-4 text-violet" />}
          label="PERFECT DAYS"
          value={String(me.stats.perfectDays)}
          sub={`${Math.round(me.stats.perfectionRate * 100)}% OF DAYS`}
          tone="violet"
        />
      </div>

      {/* Today's missions */}
      <MissionGrid
        key={`${profile.slug}-${currentDay}`}
        initialDay={
          todayRow
            ? {
                junk: todayRow.junk,
                move: todayRow.move,
                study: todayRow.study,
                xp: todayRow.xp,
                isPerfect: todayRow.isPerfect,
              }
            : null
        }
        initialDecided={
          todayRow
            ? {
                junk: todayRow.junkAt != null,
                move: todayRow.moveAt != null,
                study: todayRow.studyAt != null,
              }
            : null
        }
        user={{ name: profile.name, emoji: profile.emoji }}
        currentDay={currentDay}
      />

      {/* Lower row: mini leaderboard + week snapshot */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Glass className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-extrabold tracking-[0.16em] text-white">LIVE RANKING</h3>
            <Link href="/leaderboard" className="font-mono text-[10px] font-bold tracking-widest text-lime hover:underline">
              FULL BOARD →
            </Link>
          </div>
          <div className="space-y-2">
            {allUsers.map((u, i) => {
              const isMe = u.user.slug === profile.slug;
              return (
                <Link
                  key={u.user.slug}
                  href={`/person/${u.user.slug}`}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                    isMe ? "border-lime/30 bg-lime/[0.07]" : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]",
                  )}
                >
                  <span className={cn("w-6 font-display text-sm font-extrabold", i === 0 ? "text-yellow-300" : i === 1 ? "text-mist" : i === 2 ? "text-orange" : "text-mist")}>
                    {i + 1}
                  </span>
                  <span className="text-lg">{u.user.emoji}</span>
                  <span className="flex-1 truncate text-sm font-bold text-frost">
                    {u.user.name.toUpperCase()}
                    {isMe && <span className="ml-2 rounded-full bg-lime/20 px-1.5 py-0.5 text-[9px] font-extrabold text-lime">YOU</span>}
                  </span>
                  <span className="font-mono text-xs font-extrabold text-frost">{nf(u.stats.totalXp)} XP</span>
                  <span className="font-mono text-[10px] font-bold text-orange">🔥{u.stats.currentStreak}</span>
                </Link>
              );
            })}
          </div>
        </Glass>

        <Glass className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-extrabold tracking-[0.16em] text-white">THIS WEEK · WEEK {week}</h3>
            <Link href="/battle" className="font-mono text-[10px] font-bold tracking-widest text-orange hover:underline">
              BATTLE MAP →
            </Link>
          </div>
          <div className="space-y-3">
            {allUsers.map((u) => (
              <div key={u.user.slug}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-bold text-frost">
                    {u.user.emoji} {u.user.name.toUpperCase()}
                  </span>
                  <span className="font-mono font-extrabold text-frost">{nf(u.stats.weekXp)} XP</span>
                </div>
                <ProgressBar value={u.stats.weekXp} max={2100} color={u.user.accent === "lime" ? "lime" : u.user.accent === "orange" ? "orange" : "violet"} />
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] font-bold tracking-widest text-mist">
            ⚡ WEEKLY BATTLE · TOP SCORE WINS A BRAG RIGHT
          </p>
        </Glass>
      </div>

      {/* Signature strip */}
      <div className="flex flex-col items-center gap-3 py-2 text-center sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.2em] text-mist">
          <Logo size={22} />
          <span>SEP 22 — DEC 30, 2026</span>
          <span className="text-lime">·</span>
          <span>
            FINALE <span className="text-orange">DEC 31</span>
          </span>
        </div>
        <p className="font-mono text-[10px] font-bold tracking-[0.24em] text-mist/70">
          {remaining === 0 ? "IT ALL HAPPENED. LEGENDS." : `${remaining} DAYS LEFT. NO DAY OFF.`}
        </p>
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "lime" | "orange" | "violet" | "gold";
}) {
  const tones: Record<string, string> = {
    lime: "border-lime/25 bg-lime/[0.07]",
    orange: "border-orange/25 bg-orange/[0.07]",
    violet: "border-violet/25 bg-violet/[0.07]",
    gold: "border-yellow-400/25 bg-yellow-400/[0.07]",
  };
  return (
    <div className={cn("rounded-2xl border px-4 py-3.5", tones[tone])}>
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon}
        <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-mist">{label}</span>
      </div>
      <p className="font-display text-xl font-extrabold text-white">{value}</p>
      <p className="font-mono text-[9px] font-bold tracking-widest text-mist">{sub}</p>
    </div>
  );
}