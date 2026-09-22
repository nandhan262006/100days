import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { signSessionValue, verifySessionValue } from "./auth";
import type { UserProfile } from "./data";

export const ACTIVE_USER_COOKIE = "trio_user";
export const SOUND_COOKIE = "trio_sound";

export const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 400,
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

export async function getActiveSlug(): Promise<string | null> {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(ACTIVE_USER_COOKIE)?.value);
}

export async function isSoundOn(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SOUND_COOKIE)?.value === "on";
}

export async function getActiveProfile(): Promise<UserProfile | null> {
  const slug = await getActiveSlug();
  if (!slug) return null;
  const user = await prisma.user.findUnique({ where: { slug } });
  if (!user) return null;
  return { id: user.id, slug: user.slug, name: user.name, emoji: user.emoji, accent: user.accent };
}

export async function setActiveSession(slug: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_USER_COOKIE, signSessionValue(slug), COOKIE_OPTIONS);
}
