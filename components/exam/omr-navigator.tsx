"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { UserAnswer, Question } from "@/lib/schema";

export interface OmrNavigatorProps {
  questions: Question[];
  answers: Record<string, UserAnswer>;
  currentIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

export function OmrNavigator({
  questions,
  answers,
  currentIndex,
  onSelect,
  className,
}: OmrNavigatorProps) {
  let answeredCount = 0;
  let flaggedCount = 0;
  let blankCount = 0;

  questions.forEach(q => {
    const a = answers[q.id];
    const isAnswered = a && a.selected && a.selected.length > 0;
    const isFlagged = a && a.flagged;
    if (isAnswered) answeredCount++;
    else blankCount++;
    if (isFlagged) flaggedCount++;
  });

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between border-b border-line pb-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-soft">
          QUESTIONS ({questions.length})
        </span>
      </div>

      {/* 6-col OMR Grid */}
      <div className="grid grid-cols-6 gap-1.5" role="navigation" aria-label="Question Navigator">
        {questions.map((q, idx) => {
          const a = answers[q.id];
          const isAnswered = a && a.selected && a.selected.length > 0;
          const isFlagged = a && a.flagged;
          const isCurrent = idx === currentIndex;
          const qNum = String(idx + 1).padStart(2, "0");

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelect(idx)}
              aria-label={`Question ${idx + 1}${isAnswered ? ", answered" : ""}${isFlagged ? ", flagged" : ""}`}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-sm font-mono text-[13px] tabular-nums transition-colors duration-150 outline-offset-1 focus-visible:outline-2 focus-visible:outline-ink",
                isAnswered
                  ? "bg-accent text-white font-medium"
                  : "border border-line bg-surface text-ink-soft hover:border-line-strong",
                isCurrent && "outline outline-2 outline-offset-1 outline-ink"
              )}
            >
              {qNum}
              {isFlagged && (
                <span
                  className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-flag"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Stats and Legend */}
      <div className="border-t border-line pt-3 space-y-2 text-xs">
        <div className="font-mono text-ink-soft tabular-nums">
          <strong className="text-ink font-semibold">{answeredCount}</strong> answered ·{" "}
          <strong className="text-ink font-semibold">{flaggedCount}</strong> flagged ·{" "}
          <strong className="text-ink font-semibold">{blankCount}</strong> blank
        </div>

        <div className="flex items-center gap-3 text-[11px] text-ink-soft pt-1">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-accent inline-block" /> Answered
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-flag inline-block" /> Flagged
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm border border-line bg-surface inline-block" /> Blank
          </span>
        </div>
      </div>
    </div>
  );
}
