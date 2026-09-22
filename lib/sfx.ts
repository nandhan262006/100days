let ctx: AudioContext | null = null;
let enabled = false;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function isSoundEnabled() {
  return enabled;
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function blip(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.06) {
  const c = ensureCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export function playMissionDone() {
  blip(660, 0, 0.14, "sine", 0.08);
  blip(880, 0.09, 0.18, "sine", 0.07);
}

export function playPerfectDay() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => blip(n, i * 0.12, 0.24, "sine", 0.07));
  blip(1318.5, notes.length * 0.12, 0.4, "triangle", 0.06);
}

export function playLevelUp() {
  const notes = [392, 523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => blip(n, i * 0.09, 0.22, "triangle", 0.07));
  blip(1567.98, notes.length * 0.09, 0.5, "sine", 0.05);
}

export function playAchievement() {
  blip(740, 0, 0.12, "triangle", 0.06);
  blip(987.77, 0.11, 0.28, "triangle", 0.06);
}

export function playClick() {
  blip(320, 0, 0.06, "sine", 0.03);
}