"use client";

import { useEffect, useRef } from "react";

/** Lightweight global event bus for celebration coordination between client components. */
function createBus() {
  const listeners = new Map<string, Set<Callback>>();
  type Payload = Record<string, unknown> | undefined;
  type Callback = (p: Payload) => void;
  return {
    on(event: string, cb: Callback) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
      return () => {
        listeners.get(event)?.delete(cb);
      };
    },
    emit(event: string, payload?: Payload) {
      listeners.get(event)?.forEach((cb) => cb(payload));
    },
  };
}

export { createBus };

export const bus = createBus();

/** Consume the bus within a React component cleanly. */
export function useBus(event: string, cb: (p?: Record<string, unknown>) => void) {
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  });
  useEffect(() => {
    return bus.on(event, (p) => ref.current(p));
  }, [event]);
}

export const EVENTS = {
  xp: "trioxp",
  confetti: "trioconfetti",
  perfect: "trioperfect",
  levelUp: "triolevelup",
  achievement: "trioachievement",
  rankChange: "triorank",
} as const;