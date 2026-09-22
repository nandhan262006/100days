import { monthRangeForDay, weekForDay } from "./engine";

export type MissionKey = "junk" | "move" | "study";

export const MISSIONS: {
  key: MissionKey;
  emoji: string;
  title: string;
  tagline: string;
  xp: number;
}[] = [
  { key: "junk", emoji: "🥗", title: "CLEAN FUEL", tagline: "No junk food", xp: 100 },
  { key: "move", emoji: "🏃", title: "MOVE", tagline: "Exercise target", xp: 100 },
  { key: "study", emoji: "📚", title: "LEVEL UP", tagline: "Study for 1 hour", xp: 100 },
];

export type DayRecord = {
  dayNumber: number;
  junk: boolean;
  move: boolean;
  study: boolean;
  xp: number;
  isPerfect: boolean;
  isMissed: boolean;
};

export type UserStats = {
  days: DayRecord[];
  totalXp: number;
  currentDay: number;
  elapsedDays: number; // days decided so far (excludes pending today)
  currentStreak: number;
  bestStreak: number;
  currentPerfectStreak: number;
  bestPerfectStreak: number;
  perfectDays: number;
  totalMissions: number;
  missedDays: number;
  activeDays: number;
  junkDays: number;
  moveDays: number;
  studyDays: number;
  junkRate: number; // completed / elapsed days
  moveRate: number;
  studyRate: number;
  perfectionRate: number;
  weekXp: number; // XP earned in current week
  monthXp: number; // XP earned in current calendar month
  bestDayXp: number;
  currentStreakPeak: number;
  history: DayRecord[];
};

/** Single source of truth for "this day counts as active". */
export const isActiveDay = (d: DayRecord) =>
  d.xp > 0 || d.isPerfect || d.junk || d.move || d.study;

export function computeStats(days: DayRecord[], currentDay: number): UserStats {
  const day = Math.max(1, Math.min(100, Math.round(currentDay)));
  // Scope everything to <= currentDay so time-travel (setCurrentDay backwards)
  // doesn't leak future rows into totals, rates, or streaks.
  const scoped = [...days]
    .filter((d) => d.dayNumber >= 1 && d.dayNumber <= day)
    .sort((a, b) => a.dayNumber - b.dayNumber);
  const byDay = new Map(scoped.map((d) => [d.dayNumber, d]));
  const active = scoped.filter(isActiveDay);
  const totalXp = active.reduce((s, d) => s + d.xp, 0);

  const todayRec = byDay.get(day);
  const hasTodayRow = !!todayRec;
  // Days that have been decided so far. A pending today (no row) shouldn't
  // reset the streak or count as missed.
  const elapsed = hasTodayRow ? day : Math.max(0, day - 1);
  const streakStart = hasTodayRow ? day : day - 1;

  // Current streak: consecutive active days counting back from today (or
  // yesterday when today is still pending).
  let currentStreak = 0;
  for (let d = streakStart; d >= 1; d--) {
    const rec = byDay.get(d);
    if (rec && isActiveDay(rec)) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Best streak
  let bestStreak = 0;
  let run = 0;
  for (let d = 1; d <= day; d++) {
    const rec = byDay.get(d);
    if (rec && isActiveDay(rec)) {
      run++;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }

  // Perfect streaks (same pending-today rule)
  let currentPerfectStreak = 0;
  for (let d = streakStart; d >= 1; d--) {
    const rec = byDay.get(d);
    if (rec && rec.isPerfect) {
      currentPerfectStreak++;
    } else {
      break;
    }
  }
  let bestPerfectStreak = 0;
  let prun = 0;
  for (let d = 1; d <= day; d++) {
    const rec = byDay.get(d);
    if (rec && rec.isPerfect) {
      prun++;
      bestPerfectStreak = Math.max(bestPerfectStreak, prun);
    } else {
      prun = 0;
    }
  }

  const perfectDays = scoped.filter((d) => d.isPerfect).length;
  const activeDays = active.length;
  const missedDays = Math.max(0, elapsed - activeDays);

  const junkDays = scoped.filter((d) => d.junk).length;
  const moveDays = scoped.filter((d) => d.move).length;
  const studyDays = scoped.filter((d) => d.study).length;
  const totalMissions = junkDays + moveDays + studyDays;

  const window = Math.max(1, elapsed);
  const junkRate = junkDays / window;
  const moveRate = moveDays / window;
  const studyRate = studyDays / window;
  const perfectionRate = perfectDays / window;

  // Fixed challenge week (same windows as /battle), not a sliding 7-day window.
  const weekStart = (weekForDay(day) - 1) * 7 + 1;
  const weekXp = active
    .filter((d) => d.dayNumber >= weekStart && d.dayNumber <= day)
    .reduce((s, d) => s + d.xp, 0);
  const monthRange = monthRangeForDay(day);
  const monthXp = active
    .filter((d) => d.dayNumber >= monthRange.start && d.dayNumber <= day)
    .reduce((s, d) => s + d.xp, 0);
  const bestDayXp = active.reduce((m, d) => Math.max(m, d.xp), 0);

  return {
    days: scoped,
    totalXp,
    currentDay: day,
    elapsedDays: elapsed,
    currentStreak,
    bestStreak,
    currentPerfectStreak,
    bestPerfectStreak,
    perfectDays,
    totalMissions,
    missedDays,
    activeDays,
    junkDays,
    moveDays,
    studyDays,
    junkRate,
    moveRate,
    studyRate,
    perfectionRate,
    weekXp,
    monthXp,
    bestDayXp,
    currentStreakPeak: bestStreak,
    history: scoped,
  };
}