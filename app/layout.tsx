import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { CelebrationOverlays } from "@/components/celebrations";
import { ParticleField } from "@/components/particles";
import { getActiveProfile, isSoundOn } from "@/lib/session";
import { getCurrentDay, getUsersForPicker } from "@/lib/data";
import { prisma } from "@/lib/prisma";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-sans",
  weight: ["500", "600", "700"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body-sans",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-sans",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "The 100-Day Trio Challenge",
  description: "100 days. 3 people. Zero excuses. The fitness × productivity × gaming challenge for the trio.",
  applicationName: "100-Day Trio",
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [activeUser, users, soundOn] = await Promise.all([
    getActiveProfile(),
    getUsersForPicker(),
    isSoundOn(),
  ]);

  let xp = 0;
  if (activeUser) {
    const currentDay = await getCurrentDay();
    const days = await prisma.day.findMany({
      where: { userId: activeUser.id, dayNumber: { lte: currentDay } },
      select: { xp: true },
    });
    xp = days.reduce((s, d) => s + d.xp, 0);
  }

  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="min-h-dvh bg-ink font-sans antialiased">
        <ParticleField />
        <CelebrationOverlays />
        {activeUser ? (
          <AppShell activeUser={activeUser} users={users} soundOn={soundOn} initialXp={xp}>
            {children}
          </AppShell>
        ) : (
          <>{children}</>
        )}
      </body>
    </html>
  );
}