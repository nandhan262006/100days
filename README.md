# The 100-Day Trio Challenge

100 days. 3 people. Zero excuses. A private fitness × study × gaming tracker for Lekhana × Akshaya × Nandhan (Sep 22 — Dec 30, 2026, finale Dec 31).

Stack: Next.js 16 + React 19 + Tailwind v4 + Prisma + PostgreSQL 16.

## Setup

```bash
npm install
cp .env.example .env   # set DATABASE_URL to your Postgres
npx prisma migrate dev # or: npx prisma db push
```

## Seed (demo data)

```bash
npx tsx prisma/seed.ts        # seeds as-of day 48
SEED_DAY=20 npx tsx prisma/seed.ts  # seeds as-of any day 1..100
```

Seed creates the trio, deterministic day history with forced perfect-streak windows, achievement unlocks, and `Setting.currentDay` + `Setting.prevStandings`.

## Run

```bash
npm run dev    # http://localhost:3000
npm run build
npm run lint
```

Login: pick your fighter at `/login` + enter your password (cookie `trio_user`). Passwords: `leki` / `akki` / `nandhi` (override at seed time with `PW_LEKHANA` / `PW_AKSHAYA` / `PW_NANDHAN`). Stored as scrypt hashes in `User.passwordHash` — set/reset on an existing DB with `npx tsx prisma/set-passwords.ts`. Switching profiles from the in-app menu also requires the password.

## Demo vs live day mode

- The app's "today" is **not** `new Date()` — it's `Setting.currentDay` in Postgres (`lib/data.ts:getCurrentDay`).
- Demo: set it via seed (`SEED_DAY=48`) or `setCurrentDay(day)` / update `Setting` to `1..100` to time-travel the dashboard, calendar, battle, journey and finale.
- Live: set `currentDay` to the real day number for Sep 22 → Dec 30 (`engine.daysElapsed()` fallback is used when the setting is missing).
- `prevStandings` snapshot drives rank-change deltas on the dashboard + leaderboard.

## Routes

- `/` dashboard + mission-submit (confetti / level-up / perfect-day / achievements)
- `/leaderboard` overall / week / month / streak / perfect tabs
- `/person/[slug]` level ring + tier, streaks, per-mission bars, recent activity
- `/calendar` Sep–Dec grid (perfect / partial / missed / future) + day-details modal
- `/journey` 6 chapters, scroll-illuminated timeline
- `/achievements` trophy case, locked = grayscale + progress bars
- `/battle` current-week live XP bars + past-week winners
- `/finale` Dec 31 countdown + final-sprint standings + lore

## DB decision

Kept **PostgreSQL + Prisma** (local, seeded, everything works). A pasted Turso/libsql token was never stored or committed — migrating would require the libsql adapter + SQLite-compatible schema + re-seed.
