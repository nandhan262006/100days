import { cn } from "@/lib/cn";

export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/20 via-transparent to-violet/20",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-2xl bg-lime/10 blur-md" aria-hidden="true" />
      <span
        className="relative font-display font-extrabold leading-none text-white"
        style={{ fontSize: size * 0.34 }}
      >
        100
      </span>
      <span
        className="absolute text-lime"
        style={{ fontSize: size * 0.34, top: "-4%", right: "-6%" }}
        aria-hidden="true"
      >
        ⚡
      </span>
    </div>
  );
}