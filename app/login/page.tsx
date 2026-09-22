import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getUsersForPicker } from "@/lib/data";
import { getActiveProfile } from "@/lib/session";
import { loginUser } from "../login-actions";
import { LoginError } from "./login-error";

export const metadata = { title: "Choose your fighter — The 100-Day Trio" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const existing = await getActiveProfile();
  if (existing) redirect("/");

  const { error } = await searchParams;
  const users = await getUsersForPicker();

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="challenge-bg" aria-hidden="true" />
      <div className="challenge-grid" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo size={64} />
          <h1 className="mt-6 font-display text-3xl font-extrabold tracking-[0.18em] text-white text-glow-white sm:text-4xl">
            THE 100-DAY
            <span className="mt-1 block gradient-text">TRIO CHALLENGE</span>
          </h1>
          <p className="mt-3 font-mono text-xs font-bold tracking-[0.35em] text-mist">
            100 DAYS · 3 PEOPLE · ZERO EXCUSES
          </p>
        </div>

        <div className="glass p-6 sm:p-8">
          {error && (
            <div className="mb-4">
              <LoginError />
            </div>
          )}
          <p className="mb-5 text-center text-sm font-semibold tracking-[0.2em] text-mist">CHOOSE YOUR FIGHTER</p>
          <div className="mb-4 flex flex-col gap-3">
            {users.length === 0 && (
              <p className="rounded-xl border border-orange/25 bg-orange/10 p-4 text-center text-sm font-semibold text-orange">
                No participants yet. Run <code className="font-mono">npm run db:seed</code> to create the trio.
              </p>
            )}
            {users.map((u, i) => (
              <details key={u.slug} className="group rounded-2xl border border-white/10 bg-white/[0.04] transition-all hover:border-lime/40 open:border-lime/40">
                <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-2xl transition-shadow group-open:shadow-[0_0_24px_-4px_rgba(200,255,77,0.5)]">
                    {u.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-extrabold tracking-wide text-white">
                      {u.name.toUpperCase()}
                    </span>
                    <span className="font-mono text-[11px] font-bold tracking-[0.25em] text-mist">
                      {["#1 PACE SETTER", "#2 CONVICTION", "#3 HEART"][i] ?? "MEMBER"}
                    </span>
                  </span>
                  <span className="font-mono text-lg font-bold text-lime transition-transform group-open:rotate-90">
                    →
                  </span>
                </summary>
                <form action={loginUser} className="border-t border-white/[0.07] p-4 pt-3">
                  <input type="hidden" name="slug" value={u.slug} />
                  <label className="mb-2 block font-mono text-[10px] font-bold tracking-[0.24em] text-mist">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/12 bg-white/[0.055] px-3.5 py-2.5 text-sm font-medium text-frost outline-none transition-colors placeholder:text-mist/60 focus:border-lime/50 focus:bg-white/[0.08]"
                  />
                  <button
                    type="submit"
                    className="btn-lime mt-3 w-full rounded-xl px-4 py-2.5 text-xs font-extrabold tracking-wider"
                  >
                    UNLOCK · START THE DAY →
                  </button>
                </form>
              </details>
            ))}
          </div>
          <p className="text-center font-mono text-[11px] tracking-widest text-mist/70">
            LEKHANA × AKSHAYA × NANDHAN
          </p>
        </div>

        <p className="mt-8 text-center font-mono text-[11px] font-bold tracking-[0.3em] text-mist/60">
          SEP 22 — DEC 30, 2026 · FINALE DEC 31
        </p>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-mist/50">
          A private game for the trio. Pick your name, enter your password.
          <br />
          <Link href="/finale" className="text-violet underline-offset-2 hover:underline">
            Sneak a peek at the Grand Finale →
          </Link>
        </p>
      </div>
    </div>
  );
}
