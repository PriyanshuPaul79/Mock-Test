const sampleData = {
  "meta": {
    "exam_name": "SEBI Grade A IT Officer - Built-in Sample",
    "paper": "Phase 1 Paper 2 - IT Professional Knowledge",
    "duration_minutes": 8,
    "negative_marking": 0.25,
    "official_pace_seconds": 48,
    "full_paper_note": "50 Q / 100 Marks Simulation"
  },
  "sections": [
    {
      "id": "sec_1",
      "name": "Programming & Database Systems",
      "duration_minutes": 4,
      "questions": [
        {
          "id": "Q1", "type": "mcq", "subject": "Python", "topic": "Loop Dry Run",
          "difficulty": "medium", "marks": 2,
          "question": "What is the output of the following Python code?",
          "code": "x = 0\nfor i in range(3):\n    x += i\nprint(x)",
          "code_language": "python",
          "options": [
            { "id": "A", "text": "0" },
            { "id": "B", "text": "3" },
            { "id": "C", "text": "6" },
            { "id": "D", "text": "Error" }
          ],
          "correct_option_id": "B",
          "explanation": "range(3) produces 0, 1, 2. The cumulative sum is 0 + 1 + 2 = 3."
        },
        {
          "id": "Q2", "type": "mcq", "subject": "DBMS", "topic": "SQL Clauses",
          "difficulty": "medium", "marks": 2,
          "question": "Which SQL clause is used to filter groups created by GROUP BY?",
          "options": [
            { "id": "A", "text": "WHERE" },
            { "id": "B", "text": "ORDER BY" },
            { "id": "C", "text": "HAVING" },
            { "id": "D", "text": "DISTINCT" }
          ],
          "correct_option_id": "C",
          "explanation": "HAVING filters aggregate groups after GROUP BY. WHERE filters individual rows before grouping."
        },
        {
          "id": "Q3", "type": "mcq", "subject": "Operating Systems", "topic": "CPU Scheduling",
          "difficulty": "medium", "marks": 2,
          "question": "Which CPU scheduling algorithm can cause indefinite blocking (starvation)?",
          "options": [
            { "id": "A", "text": "Round Robin" },
            { "id": "B", "text": "First Come First Serve" },
            { "id": "C", "text": "Priority Scheduling" },
            { "id": "D", "text": "Shortest Remaining Time First only" }
          ],
          "correct_option_id": "C",
          "explanation": "In priority scheduling, low-priority processes can wait indefinitely if high-priority processes keep arriving."
        }
      ]
    },
    {
      "id": "sec_2",
      "name": "Networks, Security & General Awareness",
      "duration_minutes": 4,
      "questions": [
        {
          "id": "Q4", "type": "mcq", "subject": "Computer Networks", "topic": "OSI Reference Model",
          "difficulty": "easy", "marks": 2,
          "question": "Which OSI layer is responsible for logical addressing (IP) and routing?",
          "options": [
            { "id": "A", "text": "Data Link Layer" },
            { "id": "B", "text": "Network Layer" },
            { "id": "C", "text": "Transport Layer" },
            { "id": "D", "text": "Session Layer" }
          ],
          "correct_option_id": "B",
          "explanation": "The Network Layer (Layer 3) handles logical addressing, IP packet encapsulation, and path determination."
        },
        {
          "id": "Q5", "type": "mcq", "subject": "General Awareness", "topic": "Regulatory Bodies",
          "difficulty": "easy", "marks": 2,
          "question": "Which financial market regulator in India was established under the SEBI Act, 1992?",
          "options": [
            { "id": "A", "text": "Securities and Exchange Board of India" },
            { "id": "B", "text": "Insurance Regulatory and Development Authority" },
            { "id": "C", "text": "Pension Fund Regulatory and Development Authority" },
            { "id": "D", "text": "Reserve Bank of India" }
          ],
          "correct_option_id": "A",
          "explanation": "SEBI is the statutory regulatory body for securities and commodity markets in India."
        }
      ]
    }
  ]
};

const el = id => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ----- SUPABASE ----- */
let sb = null;
let currentUser = null;
if (typeof SUPABASE_URL !== "undefined" && typeof SUPABASE_ANON_KEY !== "undefined" && SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
  try {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn("Supabase init error:", e);
  }
}

/* ----- DOM refs ----- */
const fileInput = el("fileInput");
const fileNameDisplay = el("fileNameDisplay");
const loadSampleBtn = el("loadSampleBtn");
const loadError = el("loadError");
const startExamName = el("startExamName");
const startChips = el("startChips");
const startTestBtn = el("startTestBtn");
const backToLoadBtn = el("backToLoadBtn");
const startBtnText = el("startBtnText");
const examTitle = el("examTitle");
const paperTitle = el("paperTitle");
const timer = el("timer");
const sectionTimer = el("sectionTimer");
const sectionTimerWrap = el("sectionTimerWrap");
const sectionTabBar = el("sectionTabBar");
const submitBtn = el("submitBtn");
const questionChips = el("questionChips");
const questionText = el("questionText");
const codeBlock = el("codeBlock");
const options = el("options");
const prevBtn = el("prevBtn");
const clearBtn = el("clearBtn");
const markBtn = el("markBtn");
const nextBtn = el("nextBtn");
const palette = el("palette");
const streakPill = el("streakPill");

// Start Screen Configuration DOM Refs
const tmNormalOption = el("tmNormalOption");
const tmSectionalOption = el("tmSectionalOption");
const normalTimerConfig = el("normalTimerConfig");
const sectionalTimerConfig = el("sectionalTimerConfig");
const totalPaperMinutesInput = el("totalPaperMinutesInput");
const sectionCountInput = el("sectionCountInput");
const sectionsBuilderList = el("sectionsBuilderList");
const sectionDistHint = el("sectionDistHint");
const sectionalTotalTimeCalc = el("sectionalTotalTimeCalc");
const sectionalTotalQsCalc = el("sectionalTotalQsCalc");
const autoSplitQsBtn = el("autoSplitQsBtn");

const resultSummaryEls = {
  title: el("resultTitle"),
  subtitle: el("resultSubtitle"),
  ring: el("ringProgress"),
  ringScore: el("ringScore"),
  ringLabel: el("ringLabel"),
  correct: el("statCorrect"),
  wrong: el("statWrong"),
  attempted: el("statAttempted"),
  accuracy: el("statAccuracy"),
  time: el("statTime"),
  pace: el("statPace"),
  targetTime: el("targetTime"),
  targetNote: el("targetNote"),
  targetMessage: el("targetMessage")
};
const retakeBtn = el("retakeBtn");
const anotherBtn = el("anotherBtn");
const reviewBtn = el("reviewBtn");
const reviewContainer = el("reviewContainer");

let paletteButtons = [];

// User Pre-Test Configuration State
let userTimerConfig = {
  mode: "normal", // "normal" | "sectional"
  normalDuration: 20,
  sectionCount: 2,
  sections: []
};

let state = {
  data: null,
  questions: [],
  sections: [],
  hasSectionalTiming: false,
  currentSectionIndex: 0,
  lockedSections: new Set(),
  sectionSecondsLeft: 0,
  totalSecondsLeft: 0,
  answers: {},
  marked: new Set(),
  visited: new Set(),
  currentIndex: 0,
  totalSeconds: 0,
  secondsLeft: 0,
  timerInterval: null,
  submitted: false,
  fileName: "",
  fiveMinAlerted: false
};

/* =====================================================================
   PREFERENCES (Settings Panel)
   ===================================================================== */
const PREF_KEY = "sebiMockPrefs";
const defaultPrefs = {
  theme: "light",          // light | dark
  fontSize: "md",          // sm | md | lg | xl
  timerPosition: "top",    // top | bottom
  soundAlert5min: true,
  shuffle: false,
  dailyGoal: 3
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return Object.assign({}, defaultPrefs, raw ? JSON.parse(raw) : {});
  } catch (e) { return Object.assign({}, defaultPrefs); }
}
function savePrefs(p) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) {}
}
let prefs = loadPrefs();

function applyPrefsToDOM() {
  document.body.setAttribute("data-theme", prefs.theme);
  document.body.setAttribute("data-fontsize", prefs.fontSize);
  const header = el("testScreen").querySelector(".test-header");
  if (header) header.classList.toggle("timer-bottom", prefs.timerPosition === "bottom");
  el("themeToggleBtn").textContent = prefs.theme === "dark" ? "☀" : "☾";
}

/* =====================================================================
   STREAK
   ===================================================================== */
const STREAK_KEY = "sebiMockStreak";

function dateStr(d) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}
function todayStr() { return dateStr(new Date()); }
function yesterdayStr() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return dateStr(d);
}

let streakData = { lastDate: null, streak: 0, best: 0 };
function displayStreak() {
  let display = 0;
  if (streakData.lastDate === todayStr() || streakData.lastDate === yesterdayStr()) {
    display = streakData.streak || 0;
  }
  const countEl = el("streakCount");
  if (countEl) countEl.textContent = display + "-day streak";
  else streakPill.textContent = "🔥 " + display + "-day streak";
  streakPill.title = "Best streak: " + (streakData.best || 0) + " days · complete at least one mock daily";
}

function updateStreakOnSubmit() {
  const t = todayStr();
  let increased = false;
  if (streakData.lastDate !== t) {
    if (streakData.lastDate === yesterdayStr()) streakData.streak += 1;
    else streakData.streak = 1;
    streakData.lastDate = t;
    increased = true;
  }
  streakData.best = Math.max(streakData.best, streakData.streak);
  displayStreak();
  if (increased) {
    streakPill.classList.remove("pulse");
    void streakPill.offsetWidth;
    streakPill.classList.add("pulse");
  }
}

/* =====================================================================
   GAMIFICATION — XP, Levels, Badges, Daily Goal, History
   ===================================================================== */
