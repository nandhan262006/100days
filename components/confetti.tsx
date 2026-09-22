"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { bus, EVENTS } from "./bus";

const COLORS = ["#c8ff4d", "#a78bfa", "#fb923c", "#ffffff", "#7dd3fc"];

export function ConfettiLayer() {
  useEffect(() => {
    const off = bus.on(EVENTS.confetti, (p?: Record<string, unknown>) => {
      const big = (p?.big as boolean | undefined) ?? false;
      if (big) fireBig();
      else fire();
    });
    return off;
  }, []);

  return null;
}

function fire() {
  confetti({
    particleCount: 70,
    spread: 75,
    startVelocity: 42,
    scalar: 0.9,
    ticks: 130,
    gravity: 0.9,
    colors: COLORS,
    origin: { y: 0.35 },
    zIndex: 1200,
  });
}

function fireBig() {
  const opts = { zIndex: 1200 } as const;
  confetti({ ...opts, particleCount: 160, spread: 110, startVelocity: 55, colors: COLORS, origin: { y: 0.4 } });
  window.setTimeout(() => confetti({ ...opts, particleCount: 90, angle: 60, spread: 70, origin: { x: 0 } }), 180);
  window.setTimeout(() => confetti({ ...opts, particleCount: 90, angle: 120, spread: 70, origin: { x: 1 } }), 320);
  window.setTimeout(() => confetti({ ...opts, particleCount: 120, spread: 140, scalar: 1.1, origin: { y: 0.3 } }), 520);
}