"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, X, Minus, RotateCcw, PlusCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { StatStrip } from "@/components/exam/stat-strip";
import { Bar } from "@/components/exam/bar";
import { OptionRow } from "@/components/exam/option-row";
import { Button } from "@/components/ui/button";
import { useAttemptStore } from "@/lib/store";
import { scoreAttempt, ScoreReport } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/client";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = String(params.attemptId || "");

  const { questionSet, answers, hydrateFromLocalStorage } = useAttemptStore();
  const [filter, setFilter] = useState<"all" | "wrong" | "blank" | "flagged">("all");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email ?? null);

      if (!useAttemptStore.getState().questionSet) {
        hydrateFromLocalStorage(attemptId);
      }
      setLoading(false);
    }
    init();
  }, [attemptId, hydrateFromLocalStorage, supabase]);

  const activeQuestionSet = questionSet || useAttemptStore.getState().questionSet;
  const activeAnswers = answers || useAttemptStore.getState().answers;

  const report: ScoreReport | null = useMemo(() => {
    if (!activeQuestionSet) return null;
    return scoreAttempt(
      activeQuestionSet.questions,
      activeAnswers,
      activeQuestionSet.meta.negativeMarking,
      activeQuestionSet.meta.enableNegativeMarking
    );
  }, [activeQuestionSet, activeAnswers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Header userEmail={userEmail} />
        <main className="flex-1 max-w-[1200px] w-full mx-auto p-8 text-left">
          <div className="font-mono text-sm text-ink-soft">Loading score report…</div>
        </main>
      </div>
    );
  }

  if (!activeQuestionSet || !report) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Header userEmail={userEmail} />
        <main className="flex-1 max-w-[1200px] w-full mx-auto p-8 text-left space-y-4">
          <h1 className="font-display text-2xl font-medium text-ink">No results found</h1>
          <p className="text-sm text-ink-soft">Load a question file to begin a new test attempt.</p>
          <Button variant="primary" onClick={() => router.push("/")}>
            Go to upload
          </Button>
        </main>
      </div>
    );
  }

  const minsSpent = Math.floor(report.totalSecondsSpent / 60);
  const secsSpent = report.totalSecondsSpent % 60;
  const timeTakenFormatted = `${minsSpent}:${String(secsSpent).padStart(2, "0")}`;

  const statItems = [
    { label: "Accuracy", value: `${report.accuracy}%` },
    { label: "Correct", value: <span className="text-correct">{report.correctCount} ✓</span> },
    { label: "Incorrect", value: <span className="text-wrong">{report.wrongCount} ✗</span> },
    { label: "Blank", value: `${report.blankCount} ▢` },
    { label: "Time taken", value: timeTakenFormatted },
  ];

  // Filter questions for walkthrough
  const filteredQuestions = activeQuestionSet.questions.filter((q) => {
    const grading = report.questionsGraded[q.id];
    if (filter === "wrong") return grading?.isWrong;
    if (filter === "blank") return grading?.isBlank;
    if (filter === "flagged") return grading?.flagged;
    return true;
  });

  const handleRetakeAll = () => {
    const newAttemptId = crypto.randomUUID();
    useAttemptStore.getState().initAttempt(newAttemptId, activeQuestionSet, {
      durationMinutes: activeQuestionSet.meta.durationMinutes,
      enableTimer: true,
      enableNegativeMarking: activeQuestionSet.meta.enableNegativeMarking,
    });
    router.push(`/test/${newAttemptId}`);
  };

  const optionLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <Header userEmail={userEmail} />

      <main className="flex-1 max-w-[1000px] w-full mx-auto p-6 md:p-8 space-y-10 text-left">
        {/* Title and Top Actions */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-medium text-ink">
                Review & analysis
              </h1>
              <div className="font-mono text-xs text-ink-soft mt-1">
                {activeQuestionSet.meta.title} · Graded just now
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="secondary" size="sm" onClick={handleRetakeAll}>
                <RotateCcw size={14} />
                <span>Retake test</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={() => router.push("/")}>
                <PlusCircle size={14} />
                <span>New test</span>
              </Button>
            </div>
          </div>

          <div className="h-0.5 w-full bg-line-strong" />
        </div>

        {/* Big Score Numerals + StatStrip */}
        <div className="space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="font-display text-5xl md:text-6xl font-medium text-ink tabular-nums tracking-tight">
              {report.score}/{report.maxMarks}
            </span>
            <span className="font-mono text-xl text-ink-soft tabular-nums">
              ({report.percentageScore}%)
            </span>
          </div>

          <StatStrip stats={statItems} />
        </div>

        {/* By Topic Performance */}
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-medium text-ink">By topic</h2>
            <div className="mt-2 h-0.5 w-full bg-line-strong" />
          </div>

          {report.topics.length === 0 ? (
            <p className="text-sm font-mono text-ink-soft">No topics categorized in this question file.</p>
          ) : (
            <div className="space-y-3 max-w-2xl">
              {report.topics.map((t) => (
                <Bar
                  key={t.topic}
                  label={t.topic}
                  value={t.accuracy}
                  valueText={`${t.accuracy}%`}
                  subValueText={`${t.correct}/${t.total}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Question Review Walkthrough */}
        <div className="space-y-6 pt-4">
          <div>
            <h2 className="font-display text-2xl font-medium text-ink">Question review</h2>
            <div className="mt-2 h-0.5 w-full bg-line-strong" />
          </div>

          {/* Filter Underline Tabs */}
          <div className="flex border-b border-line gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`pb-2 transition-colors ${
                filter === "all"
                  ? "border-b-2 border-ink text-ink"
                  : "border-b-2 border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              All {activeQuestionSet.questions.length}
            </button>
            <button
              type="button"
              onClick={() => setFilter("wrong")}
              className={`pb-2 transition-colors ${
                filter === "wrong"
                  ? "border-b-2 border-ink text-ink"
                  : "border-b-2 border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              Incorrect {report.wrongCount}
            </button>
            <button
              type="button"
              onClick={() => setFilter("blank")}
              className={`pb-2 transition-colors ${
                filter === "blank"
                  ? "border-b-2 border-ink text-ink"
                  : "border-b-2 border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              Blank {report.blankCount}
            </button>
            <button
              type="button"
              onClick={() => setFilter("flagged")}
              className={`pb-2 transition-colors ${
                filter === "flagged"
                  ? "border-b-2 border-ink text-ink"
                  : "border-b-2 border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              Flagged {report.flaggedCount}
            </button>
          </div>

          {/* Walkthrough List */}
          <div className="divide-y divide-line">
            {filteredQuestions.map((q) => {
              const grading = report.questionsGraded[q.id];
              const qIndex = activeQuestionSet.questions.findIndex(x => x.id === q.id);
              const qNum = String(qIndex + 1).padStart(2, "0");

              return (
                <div key={q.id} className="py-6 space-y-4">
                  {/* Question Meta Header */}
                  <div className="flex items-center gap-2 font-mono text-xs text-ink-soft">
                    {grading?.isCorrect && (
                      <span className="inline-flex items-center gap-1 text-correct font-semibold">
                        <Check size={14} strokeWidth={2.5} /> Correct
                      </span>
                    )}
                    {grading?.isWrong && (
                      <span className="inline-flex items-center gap-1 text-wrong font-semibold">
                        <X size={14} strokeWidth={2.5} /> Incorrect
                      </span>
                    )}
                    {grading?.isBlank && (
                      <span className="inline-flex items-center gap-1 text-ink-faint">
                        <Minus size={14} strokeWidth={2} /> Blank
                      </span>
                    )}
                    <span>·</span>
                    <span>Q{qNum}</span>
                    {q.topic && <span>· {q.topic}</span>}
                    {grading?.spentSeconds != null && (
                      <span>· {grading.spentSeconds}s</span>
                    )}
                    {grading?.isPaceOutlier && (
                      <span className="text-flag font-semibold">· Pace outlier</span>
                    )}
                  </div>

                  {/* Question Stem in serif font */}
                  <div className="font-display text-lg leading-relaxed text-ink whitespace-pre-wrap">
                    {q.stem}
                  </div>

                  {/* Options with correctness highlight */}
                  <div className="space-y-2 max-w-2xl">
                    {q.options.map((opt, optIdx) => {
                      const letter = optionLetters[optIdx] || opt.id;
                      const isSelected = grading?.userSelected.includes(opt.id);
                      const isCorrect = Array.isArray(q.correctAnswer)
                        ? q.correctAnswer.includes(opt.id)
                        : String(q.correctAnswer).trim().toUpperCase() === opt.id.toUpperCase();

                      return (
                        <OptionRow
                          key={opt.id}
                          letter={letter}
                          selected={isSelected}
                          correct={isCorrect}
                          wrong={isSelected && !isCorrect}
                          disabled
                          onClick={() => {}}
                        >
                          {opt.text}
                        </OptionRow>
                      );
                    })}
                  </div>

                  {/* "Why" Explanation Block */}
                  {q.explanation && (
                    <div className="rounded-sm border border-line bg-recess border-l-4 border-l-accent p-4 max-w-2xl space-y-1">
                      <div className="font-mono text-xs uppercase tracking-wide text-ink-soft font-semibold">
                        Why
                      </div>
                      <div className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                        {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredQuestions.length === 0 && (
              <div className="py-8 text-center text-sm font-mono text-ink-soft">
                No questions matching the selected filter.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