const GAMO_KEY = "sebiMockGamo";
const BADGES = [
  { id: "first_mock", name: "First Step", icon: "🌱", desc: "Complete your first mock test" },
  { id: "perfect_100", name: "Centurion", icon: "💯", desc: "Score 100% accuracy on any mock" },
  { id: "accuracy_80", name: "Sharpshooter", icon: "🎯", desc: "Score 80%+ accuracy on any mock" },
  { id: "speed_demon", name: "Speed Demon", icon: "⚡", desc: "Average under 30s per question" },
  { id: "streak_3", name: "On Fire", icon: "🔥", desc: "Maintain a 3-day practice streak" },
  { id: "streak_7", name: "Unstoppable", icon: "🚀", desc: "Maintain a 7-day practice streak" },
  { id: "attempts_5", name: "Dedicated", icon: "📚", desc: "Complete 5 mock tests" },
  { id: "attempts_20", name: "Veteran", icon: "🏆", desc: "Complete 20 mock tests" },
  { id: "level_5", name: "High Achiever", icon: "⭐", desc: "Reach Level 5" },
  { id: "goal_getter", name: "Goal Getter", icon: "🎖️", desc: "Hit your daily mock target" }
];

const defaultGamo = { totalXP: 0, badges: [], history: [], lastLevelShown: 1 };
let gamo = Object.assign({}, defaultGamo);

function xpForLevel(lvl) { return Math.round(100 * Math.pow(lvl, 1.4)); }
function getLevelInfo(totalXP) {
  let lvl = 1;
  while (totalXP >= xpForLevel(lvl)) lvl++;
  const prevFloor = lvl === 1 ? 0 : xpForLevel(lvl - 1);
  const nextCeil = xpForLevel(lvl);
  const span = nextCeil - prevFloor;
  const intoLevel = Math.max(0, totalXP - prevFloor);
  const pct = span > 0 ? Math.min(100, Math.max(0, (intoLevel / span) * 100)) : 0;
  return { level: lvl, intoLevel, span, nextCeil, pct };
}

function calculateAttemptXP(result, elapsed, totalQuestions) {
  let xp = 0;
  xp += Math.round(result.score * 10);
  xp += Math.round(result.accuracy * 0.5);
  const avgPace = elapsed / Math.max(1, totalQuestions);
  if (avgPace < 45 && result.accuracy >= 60) xp += 20;
  if (result.accuracy === 100) xp += 50;
  return Math.max(10, xp);
}

function checkNewBadges(result, elapsed, totalQuestions, newTotalAttempts, streak) {
  const earned = new Set(gamo.badges || []);
  const newlyEarned = [];
  function grant(id) {
    if (!earned.has(id)) { earned.add(id); newlyEarned.push(id); }
  }
  if (newTotalAttempts >= 1) grant("first_mock");
  if (newTotalAttempts >= 5) grant("attempts_5");
  if (newTotalAttempts >= 20) grant("attempts_20");
  if (result.accuracy === 100 && result.attempted === totalQuestions) grant("perfect_100");
  if (result.accuracy >= 80) grant("accuracy_80");
  const avgPace = elapsed / Math.max(1, totalQuestions);
  if (avgPace < 30 && result.attempted === totalQuestions) grant("speed_demon");
  if (streak >= 3) grant("streak_3");
  if (streak >= 7) grant("streak_7");
  const info = getLevelInfo(gamo.totalXP);
  if (info.level >= 5) grant("level_5");

  const today = todayStr();
  const todayCount = (gamo.history || []).filter(h => h.date === today).length + 1;
  if (todayCount >= prefs.dailyGoal) grant("goal_getter");

  return newlyEarned;
}

function todayAttemptCount() {
  const t = todayStr();
  return (gamo.history || []).filter(h => h.date === t).length;
}

