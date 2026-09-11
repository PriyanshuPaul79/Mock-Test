"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

export interface TimerProps {
  startedAt: string;
  durationMinutes: number;
  onTimeUp?: () => void;
  className?: string;
}

export function Timer({
  startedAt,
  durationMinutes,
  onTimeUp,
  className,
}: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const elapsedSec = Math.floor((now - start) / 1000);
    const totalSec = durationMinutes * 60;
    return Math.max(0, totalSec - elapsedSec);
  });

  const [announced5Min, setAnnounced5Min] = useState(false);
  const [announced1Min, setAnnounced1Min] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const onTimeUpCalled = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const elapsedSec = Math.floor((now - start) / 1000);
      const totalSec = durationMinutes * 60;
      const remaining = Math.max(0, totalSec - elapsedSec);

      setSecondsLeft(remaining);

      // Aria alerts for 5m and 1m milestones
      if (remaining <= 300 && remaining > 298 && !announced5Min) {
        setAnnounced5Min(true);
        setAnnouncement("5 minutes remaining");
      }
      if (remaining <= 60 && remaining > 58 && !announced1Min) {
        setAnnounced1Min(true);
        setAnnouncement("1 minute remaining");
      }

      if (remaining === 0 && !onTimeUpCalled.current) {
        onTimeUpCalled.current = true;
        clearInterval(interval);
        if (onTimeUp) onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, onTimeUp, announced5Min, announced1Min]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const isCritical = secondsLeft <= 60;
  const isWarning = secondsLeft <= 300 && !isCritical;

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "font-mono text-lg font-medium tabular-nums tracking-tight",
          isWarning && "text-wrong font-semibold",
          isCritical && "text-wrong font-bold motion-reduce:animate-none animate-[pulse_1.5s_ease-in-out_infinite]",
          !isWarning && !isCritical && "text-ink",
          className
        )}
        aria-label={`Time remaining: ${mins} minutes ${secs} seconds`}
      >
        ⏱ {formatted}
      </span>
      {/* Screen reader live notification */}
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
