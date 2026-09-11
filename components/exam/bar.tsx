import React from "react";
import { cn } from "@/lib/utils";

export interface BarProps {
  label: string;
  value: number; // 0 to 100
  valueText?: string;
  subValueText?: string;
  variant?: "accent" | "flag" | "wrong";
  className?: string;
}

export function Bar({
  label,
  value,
  valueText,
  subValueText,
  variant = "accent",
  className,
}: BarProps) {
  const pct = Math.max(0, Math.min(100, value));

  const variantFills = {
    accent: "bg-accent",
    flag: "bg-flag",
    wrong: "bg-wrong",
  };

  return (
    <div className={cn("w-full space-y-1.5 py-1", className)}>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-sans font-medium text-ink truncate pr-2">
          {label}
        </span>
        <div className="flex items-baseline gap-2 shrink-0 font-mono text-xs tabular-nums text-ink-soft">
          {subValueText && <span>{subValueText}</span>}
          <strong className="text-ink font-semibold">{valueText || `${pct}%`}</strong>
        </div>
      </div>
      <div className="h-4 w-full bg-recess rounded-none overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={cn("h-full transition-[width] duration-200 ease-out", variantFills[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