async function saveProfile() {
  if (!sb || !currentUser) return;
  try {
    return await sb.from("profiles").upsert({
      id: currentUser.id,
      total_xp: gamo.totalXP,
      badges: gamo.badges,
      streak: streakData.streak || 0,
      streak_last_date: streakData.lastDate,
      streak_best: streakData.best || 0,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn("Error saving profile to Supabase:", e);
  }
}

async function recordAttempt(result, elapsed) {
  const meta = (state.data && state.data.meta) || {};
  const xp = calculateAttemptXP(result, elapsed, state.questions.length);
  const oldLevel = getLevelInfo(gamo.totalXP).level;
  gamo.totalXP += xp;
  const newLevel = getLevelInfo(gamo.totalXP).level;

  const newBadges = checkNewBadges(result, elapsed, state.questions.length, gamo.history.length + 1, streakData.streak);
  gamo.badges = Array.from(new Set([...(gamo.badges || []), ...newBadges]));

  // Subject breakdown
  const subjects = {};
  state.questions.forEach(q => {
    const s = q.subject || "General";
    if (!subjects[s]) subjects[s] = { total: 0, correct: 0, wrong: 0 };
    subjects[s].total++;
    const ans = state.answers[q.id];
    if (ans === q.correct_option_id) subjects[s].correct++;
    else if (ans) subjects[s].wrong++;
  });

  const entry = {
    id: "att_" + Date.now(),
    date: todayStr(),
    timestamp: new Date().toISOString(),
    exam: meta.exam_name || "Mock Test",
    paper: meta.paper || "",
    fileName: state.fileName || "",
    total: state.questions.length,
    correct: result.correct,
    wrong: result.wrong,
    unattempted: result.unattempted,
    attempted: result.attempted,
    accuracy: Math.round(result.accuracy),
    score: result.score,
    maxMarks: result.maxMarks,
    timeUsed: elapsed,
    timeLimit: state.totalSeconds,
    xp: xp,
    subjects: subjects
  };

  gamo.history.unshift(entry);

  if (sb && currentUser) {
    try {
      await sb.from("attempts").insert({
        user_id: currentUser.id,
        date: entry.date,
        exam: entry.exam,
        paper: entry.paper,
        file_name: entry.fileName,
        total: entry.total,
        correct: entry.correct,
        wrong: entry.wrong,
        unattempted: entry.unattempted,
        attempted: entry.attempted,
        accuracy: entry.accuracy,
        score: entry.score,
        max_marks: entry.maxMarks,
        time_used: entry.timeUsed,
        time_limit: entry.timeLimit,
        xp: entry.xp,
        subjects: entry.subjects
      });
      await saveProfile();
    } catch (e) {
      console.warn("Error inserting attempt to Supabase:", e);
    }
  } else {
    try {
      localStorage.setItem(GAMO_KEY, JSON.stringify(gamo));
      localStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
    } catch (e) {}
  }

  return { xp, leveledUp: newLevel > oldLevel, newLevel, newBadges };
}

function renderHeaderGamification() {
  const info = getLevelInfo(gamo.totalXP);
  el("levelChipNum").textContent = "L" + info.level;
  el("levelChip").title = info.intoLevel + " / " + info.span + " XP to next level";

  const goal = Math.max(1, prefs.dailyGoal);
  const todayCount = todayAttemptCount();
  const pct = Math.min(1, todayCount / goal);
  const C = 2 * Math.PI * 18;
  el("goalMiniRing").setAttribute("stroke-dasharray", C);
  el("goalMiniRing").setAttribute("stroke-dashoffset", C * (1 - pct));
  el("goalMiniLabel").textContent = todayCount + "/" + goal;
  el("goalMini").title = "Daily goal: " + todayCount + " / " + goal + " mocks completed";
}

function renderProfile() {
  const info = getLevelInfo(gamo.totalXP);
  el("profileLevelNum").textContent = info.level;
  el("profileXPBar").style.width = info.pct + "%";
  el("profileTotalXP").textContent = gamo.totalXP.toLocaleString() + " XP";
  el("profileXPText").textContent = info.intoLevel + " / " + info.span + " XP to Level " + (info.level + 1);
  el("profileAttempts").textContent = gamo.history.length;

  const C = 2 * Math.PI * 58;
  el("profileLevelRing").setAttribute("stroke-dasharray", C);
  el("profileLevelRing").setAttribute("stroke-dashoffset", C * (1 - info.pct / 100));

  const goal = Math.max(1, prefs.dailyGoal);
  const todayCount = todayAttemptCount();
  const gPct = Math.min(1, todayCount / goal);
  const gC = 2 * Math.PI * 30;
  el("goalBigRing").setAttribute("stroke-dasharray", gC);
  el("goalBigRing").setAttribute("stroke-dashoffset", gC * (1 - gPct));
  el("goalBigLabel").textContent = todayCount + "/" + goal;
  el("goalBigText").innerHTML = "<strong>" + todayCount + " / " + goal + "</strong> mocks completed today" +
    (todayCount >= goal ? ' <span style="color:var(--emerald);font-weight:800;">(Goal Reached! 🎉)</span>' : '');

  const earned = new Set(gamo.badges || []);
  const bg = el("badgesGrid");
  bg.innerHTML = BADGES.map(b => {
    const has = earned.has(b.id);
    return '<div class="badge ' + (has ? "earned" : "") + '">' +
      '<div class="b-icon">' + b.icon + '</div>' +
      '<div class="b-name">' + b.name + '</div>' +
      '<div class="b-desc">' + b.desc + '</div>' +
      '</div>';
  }).join("");

  const hw = el("historyTableWrap");
  if (gamo.history.length === 0) {
    hw.innerHTML = '<div class="history-empty" style="padding:20px;text-align:center;color:var(--text-muted);">No attempts logged yet. Complete a mock test to build your history!</div>';
  } else {
    hw.innerHTML = '<table class="history-table"><thead><tr>' +
      '<th>Date</th><th>Exam / Paper</th><th>Score</th><th>Acc</th><th>Time</th><th>XP</th>' +
      '</tr></thead><tbody>' +
      gamo.history.slice(0, 50).map(h =>
        '<tr>' +
        '<td>' + h.date + '</td>' +
        '<td><strong>' + (h.paper || h.exam) + '</strong></td>' +
        '<td>' + Number(h.score).toFixed(1) + ' / ' + h.maxMarks + '</td>' +
        '<td>' + h.accuracy + '%</td>' +
        '<td>' + fmtTime(h.timeUsed) + '</td>' +
        '<td>+' + h.xp + '</td>' +
        '</tr>'
      ).join("") +
      '</tbody></table>';
  }
}

function showLevelUp(lvl, badges) {
  el("luLevel").textContent = "Level " + lvl + "!";
  const wrap = el("luBadges");
  if (badges && badges.length) {
    wrap.innerHTML = '<div style="font-weight:700;margin:12px 0 6px;color:var(--accent-primary);">New Badges Unlocked:</div>' +
      '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">' +
      badges.map(id => {
        const b = BADGES.find(x => x.id === id);
        return b ? '<span class="chip chip-accent">' + b.icon + ' ' + b.name + '</span>' : '';
      }).join("") + '</div>';
  } else {
    wrap.innerHTML = "";
  }
  el("levelupOverlay").classList.remove("hidden");
}

/* =====================================================================
   REPORTS — CSV + PRINTABLE PDF
   ===================================================================== */
function downloadCSV() {
  if (gamo.history.length === 0) {
    toast("No attempts to export!", "⚠️");
    return;
  }
  const headers = ["ID", "Date", "Timestamp", "Exam", "Paper", "File", "Total Qs", "Correct", "Wrong", "Unattempted", "Attempted", "Accuracy %", "Score", "Max Marks", "Time Used (s)", "Time Limit (s)", "XP Earned"];
  const rows = gamo.history.map(h => [
    h.id, h.date, h.timestamp, '"' + (h.exam || "").replace(/"/g, '""') + '"',
    '"' + (h.paper || "").replace(/"/g, '""') + '"',
    '"' + (h.fileName || "").replace(/"/g, '""') + '"',
    h.total, h.correct, h.wrong, h.unattempted, h.attempted, h.accuracy,
    h.score, h.maxMarks, h.timeUsed, h.timeLimit, h.xp
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "sebi_mock_history_" + todayStr() + ".csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printReportCard() {
  const info = getLevelInfo(gamo.totalXP);
  const totalAttempts = gamo.history.length;
  const avgAcc = totalAttempts ? Math.round(gamo.history.reduce((s, h) => s + (Number(h.accuracy) || 0), 0) / totalAttempts) : 0;
  const totalCorrect = gamo.history.reduce((s, h) => s + (Number(h.correct) || 0), 0);
  const totalWrong = gamo.history.reduce((s, h) => s + (Number(h.wrong) || 0), 0);
  const totalTime = gamo.history.reduce((s, h) => s + (Number(h.timeUsed) || 0), 0);

  const subjectAgg = {};
  gamo.history.forEach(h => {
    const subs = h.subjects || {};
    Object.keys(subs).forEach(k => {
      if (!subjectAgg[k]) subjectAgg[k] = { total: 0, correct: 0, wrong: 0 };
      subjectAgg[k].total += subs[k].total || 0;
      subjectAgg[k].correct += subs[k].correct || 0;
      subjectAgg[k].wrong += subs[k].wrong || 0;
    });
  });

  const earned = new Set(gamo.badges || []);
  const badgeHTML = BADGES.filter(b => earned.has(b.id)).map(b =>
    '<span style="display:inline-block;padding:4px 8px;margin:2px;background:#f3f4f6;border-radius:6px;font-size:12px;">' + b.icon + ' ' + b.name + '</span>'
  ).join(" ") || '<span style="color:#9ca3af;font-style:italic;">No badges earned yet</span>';

  const html =
    '<div class="report-card">' +
      '<h1>SEBI Grade A · IT Officer — Mock Report Card</h1>' +
      '<div class="rc-meta">Generated on ' + new Date().toLocaleString() + ' · Candidate Summary</div>' +
      '<div class="rc-summary">' +
        '<div class="rc-stat"><div class="v">Level ' + info.level + '</div><div class="l">Current Level (' + gamo.totalXP + ' XP)</div></div>' +
        '<div class="rc-stat"><div class="v">' + totalAttempts + '</div><div class="l">Mocks Completed</div></div>' +
        '<div class="rc-stat"><div class="v">' + avgAcc + '%</div><div class="l">Average Accuracy</div></div>' +
        '<div class="rc-stat"><div class="v">' + (streakData.streak || 0) + ' Days</div><div class="l">Current Streak (Best: ' + (streakData.best || 0) + ')</div></div>' +
      '</div>' +
      '<div class="rc-section"><h3>Subject Breakdown</h3>' +
      (Object.keys(subjectAgg).length === 0 ? '<div style="color:#9ca3af;font-style:italic;padding:8px 0;">No sectional data recorded.</div>' :
        '<table><thead><tr><th>Subject</th><th>Questions</th><th>Correct</th><th>Wrong</th><th>Accuracy</th></tr></thead><tbody>' +
        Object.keys(subjectAgg).map(k => {
          const s = subjectAgg[k];
          const acc = s.total ? Math.round((s.correct / s.total) * 100) : 0;
          return '<tr><td><strong>' + k + '</strong></td><td>' + s.total + '</td><td>' + s.correct + '</td><td>' + s.wrong + '</td><td>' + acc + '%</td></tr>';
        }).join("") + '</tbody></table>') +
      '</div>' +
      '<div class="rc-section"><h3>Badges Earned</h3>' + badgeHTML + '</div>' +
      '<div class="rc-section"><h3>Attempt History (Latest 50)</h3>' +
      (gamo.history.length === 0 ? '<div style="color:#9ca3af;font-style:italic;padding:8px 0;">No attempts yet.</div>' :
        '<table><thead><tr><th>Date</th><th>Exam / Paper</th><th>Score</th><th>Acc</th><th>Time</th><th>XP</th></tr></thead><tbody>' +
        gamo.history.slice(0, 50).map(h =>
          '<tr><td>' + h.date + '</td><td>' + (h.paper || h.exam) + '</td><td>' + Number(h.score).toFixed(1) + ' / ' + h.maxMarks + '</td><td>' + h.accuracy + '%</td><td>' + fmtTime(h.timeUsed) + '</td><td>+' + h.xp + '</td></tr>'
        ).join("") + '</tbody></table>') +
      '</div>' +
    '</div>';

  el("reportPrintArea").innerHTML = html;
  showModal("reportModal");
}

/* =====================================================================
   AUDIO BEEP & TOAST
   ===================================================================== */
function toast(msg, icon = "⚡") {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = '<span>' + icon + '</span><span>' + msg + '</span>';
  document.body.appendChild(t);
  setTimeout(() => { if (t.parentElement) t.remove(); }, 3200);
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [0, 0.15, 0.3].forEach(off => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, now + off);
      gain.gain.exponentialRampToValueAtTime(0.001, now + off + 0.12);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + off); osc.stop(now + off + 0.15);
    });
  } catch (e) {}
}

/* =====================================================================
   CORE FLOW — SECTIONS, TIMERS, EXAM ARENA
   ===================================================================== */
function showScreen(screenId) {
  ["loadScreen", "startScreen", "testScreen", "resultScreen"].forEach(id => {
    el(id).classList.add("hidden");
  });
  el(screenId).classList.remove("hidden");
  window.scrollTo(0, 0);
}

function clearAppState() {
  clearInterval(state.timerInterval);
  state = {
    data: null,
    questions: [],
    sections: [],
    hasSectionalTiming: false,
    currentSectionIndex: 0,
    lockedSections: new Set(),
    sectionSecondsLeft: 0,
    totalSecondsLeft: 0,
    answers: {},
    marked: new Set(),
    visited: new Set(),
    currentIndex: 0,
    totalSeconds: 0,
    secondsLeft: 0,
    timerInterval: null,
    submitted: false,
    fileName: "",
    fiveMinAlerted: false
  };
  paletteButtons = [];
  if (palette) palette.innerHTML = "";
  if (options) options.innerHTML = "";
  const itemsList = el("reviewItemsList") || reviewContainer;
  if (itemsList) itemsList.innerHTML = "";
  reviewContainer.classList.add("hidden");
  reviewBtn.textContent = "📖 Show Detailed Review";
  fileInput.value = "";
  fileNameDisplay.textContent = "Choose or drop a .json question file";
  loadError.textContent = "";

  // Reset inputs and buttons
  submitBtn.disabled = false;
  nextBtn.disabled = false;
  prevBtn.disabled = false;
  clearBtn.disabled = false;
  markBtn.disabled = false;
}

function resetApp() {
  clearAppState();
  showScreen("loadScreen");
}

function validateData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return "Root JSON must be an object.";

  let questionList = [];
  if (Array.isArray(data.sections) && data.sections.length > 0) {
    for (let s = 0; s < data.sections.length; s++) {
      const sec = data.sections[s];
      if (!sec || typeof sec !== "object") return "Section " + (s + 1) + " is invalid.";
      if (!Array.isArray(sec.questions) || sec.questions.length === 0) return "Section " + (sec.name || (s + 1)) + " must have non-empty questions array.";
      questionList = questionList.concat(sec.questions);
    }
  } else if (Array.isArray(data.questions) && data.questions.length > 0) {
    questionList = data.questions;
  } else {
    return "JSON must contain either a non-empty 'questions' array or 'sections' array.";
  }

  const ids = new Set();
  for (let i = 0; i < questionList.length; i++) {
    const q = questionList[i];
    if (!q || typeof q !== "object") return "Question " + (i + 1) + " is invalid.";
    if (!q.id) return "Question " + (i + 1) + " is missing id.";
    if (ids.has(q.id)) return "Duplicate question id: " + q.id;
    ids.add(q.id);
    if (!q.question || typeof q.question !== "string") return "Question " + q.id + " is missing question text.";
    if ((q.type || "mcq") !== "mcq") return "Question " + q.id + ": only type mcq is supported in this version.";
    if (!Array.isArray(q.options) || q.options.length < 2) return "Question " + q.id + " needs at least 2 options.";
    const optionIds = new Set();
    for (const opt of q.options) {
      if (!opt || typeof opt !== "object") return "Question " + q.id + " has an invalid option.";
      if (!opt.id || typeof opt.text !== "string") return "Question " + q.id + " options need id and text.";
      if (optionIds.has(opt.id)) return "Question " + q.id + " has duplicate option id: " + opt.id;
      optionIds.add(opt.id);
    }
    if (!q.correct_option_id || !optionIds.has(q.correct_option_id)) {
      return "Question " + q.id + " is missing a valid correct_option_id.";
    }
  }
  return null;
}

function addChip(container, text, extraClass = "") {
  const span = document.createElement("span");
  span.className = "chip " + extraClass;
  span.textContent = text;
  container.appendChild(span);
}

/* =====================================================================
   START SCREEN TIMER & SECTION BUILDER
   ===================================================================== */
function setupTimerConfigUI(data) {
  const totalQuestions = state.questions.length;
  const meta = data.meta || {};
  let defaultDuration = Number(meta.duration_minutes || 20);
  if (defaultDuration <= 0) defaultDuration = 20;

  // Check if sections are pre-defined in uploaded JSON
  let preDefinedSections = [];
  if (Array.isArray(data.sections) && data.sections.length > 0) {
    let qOffset = 0;
    preDefinedSections = data.sections.map((sec, sIdx) => {
      const qLen = (sec.questions || []).length;
      const sObj = {
        id: sec.id || ("sec_" + (sIdx + 1)),
        name: sec.name || sec.title || ("Section " + (sIdx + 1)),
        duration_minutes: Number(sec.duration_minutes || sec.time_limit_minutes || 4),
        startIndex: qOffset,
        endIndex: qOffset + qLen - 1,
        count: qLen
      };
      qOffset += qLen;
      return sObj;
    });
  }

  if (preDefinedSections.length > 0) {
    userTimerConfig.mode = "sectional";
    userTimerConfig.sectionCount = preDefinedSections.length;
    userTimerConfig.sections = preDefinedSections;
    userTimerConfig.normalDuration = preDefinedSections.reduce((s, x) => s + x.duration_minutes, 0) || defaultDuration;
  } else {
    userTimerConfig.mode = "normal";
    userTimerConfig.normalDuration = defaultDuration;
    userTimerConfig.sectionCount = Math.min(2, Math.max(1, totalQuestions));
    partitionQuestionsIntoSections(userTimerConfig.sectionCount);
  }

  // Set radio choice safely
  const tmSec = el("tmSectionalOption");
  const tmNorm = el("tmNormalOption");
  const normCfg = el("normalTimerConfig");
  const secCfg = el("sectionalTimerConfig");

  if (userTimerConfig.mode === "sectional") {
    if (tmSec) {
      const inp = tmSec.querySelector("input");
      if (inp) inp.checked = true;
      tmSec.classList.add("active");
    }
    if (tmNorm) tmNorm.classList.remove("active");
    if (normCfg) normCfg.classList.add("hidden");
    if (secCfg) secCfg.classList.remove("hidden");
  } else {
    if (tmNorm) {
      const inp = tmNorm.querySelector("input");
      if (inp) inp.checked = true;
      tmNorm.classList.add("active");
    }
    if (tmSec) tmSec.classList.remove("active");
    if (normCfg) normCfg.classList.remove("hidden");
    if (secCfg) secCfg.classList.add("hidden");
  }

  const totInp = el("totalPaperMinutesInput");
  if (totInp) totInp.value = userTimerConfig.normalDuration;
  const secCntInp = el("sectionCountInput");
  if (secCntInp) {
    secCntInp.value = userTimerConfig.sectionCount;
    secCntInp.max = Math.min(10, Math.max(1, totalQuestions));
  }

  renderSectionsBuilderList();
  updateStartButtonSummary();
}

function partitionQuestionsIntoSections(count) {
  const totalQuestions = state.questions.length;
  count = Math.max(1, Math.min(count, Math.max(1, totalQuestions)));
  userTimerConfig.sectionCount = count;

  const previousSections = userTimerConfig.sections || [];
  userTimerConfig.sections = [];

  const baseSize = Math.floor(totalQuestions / count);
  let remainder = totalQuestions % count;
  let currentStart = 0;

  for (let i = 0; i < count; i++) {
    const size = baseSize + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    const end = currentStart + size - 1;

    // Check if previous section had custom name or duration
    const existing = previousSections[i];
    const sName = existing && existing.name ? existing.name : ("Section " + (i + 1));
    const sDur = existing && existing.duration_minutes ? existing.duration_minutes : Math.max(1, Math.round(userTimerConfig.normalDuration / count));

    userTimerConfig.sections.push({
      id: "sec_" + (i + 1),
      name: sName,
      duration_minutes: sDur,
      startIndex: currentStart,
      endIndex: end,
      count: size
    });
    currentStart = end + 1;
  }
}

function recalculateQuestionRanges() {
  let currentStart = 0;
  userTimerConfig.sections.forEach((sec, idx) => {
    const count = Math.max(1, parseInt(sec.count, 10) || 1);
    sec.count = count;
    sec.startIndex = currentStart;
    sec.endIndex = currentStart + count - 1;
    currentStart = sec.endIndex + 1;

    const rangeEl = el("secRange_" + idx);
    if (rangeEl) {
      rangeEl.textContent = "Questions Q" + (sec.startIndex + 1) + " to Q" + (sec.endIndex + 1) + " (" + sec.count + " Q" + (sec.count === 1 ? "" : "s") + ")";
    }
  });

  updateSectionalSummary();
}

function renderSectionsBuilderList() {
  const totalQuestions = state.questions.length;
  const builderContainer = el("sectionsBuilderList");
  if (!builderContainer) return;

  builderContainer.innerHTML = userTimerConfig.sections.map((sec, idx) => {
    return '<div class="sec-build-row" data-idx="' + idx + '">' +
      '<div class="sec-build-num">' + (idx + 1) + '</div>' +
      '<div class="sec-build-info">' +
        '<input type="text" class="sec-build-name-input" value="' + (sec.name || ("Section " + (idx + 1))) + '" placeholder="Section Name" data-idx="' + idx + '" />' +
        '<div class="sec-build-qrange" id="secRange_' + idx + '">Questions Q' + (sec.startIndex + 1) + ' to Q' + (sec.endIndex + 1) + ' (' + sec.count + ' Q' + (sec.count === 1 ? "" : "s") + ')</div>' +
      '</div>' +
      '<div class="sec-build-controls">' +
        '<div class="sec-ctrl-group">' +
          '<label>Questions:</label>' +
          '<input type="number" min="1" max="' + Math.max(500, totalQuestions) + '" class="sec-qcount-input" value="' + (sec.count || 1) + '" data-idx="' + idx + '" />' +
          '<span class="unit-label">Qs</span>' +
        '</div>' +
        '<div class="sec-ctrl-group">' +
          '<label>Time Limit:</label>' +
          '<input type="number" min="1" max="300" class="sec-time-input" value="' + (sec.duration_minutes || 4) + '" data-idx="' + idx + '" />' +
          '<span class="unit-label">min</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join("");

  // Wire up change listeners on dynamic inputs
  builderContainer.querySelectorAll(".sec-build-name-input").forEach(inp => {
    inp.addEventListener("input", e => {
      const idx = parseInt(e.target.dataset.idx, 10);
      if (userTimerConfig.sections[idx]) {
        userTimerConfig.sections[idx].name = e.target.value || ("Section " + (idx + 1));
      }
    });
  });

  builderContainer.querySelectorAll(".sec-qcount-input").forEach(inp => {
    const handleQCountChange = (e) => {
      const idx = parseInt(e.target.dataset.idx, 10);
      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
      if (userTimerConfig.sections[idx]) {
        userTimerConfig.sections[idx].count = val;
      }
      recalculateQuestionRanges();
      updateStartButtonSummary();
    };
    inp.addEventListener("input", handleQCountChange);
    inp.addEventListener("change", handleQCountChange);
  });

  builderContainer.querySelectorAll(".sec-time-input").forEach(inp => {
    const handleTimeChange = (e) => {
      const idx = parseInt(e.target.dataset.idx, 10);
      const val = Math.max(1, Math.min(300, parseInt(e.target.value, 10) || 1));
      if (userTimerConfig.sections[idx]) {
        userTimerConfig.sections[idx].duration_minutes = val;
      }
      updateSectionalSummary();
      updateStartButtonSummary();
    };
    inp.addEventListener("input", handleTimeChange);
    inp.addEventListener("change", handleTimeChange);
  });

  updateSectionalSummary();
}

function updateSectionalSummary() {
  const totalQuestions = state.questions.length;
  const totalAllocated = userTimerConfig.sections.reduce((s, x) => s + (parseInt(x.count, 10) || 0), 0);
  const totalDuration = userTimerConfig.sections.reduce((s, x) => s + (Number(x.duration_minutes) || 0), 0);

  const timeEl = el("sectionalTotalTimeCalc");
  if (timeEl) timeEl.textContent = totalDuration + " min";

  const qsEl = el("sectionalTotalQsCalc");
  if (qsEl) {
    if (totalAllocated === totalQuestions) {
      qsEl.innerHTML = '<span style="color:var(--emerald,#10b981);font-weight:700;">' + totalAllocated + ' / ' + totalQuestions + ' Qs (Exact ✓)</span>';
    } else if (totalAllocated < totalQuestions) {
      const diff = totalQuestions - totalAllocated;
      qsEl.innerHTML = '<span style="color:var(--amber,#f59e0b);font-weight:700;">' + totalAllocated + ' / ' + totalQuestions + ' Qs (' + diff + ' unassigned)</span>';
    } else {
      const diff = totalAllocated - totalQuestions;
      qsEl.innerHTML = '<span style="color:var(--rose,#ef4444);font-weight:700;">' + totalAllocated + ' / ' + totalQuestions + ' Qs (' + diff + ' extra)</span>';
    }
  }

  const hintEl = el("sectionDistHint");
  if (hintEl) {
    hintEl.textContent = "Customizing " + totalAllocated + " allocated questions across " + userTimerConfig.sectionCount + " sections (" + totalDuration + " min total):";
  }
}

function updateStartButtonSummary() {
  if (userTimerConfig.mode === "sectional") {
    const sumTime = userTimerConfig.sections.reduce((s, x) => s + (Number(x.duration_minutes) || 0), 0);
    const sumQs = userTimerConfig.sections.reduce((s, x) => s + (parseInt(x.count, 10) || 0), 0);
    if (startBtnText) {
      startBtnText.textContent = "🚀 Start Sectional Mock (" + sumTime + " Min · " + userTimerConfig.sectionCount + " Sections · " + sumQs + " Qs)";
    }
  } else {
    if (startBtnText) {
      startBtnText.textContent = "🚀 Start Test Now (" + userTimerConfig.normalDuration + " Min · " + state.questions.length + " Qs)";
    }
  }
}

// Start screen timer config event listeners
if (tmNormalOption && tmSectionalOption) {
  tmNormalOption.addEventListener("click", () => {
    userTimerConfig.mode = "normal";
    const inp = tmNormalOption.querySelector("input");
    if (inp) inp.checked = true;
    tmNormalOption.classList.add("active");
    tmSectionalOption.classList.remove("active");
    if (normalTimerConfig) normalTimerConfig.classList.add("hidden"); // Ensure correct show/hide
    if (normalTimerConfig) normalTimerConfig.classList.remove("hidden");
    if (sectionalTimerConfig) sectionalTimerConfig.classList.add("hidden");
    updateStartButtonSummary();
  });

  tmSectionalOption.addEventListener("click", () => {
    userTimerConfig.mode = "sectional";
    const inp = tmSectionalOption.querySelector("input");
    if (inp) inp.checked = true;
    tmSectionalOption.classList.add("active");
    tmNormalOption.classList.remove("active");
    if (normalTimerConfig) normalTimerConfig.classList.add("hidden");
    if (sectionalTimerConfig) sectionalTimerConfig.classList.remove("hidden");
    updateStartButtonSummary();
  });
}

if (totalPaperMinutesInput) {
  totalPaperMinutesInput.addEventListener("input", e => {
    const val = Math.max(1, Math.min(300, parseInt(e.target.value, 10) || 20));
    userTimerConfig.normalDuration = val;
    updateStartButtonSummary();
  });
  totalPaperMinutesInput.addEventListener("change", e => {
    const val = Math.max(1, Math.min(300, parseInt(e.target.value, 10) || 20));
    e.target.value = val;
    userTimerConfig.normalDuration = val;
    updateStartButtonSummary();
  });
}

if (sectionCountInput) {
  sectionCountInput.addEventListener("change", e => {
    const totalQuestions = state.questions.length;
    const val = Math.max(1, Math.min(totalQuestions, Math.min(10, parseInt(e.target.value, 10) || 2)));
    e.target.value = val;
    partitionQuestionsIntoSections(val);
    renderSectionsBuilderList();
    updateStartButtonSummary();
  });
}

const autoSplitBtn = el("autoSplitQsBtn");
if (autoSplitBtn) {
  autoSplitBtn.addEventListener("click", () => {
    partitionQuestionsIntoSections(userTimerConfig.sectionCount);
    renderSectionsBuilderList();
    updateStartButtonSummary();
  });
}

function loadData(data, sourceName) {
  const error = validateData(data);
  if (error) {
    loadError.textContent = error;
    showScreen("loadScreen");
    return;
  }

  state.data = data;
  state.fileName = sourceName;
  state.sections = [];
  state.hasSectionalTiming = false;

  let allQuestions = [];
  if (Array.isArray(data.sections) && data.sections.length > 0) {
    data.sections.forEach((sec, sIdx) => {
      (sec.questions || []).forEach(q => {
        allQuestions.push(q);
      });
    });
  } else {
    allQuestions = data.questions || [];
  }
  state.questions = allQuestions;

  const totalMarks = state.questions.reduce((s, q) => s + (Number(q.marks) || 1), 0);
  const meta = data.meta || {};

  startExamName.textContent = meta.exam_name || "SEBI Grade A Mock Test";
  startChips.innerHTML = "";
  addChip(startChips, meta.paper || "Paper 2 · IT");
  addChip(startChips, state.questions.length + " Questions");
  addChip(startChips, "Max " + totalMarks + " Marks");
  addChip(startChips, "Negative Marking: " + (meta.negative_marking != null ? meta.negative_marking : "0.25"));
  if (prefs.shuffle) addChip(startChips, "🔀 Shuffled Order");

  el("startSettingsSummary").innerHTML =
    '<span class="muted" style="font-size:13px;font-weight:700;">Active Preferences:</span> ' +
    '<span class="chip">' + (prefs.theme === "dark" ? "☾ Dark Theme" : "☀ Light Theme") + '</span>' +
    '<span class="chip">Font ' + prefs.fontSize.toUpperCase() + '</span>' +
    '<span class="chip">Timer ' + prefs.timerPosition + '</span>' +
    '<span class="chip">5-Min Alert ' + (prefs.soundAlert5min ? "On" : "Off") + '</span>';

  // Setup interactive timer configuration UI
  setupTimerConfigUI(data);

  loadError.textContent = "";
  showScreen("startScreen");
}

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    let parsed;
    try {
      parsed = JSON.parse(e.target.result);
    } catch (parseErr) {
      loadError.textContent = "Invalid JSON syntax: " + parseErr.message;
      showScreen("loadScreen");
      return;
    }

    try {
      fileNameDisplay.textContent = file.name;
      loadData(parsed, file.name);
    } catch (err) {
      console.error("Error loading question paper:", err);
      loadError.textContent = "Error loading mock data: " + err.message;
      showScreen("loadScreen");
    }
  };
  reader.readAsText(file);
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startTest() {
  state.answers = {};
  state.marked = new Set();
  state.visited = new Set();
  state.currentIndex = 0;
  state.currentSectionIndex = 0;
  state.lockedSections = new Set();
  state.submitted = false;
  state.fiveMinAlerted = false;

  // Re-enable controls
  submitBtn.disabled = false;
  nextBtn.disabled = false;
  prevBtn.disabled = false;
  clearBtn.disabled = false;
  markBtn.disabled = false;

  clearInterval(state.timerInterval);

  const meta = (state.data && state.data.meta) || {};

  // Apply user-configured timing mode
  if (userTimerConfig.mode === "sectional") {
    state.hasSectionalTiming = true;
    state.sections = [];

    // Ensure ranges are recalculated and synced with DOM inputs
    recalculateQuestionRanges();

    const totalAllocated = userTimerConfig.sections.reduce((s, x) => s + (parseInt(x.count, 10) || 0), 0);
    if (totalAllocated < state.questions.length) {
      state.questions = state.questions.slice(0, totalAllocated);
    }

    // Tag questions with configured sections
    userTimerConfig.sections.forEach((sec, sIdx) => {
      const qIndices = [];
      for (let i = sec.startIndex; i <= sec.endIndex && i < state.questions.length; i++) {
        state.questions[i]._sectionId = sec.id;
        state.questions[i]._sectionName = sec.name;
        state.questions[i]._sectionIndex = sIdx;
        qIndices.push(i);
      }
      state.sections.push({
        id: sec.id,
        name: sec.name,
        duration_minutes: Number(sec.duration_minutes || 4),
        questionIndices: qIndices
      });
    });

    // Handle shuffle within sections if enabled
    if (prefs.shuffle) {
      let reordered = [];
      state.sections.forEach((sec, sIdx) => {
        const secQs = state.questions.filter(q => q._sectionIndex === sIdx);
        const shuffled = shuffleArray(secQs);
        const newIndices = [];
        shuffled.forEach(q => {
          newIndices.push(reordered.length);
          reordered.push(q);
        });
        sec.questionIndices = newIndices;
      });
      state.questions = reordered;
    }

    const totalSectionalMinutes = state.sections.reduce((s, x) => s + (Number(x.duration_minutes) || 0), 0);
    state.totalSeconds = totalSectionalMinutes * 60;
    state.totalSecondsLeft = state.totalSeconds;

    const firstSec = state.sections[0];
    state.sectionSecondsLeft = (firstSec ? firstSec.duration_minutes : 4) * 60;

    sectionTimerWrap.classList.remove("hidden");
    sectionTabBar.classList.remove("hidden");
    renderSectionTabBar();
  } else {
    // Normal whole-paper timer
    state.hasSectionalTiming = false;
    state.sections = [];
    state.questions.forEach(q => {
      delete q._sectionId;
      delete q._sectionName;
      delete q._sectionIndex;
    });

    if (prefs.shuffle) {
      state.questions = shuffleArray(state.questions);
    }

    state.totalSeconds = userTimerConfig.normalDuration * 60;
    state.secondsLeft = state.totalSeconds;

    sectionTimerWrap.classList.add("hidden");
    sectionTabBar.classList.add("hidden");
  }

  examTitle.textContent = meta.exam_name || "Mock Test";
  paperTitle.textContent = [meta.paper, state.fileName].filter(Boolean).join(" | ");

  const header = el("testScreen").querySelector(".test-header");
  if (header) header.classList.toggle("timer-bottom", prefs.timerPosition === "bottom");

  buildPalette();
  renderQuestion();
  showScreen("testScreen");
  startTimer();
}

function renderSectionTabBar() {
  if (!state.hasSectionalTiming || !sectionTabBar) return;
  sectionTabBar.innerHTML = state.sections.map((sec, sIdx) => {
    let cls = "sec-tab";
    let badge = "";
    if (state.lockedSections.has(sec.id)) {
      cls += " locked";
      badge = '<span class="sec-tab-badge">🔒 LOCKED</span>';
    } else if (sIdx === state.currentSectionIndex) {
      cls += " active";
      badge = '<span class="sec-tab-badge">⚡ ACTIVE</span>';
    } else {
      cls += " upcoming";
      badge = '<span class="sec-tab-badge">⏳ ' + (sec.duration_minutes || 0) + 'm</span>';
    }
    return '<div class="' + cls + '"><span>' + sec.name + '</span>' + badge + '</div>';
  }).join("");
}

function buildPalette() {
  palette.innerHTML = "";
  paletteButtons = [];
  state.questions.forEach((q, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = index + 1;
    btn.className = "palette-btn";
    btn.addEventListener("click", () => goToQuestion(index));
    palette.appendChild(btn);
    paletteButtons.push(btn);
  });
  updatePalette();
}

function updatePalette() {
  state.questions.forEach((q, index) => {
    const btn = paletteButtons[index];
    if (!btn) return;
    btn.className = "palette-btn";

    if (state.hasSectionalTiming) {
      if (state.lockedSections.has(q._sectionId)) {
        btn.classList.add("locked");
        btn.title = "Section Locked";
      } else if (q._sectionIndex > state.currentSectionIndex) {
        btn.classList.add("upcoming");
        btn.title = "Upcoming Section";
      }
    }

    if (state.answers[q.id]) btn.classList.add("answered");
    else if (state.visited.has(q.id)) btn.classList.add("unanswered");
    if (state.marked.has(q.id)) btn.classList.add("marked");
    if (index === state.currentIndex) btn.classList.add("current");
  });

  const countChip = el("paletteCountChip");
  if (countChip) countChip.textContent = state.questions.length + " Questions";
}

function updateOptionStyles() {
  options.querySelectorAll(".option").forEach(label => {
    const input = label.querySelector("input");
    label.classList.toggle("selected", input.checked);
  });
}

function renderQuestion() {
  if (state.submitted) return;
  const q = state.questions[state.currentIndex];
  if (!q) return;
  state.visited.add(q.id);

  questionChips.innerHTML = "";
  addChip(questionChips, "Q" + (state.currentIndex + 1) + " / " + state.questions.length);
  if (q._sectionName) addChip(questionChips, "Section: " + q._sectionName, "chip-accent");
  addChip(questionChips, q.subject || "General");
  if (q.topic) addChip(questionChips, q.topic);
  addChip(questionChips, "Marks: " + (q.marks != null ? q.marks : 1));
  if (q.difficulty) addChip(questionChips, q.difficulty);

  questionText.textContent = q.question;

  if (q.code) {
    codeBlock.textContent = q.code;
    codeBlock.classList.remove("hidden");
  } else {
    codeBlock.classList.add("hidden");
  }

  options.innerHTML = "";
  q.options.forEach((opt) => {
    const label = document.createElement("label");
    label.className = "option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.value = opt.id;
    input.checked = state.answers[q.id] === opt.id;
    input.addEventListener("change", () => selectOption(q.id, opt.id));

    const optBadge = document.createElement("span");
    optBadge.className = "chip chip-sm";
    optBadge.textContent = opt.id;
    optBadge.style.marginRight = "4px";

    const text = document.createElement("span");
    text.textContent = opt.text;

    label.appendChild(input);
    label.appendChild(optBadge);
    label.appendChild(text);
    options.appendChild(label);
  });
  updateOptionStyles();

  // Navigation button states
  if (state.hasSectionalTiming) {
    const curSec = state.sections[state.currentSectionIndex];
    const qIndices = curSec ? curSec.questionIndices : [];
    const isFirstInSec = qIndices.length > 0 && state.currentIndex === qIndices[0];
    const isLastInSec = qIndices.length > 0 && state.currentIndex === qIndices[qIndices.length - 1];
    
    prevBtn.disabled = isFirstInSec;
    if (isLastInSec) {
      if (state.currentSectionIndex < state.sections.length - 1) {
        nextBtn.textContent = "Complete Section →";
      } else {
        nextBtn.textContent = "Submit Test ✓";
      }
    } else {
      nextBtn.textContent = "Save & Next →";
    }
  } else {
    prevBtn.disabled = state.currentIndex === 0;
    nextBtn.textContent = state.currentIndex === state.questions.length - 1 ? "Submit Test ✓" : "Save & Next →";
  }

  markBtn.innerHTML = state.marked.has(q.id) ? '<span>🔖</span> Unmark Review' : '<span>🔖</span> Mark for Review';
  markBtn.classList.toggle("active", state.marked.has(q.id));
  updatePalette();
}

function selectOption(questionId, optionId) {
  if (state.submitted) return; // Prevent selection after submit
  const q = state.questions.find(x => x.id === questionId);
  if (q && state.hasSectionalTiming && state.lockedSections.has(q._sectionId)) {
    toast("⚠️ Section is locked. Answer cannot be changed.", "🔒");
    return;
  }
  state.answers[questionId] = optionId;
  updateOptionStyles();
  updatePalette();
}

function clearResponse() {
  if (state.submitted) return;
  const q = state.questions[state.currentIndex];
  if (q && state.hasSectionalTiming && state.lockedSections.has(q._sectionId)) {
    toast("⚠️ Section is locked. Cannot clear response.", "🔒");
    return;
  }
  delete state.answers[q.id];
  renderQuestion();
}

function toggleMarkForReview() {
  if (state.submitted) return;
  const q = state.questions[state.currentIndex];
  if (state.marked.has(q.id)) state.marked.delete(q.id);
  else state.marked.add(q.id);
  renderQuestion();
}

function goToQuestion(index) {
  if (state.submitted) return;
  if (index < 0 || index >= state.questions.length) return;
  const targetQ = state.questions[index];

  if (state.hasSectionalTiming) {
    if (state.lockedSections.has(targetQ._sectionId)) {
      toast("⚠️ Section '" + (targetQ._sectionName || "") + "' is locked and cannot be revisited.", "🔒");
      return;
    }
    if (targetQ._sectionIndex !== state.currentSectionIndex) {
      toast("⚠️ You must complete the active section before navigating to upcoming sections.", "⏳");
      return;
    }
  }

  state.currentIndex = index;
  renderQuestion();
}

function lockCurrentSection(isTimeout) {
  if (!state.hasSectionalTiming || state.currentSectionIndex >= state.sections.length) return;
  const curSec = state.sections[state.currentSectionIndex];
  state.lockedSections.add(curSec.id);

  if (isTimeout) {
    beep();
    toast("⏳ Time expired for " + curSec.name + "! Section is locked.", "🔒");
  } else {
    toast("🔒 " + curSec.name + " submitted and locked.", "🔒");
  }

  // Check if next section exists
  if (state.currentSectionIndex + 1 < state.sections.length) {
    state.currentSectionIndex++;
    const nextSec = state.sections[state.currentSectionIndex];
    state.sectionSecondsLeft = (nextSec.duration_minutes || 0) * 60;
    renderSectionTabBar();
    if (nextSec.questionIndices && nextSec.questionIndices.length > 0) {
      goToQuestion(nextSec.questionIndices[0]);
    }
  } else {
    // All sections completed -> submit test immediately
    submitTest(true);
  }
}

function completeCurrentSection() {
  const curSec = state.sections[state.currentSectionIndex];
  const isLastSec = state.currentSectionIndex === state.sections.length - 1;
  const promptText = isLastSec
    ? "Are you ready to submit the entire test?"
    : "Are you sure you want to complete and lock '" + curSec.name + "'? You will NOT be able to return to this section.";
  
  if (confirm(promptText)) {
    if (isLastSec) submitTest(false);
    else lockCurrentSection(false);
  }
}

function nextQuestion() {
  if (state.submitted) return;
  if (state.hasSectionalTiming) {
    const curSec = state.sections[state.currentSectionIndex];
    const qIndices = curSec ? curSec.questionIndices : [];
    const posInSec = qIndices.indexOf(state.currentIndex);

    if (posInSec === qIndices.length - 1) {
      completeCurrentSection();
    } else {
      goToQuestion(qIndices[posInSec + 1]);
    }
  } else {
    if (state.currentIndex === state.questions.length - 1) submitTest(false);
    else { state.currentIndex++; renderQuestion(); }
  }
}

function prevQuestion() {
  if (state.submitted) return;
  if (state.hasSectionalTiming) {
    const curSec = state.sections[state.currentSectionIndex];
    const qIndices = curSec ? curSec.questionIndices : [];
    const posInSec = qIndices.indexOf(state.currentIndex);
    if (posInSec > 0) {
      goToQuestion(qIndices[posInSec - 1]);
    }
  } else {
    if (state.currentIndex > 0) { state.currentIndex--; renderQuestion(); }
  }
}

function startTimer() {
  clearInterval(state.timerInterval);
  updateTimerDisplay();

  state.timerInterval = setInterval(() => {
    if (state.hasSectionalTiming) {
      state.sectionSecondsLeft--;
      state.totalSecondsLeft--;

      // 5-min alert
      if (prefs.soundAlert5min && !state.fiveMinAlerted && (state.sectionSecondsLeft === 300 || state.totalSecondsLeft === 300)) {
        state.fiveMinAlerted = true;
        beep();
        toast("⏰ 5 minutes remaining!", "⏰");
      }

      updateTimerDisplay();

      if (state.sectionSecondsLeft <= 0) {
        state.sectionSecondsLeft = 0;
        updateTimerDisplay();
        lockCurrentSection(true);
      }

      if (state.totalSecondsLeft <= 0) {
        state.totalSecondsLeft = 0;
        updateTimerDisplay();
        submitTest(true);
      }
    } else {
      state.secondsLeft--;
      if (prefs.soundAlert5min && !state.fiveMinAlerted && state.secondsLeft <= 300 && state.secondsLeft > 0) {
        state.fiveMinAlerted = true;
        beep();
        toast("⏰ 5 minutes left!", "⏰");
      }
      updateTimerDisplay();

      if (state.secondsLeft <= 0) {
        state.secondsLeft = 0;
        updateTimerDisplay();
        submitTest(true);
      }
    }
  }, 1000);
}

function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ":" + String(s).padStart(2, "0");
}

function updateTimerDisplay() {
  if (state.hasSectionalTiming) {
    sectionTimer.textContent = fmtTime(state.sectionSecondsLeft);
    sectionTimer.classList.remove("danger", "warning");
    if (state.sectionSecondsLeft <= 60) sectionTimer.classList.add("danger");
    else if (state.sectionSecondsLeft <= 180) sectionTimer.classList.add("warning");

    timer.textContent = fmtTime(state.totalSecondsLeft);
    timer.classList.remove("danger", "warning");
    if (state.totalSecondsLeft <= 120) timer.classList.add("danger");
    else if (state.totalSecondsLeft <= 300) timer.classList.add("warning");
  } else {
    timer.textContent = fmtTime(state.secondsLeft);
    timer.classList.remove("danger", "warning");
    if (state.secondsLeft <= 60) timer.classList.add("danger");
    else if (state.secondsLeft <= 300) timer.classList.add("warning");
  }
}

function calculateResult() {
  let correct = 0, wrong = 0, unattempted = 0;
  let gained = 0, lost = 0, maxMarks = 0;
  const negRate = Number(state.data && state.data.meta && state.data.meta.negative_marking != null
    ? state.data.meta.negative_marking : 0.25);

  state.questions.forEach(q => {
    const marks = Number(q.marks) || 1;
    maxMarks += marks;
    const selected = state.answers[q.id];
    if (!selected) { unattempted++; return; }
    if (selected === q.correct_option_id) { correct++; gained += marks; }
    else {
      wrong++;
      if (negRate > 0) lost += marks * negRate;
    }
  });
  const attempted = correct + wrong;
  const accuracy = attempted ? (correct / attempted) * 100 : 0;
  return { correct, wrong, unattempted, gained, lost, maxMarks, score: gained - lost, attempted, accuracy };
}

function renderResult(result, elapsed, gamoResult) {
  const meta = (state.data && state.data.meta) || {};
  const total = state.questions.length;

  resultSummaryEls.title.textContent = (meta.paper || "Mock Exam") + " — Complete";
  resultSummaryEls.subtitle.textContent =
    total + " questions · scored with " + (meta.negative_marking != null ? meta.negative_marking : 0.25) +
    " negative marking · max " + result.maxMarks + " marks" +
    (meta.full_paper_note ? " (" + meta.full_paper_note + ")" : "");

  const C = 2 * Math.PI * 118;
  const pct = result.maxMarks > 0 ? Math.max(0, Math.min(1, result.score / result.maxMarks)) : 0;
  resultSummaryEls.ring.setAttribute("stroke-dasharray", C);
  resultSummaryEls.ring.setAttribute("stroke-dashoffset", C * (1 - pct));
  resultSummaryEls.ringScore.textContent = result.score.toFixed(1);
  resultSummaryEls.ringLabel.textContent = "NET / " + result.maxMarks;

  resultSummaryEls.correct.textContent = result.correct + " (+" + result.gained.toFixed(2) + ")";
  resultSummaryEls.wrong.textContent = result.wrong + " (−" + result.lost.toFixed(2) + ")";
  resultSummaryEls.attempted.textContent = result.attempted + " / " + total;
  resultSummaryEls.accuracy.textContent = Math.round(result.accuracy) + "%";
  resultSummaryEls.time.textContent = fmtTime(elapsed);
  const pace = Math.round(elapsed / Math.max(1, total));
  resultSummaryEls.pace.textContent = pace + "s/Q" +
    (meta.official_pace_seconds ? " · official " + meta.official_pace_seconds + "s" : "");

  const targetSec = Math.max(30, Math.round((elapsed * 0.9) / 5) * 5);
  resultSummaryEls.targetTime.textContent = fmtTime(targetSec);
  resultSummaryEls.targetNote.textContent = "(next mock target pace)";

  let msg;
  if (result.accuracy === 100 && result.attempted === total) {
    msg = "Flawless Performance! 100% accuracy across all questions. Exam-ready speed and precision.";
  } else if (result.accuracy >= 80) {
    msg = "Excellent score! Maintain your pace and review tricky edge cases below.";
  } else if (result.accuracy >= 60) {
    msg = "Solid effort. Focus on weak topics in the solutions review to push past 80%.";
  } else {
    msg = "Consistent practice is key. Carefully review every explanation below.";
  }
  resultSummaryEls.targetMessage.textContent = msg;

  // XP Banner
  const xpBanner = el("xpBanner");
  const newBadgeHTML = (gamoResult.newBadges || []).map(id => {
    const b = BADGES.find(x => x.id === id);
    return b ? '<span class="chip" style="background:rgba(245,158,11,.18);border-color:rgba(245,158,11,.4);color:#b45309;">' + b.icon + ' ' + b.name + '</span>' : '';
  }).join("");
  xpBanner.innerHTML =
    '<div><div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Total XP Earned</div>' +
    '<div class="xp-amount">+' + gamoResult.xp + ' XP</div></div>' +
    (gamoResult.leveledUp ? '<span class="chip" style="background:rgba(255,255,255,.2);color:#fff;border-color:rgba(255,255,255,.4);">⭐ Level Up → L' + gamoResult.newLevel + '</span>' : '') +
    (newBadgeHTML ? '<div class="new-badges">' + newBadgeHTML + '</div>' : '');

  // Render question-by-question review items
  const itemsList = el("reviewItemsList") || reviewContainer;
  itemsList.innerHTML = "";
  state.questions.forEach((q, index) => {
    const selected = state.answers[q.id];
    let status = "unattempted";
    if (selected) status = selected === q.correct_option_id ? "correct" : "wrong";

    const item = document.createElement("div");
    item.className = "review-item " + status;
    const title = document.createElement("div");
    title.className = "review-title";
    title.textContent = "Q" + (index + 1) + ". " + (q._sectionName ? "[" + q._sectionName + "] " : "") + (q.subject || "General") +
      (q.topic ? " · " + q.topic : "") + " · " + status.toUpperCase();
    item.appendChild(title);

    const question = document.createElement("div");
    question.className = "review-question";
    question.textContent = q.question;
    item.appendChild(question);

    if (q.code) {
      const pre = document.createElement("pre");
      pre.className = "code";
      pre.textContent = q.code;
      item.appendChild(pre);
    }

    q.options.forEach(opt => {
      const optDiv = document.createElement("div");
      let cls = "review-option";
      if (opt.id === q.correct_option_id) cls += " correct";
      if (opt.id === selected) cls += " selected";
      optDiv.className = cls;
      let suffix = "";
      if (opt.id === q.correct_option_id) suffix += " ✓ Correct Answer";
      if (opt.id === selected) suffix += " • Your Response";
      optDiv.textContent = opt.id + ". " + opt.text + suffix;
      item.appendChild(optDiv);
    });

    if (q.explanation) {
      const exp = document.createElement("div");
      exp.className = "explanation";
      exp.innerHTML = "<strong>Explanation:</strong> " + q.explanation;
      item.appendChild(exp);
    }
    itemsList.appendChild(item);
  });

  reviewContainer.classList.add("hidden");
  reviewBtn.textContent = "📖 Show Detailed Review";

  if (gamoResult.leveledUp || (gamoResult.newBadges && gamoResult.newBadges.length > 0)) {
    setTimeout(() => showLevelUp(gamoResult.newLevel, gamoResult.newBadges), 600);
  }
}

// Instant & Synchronous Test Submission
function submitTest(autoSubmit) {
  if (state.submitted) return;
  const unanswered = state.questions.filter(q => !state.answers[q.id]).length;
  if (!autoSubmit && unanswered > 0) {
    if (!confirm("You have " + unanswered + " unanswered question(s). Submit test now?")) return;
  }
  
  clearInterval(state.timerInterval);
  state.submitted = true;

  // Immediately disable all answer inputs & controls to prevent further modifications
  options.querySelectorAll("input").forEach(inp => inp.disabled = true);
  submitBtn.disabled = true;
  nextBtn.disabled = true;
  prevBtn.disabled = true;
  clearBtn.disabled = true;
  markBtn.disabled = true;

  const elapsed = state.hasSectionalTiming
    ? (state.totalSeconds - state.totalSecondsLeft)
    : (state.totalSeconds - state.secondsLeft);

  const result = calculateResult();
  updateStreakOnSubmit();

  // Instant local rendering without network delay
  const initialXP = calculateAttemptXP(result, elapsed, state.questions.length);
  renderResult(result, elapsed, { xp: initialXP, leveledUp: false, newLevel: getLevelInfo(gamo.totalXP).level, newBadges: [] });
  renderHeaderGamification();
  showScreen("resultScreen");

  // Asynchronous cloud & local storage sync in background
  recordAttempt(result, elapsed).then(gamoResult => {
    renderResult(result, elapsed, gamoResult);
    renderHeaderGamification();
  }).catch(err => {
    console.warn("Background recordAttempt:", err);
  });
}

/* =====================================================================
   SETTINGS & MODALS
   ===================================================================== */
function openSettings() { renderSettingsUI(); showModal("settingsModal"); }
function openProfile() { renderProfile(); showModal("profileModal"); }

function showModal(id) {
  const modal = el(id);
  modal.classList.remove("hidden");
  const bd = modal.parentElement;
  if (bd && bd.classList.contains("modal-backdrop")) bd.classList.remove("hidden");
}
function hideModal(id) {
  const modal = el(id);
  modal.classList.add("hidden");
  const bd = modal.parentElement;
  if (bd && bd.classList.contains("modal-backdrop")) bd.classList.add("hidden");
}

function renderSettingsUI() {
  $$('#themeSeg button').forEach(b => b.classList.toggle("active", b.dataset.val === prefs.theme));
  $$('#fontSeg button').forEach(b => b.classList.toggle("active", b.dataset.val === prefs.fontSize));
  $$('#timerPosSeg button').forEach(b => b.classList.toggle("active", b.dataset.val === prefs.timerPosition));
  el("soundToggle").checked = !!prefs.soundAlert5min;
  el("shuffleToggle").checked = !!prefs.shuffle;
  el("dailyGoalInput").value = prefs.dailyGoal;
}

function updatePref(key, val) {
  prefs[key] = val;
  savePrefs(prefs);
  applyPrefsToDOM();
  renderHeaderGamification();
}

/* =====================================================================
   EVENT WIRING
   ===================================================================== */
fileInput.addEventListener("change", handleFile);
loadSampleBtn.addEventListener("click", () => loadData(sampleData, "built-in-sample.json"));
backToLoadBtn.addEventListener("click", resetApp);
startTestBtn.addEventListener("click", startTest);
prevBtn.addEventListener("click", prevQuestion);
clearBtn.addEventListener("click", clearResponse);
markBtn.addEventListener("click", toggleMarkForReview);
nextBtn.addEventListener("click", nextQuestion);
submitBtn.addEventListener("click", () => submitTest(false));
retakeBtn.addEventListener("click", startTest);
anotherBtn.addEventListener("click", resetApp);

reviewBtn.addEventListener("click", () => {
  reviewContainer.classList.toggle("hidden");
  reviewBtn.textContent = reviewContainer.classList.contains("hidden") ? "📖 Show Detailed Review" : "🙈 Hide Review";
});

// Review Filter Buttons
const reviewFilterBtns = $$(".rf-btn");
reviewFilterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    reviewFilterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    const items = (el("reviewItemsList") || reviewContainer).querySelectorAll(".review-item");
    items.forEach(item => {
      if (filter === "all" || item.classList.contains(filter)) {
        item.classList.remove("hidden");
      } else {
        item.classList.add("hidden");
      }
    });
  });
});

