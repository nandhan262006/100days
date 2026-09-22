import { PrismaClient } from "../lib/generated/prisma/client";
import { makePrisma } from "./client";
import { dateForDayNumber, CHALLENGE } from "../lib/engine";
import type { DayRecord } from "../lib/stats";
import { computeStats } from "../lib/stats";
import { evaluateAchievements } from "../lib/achievements";
import { hashPassword } from "../lib/auth";

/** Profile passwords: lekhana→leki, akshaya→akki, nandhan→nandhi */
const PROFILE_PASSWORDS: Record<string, string> = {
  lekhana: process.env.PW_LEKHANA ?? "leki",
  akshaya: process.env.PW_AKSHAYA ?? "akki",
  nandhan: process.env.PW_NANDHAN ?? "nandhi",
};

const prisma: PrismaClient = makePrisma();

// Deterministic PRNG
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EXERCISES = ["Running", "Cycling", "Gym", "Yoga", "Walking", "HIIT", "Swimming", "Bodyweight"];
const SUBJECTS = [
  "Machine Learning",
  "Deep Learning",
  "Data Structures",
  "System Design",
  "Probability & Stats",
  "Linear Algebra",
  "DSA",
  "Web Dev",
  "Statistics",
  "Algorithms",
];
const LEARNED = [
  "Backpropagation intuition",
  "Transformer attention math",
  "Sliding window technique",
  "DB indexing internals",
  "Markov chains",
  "PCA from scratch",
  "HTTP/3 & QUIC",
  "Dynamic programming patterns",
  "CLT in practice",
  "Gradient descent variants",
];

const INPUT = process.env.SEED_DAY
  ? Math.max(1, Math.min(100, parseInt(process.env.SEED_DAY, 10)))
  : 48;

