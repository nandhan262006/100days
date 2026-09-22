"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Glass } from "@/components/glass";
import { CHALLENGE, DAY_MS, dateForDayNumber, formatDayDate } from "@/lib/engine";
import { cn } from "@/lib/cn";

export type CalendarDay = {
  dayNumber: number;
  dateISO: string;
  junk: boolean;
  move: boolean;
  study: boolean;
  xp: number;
  isPerfect: boolean;
  isMissed: boolean;
  exerciseType: string | null;
  exerciseMin: number | null;
  steps: number | null;
  subject: string | null;
  studyMin: number | null;
  learned: string | null;
};

export type CalendarUser = {
  slug: string;
  name: string;
  emoji: string;
  accent: string;
  days: CalendarDay[];
};

type Level = "future" | "pending" | "missed" | 1 | 2 | 3;

function levelFor(rec: CalendarDay | undefined, day: number, currentDay: number): Level {
  if (day > currentDay) return "future";
  if (!rec) return day === currentDay ? "pending" : "missed";
  if (rec.xp >= 300) return 3;
  if (rec.xp >= 200) return 2;
  if (rec.xp >= 100) return 1;
  return "missed";
}

const LEVEL_STYLE: Record<Level, string> = {
  future: "bg-white/[0.03]",
  pending: "bg-white/[0.06]",
  missed: "bg-red-500/20",
  1: "bg-lime/25",
  2: "bg-lime/50",
  3: "bg-lime shadow-[0_0_10px_rgba(200,255,77,0.5)]",
};

const WEEKDAY_LABELS = ["", "MON", "", "WED", "", "FRI", ""];

type WeekColumn = {
  cells: (number | null)[]; // 7 entries, Sunday..Saturday
  monthLabel: string | null;
};

function buildWeekColumns(): WeekColumn[] {
  const startTs = dateForDayNumber(1).getTime(); // Sep 23 2026 (Wednesday)
  const startDow = new Date(startTs).getUTCDay();
  const gridStart = startTs - startDow * DAY_MS; // Sunday before day 1
  const weeks: WeekColumn[] = [];
  let prevMonth = "";
  const totalWeeks = Math.ceil((startDow + CHALLENGE.days) / 7);
  for (let w = 0; w < totalWeeks; w++) {
    const cells: (number | null)[] = [];
    let monthLabel: string | null = null;
    for (let r = 0; r < 7; r++) {
      const ts = gridStart + (w * 7 + r) * DAY_MS;
      const n = Math.round((ts - startTs) / DAY_MS) + 1;
      if (n >= 1 && n <= CHALLENGE.days) {
        cells.push(n);
        const m = new Date(ts).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
        if (prevMonth !== m) {
          monthLabel = m;
          prevMonth = m;
        }
      } else {
        cells.push(null);
      }
    }
    weeks.push({ cells, monthLabel });
  }
  return weeks;
}