// Drag & Drop File Zone
const fileDropZone = el("fileDropZone");
if (fileDropZone) {
  ["dragenter", "dragover"].forEach(evtName => {
    fileDropZone.addEventListener(evtName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileDropZone.style.borderColor = "var(--accent-primary)";
      fileDropZone.style.background = "rgba(99, 102, 241, 0.1)";
    });
  });
  ["dragleave", "drop"].forEach(evtName => {
    fileDropZone.addEventListener(evtName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      fileDropZone.style.borderColor = "";
      fileDropZone.style.background = "";
    });
  });
  fileDropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt ? dt.files : null;
    if (files && files.length > 0) {
      fileInput.files = files;
      handleFile({ target: { files: files } });
    }
  });
}

// Quick Sample Card Click
const loadSampleCard = el("loadSampleCard");
if (loadSampleCard) {
  loadSampleCard.addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") {
      loadSampleBtn.click();
    }
  });
}

// Header buttons
el("themeToggleBtn").addEventListener("click", () => {
  updatePref("theme", prefs.theme === "dark" ? "light" : "dark");
});
el("settingsBtn").addEventListener("click", openSettings);
el("levelChip").addEventListener("click", openProfile);
el("goalMini").addEventListener("click", openProfile);

// Settings modal
el("settingsCloseBtn").addEventListener("click", () => hideModal("settingsModal"));
el("settingsBackdrop").addEventListener("click", e => { if (e.target === el("settingsBackdrop")) hideModal("settingsModal"); });
$$('#themeSeg button').forEach(b => b.addEventListener("click", () => updatePref("theme", b.dataset.val)));
$$('#fontSeg button').forEach(b => b.addEventListener("click", () => updatePref("fontSize", b.dataset.val)));
$$('#timerPosSeg button').forEach(b => b.addEventListener("click", () => updatePref("timerPosition", b.dataset.val)));
el("soundToggle").addEventListener("change", e => updatePref("soundAlert5min", e.target.checked));
el("shuffleToggle").addEventListener("change", e => updatePref("shuffle", e.target.checked));
el("dailyGoalInput").addEventListener("change", e => {
  const v = Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 3));
  e.target.value = v;
  updatePref("dailyGoal", v);
});
el("testBeepBtn").addEventListener("click", beep);

