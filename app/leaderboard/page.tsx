import { redirect } from "next/navigation";
import { LeaderboardClient, type RankChange } from "@/components/leaderboard";
import { getActiveProfile } from "@/lib/session";
import { getCurrentDay, getAllUsersWithStats, getPrevStandings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const profile = await getActiveProfile();
  if (!profile) redirect("/login");

  const currentDay = await getCurrentDay();
  const users = await getAllUsersWithStats(currentDay);
  const prev = await getPrevStandings();

  const ranking = [...users]
    .sort((a, b) => b.stats.totalXp - a.stats.totalXp)
    .map((u, i) => ({ slug: u.user.slug, rank: i + 1 }));

  const changes: RankChange[] = prev?.length
    ? users.map((u) => {
        const after = ranking.find((r) => r.slug === u.user.slug)?.rank ?? users.length;
        const before = prev.find((p) => p.slug === u.user.slug)?.rank ?? after;
        return { slug: u.user.slug, before, after };
      })
    : [];

  return (
    <LeaderboardClient users={users} currentDay={currentDay} changes={changes} activeSlug={profile.slug} />
  );
}