export function CalendarClient({
  users,
  currentDay,
  activeSlug,
}: {
  users: CalendarUser[];
  currentDay: number;
  activeSlug: string;
}) {
  const [slug, setSlug] = useState(activeSlug);
  const [selected, setSelected] = useState<number | null>(null);
  const weeks = useMemo(() => buildWeekColumns(), []);
  const user = users.find((u) => u.slug === slug) ?? users[0];
  const byDay = useMemo(() => new Map(user.days.map((d) => [d.dayNumber, d])), [user]);
  const selectedRec = selected != null ? byDay.get(selected) : undefined;

  const counts = useMemo(() => {
    let perfect = 0;
    let partial = 0;
    let missed = 0;
    for (let d = 1; d <= currentDay; d++) {
      const lv = levelFor(byDay.get(d), d, currentDay);
      if (lv === 3) perfect++;
      else if (lv === 1 || lv === 2) partial++;
      else if (lv === "missed") missed++;
    }
    return { perfect, partial, missed };
  }, [byDay, currentDay]);

  return (
    <div className="space-y-5 sm:space-y-7">
      <div>
        <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-lime">📅 ACTIVITY CALENDAR</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          100 DAYS, <span className="gradient-text">ONE HEATMAP</span>
        </h1>
        <p className="mt-1.5 font-mono text-[10px] font-bold tracking-[0.26em] text-mist">
          DAY {currentDay} / 100 · GITHUB-STYLE · CLICK ANY SQUARE FOR DETAILS
        </p>
      </div>

      {/* User tabs */}
      <div className="flex flex-wrap gap-2">
        {users.map((u) => (
          <button
            key={u.slug}
            onClick={() => {
              setSlug(u.slug);
              setSelected(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold transition-all",
              u.slug === slug
                ? "border-lime/40 bg-lime/[0.1] text-white"
                : "border-white/10 bg-white/[0.03] text-mist hover:text-frost",
            )}
          >
            <span className="text-base">{u.emoji}</span> {u.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Heatmap */}
      <Glass className="p-4 sm:p-6">
        <div className="overflow-x-auto pb-1">
          <div className="min-w-max">
            {/* Month labels */}
            <div className="mb-1.5 flex items-end gap-[3px]">
              <span className="w-8 shrink-0" />
              {weeks.map((w, i) => (
                <div key={`m-${i}`} className="w-3.5 shrink-0 sm:w-4">
                  {w.monthLabel && (
                    <span className="whitespace-nowrap font-mono text-[9px] font-bold tracking-widest text-mist">
                      {w.monthLabel}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Rows: Sun..Sat */}
            {WEEKDAY_LABELS.map((label, r) => (
              <div key={`r-${r}`} className="flex items-center gap-[3px]">
                <span className="w-8 shrink-0 font-mono text-[8px] font-bold tracking-widest text-mist/70">
                  {label}
                </span>
                {weeks.map((w, i) => {
                  const day = w.cells[r];
                  if (day == null) {
                    return <span key={`c-${i}-${r}`} className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />;
                  }
                  const rec = byDay.get(day);
                  const lv = levelFor(rec, day, currentDay);
                  const isToday = day === currentDay;
                  const isSel = selected === day;
                  return (
                    <button
                      key={`c-${i}-${r}`}
                      title={`Day ${day} · ${formatDayDate(dateForDayNumber(day))}${rec ? ` · ${rec.xp} XP${rec.isPerfect ? " · PERFECT" : ""}` : isToday ? " · today" : ""}`}
                      onClick={() => setSelected(day)}
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 rounded-[4px] transition-transform hover:scale-125 sm:h-4 sm:w-4",
                        LEVEL_STYLE[lv],
                        isToday && "ring-2 ring-white/70",
                        isSel && "ring-2 ring-violet scale-125",
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-3.5">
          <span className="font-mono text-[10px] font-bold tracking-widest text-mist">LESS</span>
          <span className="flex items-center gap-1">
            {["bg-white/[0.05]", "bg-lime/25", "bg-lime/50", "bg-lime"].map((c) => (
              <span key={c} className={cn("h-3 w-3 rounded-[4px]", c)} />
            ))}
          </span>
          <span className="font-mono text-[10px] font-bold tracking-widest text-mist">MORE</span>
          <span className="flex items-center gap-4 font-mono text-[10px] font-bold tracking-widest text-mist">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[4px] bg-red-500/20" /> MISSED · {counts.missed}
            </span>
            <span>👑 PERFECT · {counts.perfect}</span>
            <span>⚡ PARTIAL · {counts.partial}</span>
            <span>{100 - currentDay} TO GO</span>
          </span>
        </div>
      </Glass>

      {/* Day details modal */}
      <AnimatePresence>
        {selected != null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/70 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-[min(92vw,440px)] p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10px] font-bold tracking-[0.24em] text-mist">
                    {user.emoji} {user.name.toUpperCase()} · {formatDayDate(dateForDayNumber(selected)).toUpperCase()}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-extrabold text-white">
                    DAY {selected}
                    <span className="ml-2 text-sm text-mist">/ 100</span>
                  </h3>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-mist hover:bg-white/[0.06] hover:text-frost" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!selectedRec || selected > currentDay ? (
                <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-mist">
                  {selected > currentDay ? "This day hasn't arrived yet. Stay ready." : "No record for this day."}
                </p>
              ) : (
                <div className="space-y-3">
                  <div className={cn("rounded-xl border px-4 py-3 text-center font-display text-2xl font-extrabold", selectedRec.isPerfect ? "border-lime/40 bg-lime/10 text-lime" : "border-white/10 bg-white/[0.04] text-white")}>
                    {selectedRec.xp} <span className="text-sm text-mist">/ 300 XP</span>
                    <span className="ml-2 text-sm">{selectedRec.isPerfect ? "👑 PERFECT" : selectedRec.isMissed ? "MISSED" : "PARTIAL"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <MissionMini emoji="🥗" done={selectedRec.junk} label="FUEL" />
                    <MissionMini emoji="🏃" done={selectedRec.move} label="MOVE" />
                    <MissionMini emoji="📚" done={selectedRec.study} label="STUDY" />
                  </div>
                  {(selectedRec.exerciseMin || selectedRec.steps || selectedRec.studyMin || selectedRec.learned) && (
                    <div className="space-y-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-xs leading-relaxed text-mist">
                      {(selectedRec.exerciseMin || selectedRec.steps) && (
                        <p>🏃 {selectedRec.exerciseType ?? "Exercise"}{selectedRec.exerciseMin ? ` · ${selectedRec.exerciseMin} min` : ""}{selectedRec.steps ? ` · ${selectedRec.steps.toLocaleString()} steps` : ""}</p>
                      )}
                      {selectedRec.studyMin && <p>📚 {selectedRec.subject ?? "Study"} · {selectedRec.studyMin} min</p>}
                      {selectedRec.learned && <p className="text-frost/80">💡 {selectedRec.learned}</p>}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                {selected > 1 && (
                  <button onClick={() => setSelected(selected - 1)} className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-extrabold tracking-widest text-frost hover:bg-white/[0.08]">
                    ← PREV
                  </button>
                )}
                {selected < 100 && (
                  <button onClick={() => setSelected(selected + 1)} className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-extrabold tracking-widest text-frost hover:bg-white/[0.08]">
                    NEXT →
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MissionMini({ emoji, done, label }: { emoji: string; done: boolean; label: string }) {
  return (
    <div className={cn("rounded-xl border px-2 py-2.5", done ? "border-lime/30 bg-lime/[0.08]" : "border-white/[0.08] bg-white/[0.02]")}>
      <p className="text-lg">{emoji}</p>
      <p className={cn("font-mono text-[11px] font-extrabold", done ? "text-lime" : "text-mist")}>{done ? "✓" : "✕"}</p>
      <p className="font-mono text-[9px] font-bold tracking-widest text-mist">{label}</p>
    </div>
  );
}
