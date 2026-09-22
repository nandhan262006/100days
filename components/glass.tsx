import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Glass({
  className,
  children,
  hover,
  glow,
  onClick,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean; glow?: "lime" | "violet" | "orange" }) {
  return (
    <div
      className={cn("glass", hover && "glass-hover", glow && `glow-${glow}`, className)}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Chip({
  className,
  children,
  tone = "neutral",
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "neutral" | "lime" | "violet" | "orange" | "red";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-white/[0.06] text-mist border-white/10",
    lime: "bg-lime-soft text-lime border-lime/25",
    violet: "bg-violet-soft text-violet border-violet/25",
    orange: "bg-orange-soft text-orange border-orange/25",
    red: "bg-red-500/10 text-red-400 border-red-500/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}