import { redirect } from "next/navigation";
import { CalendarClient, type CalendarUser } from "./calendar-client";
import { getActiveProfile } from "@/lib/session";
import { getCurrentDay } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const profile = await getActiveProfile();
  if (!profile) redirect("/login");

  const currentDay = await getCurrentDay();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  const calendars: CalendarUser[] = await Promise.all(
    users.map(async (u) => {
      const rows = await prisma.day.findMany({
        where: { userId: u.id },
        select: {
          dayNumber: true,
          date: true,
          junk: true,
          move: true,
          study: true,
          xp: true,
          isPerfect: true,
          isMissed: true,
          exerciseType: true,
          exerciseMin: true,
          steps: true,
          subject: true,
          studyMin: true,
          learned: true,
        },
        orderBy: { dayNumber: "asc" },
      });
      return {
        slug: u.slug,
        name: u.name,
        emoji: u.emoji,
        accent: u.accent,
        days: rows.map((r) => ({
          dayNumber: r.dayNumber,
          dateISO: r.date.toISOString(),
          junk: r.junk,
          move: r.move,
          study: r.study,
          xp: r.xp,
          isPerfect: r.isPerfect,
          isMissed: r.isMissed,
          exerciseType: r.exerciseType,
          exerciseMin: r.exerciseMin,
          steps: r.steps,
          subject: r.subject,
          studyMin: r.studyMin,
          learned: r.learned,
        })),
      };
    }),
  );

  return <CalendarClient users={calendars} currentDay={currentDay} activeSlug={profile.slug} />;
}
