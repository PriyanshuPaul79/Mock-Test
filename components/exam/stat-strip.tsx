import React from "react";
import { cn } from "@/lib/utils";

export interface StatItem {
  label: string;
  value: React.ReactNode;
}

export interface StatStripProps {
  stats: StatItem[];
  className?: string;
}

export function StatStrip({ stats, className }: StatStripProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap divide-x divide-line border-y border-line my-6",
        className
      )}
    >
      {stats.map((s, idx) => (
        <div
          key={s.label}
          className={cn(
            "px-6 py-4",
            idx === 0 ? "pl-0" : ""
          )}
        >
          <div className="font-mono text-2xl tabular-nums font-medium text-ink">
            {s.value}
          </div>
          <div className="mt-0.5 text-[13px] font-semibold uppercase tracking-wide text-ink-soft">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