async function main() {
  console.log(`Seeding the 100-Day Trio Challenge... (as-of day ${INPUT})`);

  // Reset
  await prisma.achievementUnlock.deleteMany();
  await prisma.day.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  const profiles = [
    { name: "Lekhana", slug: "lekhana", emoji: "🦋", accent: "violet", junk: 0.82, move: 0.55, study: 0.45 },
    { name: "Akshaya", slug: "akshaya", emoji: "🌺", accent: "lime", junk: 0.78, move: 0.68, study: 0.6 },
    { name: "Nandhan", slug: "nandhan", emoji: "🌊", accent: "orange", junk: 0.62, move: 0.8, study: 0.52 },
  ];

  // Windows force perfect streaks. Breaks are explicit missed days that separate
  // random activity from forced runs so streaks stay predictable.
  type Window = { start: number; end: number; perfect: boolean };
  const wood: Record<string, { windows: Window[]; breaks: number[] }> = {
    akshaya: {
      windows: [
        { start: 1, end: 3, perfect: true }, // opening salvo
        { start: 13, end: 26, perfect: true }, // → 14-day perfect run (UNSTOPPABLE)
        { start: 36, end: 47, perfect: true }, // → current 12-day streak
      ],
      breaks: [27, 35],
    },
    nandhan: {
      windows: [
        { start: 1, end: 4, perfect: true },
        { start: 14, end: 27, perfect: true }, // → 14-day run
        { start: 40, end: 47, perfect: true }, // → current 8-day streak
      ],
      breaks: [28, 39],
    },
    lekhana: {
      windows: [
        { start: 1, end: 3, perfect: true },
        { start: 20, end: 40, perfect: true }, // → 21-day best streak
        { start: 42, end: 47, perfect: true }, // → current 6-day streak
      ],
      breaks: [19, 41],
    },
  };

  const users: Record<string, string> = {};
  for (const p of profiles) {
    const passwordHash = await hashPassword(PROFILE_PASSWORDS[p.slug] ?? "");
    const user = await prisma.user.create({
      data: { name: p.name, slug: p.slug, emoji: p.emoji, accent: p.accent, passwordHash },
    });
    users[p.slug] = user.id;

    const rng = mulberry32((p.slug.length * 7919 + p.accent.length * 104729) % 999983);
    const spec = wood[p.slug];
    const windows = spec.windows;
    const breaks = new Set(spec.breaks);
    const inWindow = (day: number) => windows.find((win) => day <= win.end && day >= win.start);

    for (let day = 1; day < INPUT; day++) {
      let junk: boolean;
      let move: boolean;
      let study: boolean;

      const win = inWindow(day);
      if (breaks.has(day)) {
        junk = move = study = false;
      } else if (win) {
        junk = move = study = true;
      } else {
        const roll = rng();
        junk = rng() < p.junk;
        move = rng() < p.move;
        study = rng() < p.study;
        // occasional full miss or partial day
        if (roll < 0.1) {
          junk = move = study = false;
        } else if (roll > 0.96) {
          // partial day — pass move, fail others
          move = true;
          junk = !junk;
          study = false;
        }
      }

      const xp = (junk ? 100 : 0) + (move ? 100 : 0) + (study ? 100 : 0);
      const isPerfect = xp === 300;
      const isMissed = xp === 0;

      const exerciseType = move ? EXERCISES[Math.floor(rng() * EXERCISES.length)] : null;
      const exerciseMin = move ? 25 + Math.floor(rng() * 46) : null;
      const steps = move ? 4200 + Math.floor(rng() * 6800) : null;
      const subject = study ? SUBJECTS[Math.floor(rng() * SUBJECTS.length)] : null;
      const studyMin = study ? 55 + Math.floor(rng() * 75) : null;
      const learned = study ? LEARNED[Math.floor(rng() * LEARNED.length)] : null;

      const submitted = new Date(dateForDayNumber(day).getTime() + 12 * 3600 * 1000);
      await prisma.day.create({
        data: {
          userId: user.id,
          dayNumber: day,
          date: dateForDayNumber(day),
          junk,
          move,
          study,
          junkAt: junk ? submitted : null,
          moveAt: move ? submitted : null,
          studyAt: study ? submitted : null,
          exerciseType,
          exerciseMin,
          steps,
          subject,
          studyMin,
          learned,
          xp,
          isPerfect,
          isMissed,
          submittedAt: submitted,
        },
      });
    }

    // Compute achievements from history (excluding today) as previously-unlocked set
    const rows = await prisma.day.findMany({
      where: { userId: user.id },
      select: {
        dayNumber: true,
        junk: true,
        move: true,
        study: true,
        xp: true,
        isPerfect: true,
        isMissed: true,
      },
    });
    const records: DayRecord[] = rows.map((r) => ({
      dayNumber: r.dayNumber,
      junk: r.junk,
      move: r.move,
      study: r.study,
      xp: r.xp,
      isPerfect: r.isPerfect,
      isMissed: r.isMissed,
    }));
    const evals = evaluateAchievements(records, INPUT - 1);
    const unlockedIds = evals.filter((e) => e.unlocked).map((e) => e.id);
    await prisma.achievementUnlock.createMany({
      data: unlockedIds.map((id) => ({
        userId: user.id,
        achievement: id,
        unlockedAt: new Date(Date.now() - 3600 * 1000),
      })),
    });

    const stats = computeStats(records, INPUT - 1);
    console.log(
      `  ${p.name.padEnd(8)} xp=${stats.totalXp} streak=${stats.currentStreak} perfect=${stats.perfectDays} junk=${stats.junkDays} move=${stats.moveDays} study=${stats.studyDays} unlocks=${unlockedIds.length}`,
    );
  }

  await prisma.setting.createMany({
    data: [
      { key: "currentDay", value: String(INPUT) },
      {
        key: "prevStandings",
        value: JSON.stringify([{ slug: "akshaya", rank: 1 }, { slug: "nandhan", rank: 2 }, { slug: "lekhana", rank: 3 }]),
      },
    ],
  });

  console.log(
    `Done. Challenge: ${CHALLENGE.title} | ${CHALLENGE.days} days | as-of day ${INPUT} | finale ${CHALLENGE.finale.toISOString().slice(0, 10)}`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});