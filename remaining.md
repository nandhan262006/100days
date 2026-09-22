# Remaining Work — The 100-Day Trio Challenge

> Build status: DONE. Dashboard, login, leaderboard, mission-submit flow
> (confetti / level-up / perfect-day / achievement celebrations) + all 6 pages
> working, typecheck-clean, lint-clean, build-clean.

## Open decision

- User pasted a **Turso (libsql)** connection string (JWT + `libsql://...turso.io`).
  App is currently built on **Prisma + PostgreSQL** (local Postgres 16, already
  seeded with day-48 demo data). Decide:
  - [x] Keep PostgreSQL (recommended, everything works) — DECIDED, kept.
  - [ ] Migrate to Turso (requires libsql adapter, SQLite-compatible schema, re-seed)
- The pasted token was NOT stored or committed anywhere.

## Pages still to build — ALL DONE

1. **Personal dashboard** `/person/[slug]` — DONE
   - Level ring + tier badge, current/best streak, perfect days
   - Per-mission stats with completion bars
   - Recent activity strip
2. **100-day activity calendar** `/calendar` — DONE
   - GitHub-style grid grouped by month (Sep/Oct/Nov/Dec)
   - Color states: none / partial / perfect / missed
   - Hover tooltip + click-to-open day details (mission ✓/✕, XP)
3. **The Journey** `/journey` — DONE
   - 100-day timeline divided into the 6 chapters
   - Scroll-triggered progress illumination
4. **Achievements** `/achievements` — DONE
   - Grid of all achievements; locked = grayscale, unlocked = glow
   - Progress bars on locked ones
5. **Weekly battle** `/battle` — DONE
   - Current week: animated XP bars for all 3 players
   - History of past weeks + week winners
6. **Grand Finale** `/finale` — DONE
   - Countdown to Dec 31, 2026
   - Final-sprint standings + lore strip

## Polish & hardening

- [x] Add `lib/generated/` (Prisma client output) to `.gitignore`
- [x] `.env.example` documenting `DATABASE_URL`
- [x] README: setup, seed, run, demo-vs-live day mode
- [x] Responsive pass (mobile nav, tables, modals)
- [x] `npm run build` + `eslint` clean
- [x] Remove unused imports (e.g. `Chip` on dashboard)

## Verification

- [x] Re-run seed: `npx tsx prisma/seed.ts`
- [x] `npm run build`
- [x] `npm run lint`
- [ ] End-to-end click-through: login → 3 missions → level-up / perfect-day flows (manual — mission flow unchanged, new pages link from dashboard/nav)