"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flag, HelpCircle, ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useAttemptStore } from "@/lib/store";
import { OptionRow } from "@/components/exam/option-row";
import { OmrNavigator } from "@/components/exam/omr-navigator";
import { Timer } from "@/components/exam/timer";
import { ShortcutDialog } from "@/components/exam/shortcut-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = String(params.attemptId || "");

  const {
    questionSet,
    currentIndex,
    answers,
    startedAt,
    durationMinutes,
    enableTimer,
    enableNegativeMarking,
    isSubmitted,
    isSaving,
    selectOption,
    clearAnswer,
    toggleFlag,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    recordTimeSpent,
    setSaving,
    submitAttempt,
    hydrateFromLocalStorage,
  } = useAttemptStore();

  const [inExam, setInExam] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [timeUpOpen, setTimeUpOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Pre-test configuration options
  const [prefEnableTimer, setPrefEnableTimer] = useState(true);
  const [prefNegativeMarking, setPrefNegativeMarking] = useState(true);

  const supabase = createClient();
  const lastActiveTimeRef = useRef<number>(Date.now());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate attempt state from local storage or store
  useEffect(() => {
    if (!questionSet) {
      const success = hydrateFromLocalStorage(attemptId);
      if (!success) {
        // Redirect back to upload if no attempt is found
        router.push("/");
      }
    }
  }, [attemptId, questionSet, hydrateFromLocalStorage, router]);

  // Periodic time recording per active question
  useEffect(() => {
    if (!inExam || isSubmitted || !questionSet) return;

    lastActiveTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = Math.round((now - lastActiveTimeRef.current) / 1000);
      if (deltaSec >= 1) {
        const activeQ = questionSet.questions[currentIndex];
        if (activeQ) {
          recordTimeSpent(activeQ.id, deltaSec);
        }
        lastActiveTimeRef.current = now;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [inExam, isSubmitted, questionSet, currentIndex, recordTimeSpent]);

  // Debounced sync to Supabase
  const syncAnswersToSupabase = useCallback(async () => {
    if (!attemptId) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("attempts")
          .update({
            subjects: answers,
          })
          .eq("id", attemptId)
          .eq("user_id", user.id);
      }
    } catch (e) {
      console.warn("Autosave note:", e);
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  }, [attemptId, answers, setSaving, supabase]);

  useEffect(() => {
    if (!inExam || isSubmitted) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      syncAnswersToSupabase();
    }, 1500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [answers, inExam, isSubmitted, syncAnswersToSupabase]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!inExam || isSubmitted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack keys when input or dialog is active
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || shortcutOpen || submitDialogOpen) {
        return;
      }

      const activeQ = questionSet?.questions[currentIndex];
      if (!activeQ) return;

      const key = e.key.toUpperCase();

      // Number keys 1-4 or Letters A-D
      const letterMap: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
      const targetLetter = letterMap[key] || key;

      const matchingOpt = activeQ.options.find(
        (opt, idx) => opt.id.toUpperCase() === targetLetter || String.fromCharCode(65 + idx) === targetLetter
      );

      if (matchingOpt) {
        e.preventDefault();
        selectOption(activeQ.id, matchingOpt.id, activeQ.type === "multi");
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        nextQuestion();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevQuestion();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextQuestion();
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFlag(activeQ.id);
      } else if (e.key === "?") {
        e.preventDefault();
        setShortcutOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    inExam,
    isSubmitted,
    questionSet,
    currentIndex,
    shortcutOpen,
    submitDialogOpen,
    selectOption,
    nextQuestion,
    prevQuestion,
    toggleFlag,
  ]);

  const handleFinalSubmit = () => {
    submitAttempt();
    setSubmitDialogOpen(false);
    setTimeUpOpen(false);

    // Fire-and-forget Supabase sync in background (non-blocking)
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && questionSet) {
          await supabase
            .from("attempts")
            .update({
              subjects: answers,
            })
            .eq("id", attemptId)
            .eq("user_id", user.id);
        }
      } catch (e) {
        console.warn("Final submit background sync note:", e);
      }
    })();

    // Navigate immediately without waiting
    router.push(`/review/${attemptId}`);
  };

  if (!questionSet) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-sm font-mono text-ink-soft">
        Loading test session…
      </div>
    );
  }

  const activeQuestion = questionSet.questions[currentIndex];
  const activeAnswer = answers[activeQuestion?.id] || {
    questionId: activeQuestion?.id,
    selected: [],
    spentSeconds: 0,
    flagged: false,
    visited: true,
  };

  const isFlagged = activeAnswer.flagged;
  const answeredCount = Object.values(answers).filter(a => a.selected.length > 0).length;
  const blankCount = questionSet.questions.length - answeredCount;

  // 1. INSTRUCTIONS / COVER SCREEN
  if (!inExam) {
    const totalMarks = questionSet.questions.reduce((s, q) => s + (q.marks || 1), 0);
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="max-w-2xl w-full border border-line bg-surface p-8 md:p-10 rounded-md text-left space-y-6">
          <div>
            <h1 className="font-display text-3xl font-medium text-ink">
              {questionSet.meta.title || "Practice Examination"}
            </h1>
            <div className="font-mono text-xs text-ink-soft mt-1">
              {questionSet.questions.length} questions · {questionSet.meta.durationMinutes} minutes · Max {totalMarks} marks
            </div>
          </div>

          <div className="h-0.5 w-full bg-line-strong" />

          <div className="space-y-3">
            <h2 className="font-sans font-semibold text-base text-ink">
              Before you begin
            </h2>
            <ol className="list-decimal list-inside text-sm text-ink-soft space-y-2 leading-relaxed">
              <li>The timer starts when you select <strong>Begin test</strong>.</li>
              <li>Answers save automatically in this browser and sync to your account.</li>
              <li>Use the question navigator on the right to jump between questions.</li>
              <li>Flagged questions are marked for your review and do not affect scoring.</li>
              <li>Press <kbd className="font-mono text-xs bg-recess px-1.5 py-0.5 border border-line rounded-sm">?</kbd> at any time to view keyboard shortcuts.</li>
            </ol>
          </div>

          <div className="border-t border-line pt-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer text-sm text-ink">
              <input
                type="checkbox"
                checked={prefEnableTimer}
                onChange={e => setPrefEnableTimer(e.target.checked)}
                className="h-4 w-4 rounded-sm border-line text-ink focus:ring-0"
              />
              <span>Enable timed countdown ({questionSet.meta.durationMinutes}:00)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-sm text-ink">
              <input
                type="checkbox"
                checked={prefNegativeMarking}
                onChange={e => setPrefNegativeMarking(e.target.checked)}
                className="h-4 w-4 rounded-sm border-line text-ink focus:ring-0"
              />
              <span>Negative marking (−{questionSet.meta.negativeMarking || 0.25} per wrong answer)</span>
            </label>
          </div>

          <div className="border-t border-line pt-6 flex justify-end">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setInExam(true)}
              className="px-8"
            >
              Begin test →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. RUNNER WORKSPACE
  const optionLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return (
    <div className="min-h-screen bg-paper flex flex-col text-ink">
      {/* 56px Top Bar */}
      <header className="h-14 border-b border-line bg-surface px-6 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-display font-medium text-lg text-ink truncate max-w-[280px] md:max-w-md">
            {questionSet.meta.title}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {enableTimer && startedAt && (
            <Timer
              startedAt={startedAt}
              durationMinutes={durationMinutes}
              onTimeUp={() => setTimeUpOpen(true)}
            />
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShortcutOpen(true)}
            title="Keyboard shortcuts (?)"
            className="hidden sm:inline-flex"
          >
            <HelpCircle size={16} strokeWidth={1.75} />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleFlag(activeQuestion.id)}
            className={isFlagged ? "border-flag text-flag" : ""}
          >
            <Flag size={14} className={isFlagged ? "fill-flag text-flag" : ""} />
            <span className="hidden sm:inline">{isFlagged ? "Flagged" : "Flag"}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setSubmitDialogOpen(true)}
          >
            Submit
          </Button>
        </div>
      </header>

      {/* Main Runner Body */}
      <div className="flex-1 flex max-w-[1200px] w-full mx-auto">
        {/* Left/Center Question Column (max 720px) */}
        <main className="flex-1 max-w-[720px] mx-auto p-6 md:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Question Meta Label */}
            <div className="flex items-center justify-between font-mono text-xs text-ink-soft border-b border-line pb-2">
              <span>
                Q{String(currentIndex + 1).padStart(2, "0")} · {activeQuestion.type === "multi" ? "Multi-select" : activeQuestion.type === "truefalse" ? "True / False" : "Single choice"}
              </span>
              {activeQuestion.topic && (
                <span className="text-ink-faint uppercase tracking-wider">{activeQuestion.topic}</span>
              )}
            </div>

            {/* Question Stem in display serif font */}
            <div className="font-display text-[18px] md:text-[20px] leading-[1.6] text-ink whitespace-pre-wrap">
              {activeQuestion.stem}
            </div>

            {/* Multi-select hint if applicable */}
            {activeQuestion.type === "multi" && (
              <div className="text-[13px] text-ink-soft font-medium">
                Select all options that apply
              </div>
            )}

            {/* Option Rows */}
            <div className="space-y-2.5 pt-2" role="radiogroup">
              {activeQuestion.options.map((opt, optIdx) => {
                const letter = optionLetters[optIdx] || opt.id;
                const isSelected = activeAnswer.selected.includes(opt.id);

                return (
                  <OptionRow
                    key={opt.id}
                    letter={letter}
                    selected={isSelected}
                    isMulti={activeQuestion.type === "multi"}
                    onClick={() => selectOption(activeQuestion.id, opt.id, activeQuestion.type === "multi")}
                  >
                    {opt.text}
                  </OptionRow>
                );
              })}
            </div>

            {/* Clear Response */}
            {activeAnswer.selected.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => clearAnswer(activeQuestion.id)}
                  className="text-xs font-mono text-ink-soft hover:text-ink underline"
                >
                  Clear response
                </button>
              </div>
            )}
          </div>

          {/* Bottom Bar Controls */}
          <footer className="border-t border-line pt-6 mt-10 flex items-center justify-between">
            <Button
              variant="secondary"
              size="md"
              onClick={prevQuestion}
              disabled={currentIndex === 0}
            >
              <ArrowLeft size={16} />
              <span>Previous</span>
            </Button>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-ink-soft tabular-nums">
                Q{currentIndex + 1} of {questionSet.questions.length}
              </span>
              <span className="font-mono text-[11px] text-ink-faint" aria-live="polite">
                {isSaving ? "Saving…" : "Saved"}
              </span>
            </div>

            {currentIndex === questionSet.questions.length - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setSubmitDialogOpen(true)}
              >
                Review & Submit →
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={nextQuestion}
              >
                <span>Next</span>
                <ArrowRight size={16} />
              </Button>
            )}
          </footer>
        </main>

        {/* Right Sticky OMR Rail (Desktop >= 1024px) */}
        <aside className="hidden lg:block w-[280px] border-l border-line p-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto bg-surface">
          <OmrNavigator
            questions={questionSet.questions}
            answers={answers}
            currentIndex={currentIndex}
            onSelect={goToQuestion}
          />
        </aside>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutDialog open={shortcutOpen} onOpenChange={setShortcutOpen} />

      {/* Submit Confirmation Interstitial */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit test</DialogTitle>
            <DialogDescription>
              Review your progress before final grading.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3 font-mono text-sm text-ink-soft">
            <div className="p-3 bg-recess rounded-sm border border-line text-ink">
              You have answered <strong className="text-ink">{answeredCount}</strong> of{" "}
              {questionSet.questions.length} questions.
              {blankCount > 0 && (
                <span className="text-wrong block mt-1">
                  {blankCount} question{blankCount === 1 ? "" : "s"} remain blank.
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSubmitDialogOpen(false)}
            >
              Keep working
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleFinalSubmit}
            >
              Submit test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Up Alert Dialog */}
      <Dialog open={timeUpOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-wrong">Time is up</DialogTitle>
            <DialogDescription>
              Your test duration has ended. Your answers have been saved and will now be graded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={handleFinalSubmit}
              className="w-full"
            >
              View score report →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
