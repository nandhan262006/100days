import { FinaleClient } from "./finale-client";
import { getCurrentDay, getAllUsersWithStats } from "@/lib/data";
import { CHALLENGE, CHAPTERS, daysRemaining } from "@/lib/engine";

export const dynamic = "force-dynamic";

export default async function FinalePage() {
  const currentDay = await getCurrentDay();
  const users = await getAllUsersWithStats(currentDay);
  const remaining = daysRemaining(currentDay);

  const standings = users.map((u, i) => ({
    slug: u.user.slug,
    name: u.user.name,
    emoji: u.user.emoji,
    accent: u.user.accent,
    rank: i + 1,
    totalXp: u.stats.totalXp,
    weekXp: u.stats.weekXp,
    streak: u.stats.currentStreak,
    perfect: u.stats.perfectDays,
  }));

  const lore = CHAPTERS.map((c) => ({
    label: c.label,
    emoji: c.emoji,
    blurb: c.blurb,
    start: c.start,
    end: c.end,
  }));

  return (
    <FinaleClient
      finaleISO={CHALLENGE.finale.toISOString()}
      currentDay={currentDay}
      remaining={remaining}
      standings={standings}
      lore={lore}
    />
  );
}
