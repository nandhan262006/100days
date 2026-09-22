"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { ACTIVE_USER_COOKIE, SOUND_COOKIE, getActiveProfile, setActiveSession } from "@/lib/session";
import { getCurrentDay, getAllUsersWithStats, getPrevStandingsSnapshot, setPrevStandings } from "@/lib/data";
import { evaluateAchievements, ACHIEVEMENT_BY_ID } from "@/lib/achievements";
import { levelForXp } from "@/lib/levels";
import { computeStats, MISSIONS } from "@/lib/stats";
import { dateForDayNumber } from "@/lib/engine";

export type SubmitResult = {
  ok: boolean;
  error?: string;
  mission: string;
  xpDelta: number;
  totalXpAfter: number;
  day: { junk: boolean; move: boolean; study: boolean; xp: number; isPerfect: boolean } | null;
  levelBefore: number;
  levelAfter: number;
  streakAfter: number;
  perfectDay: boolean;
  newlyUnlocked: { id: string; emoji: string; title: string }[];
  rankBefore: number;
  rankAfter: number;
};

const EMPTY_RESULT = (mission: string, error: string, xpBefore: number): SubmitResult => ({
  ok: false,
  error,
  mission,
  xpDelta: 0,
  totalXpAfter: xpBefore,
  day: null,
  levelBefore: 0,
  levelAfter: 0,
  streakAfter: 0,
  perfectDay: false,
  newlyUnlocked: [],
  rankBefore: 0,
  rankAfter: 0,
});

export async function setActiveUser(slug: string, password: string): Promise<{ ok: boolean }> {
  const user = await prisma.user.findUnique({ where: { slug } });
  if (!user) return { ok: false };
  const verified = await verifyPassword(password, user.passwordHash);
  if (!verified) return { ok: false };
  await setActiveSession(slug);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function clearActiveUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_USER_COOKIE);
  revalidatePath("/", "layout");
}

export async function toggleSound(): Promise<{ on: boolean }> {
  const cookieStore = await cookies();
  const prev = cookieStore.get(SOUND_COOKIE)?.value === "on";
  cookieStore.set(SOUND_COOKIE, prev ? "off" : "on", { path: "/", maxAge: 60 * 60 * 24 * 400, sameSite: "lax" });
  return { on: !prev };
}

export type MissionPayload = {
  move?: { type?: string; min?: number; steps?: number };
  study?: { subject?: string; min?: number; learned?: string };
};

class MissionLockedError extends Error {}

