"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ShortcutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutDialog({ open, onOpenChange }: ShortcutDialogProps) {
  const shortcuts = [
    { key: "1 – 4 or A – D", action: "Select option" },
    { key: "Enter", action: "Next question" },
    { key: "← / →", action: "Previous / next question" },
    { key: "F", action: "Toggle flag for review" },
    { key: "?", action: "Show keyboard shortcuts" },
    { key: "Esc", action: "Close dialog" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>

        <div className="divide-y divide-line py-2">
          {shortcuts.map(s => (
            <div
              key={s.key}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-ink-soft">{s.action}</span>
              <kbd className="rounded-sm border border-line bg-recess px-2 py-0.5 font-mono text-xs font-semibold text-ink">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
