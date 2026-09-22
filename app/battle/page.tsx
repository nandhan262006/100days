import { redirect } from "next/navigation";
import { BattleClient, type BattleWeek } from "./battle-client";
import { getActiveProfile } from "@/lib/session";
import { getCurrentDay, getAllUsersWithStats } from "@/lib/data";
import { TOTAL_WEEKS, weekRange, weekForDay } from "@/lib/engine";

export const dynamic = "force-dynamic";

export default async function BattlePage() {
  const profile = await getActiveProfile();
  if (!profile) redirect("/login");

  const currentDay = await getCurrentDay();
  const currentWeek = weekForDay(currentDay);
  const users = await getAllUsersWithStats(currentDay);

  const weeks: BattleWeek[] = [];
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const range = weekRange(w);
    const isFuture = range.start > currentDay;
    const isCurrent = w === currentWeek;
    const rows = users.map((u) => {
      const xp = u.stats.days
        .filter((d) => d.dayNumber >= range.start && d.dayNumber <= Math.min(range.end, currentDay))
        .reduce((s, d) => s + d.xp, 0);
      return { slug: u.user.slug, name: u.user.name, emoji: u.user.emoji, accent: u.user.accent, xp };
    });
    const best = Math.max(...rows.map((r) => r.xp));
    const winners = best > 0 && !isFuture ? rows.filter((r) => r.xp === best).map((r) => r.slug) : [];
    weeks.push({
      week: w,
      start: range.start,
      end: range.end,
      startLabel: range.startDate.toISOString(),
      endLabel: range.endDate.toISOString(),
      isCurrent,
      isFuture,
      rows,
      winners,
      totalXp: rows.reduce((s, r) => s + r.xp, 0),
    });
  }

  const current = weeks.find((w) => w.week === currentWeek) ?? weeks[0];
  const past = weeks.filter((w) => w.week < currentWeek).reverse();
  const winCounts = new Map<string, number>();
  for (const w of weeks) {
    if (w.isFuture || w.isCurrent) continue;
    for (const s of w.winners) winCounts.set(s, (winCounts.get(s) ?? 0) + 1);
  }

  return (
    <BattleClient
      current={current}
      past={past}
      currentWeek={currentWeek}
      currentDay={currentDay}
      activeSlug={profile.slug}
      winCounts={Object.fromEntries(winCounts)}
    />
  );
}