// Profile modal
el("profileCloseBtn").addEventListener("click", () => hideModal("profileModal"));
el("profileBackdrop").addEventListener("click", e => { if (e.target === el("profileBackdrop")) hideModal("profileModal"); });
el("downloadCsvBtn").addEventListener("click", downloadCSV);
el("downloadPdfBtn").addEventListener("click", printReportCard);

// Report modal
el("reportCloseBtn").addEventListener("click", () => { hideModal("reportModal"); el("reportPrintArea").innerHTML = ""; });
el("reportBackdrop").addEventListener("click", e => {
  if (e.target === el("reportBackdrop")) { hideModal("reportModal"); el("reportPrintArea").innerHTML = ""; }
});

// Result screen downloads
el("resultCsvBtn").addEventListener("click", downloadCSV);
el("resultPdfBtn").addEventListener("click", printReportCard);

// Level-up overlay close
el("levelupOverlay").addEventListener("click", () => el("levelupOverlay").classList.add("hidden"));

// ESC to close modals
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    ["settingsModal", "profileModal", "reportModal"].forEach(id => {
      if (!el(id).classList.contains("hidden")) { hideModal(id); }
    });
    el("levelupOverlay").classList.add("hidden");
  }
});

/* =====================================================================
   AUTH + INITIALIZE
   ===================================================================== */
