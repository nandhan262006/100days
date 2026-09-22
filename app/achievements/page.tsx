import { redirect } from "next/navigation";
import { AchievementsClient } from "./achievements-client";
import { getActiveProfile } from "@/lib/session";
import { getCurrentDay, getAllUsersWithStats } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, evaluateAchievements } from "@/lib/achievements";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const profile = await getActiveProfile();
  if (!profile) redirect("/login");

  const currentDay = await getCurrentDay();
  const [all, unlockRows] = await Promise.all([
    getAllUsersWithStats(currentDay),
    prisma.achievementUnlock.findMany({ where: { userId: profile.id } }),
  ]);
  const me = all.find((u) => u.user.slug === profile.slug);
  if (!me) redirect("/login");
  const evals = evaluateAchievements(me.rawDays, currentDay);
  const unlockedSet = new Set(unlockRows.map((u) => u.achievement));

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
