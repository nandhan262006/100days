"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Check, X } from "lucide-react";
import { resetToday, submitMission, type SubmitResult } from "@/app/actions";
import { EVENTS, bus } from "./bus";
import { playMissionDone } from "@/lib/sfx";
import { MISSIONS } from "@/lib/stats";
import { cn } from "@/lib/cn";

type DayState = {
  junk: boolean;
  move: boolean;
  study: boolean;
  xp: number;
  isPerfect: boolean;
};

type Decided = Record<"junk" | "move" | "study", boolean>;

export function MissionGrid({
  initialDay,
  initialDecided,
  user,
  currentDay,
}: {
  initialDay: DayState | null;
  initialDecided?: Decided | null;
  user: { name: string; emoji: string };
  currentDay: number;
}) {
  const [day, setDay] = useState<DayState>(initialDay ?? { junk: false, move: false, study: false, xp: 0, isPerfect: false });
  const decidedInit: Decided = initialDecided ?? {
    junk: initialDay?.junk ?? false,
    move: initialDay?.move ?? false,
    study: initialDay?.study ?? false,
  };
  const decidedRef = useRef<Decided>({ ...decidedInit });
  const [decided, setDecided] = useState<Decided>({ ...decidedInit });

  const celebrate = useCallback(
    (r: SubmitResult, wasSkip: boolean) => {
      if (r.xpDelta > 0) {
        bus.emit(EVENTS.xp, { total: r.totalXpAfter });
        bus.emit(EVENTS.confetti, { big: false });
      }

      if (r.perfectDay && !wasSkip) {
        window.setTimeout(() => {
          bus.emit(EVENTS.perfect, {
            name: user.name,
            emoji: user.emoji,
            xp: 300,
            streak: r.streakAfter,
            day: currentDay,
          });
          bus.emit(EVENTS.confetti, { big: true });
        }, 350);
      }

      if (r.levelAfter > r.levelBefore) {
        window.setTimeout(() => {
          bus.emit(EVENTS.levelUp, { name: user.name, emoji: user.emoji, before: r.levelBefore, after: r.levelAfter });
        }, r.perfectDay ? 2600 : 260);
      }

      if (r.rankBefore > 0 && r.rankAfter !== r.rankBefore) {
        window.setTimeout(() => {
          bus.emit(EVENTS.rankChange, { before: r.rankBefore, after: r.rankAfter });
        }, 700);
      }

      r.newlyUnlocked.forEach((a, i) => {
        window.setTimeout(() => {
          bus.emit(EVENTS.achievement, { emoji: a.emoji, title: a.title });
        }, 1200 + i * 750);
      });
    },
    [user.name, user.emoji, currentDay],
  );

  const decide = useCallback(
    async (mission: "junk" | "move" | "study", action: "complete" | "skip", payload = {}) => {
      if (decidedRef.current[mission]) return null;
      const r = await submitMission(mission, payload, action);
      if (!r.ok) return r;

      if (r.day) {
        setDay(r.day);
        decidedRef.current[mission] = true;
        setDecided({ ...decidedRef.current });
      }
      if (r.ok) {
        // Only play the reward sound + XP celebrations on actual XP gains.
        // Skips (xpDelta 0) must stay silent with no confetti / fly-up.
        if (r.xpDelta > 0) {
          playMissionDone();
        }
        celebrate(r, action === "skip");
      }
      return r;
    },
    [celebrate],
  );

  const [resetting, setResetting] = useState(false);
  const anyDecided = decided.junk || decided.move || decided.study;

  const doReset = useCallback(async () => {
    if (resetting) return;
    if (!window.confirm("Reset today? All missions go back to undecided.")) return;
    setResetting(true);
    const r = await resetToday();
    setResetting(false);
    if (r.ok) {
      decidedRef.current = { junk: false, move: false, study: false };
      setDecided({ ...decidedRef.current });
      setDay({ junk: false, move: false, study: false, xp: 0, isPerfect: false });
      bus.emit(EVENTS.rankChange, { before: 0, after: 0 });
    }
  }, [resetting]);

  const missions = MISSIONS.map((m) => ({
    ...m,
    done: day[m.key],
    decidedKey: decided[m.key],
  }));

  const perfect = day.isPerfect;

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-[0.14em] text-white">TODAY&apos;S MISSIONS</h2>
          <p className="mt-0.5 font-mono text-[11px] font-bold tracking-[0.22em] text-mist">
            DAY {currentDay} · 300 XP AVAILABLE
          </p>
        </div>
        <div className="flex items-center gap-2">
          {anyDecided && (
            <button
              onClick={doReset}
              disabled={resetting}
              title="Reset today's missions"
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs font-bold text-mist transition-colors hover:border-white/25 hover:text-frost disabled:opacity-50"
            >
              <RotateCcw className={cn("h-3.5 w-3.5", resetting && "animate-spin")} strokeWidth={2.5} />
              RESET
            </button>
          )}
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs font-bold text-frost">
            <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse-glow" />
            {day.xp}/300
          </div>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {perfect && (
          <motion.div
            key="perfect-line"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-lime/40 bg-lime/10 px-4 py-2.5 text-sm font-extrabold tracking-widest text-lime text-glow-lime"
          >
            🔥 PERFECT DAY · 300 / 300 XP
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 md:grid-cols-3">
        {missions.map((m, i) => (
          <MissionCard
            key={m.key}
            mission={m}
            index={i}
            onDecide={decide}
          />
        ))}
      </div>
    </div>
  );
}

function MissionCard({
  mission,
  index,
  onDecide,
}: {
  mission: { key: "junk" | "move" | "study"; emoji: string; title: string; tagline: string; xp: number; done: boolean; decidedKey: boolean };
  index: number;
  onDecide: (m: "junk" | "move" | "study", a: "complete" | "skip", p?: Record<string, unknown>) => Promise<SubmitResult | null>;
}) {
  const [pending, setPending] = useState(false);
  const [flyKey, setFlyKey] = useState(0);

  const accents = [
    { ring: "from-lime/25 to-transparent", border: "hover:border-lime/40", glow: "text-lime", btn: "btn-lime" },
    { ring: "from-orange/25 to-transparent", border: "hover:border-orange/40", glow: "text-orange", btn: "bg-gradient-to-r from-orange to-[#ffb26b] text-ink font-extrabold" },
    { ring: "from-violet/25 to-transparent", border: "hover:border-violet/40", glow: "text-violet", btn: "bg-gradient-to-r from-violet to-[#c4b5fd] text-ink font-extrabold" },
  ][index] ?? { ring: "", border: "", glow: "text-white", btn: "btn-lime" };

  const done = mission.done;
  const decidedKey = mission.decidedKey;

  const doSubmit = async (action: "complete" | "skip", payload?: Record<string, unknown>) => {
    if (done || decidedKey || pending) return;
    setPending(true);
    const r = await onDecide(mission.key, action, payload);
    setPending(false);
    if (r?.ok && r.xpDelta > 0) {
      setFlyKey((k) => k + 1);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass relative overflow-hidden p-5",
        done ? "border-lime/30 shadow-[0_0_40px_-12px_rgba(200,255,77,0.35)]" : accents.border + " glass-hover",
      )}
    >
      {/* glow ring */}
      <div className={cn("pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-b opacity-60 blur-2xl", accents.ring)} />

      {/* flying +100 */}
      <AnimatePresence>
        {flyKey > 0 && (
          <motion.div
            key={flyKey}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -90, scale: 1.15 }}
            transition={{ duration: 1.15, times: [0, 0.15, 0.7, 1], ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 font-mono text-2xl font-extrabold text-lime text-glow-lime"
          >
            +100 XP
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <span className="text-4xl transition-transform duration-300 group-hover:scale-110">{mission.emoji}</span>
          {done ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="grid h-9 w-9 place-items-center rounded-full bg-lime text-ink shadow-[0_0_24px_-4px_rgba(200,255,77,0.8)]"
            >
              <Check className="h-5 w-5" strokeWidth={3.5} />
            </motion.span>
          ) : decidedKey ? (
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-mist">
              <X className="h-5 w-5" strokeWidth={3} />
            </span>
          ) : null}
        </div>

        <div>
          <h3 className="font-display text-base font-extrabold tracking-[0.12em] text-white">{mission.title}</h3>
          <p className="mt-0.5 text-xs font-medium text-mist">{mission.tagline}</p>
        </div>

        <div className="mt-auto">
          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-xl border border-lime/30 bg-lime/10 px-3.5 py-2.5"
            >
              <span className="text-xs font-extrabold tracking-widest text-lime">✓ COMPLETED</span>
              <span className="font-mono text-xs font-extrabold text-lime">+100 XP</span>
            </motion.div>
          ) : decidedKey ? (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
              <span className="text-xs font-extrabold tracking-widest text-mist">✕ SKIPPED</span>
              <span className="font-mono text-xs font-bold text-mist">+0 XP</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {mission.key === "junk" || mission.key === "move" || mission.key === "study" ? (
                <>
                  <button
                    onClick={() => doSubmit("complete")}
                    disabled={pending}
                    className="btn-lime flex-1 rounded-xl px-4 py-3 text-xs font-extrabold tracking-wider"
                  >
                    {pending ? "..." : "YES ✓ · +100 XP"}
                  </button>
                  <button
                    onClick={() => doSubmit("skip")}
                    disabled={pending}
                    className="rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-xs font-extrabold text-mist hover:bg-white/[0.08]"
                  >
                    NO ✕
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
