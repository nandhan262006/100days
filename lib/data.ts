import { prisma } from "./prisma";
import { computeStats, type DayRecord, type UserStats } from "./stats";
import { CHALLENGE, daysElapsed, weekForDay } from "./engine";

export type UserProfile = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  accent: string;
};

/** App-wide challenge "today". Stored in DB so the group can jump between demo and live time. */
export async function getCurrentDay(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: "currentDay" } });
  if (setting && /^\d+$/.test(setting.value.trim())) {
    const v = parseInt(setting.value.trim(), 10);
    return Math.max(1, Math.min(100, v));
  }
  return daysElapsed(new Date());
}

/** Operator control: jump the app-wide "today" between 1 and 100. */
export async function setCurrentDay(day: number): Promise<void> {
  const v = Math.max(1, Math.min(100, Math.round(day)));
  await prisma.setting.upsert({
    where: { key: "currentDay" },
    create: { key: "currentDay", value: String(v) },
    update: { value: String(v) },
  });
}

export async function getSetting(key: string): Promise<string | null> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export function toDayRecords(rows: { dayNumber: number; junk: boolean; move: boolean; study: boolean; xp: number; isPerfect: boolean; isMissed: boolean }[]): DayRecord[] {
  return rows.map((r) => ({
    dayNumber: r.dayNumber,
    junk: r.junk,
    move: r.move,
    study: r.study,
    xp: r.xp,
    isPerfect: r.isPerfect,
    isMissed: r.isMissed,
  }));
}

export type UserWithStats = {
  user: UserProfile;
  stats: UserStats;
  rawDays: DayRecord[];
};

export async function loadUserWithStats(
  user: { id: string; slug: string; name: string; emoji: string; accent: string },
  currentDay: number,
): Promise<UserWithStats> {
  const rows = await prisma.day.findMany({
    where: { userId: user.id },
    select: { dayNumber: true, junk: true, move: true, study: true, xp: true, isPerfect: true, isMissed: true },
  });
  const records = toDayRecords(rows);
  const stats = computeStats(records, currentDay);
  return {
    user: { id: user.id, slug: user.slug, name: user.name, emoji: user.emoji, accent: user.accent },
    stats,
    rawDays: records,
  };
}

export async function getAllUsersWithStats(currentDay: number): Promise<UserWithStats[]> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const out = await Promise.all(users.map((u) => loadUserWithStats(u, currentDay)));
  out.sort((a, b) => b.stats.totalXp - a.stats.totalXp);
  return out;
}

export type StandingsRow = {
  slug: string;
  rank: number;
};

type PrevStandingsSnapshot = {
  day: number;
  rows: StandingsRow[];
};

/** Snapshot of standings at the start of the current day, used for rank deltas. */
export async function getPrevStandings(): Promise<StandingsRow[] | null> {
  const raw = await getSetting("prevStandings");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PrevStandingsSnapshot | StandingsRow[];
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.rows)) return parsed.rows;
    return null;
  } catch {
    return null;
  }
}

export async function getPrevStandingsSnapshot(): Promise<PrevStandingsSnapshot | null> {
  const raw = await getSetting("prevStandings");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PrevStandingsSnapshot | StandingsRow[];
    if (Array.isArray(parsed)) return null;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.rows)) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function setPrevStandings(day: number, rows: StandingsRow[]): Promise<void> {
  const snapshot: PrevStandingsSnapshot = { day, rows };
  await setSetting("prevStandings", JSON.stringify(snapshot));
}

export async function getUsersForPicker(): Promise<UserProfile[]> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return users.map((u) => ({ id: u.id, slug: u.slug, name: u.name, emoji: u.emoji, accent: u.accent }));
}

export type FullDay = {
  dayNumber: number;
  date: Date;
  junk: boolean;
  move: boolean;
  study: boolean;
  exerciseType: string | null;
  exerciseMin: number | null;
  steps: number | null;
  subject: string | null;
  studyMin: number | null;
  learned: string | null;
  xp: number;
  isPerfect: boolean;
  isMissed: boolean;
};

export async function getDashboardData(slug: string, currentDay: number) {
  const user = await prisma.user.findUnique({ where: { slug } });
  if (!user) return null;
  const me = await loadUserWithStats(user, currentDay);
  const allUsers = await getAllUsersWithStats(currentDay);
  const todayRow = await prisma.day.findUnique({
    where: { userId_dayNumber: { userId: user.id, dayNumber: currentDay } },
  });
  const ranks = new Map<string, number>();
  allUsers.forEach((u, i) => ranks.set(u.user.slug, i + 1));

  return {
    me,
    allUsers,
    myRank: ranks.get(slug) ?? null,
    todayRow,
    week: weekForDay(currentDay),
  };
}

export { CHALLENGE };