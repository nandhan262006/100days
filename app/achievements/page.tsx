import { redirect } from "next/navigation";
import { AchievementsClient } from "./achievements-client";
import { getActiveProfile } from "@/lib/session";
import { getCurrentDay, getAllUsersWithStats, loadUserWithStats } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, evaluateAchievements } from "@/lib/achievements";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const profile = await getActiveProfile();
  if (!profile) redirect("/login");

  const currentDay = await getCurrentDay();
  const meRow = await prisma.user.findUnique({ where: { slug: profile.slug } });
  if (!meRow) redirect("/login");
  const me = await loadUserWithStats(meRow, currentDay);
  const evals = evaluateAchievements(me.rawDays, currentDay);
  const unlockRows = await prisma.achievementUnlock.findMany({ where: { userId: meRow.id } });
  const unlockedSet = new Set(unlockRows.map((u) => u.achievement));

  const all = await getAllUsersWithStats(currentDay);
  const trioCounts = new Map<string, number>();
  for (const u of all) {
    const ev = evaluateAchievements(u.rawDays, currentDay);
    for (const e of ev) {
      if (e.unlocked) trioCounts.set(e.id, (trioCounts.get(e.id) ?? 0) + 1);
    }
  }

  const items = ACHIEVEMENTS.map((def) => {
    const ev = evals.find((e) => e.id === def.id);
    return {
      id: def.id,
      emoji: def.emoji,
      title: def.title,
      description: def.description,
      tier: def.tier,
      unlocked: ev?.unlocked ?? false,
      progress: ev?.progress ?? 0,
      progressText: ev?.progressText ?? "",
      trioCount: trioCounts.get(def.id) ?? 0,
      isMine: unlockedSet.has(def.id) || (ev?.unlocked ?? false),
    };
  });

  return (
    <AchievementsClient
      items={items}
      userName={profile.name}
      userEmoji={profile.emoji}
      currentDay={currentDay}
    />
  );
}
