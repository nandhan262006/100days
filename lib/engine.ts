export const CHALLENGE = {
  title: "THE 100-DAY TRIO CHALLENGE",
  subtitle: "100 DAYS. 3 PEOPLE. ZERO EXCUSES.",
  participants: "LEKHANA × AKSHAYA × NANDHAN",
  start: new Date(Date.UTC(2026, 8, 23)), // Sep 23, 2026
  end: new Date(Date.UTC(2026, 11, 31)), // Dec 31, 2026 (day 100)
  finale: new Date(Date.UTC(2027, 0, 1)), // Jan 1, 2027
  days: 100,
  xpPerMission: 100,
  xpPerDay: 300,
  xpMax: 30000,
} as const;

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Real-timescale day number for a given date (1-based, clamped to 1..100). */
export function dayNumberForDate(date: Date): number {
  const targetUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  const diff = Math.floor((targetUtc - CHALLENGE.start.getTime()) / DAY_MS);
  return clamp(Math.min(diff + 1, CHALLENGE.days), 1, CHALLENGE.days);
}

export function dateForDayNumber(dayNumber: number): Date {
  return new Date(
    CHALLENGE.start.getTime() + (Math.max(1, Math.min(100, dayNumber)) - 1) * DAY_MS,
  );
}

export function daysElapsed(today = new Date()): number {
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const diff = Math.floor((todayUtc - CHALLENGE.start.getTime()) / DAY_MS);
  return clamp(diff + 1, 1, CHALLENGE.days);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function daysRemaining(currentDay: number): number {
  return Math.max(0, CHALLENGE.days - currentDay);
}

export const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
] as const;

export type Chapter = {
  label: string;
  emoji: string;
  start: number;
  end: number;
  blurb: string;
};

export const CHAPTERS: Chapter[] = [
  {
    label: "THE START",
    emoji: "🌱",
    start: 1,
    end: 10,
    blurb: "Seeds planted. Habits take root.",
  },
  {
    label: "BUILDING DISCIPLINE",
    emoji: "🔥",
    start: 11,
    end: 25,
    blurb: "It stops being motivation. It becomes routine.",
  },
  {
    label: "THE GRIND",
    emoji: "⚔️",
    start: 26,
    end: 50,
    blurb: "Nobody is watching. This is where it counts.",
  },
  {
    label: "NO EXCUSES",
    emoji: "💀",
    start: 51,
    end: 75,
    blurb: "The wall. The storm. Push through anyway.",
  },
  {
    label: "FINAL PUSH",
    emoji: "👑",
    start: 76,
    end: 99,
    blurb: "The end is visible. Don't blink now.",
  },
  {
    label: "LEGENDS",
    emoji: "🏆",
    start: 100,
    end: 100,
    blurb: "100 days. Zero excuses. Forever legends.",
  },
];

export function chapterForDay(day: number): Chapter {
  return (
    CHAPTERS.find((c) => day >= c.start && day <= c.end) ?? CHAPTERS[CHAPTERS.length - 1]
  );
}

/** Week windows (1-based) of 7 days starting at challenge start. */
export function weekRange(weekNumber: number): { start: number; end: number; startDate: Date; endDate: Date } {
  const start = (weekNumber - 1) * 7 + 1;
  const end = Math.min(start + 6, CHALLENGE.days);
  const startDate = dateForDayNumber(start);
  const endDate = dateForDayNumber(end);
  return { start, end, startDate, endDate };
}

export function weekForDay(day: number): number {
  return Math.floor((Math.max(1, Math.min(day, 100)) - 1) / 7) + 1;
}

/** Day-number range for the calendar month that contains the given day. */
export function monthRangeForDay(day: number): { start: number; end: number; label: string } {
  const d = dateForDayNumber(day);
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  const start = Math.max(1, dayNumberForDate(first));
  const end = Math.min(CHALLENGE.days, dayNumberForDate(last));
  return { start, end, label: MONTHS[d.getUTCMonth()] };
}

export const TOTAL_WEEKS = 15;

export function formatDayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Group days 1..100 into month buckets for the activity calendar. */
export type MonthBucket = {
  label: string;
  days: number[];
};

export function buildMonthBuckets(): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  for (let d = 1; d <= CHALLENGE.days; d++) {
    const date = dateForDayNumber(d);
    const monthLabel = MONTHS[date.getUTCMonth()];
    let bucket = buckets[buckets.length - 1];
    if (!bucket || bucket.label !== monthLabel) {
      bucket = { label: monthLabel, days: [] };
      buckets.push(bucket);
    }
    bucket.days.push(d);
  }
  return buckets;
}