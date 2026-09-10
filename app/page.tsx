"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileUp, FileText, Check, AlertCircle, Copy, ArrowRight, Play, RotateCcw } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseQuestionJson, ParseResultSuccess } from "@/lib/parse";
import { QuestionSet } from "@/lib/schema";
import { useAttemptStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

const SAMPLE_JSON_SNIPPET = `{
  "meta": {
    "exam_name": "Past Paper 2026",
    "duration_minutes": 45,
    "negative_marking": 0.25
  },
  "questions": [
    {
      "id": "Q01",
      "question": "What is the worst-case complexity of BST search?",
      "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      "correctAnswer": "O(n)",
      "topic": "Data Structures",
      "explanation": "In an unbalanced tree, search degrades to linear search."
    }
  ]
}`;

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();
  const initAttempt = useAttemptStore(state => state.initAttempt);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<"file" | "paste">("file");
  const [pasteText, setPasteText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [parsingFile, setParsingFile] = useState<{ name: string; size: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<ParseResultSuccess | null>(null);
  const [customDuration, setCustomDuration] = useState<number>(45);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [setName, setSetName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Recent sets
  const [recentSets, setRecentSets] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get current user session and fetch recent sets
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
        loadRecentSets(user.id);
      }
    }
    initUser();
  }, []);

  async function loadRecentSets(userId: string) {
    setRecentLoading(true);
    try {
      // Load recent attempts from public.attempts
      const { data: attempts } = await supabase
        .from("attempts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8);

      if (attempts) {
        setRecentSets(attempts);
      }
    } catch (e) {
      console.warn("Could not load recent sets:", e);
    } finally {
      setRecentLoading(false);
    }
  }

  const handleJsonString = (rawJson: string, defaultTitle = "Past Paper") => {
    setErrors([]);
    setSavedNotice(null);

    const result = parseQuestionJson(rawJson, defaultTitle);
    if (!result.success) {
      setParsedData(null);
      setErrors(result.errors);
    } else {
      setParsedData(result);
      setCustomDuration(result.summary.suggestedDuration);
      setSetName(result.summary.setName);
      setErrors([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const kb = (file.size / 1024).toFixed(0);
    setParsingFile({ name: file.name, size: `${kb} KB` });

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setParsingFile(null);
      handleJsonString(content, file.name.replace(/\.json$/i, ""));
    };
    reader.onerror = () => {
      setParsingFile(null);
      setErrors(["Failed to read file from disk."]);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(SAMPLE_JSON_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBeginTest = async () => {
    if (!parsedData) return;
    setIsSubmitting(true);

    const attemptId = crypto.randomUUID();
    const updatedSet: QuestionSet = {
      ...parsedData.data,
      meta: {
        ...parsedData.data.meta,
        title: setName.trim() || parsedData.summary.setName,
        durationMinutes: customDuration,
      },
    };

    // Initialize Zustand store with attempt
    initAttempt(attemptId, updatedSet, {
      durationMinutes: customDuration,
      enableTimer: true,
      enableNegativeMarking: updatedSet.meta.enableNegativeMarking,
    });

    // Try to record attempt row to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("attempts").insert({
          id: attemptId,
          user_id: user.id,
          date: new Date().toISOString().split("T")[0],
          exam: setName.trim() || parsedData.summary.setName,
          paper: updatedSet.meta.description || "Paper 1",
          file_name: parsedData.summary.setName,
          total: updatedSet.questions.length,
          correct: 0,
          wrong: 0,
          unattempted: updatedSet.questions.length,
          attempted: 0,
          accuracy: 0,
          score: 0,
          max_marks: updatedSet.questions.reduce((s, q) => s + (q.marks || 1), 0),
          time_used: 0,
          time_limit: customDuration * 60,
          xp: 0,
          subjects: {},
        });
      }
    } catch (dbErr) {
      console.warn("DB attempt row creation note:", dbErr);
    }

    router.push(`/test/${attemptId}`);
  };

  const handleSaveForLater = async () => {
    if (!parsedData) return;
    setIsSubmitting(true);
    const attemptId = crypto.randomUUID();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("attempts").insert({
          id: attemptId,
          user_id: user.id,
          date: new Date().toISOString().split("T")[0],
          exam: setName.trim() || parsedData.summary.setName,
          file_name: parsedData.summary.setName,
          total: parsedData.data.questions.length,
          correct: 0,
          wrong: 0,
          unattempted: parsedData.data.questions.length,
          attempted: 0,
          accuracy: 0,
          score: 0,
          max_marks: parsedData.data.questions.reduce((s, q) => s + (q.marks || 1), 0),
          time_used: 0,
          time_limit: customDuration * 60,
          xp: 0,
        });

        setSavedNotice("Saved to your account.");
        loadRecentSets(user.id);
      }
    } catch (err: any) {
      setErrors([`Failed to save set: ${err.message}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <Header userEmail={userEmail} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Upload & Ingestion (~60%) */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <div className="flex items-baseline justify-between">
                <h1 className="font-display text-2xl md:text-3xl font-medium text-ink">
                  01 · Load a question file
                </h1>
              </div>
              <div className="mt-2 h-0.5 w-full bg-line-strong" />
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-line">
              <button
                type="button"
                onClick={() => {
                  setTab("file");
                  setErrors([]);
                }}
                className={`pb-2 text-sm font-medium mr-6 transition-colors ${
                  tab === "file"
                    ? "border-b-2 border-ink text-ink"
                    : "border-b-2 border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                Upload file
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("paste");
                  setErrors([]);
                }}
                className={`pb-2 text-sm font-medium transition-colors ${
                  tab === "paste"
                    ? "border-b-2 border-ink text-ink"
                    : "border-b-2 border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                Paste JSON
              </button>
            </div>

            {/* Upload Tab Body */}
            {tab === "file" && !parsedData && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed p-10 text-center cursor-pointer transition-colors duration-150 rounded-sm ${
                    isDragging
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-surface hover:border-line-strong"
                  }`}
                >
                  <FileUp size={28} strokeWidth={1.75} className="mx-auto text-ink-soft mb-3" />
                  <div className="text-base font-medium text-ink">
                    Drop your JSON file here, or click to browse
                  </div>
                  <div className="text-xs text-ink-faint font-mono mt-1">
                    .json · up to 5 MB
                  </div>
                </div>
              </div>
            )}

            {/* Paste Tab Body */}
            {tab === "paste" && !parsedData && (
              <div className="space-y-3">
                <textarea
                  rows={8}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste your JSON question file contents here..."
                  className="w-full font-mono text-[13px] leading-relaxed p-4 rounded-sm border border-line bg-surface text-ink focus:outline-2 focus:outline-ink"
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleJsonString(pasteText, "Pasted Paper")}
                  disabled={!pasteText.trim()}
                >
                  Validate JSON
                </Button>
              </div>
            )}

            {/* Parsing State */}
            {parsingFile && (
              <div className="flex items-center gap-3 p-4 rounded-sm border border-line bg-surface font-mono text-xs text-ink-soft">
                <FileText size={18} strokeWidth={1.75} className="text-ink" />
                <span>
                  <strong className="text-ink">{parsingFile.name}</strong> · {parsingFile.size} — Reading…
                </span>
              </div>
            )}

            {/* Linter-style Errors */}
            {errors.length > 0 && (
              <div className="rounded-sm border-l-2 border-l-wrong bg-wrong-soft p-4 space-y-1 text-xs font-mono text-ink">
                <div className="font-semibold text-wrong mb-2 flex items-center gap-2">
                  <AlertCircle size={14} /> Validation issues found:
                </div>
                {errors.map((err, i) => (
                  <div key={i} className="leading-relaxed">
                    ✗ {err}
                  </div>
                ))}
              </div>
            )}

            {/* Success Summary */}
            {parsedData && (
              <div className="border border-line bg-surface p-6 rounded-md space-y-6">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-correct font-semibold text-base">
                      <Check size={18} strokeWidth={2.5} />
                      <span>{parsedData.summary.total} questions ready</span>
                    </div>
                    <div className="text-xs font-mono text-ink-soft mt-1">
                      {parsedData.summary.single} single-choice · {parsedData.summary.multi} multi-select · {parsedData.summary.topics.length} topics detected
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setParsedData(null);
                      setErrors([]);
                    }}
                  >
                    Change file
                  </Button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Set name"
                    value={setName}
                    onChange={(e) => setSetName(e.target.value)}
                    placeholder="Exam or Subject Name"
                  />

                  <div className="flex items-center justify-between py-1 text-sm">
                    <span className="text-ink-soft">Duration:</span>
                    {isEditingDuration ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={customDuration}
                          onChange={(e) => setCustomDuration(Number(e.target.value) || 1)}
                          className="h-8 w-20 px-2 font-mono text-sm border border-line rounded-sm bg-surface text-ink text-right"
                        />
                        <span className="text-xs font-mono text-ink-soft">min</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsEditingDuration(false)}
                        >
                          Done
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 font-mono">
                        <strong className="text-ink">{customDuration} minutes</strong>
                        <button
                          type="button"
                          onClick={() => setIsEditingDuration(true)}
                          className="text-xs text-ink-soft hover:text-ink underline ml-1"
                        >
                          [change]
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {savedNotice && (
                  <div className="font-mono text-xs text-correct bg-correct-soft p-2 rounded-sm border-l-2 border-l-correct">
                    {savedNotice}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    onClick={handleBeginTest}
                    className="flex-1"
                  >
                    <span>Begin test</span>
                    <ArrowRight size={16} strokeWidth={1.75} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    disabled={isSubmitting}
                    onClick={handleSaveForLater}
                  >
                    Save for later
                  </Button>
                </div>
              </div>
            )}

            {/* Section 02 · Recent Sets */}
            {recentSets.length > 0 && (
              <div className="pt-6 space-y-4">
                <div>
                  <h2 className="font-display text-xl font-medium text-ink">
                    02 · Recent sets
                  </h2>
                  <div className="mt-2 h-0.5 w-full bg-line-strong" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-line-strong text-left">
                        <th className="py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink-soft">
                          Name
                        </th>
                        <th className="py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink-soft font-mono text-right">
                          Questions
                        </th>
                        <th className="py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink-soft font-mono text-right">
                          Date
                        </th>
                        <th className="py-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink-soft text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {recentSets.map((set) => {
                        const isFinished = set.attempted > 0 || set.correct > 0 || set.wrong > 0;
                        return (
                          <tr key={set.id} className="hover:bg-recess/50 transition-colors">
                            <td className="py-3 font-medium text-ink max-w-[200px] truncate">
                              {set.exam || set.file_name || "Practice Set"}
                            </td>
                            <td className="py-3 font-mono tabular-nums text-right text-ink-soft">
                              {set.total || "—"}
                            </td>
                            <td className="py-3 font-mono tabular-nums text-right text-ink-soft text-xs">
                              {set.date || "Today"}
                            </td>
                            <td className="py-3 text-right">
                              {isFinished ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/review/${set.id}`)}
                                  className="h-7 text-xs font-mono"
                                >
                                  Review →
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => router.push(`/test/${set.id}`)}
                                  className="h-7 text-xs font-mono"
                                >
                                  Begin →
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Expected Format Reference (~40%) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="font-display text-xl font-medium text-ink">
                EXPECTED FORMAT
              </h2>
              <div className="mt-2 h-0.5 w-full bg-line-strong" />
            </div>

            {/* Code Snippet Box */}
            <div className="relative rounded-md border border-line bg-recess p-4 font-mono text-[12px] leading-5 text-ink overflow-x-auto">
              <button
                type="button"
                onClick={handleCopySnippet}
                className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-2 py-1 text-[11px] font-mono text-ink-soft hover:text-ink transition-colors"
              >
                {copied ? <Check size={12} className="text-correct" /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <pre className="pt-4">{SAMPLE_JSON_SNIPPET}</pre>
            </div>

            {/* Schema Field Aliases Table */}
            <div className="space-y-3">
              <div className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft">
                Key Aliases Accepted
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-line text-left text-ink-faint">
                      <th className="pb-1.5 font-semibold">Field</th>
                      <th className="pb-1.5 font-semibold">Accepted Aliases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink-soft">
                    <tr>
                      <td className="py-1.5 text-ink font-semibold">id</td>
                      <td className="py-1.5">id, qid, number, no</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-ink font-semibold">question</td>
                      <td className="py-1.5">question, q, text, stem, title</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-ink font-semibold">options</td>
                      <td className="py-1.5">options, choices, answers</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-ink font-semibold">correctAnswer</td>
                      <td className="py-1.5">correctAnswer, correct_answer, answer, answer_index</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-ink font-semibold">explanation</td>
                      <td className="py-1.5">explanation, solution, why</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-ink font-semibold">topic</td>
                      <td className="py-1.5">topic, subject, chapter, tag</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
