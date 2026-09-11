"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OptionRowProps {
  letter: string;
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  correct?: boolean;
  wrong?: boolean;
  isMulti?: boolean;
}

export function OptionRow({
  letter,
  selected,
  onClick,
  children,
  disabled = false,
  correct,
  wrong,
  isMulti = false,
}: OptionRowProps) {
  return (
    <button
      type="button"
      role={isMulti ? "checkbox" : "radio"}
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-baseline gap-3 rounded-sm border px-4 py-3 text-left font-sans text-base transition-colors duration-150 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ink disabled:pointer-events-none",
        selected
          ? "border-ink bg-accent-soft text-ink"
          : "border-line bg-surface text-ink hover:border-line-strong",
        correct && "border-correct bg-correct-soft",
        wrong && !correct && "border-wrong bg-wrong-soft",
        disabled && "cursor-default"
      )}
    >
      <span className="font-mono text-sm font-medium text-ink-soft shrink-0">
        ({letter})
      </span>
      <span className="flex-1 text-ink leading-relaxed">{children}</span>
      {correct && (
        <Check size={16} strokeWidth={2} className="ml-auto text-correct shrink-0 self-center" />
      )}
      {wrong && !correct && (
        <X size={16} strokeWidth={2} className="ml-auto text-wrong shrink-0 self-center" />
      )}
    </button>
  );
}