export async function submitMission(
  mission: string,
  payload: MissionPayload = {},
  action: "complete" | "skip" = "complete",
): Promise<SubmitResult> {
  const profile = await getActiveProfile();
  if (!profile) {
    return { ok: false, error: "NO_ACTIVE_USER", mission, xpDelta: 0, totalXpAfter: 0, day: null, levelBefore: 0, levelAfter: 0, streakAfter: 0, perfectDay: false, newlyUnlocked: [], rankBefore: 0, rankAfter: 0 };
  }
  if (!MISSIONS.some((m) => m.key === mission)) {
    return EMPTY_RESULT(mission, "BAD_MISSION", 0);
  }
  if (action !== "complete" && action !== "skip") {
    return EMPTY_RESULT(mission, "BAD_ACTION", 0);
  }

  const currentDay = await getCurrentDay();

  const allBefore = await getAllUsersWithStats(currentDay);
  const meXp = allBefore.find((u) => u.user.slug === profile.slug)?.stats.totalXp ?? 0;
  const levelBefore = levelForXp(meXp);
  const rankBefore = Math.max(1, allBefore.findIndex((u) => u.user.slug === profile.slug) + 1);

  const key = mission as "junk" | "move" | "study";
  const complete = action === "complete";
  const now = new Date();

  // Atomically claim the mission's decision slot and derive the full day
  // state inside one transaction. The timestamp column acts as the lock: the
  // guarded updateMany only writes when that mission is still undecided, so
  // a concurrent duplicate submit loses the race and gets LOCKED instead of
  // double-counting. Because concurrent claims serialize on the row lock,
  // the xp/isPerfect/isMissed recompute at the end of the tx always sees the
  // other mission's committed flags — no lost updates.
  const txResult = await prisma
    .$transaction(async (tx) => {
    const existing = await tx.day.findUnique({
      where: { userId_dayNumber: { userId: profile.id, dayNumber: currentDay } },
    });
    if (existing && decisionAt(existing, key) !== null) {
      throw new MissionLockedError();
    }

    const detail =
      key === "move"
        ? {
            exerciseType: cleanStr(payload.move?.type) ?? existing?.exerciseType ?? null,
            exerciseMin: payload.move?.min !== undefined ? clampInt(payload.move.min, 0, 720) : existing?.exerciseMin ?? null,
            steps: payload.move?.steps !== undefined ? clampInt(payload.move.steps, 0, 200000) : existing?.steps ?? null,
          }
        : key === "study"
          ? {
              subject: cleanStr(payload.study?.subject) ?? existing?.subject ?? null,
              studyMin: payload.study?.min !== undefined ? clampInt(payload.study.min, 0, 1440) : existing?.studyMin ?? null,
              learned: cleanStr(payload.study?.learned) ?? existing?.learned ?? null,
            }
          : {};

    const claimWrite = { ...detail, [key]: complete, [`${key}At`]: now };

    if (existing) {
      const guard =
        key === "junk" ? { junkAt: null } : key === "move" ? { moveAt: null } : { studyAt: null };
      const claimed = await tx.day.updateMany({
        where: { id: existing.id, ...guard },
        data: claimWrite,
      });
      if (claimed.count === 0) {
        throw new MissionLockedError();
      }
    } else {
      // Unique (userId, dayNumber) may still race a create; fall back to the
      // same guarded update when that happens.
      try {
        await tx.day.create({
          data: {
            ...detail,
            dayNumber: currentDay,
            date: dateForDayNumber(currentDay),
            userId: profile.id,
            [key]: complete,
            [`${key}At`]: now,
          },
        });
      } catch {
        const raced = await tx.day.findUnique({
          where: { userId_dayNumber: { userId: profile.id, dayNumber: currentDay } },
        });
        if (!raced || decisionAt(raced, key) !== null) {
          throw new MissionLockedError();
        }
        const guard =
          key === "junk" ? { junkAt: null } : key === "move" ? { moveAt: null } : { studyAt: null };
        const claimed = await tx.day.updateMany({
          where: { id: raced.id, ...guard },
          data: claimWrite,
        });
        if (claimed.count === 0) {
          throw new MissionLockedError();
        }
      }
    }

    // Re-read the row AFTER the claim: under read-committed this observes any
    // concurrently committed mission decisions that serialized before us.
    const merged = await tx.day.findUniqueOrThrow({
      where: { userId_dayNumber: { userId: profile.id, dayNumber: currentDay } },
    });
    const dayXp = (merged.junk ? 100 : 0) + (merged.move ? 100 : 0) + (merged.study ? 100 : 0);
    const dayIsPerfect = dayXp === 300;
    const dayActive = dayXp > 0;
    const saved = await tx.day.update({
      where: { id: merged.id },
      data: { xp: dayXp, isPerfect: dayIsPerfect, isMissed: !dayActive, submittedAt: now },
    });

    const afterRows = await tx.day.findMany({
      where: { userId: profile.id },
      select: { dayNumber: true, junk: true, move: true, study: true, xp: true, isPerfect: true, isMissed: true },
    });
    const records = afterRows.map((r) => ({
      dayNumber: r.dayNumber, junk: r.junk, move: r.move, study: r.study, xp: r.xp, isPerfect: r.isPerfect, isMissed: r.isMissed,
    }));

    const evals = evaluateAchievements(records, currentDay);
    const unlockedSet = new Set(
      (await tx.achievementUnlock.findMany({ where: { userId: profile.id } })).map((u) => u.achievement),
    );
    const newlyUnlocked = evals
      .filter((e) => e.unlocked && !unlockedSet.has(e.id))
      .map((e) => {
        const def = ACHIEVEMENT_BY_ID[e.id];
        return { id: e.id, emoji: def?.emoji ?? "🏅", title: def?.title ?? e.id };
      });
    if (newlyUnlocked.length > 0) {
      // SQLite has no skipDuplicates; tolerate unique violations from a
      // concurrent submit that unlocked the same achievement first.
      for (const a of newlyUnlocked) {
        await tx.achievementUnlock
          .create({ data: { userId: profile.id, achievement: a.id } })
          .catch(() => undefined);
      }
    }

    return { saved, records, newlyUnlocked };
  }).catch((err) => {
    if (err instanceof MissionLockedError) return null;
    throw err;
  });

  if (!txResult) {
    return EMPTY_RESULT(mission, "LOCKED", meXp);
  }

  const { saved, records, newlyUnlocked } = txResult;
  const statsAfter = computeStats(records, currentDay);
  const xpDelta = complete ? 100 : 0;

  const allAfter = await getAllUsersWithStats(currentDay);
  const rankAfter = Math.max(1, allAfter.findIndex((u) => u.user.slug === profile.slug) + 1);
  // Snapshot the standings as of the first submit of each day so rank deltas
  // on the dashboard + leaderboard read "since the day started" instead of
  // being clobbered by every subsequent submit by anyone.
  const snapshot = await getPrevStandingsSnapshot();
  if (!snapshot || snapshot.day !== currentDay) {
    await setPrevStandings(
      currentDay,
      allBefore.map((u, i) => ({ slug: u.user.slug, rank: i + 1 })),
    );
  }

  revalidatePath("/", "layout");
  revalidatePath("/leaderboard");
  revalidatePath("/achievements");
  revalidatePath(`/person/${profile.slug}`);
  revalidatePath("/battle");
  revalidatePath("/calendar");
  revalidatePath("/finale");

  return {
    ok: true,
    mission,
    xpDelta: Math.max(0, xpDelta),
    totalXpAfter: statsAfter.totalXp,
    day: dayShape(saved),
    levelBefore,
    levelAfter: levelForXp(statsAfter.totalXp),
    streakAfter: statsAfter.currentStreak,
    perfectDay: saved.isPerfect,
    newlyUnlocked,
    rankBefore,
    rankAfter,
  };
}

function decisionAt(day: { junkAt: Date | null; moveAt: Date | null; studyAt: Date | null }, key: string): Date | null {
  if (key === "junk") return day.junkAt;
  if (key === "move") return day.moveAt;
  if (key === "study") return day.studyAt;
  return null;
}

function dayShape(day: { junk: boolean; move: boolean; study: boolean; xp: number; isPerfect: boolean }) {
  return { junk: day.junk, move: day.move, study: day.study, xp: day.xp, isPerfect: day.isPerfect };
}

function cleanStr(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  const s = v.trim();
  return s.length > 0 ? s.slice(0, 80) : undefined;
}

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.round(v)));
}