applyPrefsToDOM();

const authScreen = el("authScreen");
const authForm = el("authForm");
const authEmail = el("authEmail");
const authPassword = el("authPassword");
const authSubmitBtn = el("authSubmitBtn");
const authToggleBtn = el("authToggleBtn");
const authTitle = el("authTitle");
const authSubtitle = el("authSubtitle");
const authError = el("authError");
const signOutBtn = el("signOutBtn");
const guestBtn = el("guestBtn");
const pwdToggleBtn = el("pwdToggleBtn");
const appHeader = document.querySelector(".app-header");

let authMode = "signin";
let bootToken = 0;
let lastUserId = null;

// Guest practice mode
if (guestBtn) {
  guestBtn.addEventListener("click", () => {
    showApp();
  });
}

// Password show/hide toggle
if (pwdToggleBtn) {
  pwdToggleBtn.addEventListener("click", () => {
    const isPwd = authPassword.type === "password";
    authPassword.type = isPwd ? "text" : "password";
    pwdToggleBtn.textContent = isPwd ? "🙈" : "👁";
  });
}

function showAuth() {
  lastUserId = null;
  gamo = Object.assign({}, defaultGamo);
  streakData = { lastDate: null, streak: 0, best: 0 };
  clearAppState();
  displayStreak();
  renderHeaderGamification();
  renderProfile();
  ["loadScreen", "startScreen", "testScreen", "resultScreen"].forEach(id => el(id).classList.add("hidden"));
  ["settingsModal", "profileModal", "reportModal"].forEach(id => hideModal(id));
  authScreen.classList.remove("hidden");
  appHeader.classList.add("hidden");
  signOutBtn.style.display = "none";
}

