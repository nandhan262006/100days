import { redirect } from "next/navigation";
import { JourneyClient } from "./journey-client";
import { getActiveProfile } from "@/lib/session";
import { getCurrentDay, getAllUsersWithStats } from "@/lib/data";
import { CHAPTERS } from "@/lib/engine";

export const dynamic = "force-dynamic";

export default async function JourneyPage() {
  const profile = await getActiveProfile();
  if (!profile) redirect("/login");

  const currentDay = await getCurrentDay();
  const users = await getAllUsersWithStats(currentDay);

  const chapters = CHAPTERS.map((c) => {
    const totalDays = c.end - c.start + 1;
    const elapsed = Math.max(0, Math.min(totalDays, currentDay - c.start + 1));
    const status = currentDay < c.start ? "locked" as const : currentDay > c.end ? "completed" as const : "active" as const;

    let perfect = 0;
    let xp = 0;
    for (const u of users) {
      for (const d of u.stats.days) {
        if (d.dayNumber >= c.start && d.dayNumber <= c.end) {
          xp += d.xp;
          if (d.isPerfect) perfect++;
        }
      }
    }

    return {
      label: c.label,
      emoji: c.emoji,
      start: c.start,
      end: c.end,
      blurb: c.blurb,
      totalDays,
      elapsed,
      status,
      perfect,
      xp,
    };
  });

  return <JourneyClient chapters={chapters} currentDay={currentDay} />;
}
