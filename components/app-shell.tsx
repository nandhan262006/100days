"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Trophy,
  Swords,
  CalendarDays,
  Route,
  Medal,
  Crown,
  LayoutDashboard,
  Volume2,
  VolumeX,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Logo } from "./logo";
import { AnimatedNumber } from "./animated-number";
import { ConfettiLayer } from "./confetti";
import { EVENTS, useBus } from "./bus";
import { setSoundEnabled, playClick, playAchievement } from "@/lib/sfx";
import { toggleSound, setActiveUser, clearActiveUser } from "@/app/actions";
import { cn } from "@/lib/cn";
import type { UserProfile } from "@/lib/data";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/battle", label: "Battle", icon: Swords },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/journey", label: "Journey", icon: Route },
  { href: "/achievements", label: "Achievements", icon: Medal },
];

export function AppShell({
  activeUser,
  users,
  soundOn,
  initialXp,
  children,
}: {
  activeUser: UserProfile;
  users: UserProfile[];
  soundOn: boolean;
  initialXp: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [xp, setXp] = useState(initialXp);
  const [sound, setSound] = useState(soundOn);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [switchPw, setSwitchPw] = useState("");
  const [switchErr, setSwitchErr] = useState(false);

  // Initialize the sfx module from the persisted preference on mount.
  useEffect(() => {
    setSoundEnabled(soundOn);
  }, [soundOn]);

  useBus(EVENTS.xp, (p) => {
    const total = p?.total as number | undefined;
    if (typeof total === "number") setXp(total);
  });

  const onToggleSound = useCallback(async () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    if (next) playClick();
    await toggleSound();
  }, [sound]);

  const pickUser = useCallback(async (slug: string) => {
    if (slug === activeUser.slug) {
      setPickerOpen(false);
      return;
    }
    playClick();
    setPendingSlug(slug);
    setSwitchPw("");
    setSwitchErr(false);
  }, [activeUser.slug]);

  const confirmSwitch = useCallback(async () => {
    if (!pendingSlug) return;
    const ok = await setActiveUser(pendingSlug, switchPw);
    if (ok) {
      setPendingSlug(null);
      setSwitchPw("");
      setSwitchErr(false);
      setPickerOpen(false);
    } else {
      setSwitchErr(true);
    }
  }, [pendingSlug, switchPw]);

  const logout = useCallback(async () => {
    setPickerOpen(false);
    await clearActiveUser();
  }, []);

  const personalHref = `/person/${activeUser.slug}`;

  return (
    <div className="min-h-dvh text-frost">
      <div className="challenge-bg" aria-hidden="true" />
      <div className="challenge-grid" aria-hidden="true" />
      <ConfettiLayer />
      <ToastHost />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.07] bg-ink/70 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <Logo size={42} />
          <div className="leading-tight">
            <Link href="/" className="block font-display text-[13px] font-extrabold tracking-wide text-white">
              100-DAY TRIO
            </Link>
            <span className="text-[10px] font-bold tracking-[0.18em] text-lime">ZERO EXCUSES</span>
          </div>
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                    : "text-mist hover:bg-white/[0.05] hover:text-frost",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active && "text-lime")} />
                {item.label}
                {active && (
                  <motion.span layoutId="nav-pill" className="ml-auto h-1.5 w-1.5 rounded-full bg-lime" />
                )}
              </Link>
            );
          })}

          <Link
            href={personalHref}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
              pathname.startsWith("/person")
                ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                : "text-mist hover:bg-white/[0.05] hover:text-frost",
            )}
          >
            <Crown className={cn("h-[18px] w-[18px]", pathname.startsWith("/person") && "text-violet")} />
            MY PROFILE
          </Link>

          <Link
            href="/finale"
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
              pathname === "/finale"
                ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                : "text-mist hover:bg-white/[0.05] hover:text-frost",
            )}
          >
            <Crown className={cn("h-[18px] w-[18px]", pathname === "/finale" && "text-orange")} />
            GRAND FINALE
          </Link>
        </nav>

        {/* User card + sound */}
        <div className="border-t border-white/[0.07] p-3">
          <button
            onClick={onToggleSound}
            className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-mist transition-colors hover:bg-white/[0.05] hover:text-frost"
          >
            {sound ? <Volume2 className="h-4 w-4 text-lime" /> : <VolumeX className="h-4 w-4" />}
            SOUND {sound ? "ON" : "OFF"}
          </button>
          <div className="relative">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.07]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-lg">
                {activeUser.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-white">{activeUser.name}</span>
                <span className="text-[10px] font-semibold tracking-widest text-mist">
                  ⚡ <AnimatedNumber value={xp} format={(n) => Math.round(n).toLocaleString("en-US")} /> XP
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-mist" />
            </button>
            <AnimatePresence>
              {pickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-white/10 bg-card-2 p-1.5 shadow-2xl"
                >
                  {users.map((u) => (
                    <button
                      key={u.slug}
                      onClick={() => pickUser(u.slug)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors",
                        u.slug === activeUser.slug ? "bg-lime/15 text-lime" : "text-frost hover:bg-white/[0.06]",
                      )}
                    >
                      <span className="text-base">{u.emoji}</span>
                      {u.name}
                      {u.slug === activeUser.slug && <span className="ml-auto text-[10px]">ACTIVE</span>}
                    </button>
                  ))}
                  {pendingSlug && (
                    <SwitchPasswordForm
                      slug={pendingSlug}
                      users={users}
                      value={switchPw}
                      error={switchErr}
                      onChange={(v) => {
                        setSwitchPw(v);
                        setSwitchErr(false);
                      }}
                      onSubmit={confirmSwitch}
                      onCancel={() => {
                        setPendingSlug(null);
                        setSwitchErr(false);
                      }}
                    />
                  )}
                  <button
                    onClick={logout}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-white/10 px-2.5 py-2 text-left text-sm font-semibold text-mist hover:text-frost"
                  >
                    <LogOut className="h-4 w-4" /> Switch identity
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/[0.07] bg-ink/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo size={36} />
        <div className="flex-1 leading-tight">
          <p className="font-display text-[12px] font-extrabold tracking-wide text-white">100-DAY TRIO</p>
          <p className="text-[10px] font-bold tracking-[0.2em] text-lime">ZERO EXCUSES</p>
        </div>
        <span className="rounded-full border border-lime/25 bg-lime/10 px-2.5 py-1 font-mono text-[11px] font-bold text-lime">
          ⚡ <AnimatedNumber value={xp} />
        </span>
        <button
          onClick={onToggleSound}
          className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-mist"
          aria-label="Toggle sound"
        >
          {sound ? <Volume2 className="h-4 w-4 text-lime" /> : <VolumeX className="h-4 w-4" />}
        </button>
        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-base"
            aria-label="Switch user"
          >
            {activeUser.emoji}
          </button>
          <AnimatePresence>
            {pickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-card-2 p-1.5 shadow-2xl"
              >
                {users.map((u) => (
                  <button
                    key={u.slug}
                    onClick={() => pickUser(u.slug)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors",
                      u.slug === activeUser.slug ? "bg-lime/15 text-lime" : "text-frost hover:bg-white/[0.06]",
                    )}
                  >
                    <span className="text-base">{u.emoji}</span>
                    {u.name}
                  </button>
                ))}
                {pendingSlug && (
                  <SwitchPasswordForm
                    slug={pendingSlug}
                    users={users}
                    value={switchPw}
                    error={switchErr}
                    onChange={(v) => {
                      setSwitchPw(v);
                      setSwitchErr(false);
                    }}
                    onSubmit={confirmSwitch}
                    onCancel={() => {
                      setPendingSlug(null);
                      setSwitchErr(false);
                    }}
                  />
                )}
                <button
                  onClick={logout}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-white/10 px-2.5 py-2 text-left text-sm font-semibold text-mist"
                >
                  <LogOut className="h-4 w-4" /> Switch identity
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:pb-16 lg:pl-12 lg:pr-12 lg:pt-8 lg:max-w-[calc(100vw-16rem)]">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-6">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 py-2.5"
              >
                <Icon className={cn("h-5 w-5", active ? "text-lime" : "text-mist")} />
                <span className={cn("text-[9px] font-bold tracking-wide", active ? "text-frost" : "text-mist/80")}>
                  {item.label}
                </span>
                {active && <motion.span layoutId="mobile-pill" className="absolute top-0 h-0.5 w-8 rounded-full bg-lime" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

type Toast = {
  id: number;
  kind: "achievement" | "rank";
  emoji: string;
  title: string;
  body: string;
};

function SwitchPasswordForm({
  slug,
  users,
  value,
  error,
  onChange,
  onSubmit,
  onCancel,
}: {
  slug: string;
  users: UserProfile[];
  value: string;
  error: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const who = users.find((u) => u.slug === slug);
  return (
    <div className="rounded-lg border border-lime/25 bg-lime/[0.06] p-2.5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <p className="mb-1.5 text-[11px] font-bold tracking-wider text-frost">
          {who?.emoji} PASSWORD FOR {who?.name.toUpperCase()}
        </p>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className={cn(
            "w-full rounded-lg border bg-white/[0.06] px-2.5 py-1.5 text-base text-frost outline-none placeholder:text-mist/60 sm:text-sm",
            error ? "border-red-500/50" : "border-white/12 focus:border-lime/50",
          )}
        />
        {error && <p className="mt-1 text-[10px] font-bold tracking-wider text-red-400">✕ WRONG PASSWORD</p>}
        <div className="mt-2 flex gap-1.5">
          <button type="submit" className="btn-lime flex-1 rounded-lg px-2 py-1.5 text-[10px] font-extrabold tracking-wider">
            UNLOCK
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-extrabold text-mist hover:bg-white/[0.08]"
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
}

function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((t: Omit<Toast, "id">) => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((list) => [...list.slice(-2), { ...t, id }]);
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 4200);
  }, []);

  useBus(EVENTS.achievement, (p) => {
    const emoji = (p?.emoji as string) ?? "🏅";
    const title = (p?.title as string) ?? "ACHIEVEMENT";
    playAchievement();
    push({ kind: "achievement", emoji, title, body: "ACHIEVEMENT UNLOCKED" });
  });

  useBus(EVENTS.rankChange, (p) => {
    const before = p?.before as number;
    const after = p?.after as number;
    if (before > after) {
      push({ kind: "rank", emoji: "⚡", title: "MOVED UP!", body: `#${before} → #${after}` });
    } else if (after > before) {
      push({ kind: "rank", emoji: "🛡️", title: "LOST A SPOT", body: `#${before} → #${after}` });
    }
  });

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-[min(90vw,340px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-2xl border p-3 shadow-2xl backdrop-blur-xl",
              t.kind === "achievement" ? "border-lime/30 bg-card-2/95" : "border-violet/30 bg-card-2/95",
            )}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-2xl">
              {t.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-sm font-extrabold tracking-wide text-white">
                {t.title}
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-lime">{t.body}</span>
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}