function showApp() {
  authScreen.classList.add("hidden");
  appHeader.classList.remove("hidden");
  signOutBtn.style.display = "";
  signOutBtn.title = currentUser ? ("Sign out · " + currentUser.email) : "Return to Sign In";
  showScreen("loadScreen");
}

if (!sb) {
  authTitle.textContent = "Supabase Not Configured";
  authSubtitle.textContent = "Add your Project URL + anon key to supabase-config.js to enable cloud sync, or practice offline.";
  authForm.style.display = "none";
  authToggleBtn.style.display = "none";
  showAuth();
} else {
  authForm.addEventListener("submit", async e => {
    e.preventDefault();
    const email = authEmail.value.trim();
    const password = authPassword.value;
    authError.textContent = "";
    authSubmitBtn.disabled = true;
    let res;
    if (authMode === "signup") res = await sb.auth.signUp({ email, password });
    else res = await sb.auth.signInWithPassword({ email, password });
    authSubmitBtn.disabled = false;
    if (res.error) {
      authError.textContent = res.error.message;
    } else if (!res.data.session) {
      authTitle.textContent = "Check your email";
      authSubtitle.textContent = "We sent a confirmation link to " + email + ". Click it, then sign in.";
      authForm.style.display = "none";
      authToggleBtn.style.display = "none";
    }
  });

  authToggleBtn.addEventListener("click", () => {
    authMode = authMode === "signin" ? "signup" : "signin";
    const signingUp = authMode === "signup";
    authTitle.textContent = signingUp ? "Create your account" : "Welcome back";
    authSubtitle.textContent = signingUp ? "Your progress syncs across devices" : "Sign in to keep your progress synced";
    authSubmitBtn.innerHTML = signingUp ? '<span>Create account</span><span class="btn-arrow">→</span>' : '<span>Sign in</span><span class="btn-arrow">→</span>';
    authToggleBtn.textContent = signingUp ? "Already have an account? Sign in" : "New here? Create an account";
    authPassword.setAttribute("autocomplete", signingUp ? "new-password" : "current-password");
  });

  signOutBtn.addEventListener("click", () => {
    if (sb && currentUser) sb.auth.signOut();
    else showAuth();
  });

  async function migrateLocalData() {
    let local;
    try { local = JSON.parse(localStorage.getItem(GAMO_KEY)); } catch (e) { return; }
    if (!local || !local.history || local.history.length === 0) {
      localStorage.removeItem(GAMO_KEY);
      return;
    }
    if (gamo.history.length > 0) {
      localStorage.removeItem(GAMO_KEY);
      return;
    }
    gamo.totalXP = local.totalXP || 0;
    gamo.badges = local.badges || [];
    gamo.history = local.history;

    if (sb && currentUser) {
      await sb.from("attempts").insert(local.history.map(h => ({
        user_id: currentUser.id,
        date: h.date, exam: h.exam, paper: h.paper || "", file_name: h.fileName || "",
        total: h.total, correct: h.correct, wrong: h.wrong, unattempted: h.unattempted,
        attempted: h.attempted, accuracy: h.accuracy, score: h.score, max_marks: h.maxMarks,
        time_used: h.timeUsed, time_limit: h.timeLimit, xp: h.xp, subjects: h.subjects || {}
      })));

      let s;
      try { s = JSON.parse(localStorage.getItem(STREAK_KEY)); } catch (e2) {}
      if (s && streakData.streak === 0) {
        streakData = { lastDate: s.lastDate, streak: s.streak || 0, best: s.best || 0 };
      }
      localStorage.removeItem(GAMO_KEY);
      localStorage.removeItem(STREAK_KEY);
      await saveProfile();
    }
  }

  async function bootUser(authEvent) {
    if (!currentUser) return showAuth();
    const uid = currentUser.id;
    if (gamo && uid === lastUserId) {
      displayStreak();
      renderHeaderGamification();
      renderProfile();
      showApp();
      return;
    }
    lastUserId = uid;
    const myBoot = ++bootToken;

    try {
      const { data: prof } = await sb.from("profiles")
        .select("total_xp, badges, streak, streak_last_date, streak_best")
        .eq("id", currentUser.id)
        .maybeSingle();
      let profRow = prof || null;

      const { data: attempts } = await sb.from("attempts")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (myBoot !== bootToken) return;

      const historyList = (attempts || []).map(h => ({
        id: h.id, date: h.date, timestamp: h.created_at,
        exam: h.exam, paper: h.paper, fileName: h.file_name,
        total: h.total, correct: h.correct, wrong: h.wrong,
        unattempted: h.unattempted, attempted: h.attempted,
        accuracy: h.accuracy, score: Number(h.score), maxMarks: Number(h.max_marks),
        timeUsed: h.time_used, timeLimit: h.time_limit, xp: h.xp,
        subjects: h.subjects
      }));

      const attemptsXP = historyList.reduce((sum, h) => sum + (Number(h.xp) || 0), 0);
      const dbXP = profRow ? (Number(profRow.total_xp) || 0) : 0;
      const totalXP = Math.max(dbXP, attemptsXP);

      gamo = {
        totalXP: totalXP,
        badges: profRow && profRow.badges ? profRow.badges : [],
        history: historyList,
        lastLevelShown: 1
      };
      streakData = {
        lastDate: profRow ? profRow.streak_last_date : null,
        streak: profRow ? (profRow.streak || 0) : 0,
        best: profRow ? (profRow.streak_best || 0) : 0
      };

      if (gamo.history.length === 0) {
        await migrateLocalData();
      }

      if (!profRow) {
        const { error: insErr } = await saveProfile();
        if (insErr) {
          authError.textContent = "Profile row missing — did you run schema.sql? (" + insErr.message + ")";
        }
      }

      displayStreak();
      renderHeaderGamification();
      renderProfile();
      showApp();
      signOutBtn.title = "Sign out · " + currentUser.email;
    } catch (err) {
      console.error("Error booting user:", err);
      showApp();
    }
  }

  sb.auth.onAuthStateChange((event, sess) => {
    currentUser = sess ? sess.user : null;
    if (currentUser) bootUser(event);
    else showAuth();
  });
}
