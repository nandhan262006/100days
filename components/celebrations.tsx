"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { EVENTS, useBus } from "./bus";
import confetti from "canvas-confetti";
import { playLevelUp, playPerfectDay } from "@/lib/sfx";

type LevelUpData = { name: string; emoji: string; before: number; after: number };
type PerfectData = { name: string; emoji: string; xp: number; streak: number; day: number };

export function CelebrationOverlays() {
  return (
    <>
      <LevelUpHost />
      <PerfectDayHost />
    </>
  );
}

function LevelUpHost() {
  const [data, setData] = useState<LevelUpData | null>(null);

  const show = useCallback((d: LevelUpData) => {
    playLevelUp();
    fireModalConfetti();
    setData(d);
    window.setTimeout(() => setData(null), 4200);
  }, []);

  useBus(EVENTS.levelUp, (p) => {
    const name = (p?.name as string) ?? "";
    const emoji = (p?.emoji as string) ?? "⚡";
    const before = (p?.before as number) ?? 0;
    const after = (p?.after as number) ?? 0;
    if (after > before) show({ name, emoji, before, after });
  });

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          key="levelup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setData(null)}
          className="fixed inset-0 z-[80] grid place-items-center bg-black/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, rotateX: 20 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 1.08, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative flex flex-col items-center gap-4 rounded-[2rem] border border-lime/40 bg-gradient-to-b from-card-2 to-ink px-10 py-12 text-center shadow-[0_0_80px_-12px_rgba(200,255,77,0.5)]"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="grid h-20 w-20 place-items-center rounded-3xl bg-lime text-[44px] shadow-[0_0_60px_-8px_rgba(200,255,77,0.9)]"
            >
              <Zap className="h-10 w-10 text-ink" strokeWidth={3} />
            </motion.div>
            <p className="font-display text-xl font-extrabold tracking-[0.3em] text-lime text-glow-lime">LEVEL UP!</p>
            <p className="text-3xl font-extrabold text-white">
              {data.emoji} {data.name.toUpperCase()}
            </p>
            <p className="font-mono text-lg font-bold text-mist">
              LEVEL {data.before} <span className="mx-2 text-lime">→</span> LEVEL {data.after}
            </p>
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-mist">
              <Sparkles className="h-3.5 w-3.5 text-violet" /> THE GRIND PAYS OFF
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PerfectDayHost() {
  const [data, setData] = useState<PerfectData | null>(null);

  const show = useCallback((d: PerfectData) => {
    playPerfectDay();
    fireBigConfetti();
    setData(d);
    window.setTimeout(() => setData(null), 5500);
  }, []);

  useBus(EVENTS.perfect, (p) => {
    const name = (p?.name as string) ?? "";
    const emoji = (p?.emoji as string) ?? "🔥";
    const xp = (p?.xp as number) ?? 300;
    const streak = (p?.streak as number) ?? 0;
    const day = (p?.day as number) ?? 0;
    if (name) show({ name, emoji, xp, streak, day });
  });

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          key="perfect"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setData(null)}
          className="fixed inset-0 z-[85] grid place-items-center bg-black/80 backdrop-blur-lg"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="relative flex w-[92vw] max-w-sm flex-col items-center gap-5 rounded-[2rem] border border-lime/50 bg-gradient-to-b from-[#1a2410] to-ink px-8 py-12 text-center shadow-[0_0_120px_-10px_rgba(200,255,77,0.55)]"
          >
            <motion.div
              animate={{ rotate: [0, -6, 6, -6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="text-[64px] leading-none drop-shadow-[0_0_30px_rgba(200,255,77,0.8)]"
            >
              🔥
            </motion.div>
            <p className="font-display text-2xl font-extrabold tracking-[0.28em] text-lime text-glow-lime">
              PERFECT DAY
            </p>
            <p className="text-2xl font-extrabold text-white">
              {data.emoji} {data.name.toUpperCase()}
            </p>
            <p className="font-mono text-2xl font-extrabold text-white">
              {data.xp}<span className="text-lime"> / 300 XP</span>
            </p>
            <div className="flex items-center gap-2 text-xl">
              <span>🥗</span>
              <span className="font-bold text-lime">✓</span>
              <span className="mx-2 text-mist">·</span>
              <span>🏃</span>
              <span className="font-bold text-lime">✓</span>
              <span className="mx-2 text-mist">·</span>
              <span>📚</span>
              <span className="font-bold text-lime">✓</span>
            </div>
            <p className="font-mono text-xs font-bold tracking-[0.2em] text-mist">
              DAY {data.day} · STREAK → {data.streak} DAYS
            </p>
            <motion.div
              animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="absolute right-6 top-6 text-2xl"
            >
              ✨
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function fireModalConfetti() {
  confetti({
    particleCount: 120,
    spread: 100,
    startVelocity: 45,
    colors: ["#c8ff4d", "#a78bfa", "#ffffff"],
    origin: { y: 0.4 },
    zIndex: 1500,
  });
}

function fireBigConfetti() {
  const colors = ["#c8ff4d", "#a78bfa", "#fb923c", "#ffffff", "#7dd3fc"];
  confetti({ particleCount: 180, spread: 120, startVelocity: 55, colors, origin: { y: 0.4 }, zIndex: 1500 });
  window.setTimeout(() => confetti({ particleCount: 100, angle: 60, spread: 75, colors, origin: { x: 0 } }), 200);
  window.setTimeout(() => confetti({ particleCount: 100, angle: 120, spread: 75, colors, origin: { x: 1 } }), 380);
  window.setTimeout(() => confetti({ particleCount: 130, spread: 150, scalar: 1.1, colors, origin: { y: 0.25 } }), 600);
}