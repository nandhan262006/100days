export const XP_PER_LEVEL = 1000;

export type Tier = {
  name: string;
  min: number;
};

export const TIERS: Tier[] = [
  { name: "ROOKIE", min: 0 },
  { name: "GRINDER", min: 1000 },
  { name: "DISCIPLINED", min: 2000 },
  { name: "BEAST", min: 3000 },
  { name: "MACHINE", min: 4000 },
  { name: "LEGEND", min: 5000 },
];

export function levelForXp(xp: number): number {
  return Math.floor(Math.max(1, xp) / XP_PER_LEVEL) + 1;
}

export function tierForXp(xp: number): string {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (xp >= t.min) tier = t;
  }
  return tier.name;
}

export function levelProgress(xp: number): { level: number; intoLevel: number; totalForLevel: number } {
  const level = levelForXp(xp);
  const base = (level - 1) * XP_PER_LEVEL;
  return {
    level,
    intoLevel: xp - base,
    totalForLevel: XP_PER_LEVEL,
  };
}

export const LEVEL_COLORS: Record<string, string> = {
  "1": "#9ca3af",
  "2": "#9ca3af",
  "3": "#a3e635",
  "4": "#a3e635",
  "5": "#22d3ee",
  "6": "#22d3ee",
  "7": "#fb923c",
  "8": "#fb923c",
  "9": "#a78bfa",
  "10": "#a78bfa",
  LEGEND: "#facc15",
};

export function levelColor(level: number): string {
  if (level >= 11) return LEVEL_COLORS.LEGEND;
  return LEVEL_COLORS[String(level)] ?? "#ffffff";
}