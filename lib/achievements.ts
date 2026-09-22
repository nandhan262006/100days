import type { DayRecord } from "./stats";
import { isActiveDay } from "./stats";

export type AchievementDef = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "legendary";
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-light", emoji: "🌅", title: "FIRST LIGHT", description: "Complete your first day of the challenge.", tier: "bronze" },
  { id: "on-fire", emoji: "🔥", title: "ON FIRE", description: "Hold a 7-day streak.", tier: "silver" },
  { id: "unstoppable", emoji: "🔥", title: "UNSTOPPABLE", description: "Hold a 14-day streak.", tier: "gold" },
  { id: "burnout", emoji: "🔥", title: "BURNOUT", description: "Hold a 50-day streak.", tier: "legendary" },
  { id: "clean-machine", emoji: "🥗", title: "CLEAN MACHINE", description: "14 consecutive no-junk days.", tier: "silver" },
  { id: "beast-mode", emoji: "💪", title: "BEAST MODE", description: "Complete exercise 20 times.", tier: "silver" },
  { id: "bookworm", emoji: "📚", title: "BOOKWORM", description: "Study 10 consecutive days.", tier: "silver" },
  { id: "perfect-week", emoji: "👑", title: "PERFECT WEEK", description: "Complete all 3 missions for 7 days straight.", tier: "gold" },
  { id: "1k-club", emoji: "⚡", title: "1K CLUB", description: "Earn 1,000 total XP.", tier: "bronze" },
  { id: "3k-club", emoji: "⚡", title: "3K CLUB", description: "Earn 3,000 total XP.", tier: "silver" },
  { id: "5k-club", emoji: "💎", title: "5K CLUB", description: "Earn 5,000 total XP.", tier: "gold" },
  { id: "10k-club", emoji: "💎", title: "10K CLUB", description: "Earn 10,000 total XP.", tier: "legendary" },
  { id: "no-excuses", emoji: "💀", title: "NO EXCUSES", description: "Earn 30 perfect days.", tier: "gold" },
  { id: "half-way", emoji: "🏆", title: "HALF WAY", description: "Be active for 50 days.", tier: "silver" },
  { id: "legend", emoji: "👑", title: "LEGEND", description: "Be active on all 100 days.", tier: "legendary" },
];

export type AchievementEval = {
  id: string;
  unlocked: boolean;
  progress: number; // 0..1
  progressText: string;
};

function maxConsecutive(
  byDay: Map<number, DayRecord>,
  day: number,
  predicate: (d: DayRecord) => boolean,
): number {
  // Missing days break the run — a gap is not a streak.
  let best = 0;
  let run = 0;
  for (let d = 1; d <= day; d++) {
    const rec = byDay.get(d);
    if (rec && predicate(rec)) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

export function evaluateAchievements(
  daysRaw: DayRecord[],
  currentDay: number,
): AchievementEval[] {
  const day = Math.max(1, Math.min(100, Math.round(currentDay)));
  const scoped = [...daysRaw]
    .filter((d) => d.dayNumber >= 1 && d.dayNumber <= day)
    .sort((a, b) => a.dayNumber - b.dayNumber);
  const byDay = new Map(scoped.map((d) => [d.dayNumber, d]));
  const isActive = isActiveDay;
  const active = scoped.filter(isActive);
  const totalXp = active.reduce((s, d) => s + d.xp, 0);
  const perfectDays = scoped.filter((d) => d.isPerfect).length;

  const dayStreak = maxConsecutive(byDay, day, isActive);
  const cleanStreak = maxConsecutive(byDay, day, (d) => d.junk);
  const studyStreak = maxConsecutive(byDay, day, (d) => d.study);
  const perfectStreak = maxConsecutive(byDay, day, (d) => d.isPerfect);
  const exerciseCount = scoped.filter((d) => d.move).length;
  const activeDays = active.length;

  const pct = (cur: number, target: number) => Math.min(1, cur / target);

  const evals: AchievementEval[] = [
    { id: "first-light", unlocked: active.length > 0, progress: active.length > 0 ? 1 : 0, progressText: active.length > 0 ? "DAY 1 DONE" : "0 / 1 DAY" },
    { id: "on-fire", unlocked: dayStreak >= 7, progress: pct(dayStreak, 7), progressText: `${dayStreak} / 7 DAYS` },
    { id: "unstoppable", unlocked: dayStreak >= 14, progress: pct(dayStreak, 14), progressText: `${dayStreak} / 14 DAYS` },
    { id: "burnout", unlocked: dayStreak >= 50, progress: pct(dayStreak, 50), progressText: `${dayStreak} / 50 DAYS` },
    { id: "clean-machine", unlocked: cleanStreak >= 14, progress: pct(cleanStreak, 14), progressText: `${cleanStreak} / 14 DAYS` },
    { id: "beast-mode", unlocked: exerciseCount >= 20, progress: pct(exerciseCount, 20), progressText: `${exerciseCount} / 20 TIMES` },
    { id: "bookworm", unlocked: studyStreak >= 10, progress: pct(studyStreak, 10), progressText: `${studyStreak} / 10 DAYS` },
    { id: "perfect-week", unlocked: perfectStreak >= 7, progress: pct(perfectStreak, 7), progressText: `${perfectStreak} / 7 DAYS` },
    { id: "1k-club", unlocked: totalXp >= 1000, progress: pct(totalXp, 1000), progressText: `${totalXp} / 1,000 XP` },
    { id: "3k-club", unlocked: totalXp >= 3000, progress: pct(totalXp, 3000), progressText: `${totalXp} / 3,000 XP` },
    { id: "5k-club", unlocked: totalXp >= 5000, progress: pct(totalXp, 5000), progressText: `${totalXp} / 5,000 XP` },
    { id: "10k-club", unlocked: totalXp >= 10000, progress: pct(totalXp, 10000), progressText: `${totalXp} / 10,000 XP` },
    { id: "no-excuses", unlocked: perfectDays >= 30, progress: pct(perfectDays, 30), progressText: `${perfectDays} / 30 DAYS` },
    { id: "half-way", unlocked: activeDays >= 50, progress: pct(activeDays, 50), progressText: `${activeDays} / 50 DAYS` },
    { id: "legend", unlocked: activeDays >= 100, progress: pct(activeDays, 100), progressText: `${activeDays} / 100 DAYS` },
  ];

  return evals;
}

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

export const TIER_BADGE: Record<AchievementDef["tier"], string> = {
  bronze: "#b45309",
  silver: "#cbd5e1",
  gold: "#facc15",
  legendary: "#a78bfa",
};