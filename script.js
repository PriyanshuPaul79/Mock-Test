const sampleData = {
    "meta": {
      "exam_name": "SEBI Grade A IT Officer - Built-in Sample",
      "paper": "Phase 1 Paper 2 - IT",
      "duration_minutes": 8,
      "negative_marking": 0.25,
      "official_pace_seconds": 48,
      "full_paper_note": "Full paper: 50 Q / 100"
    },
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
        "explanation": "range(3) gives 0, 1, 2. The sum is 0 + 1 + 2 = 3."
      },
      {
        "id": "Q2", "type": "mcq", "subject": "DBMS", "topic": "SQL",
        "difficulty": "medium", "marks": 2,
        "question": "Which SQL clause is used to filter groups created by GROUP BY?",
        "options": [
          { "id": "A", "text": "WHERE" },
          { "id": "B", "text": "ORDER BY" },
          { "id": "C", "text": "HAVING" },
          { "id": "D", "text": "DISTINCT" }
        ],
        "correct_option_id": "C",
        "explanation": "HAVING filters groups after GROUP BY. WHERE filters rows before grouping."
      },
      {
        "id": "Q3", "type": "mcq", "subject": "Operating Systems", "topic": "Scheduling",
        "difficulty": "medium", "marks": 2,
        "question": "Which CPU scheduling algorithm can cause starvation?",
        "options": [
          { "id": "A", "text": "Round Robin" },
          { "id": "B", "text": "First Come First Serve" },
          { "id": "C", "text": "Priority Scheduling" },
          { "id": "D", "text": "None of the above" }
        ],
        "correct_option_id": "C",
        "explanation": "In priority scheduling, low-priority processes may wait indefinitely, causing starvation."
      },
      {
        "id": "Q4", "type": "mcq", "subject": "Computer Networks", "topic": "OSI Model",
        "difficulty": "easy", "marks": 2,
        "question": "Which OSI layer is responsible for logical addressing and routing?",
        "options": [
          { "id": "A", "text": "Data Link Layer" },
          { "id": "B", "text": "Network Layer" },
          { "id": "C", "text": "Transport Layer" },
          { "id": "D", "text": "Session Layer" }
        ],
        "correct_option_id": "B",
        "explanation": "The Network Layer handles logical addressing, routing, and packet forwarding."
      },
      {
        "id": "Q5", "type": "mcq", "subject": "General Awareness", "topic": "Financial Regulators",
        "difficulty": "easy", "marks": 2,
        "question": "SEBI is the regulator of which market in India?",
        "options": [
          { "id": "A", "text": "Securities Market" },
          { "id": "B", "text": "Insurance Market" },
          { "id": "C", "text": "Commodity Market only" },
          { "id": "D", "text": "Foreign Exchange Market only" }
        ],
        "correct_option_id": "A",
        "explanation": "SEBI regulates the securities market in India."
      }
    ]
  };

const el = id => document.getElementById(id);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  /* ----- SUPABASE ----- */
  let sb = null;
  let currentUser = null;
  if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /* ----- DOM refs (original) ----- */
  const fileInput = el("fileInput");
  const fileNameDisplay = el("fileNameDisplay");
  const loadSampleBtn = el("loadSampleBtn");
  const loadError = el("loadError");
  const startExamName = el("startExamName");
  const startChips = el("startChips");
  const startTestBtn = el("startTestBtn");
  const backToLoadBtn = el("backToLoadBtn");
  const examTitle = el("examTitle");
  const paperTitle = el("paperTitle");
  const timer = el("timer");
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

  let state = {
    data: null,
    questions: [],
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
     PREFERENCES  (settings panel)
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
    // Timer position
    const header = el("testScreen").querySelector(".test-header");
    if (header) header.classList.toggle("timer-bottom", prefs.timerPosition === "bottom");
    // Theme button icon
    el("themeToggleBtn").textContent = prefs.theme === "dark" ? "☀" : "☾";
  }

  /* =====================================================================
     STREAK  (stored on the profiles row in Supabase)
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
    streakPill.textContent = "🔥 " + display + "-day streak";
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
    // persisted to Supabase via saveProfile() inside recordAttempt
  }

  /* =====================================================================
     GAMIFICATION  — XP, Levels, Badges, Daily Goal, Attempt history
     ===================================================================== */
  const GAMO_KEY = "sebiMockGamo";
  const defaultGamo = {
    totalXP: 0,
    badges: [],            // array of badge ids earned
    history: [],           // array of attempt records
    lastLevelShown: 1
  };

  function saveProfile() {
    if (!sb || !currentUser) return Promise.resolve();
    return sb.from("profiles").upsert({
      id: currentUser.id,
      total_xp: gamo.totalXP,
      badges: gamo.badges,
      streak: streakData.streak,
      streak_last_date: streakData.lastDate,
      streak_best: streakData.best
    });
  }
  let gamo = Object.assign({}, defaultGamo);

  // XP needed for a level: Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 300 XP, etc.
  function xpForLevel(lvl) {
    if (lvl <= 1) return 0;
    return 100 * (lvl - 1) * lvl / 2;
  }
  function levelFromXP(xp) {
    xp = Math.max(0, Number(xp) || 0);
    let lvl = 1;
    while (xpForLevel(lvl + 1) <= xp) lvl++;
    const curBase = xpForLevel(lvl);
    const nextBase = xpForLevel(lvl + 1);
    const intoLevel = xp - curBase;
    const span = nextBase - curBase;
    const pct = span > 0 ? Math.min(100, Math.max(0, (intoLevel / span) * 100)) : 0;
    return { level: lvl, intoLevel: intoLevel, span: span, pct: pct, nextBase: nextBase };
  }

  // XP earned for a single attempt
  function calcXP(result, total) {
    let xp = 0;
    xp += result.correct * 15;          // 15 XP per correct
    xp -= result.wrong * 5;             // -5 per wrong (min 0 enforced later)
    xp += Math.round(result.accuracy);  // accuracy bonus
    if (result.attempted === total) xp += 20;       // full attempt bonus
    if (result.accuracy === 100 && result.attempted === total) xp += 50; // perfect bonus
    return Math.max(0, xp);
  }

  // Badge registry
  const BADGES = [
    { id: "first_blood",  icon: "🎯", name: "First Blood",    desc: "Complete your first mock" },
    { id: "sql_sniper",   icon: "🎯", name: "SQL Sniper",     desc: "Get 100% on a DBMS paper" },
    { id: "streak_7",     icon: "🔥", name: "7-Day Streak",   desc: "Maintain a 7-day streak" },
    { id: "streak_30",    icon: "💎", name: "30-Day Streak",  desc: "Maintain a 30-day streak" },
    { id: "sharpshooter", icon: "🔫", name: "Sharpshooter",   desc: "100% accuracy on a full mock" },
    { id: "marathoner",   icon: "🏃", name: "Marathoner",     desc: "Attempt all questions in a mock" },
    { id: "level_5",      icon: "⭐", name: "Rising Star",    desc: "Reach Level 5" },
    { id: "level_10",     icon: "🏆", name: "Mock Master",    desc: "Reach Level 10" },
    { id: "xp_1000",      icon: "💠", name: "XP Hoarder",     desc: "Accumulate 1000 XP" },
    { id: "goal_done",    icon: "✅", name: "Goal Getter",    desc: "Hit your daily goal" },
    { id: "night_owl",    icon: "🦉", name: "Night Owl",      desc: "Finish a mock after 10 PM" },
    { id: "early_bird",   icon: "🐦", name: "Early Bird",     desc: "Finish a mock before 7 AM" }
  ];

  function checkBadges(attempt) {
    const earned = new Set(gamo.badges);
    const newly = [];
    const streak = streakData;
    const hour = new Date().getHours();

    function grant(id) {
      if (!earned.has(id)) {
        earned.add(id); newly.push(id);
      }
    }

    if (gamo.history.length === 1) grant("first_blood");
    if (attempt.subjects && attempt.subjects.DBMS && attempt.subjects.DBMS.correct > 0
        && attempt.subjects.DBMS.correct === attempt.subjects.DBMS.total
        && attempt.subjects.DBMS.total > 0) grant("sql_sniper");
    if (streak && streak.streak >= 7) grant("streak_7");
    if (streak && streak.streak >= 30) grant("streak_30");
    if (attempt.accuracy === 100 && attempt.attempted === attempt.total) grant("sharpshooter");
    if (attempt.attempted === attempt.total) grant("marathoner");
    const lvlInfo = levelFromXP(gamo.totalXP);
    if (lvlInfo.level >= 5) grant("level_5");
    if (lvlInfo.level >= 10) grant("level_10");
    if (gamo.totalXP >= 1000) grant("xp_1000");
    if (hour >= 22 || hour < 1) grant("night_owl");
    if (hour >= 5 && hour < 7) grant("early_bird");

    // daily goal
    const todayCount = gamo.history.filter(h => h.date === todayStr()).length;
    if (todayCount >= prefs.dailyGoal) grant("goal_done");

    gamo.badges = Array.from(earned);
    return newly;
  }

  async function recordAttempt(result, elapsed) {
    const meta = (state.data && state.data.meta) || {};
    // subject breakdown
    const subjects = {};
    state.questions.forEach(q => {
      const s = q.subject || "General";
      if (!subjects[s]) subjects[s] = { correct: 0, wrong: 0, total: 0 };
      subjects[s].total++;
      const sel = state.answers[q.id];
      if (!sel) return;
      if (sel === q.correct_option_id) subjects[s].correct++;
      else subjects[s].wrong++;
    });

    const xp = calcXP(result, state.questions.length);
    const prevXP = gamo.totalXP;
    const prevLevel = levelFromXP(prevXP).level;

    const attempt = {
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

    gamo.history.unshift(attempt);
    gamo.totalXP += xp;

    const newLevel = levelFromXP(gamo.totalXP).level;
    const newBadges = checkBadges(attempt);

    if (sb && currentUser) {
      const { data: ins, error } = await sb.from("attempts").insert({
        user_id: currentUser.id,
        date: attempt.date,
        exam: attempt.exam,
        paper: attempt.paper,
        file_name: attempt.fileName,
        total: attempt.total,
        correct: attempt.correct,
        wrong: attempt.wrong,
        unattempted: attempt.unattempted,
        attempted: attempt.attempted,
        accuracy: attempt.accuracy,
        score: attempt.score,
        max_marks: attempt.maxMarks,
        time_used: attempt.timeUsed,
        time_limit: attempt.timeLimit,
        xp: attempt.xp,
        subjects: attempt.subjects || {}
      }).select("id").single();
      if (error) toast("Couldn't save attempt to cloud: " + error.message, "⚠️");
      else attempt.id = ins.id;
      await saveProfile();
    }

    return {
      xp: xp,
      leveledUp: newLevel > prevLevel,
      newLevel: newLevel,
      newBadges: newBadges
    };
  }

  function renderHeaderGamification() {
    const info = levelFromXP(gamo.totalXP);
    el("levelChipNum").textContent = "L" + info.level;
    el("levelChip").title = info.intoLevel + " / " + info.span + " XP to next level";

    // daily goal mini ring
    const todayCount = gamo.history.filter(h => h.date === todayStr()).length;
    const goal = Math.max(1, prefs.dailyGoal);
    const pct = Math.min(1, todayCount / goal);
    const C = 2 * Math.PI * 18;
    el("goalMiniRing").setAttribute("stroke-dasharray", C);
    el("goalMiniRing").setAttribute("stroke-dashoffset", C * (1 - pct));
    el("goalMiniLabel").textContent = todayCount + "/" + goal;
    el("goalMini").title = "Daily goal: " + todayCount + " / " + goal + " mocks completed";
  }

  function renderProfile() {
    const info = levelFromXP(gamo.totalXP);
    el("profileLevelNum").textContent = info.level;
    el("profileXPBar").style.width = info.pct + "%";
    el("profileXPText").textContent =
      info.intoLevel + " / " + info.span + " XP — " +
      (info.span - info.intoLevel) + " XP to Level " + (info.level + 1);
    el("profileTotalXP").textContent = gamo.totalXP + " XP";
    el("profileAttempts").textContent = gamo.history.length;

    // daily goal tracker
    const todayCount = gamo.history.filter(h => h.date === todayStr()).length;
    const goal = Math.max(1, prefs.dailyGoal);
    const pct = Math.min(1, todayCount / goal);
    const C = 2 * Math.PI * 30;
    el("goalBigRing").setAttribute("stroke-dasharray", C);
    el("goalBigRing").setAttribute("stroke-dashoffset", C * (1 - pct));
    el("goalBigLabel").textContent = todayCount + "/" + goal;
    el("goalBigText").innerHTML = "<strong>" + todayCount + " / " + goal +
      "</strong> mocks today" + (todayCount >= goal ? " 🎉 Goal smashed!" : "");

    // badges
    const earned = new Set(gamo.badges);
    el("badgesGrid").innerHTML = BADGES.map(b => {
      const has = earned.has(b.id);
      return '<div class="badge ' + (has ? "earned" : "") + '" title="' + b.desc + '">' +
        '<div class="b-icon">' + b.icon + '</div>' +
        '<div class="b-name">' + b.name + '</div>' +
        '<div class="b-desc">' + b.desc + '</div>' +
      '</div>';
    }).join("");

    // history table
    if (gamo.history.length === 0) {
      el("historyTableWrap").innerHTML = '<div class="history-empty">No attempts yet — finish your first mock to start your report card.</div>';
    } else {
      const rows = gamo.history.map(h => {
        return '<tr>' +
          '<td>' + h.date + '</td>' +
          '<td>' + escapeHTML(h.exam) + (h.paper ? '<br><span class="muted" style="font-size:11px;">' + escapeHTML(h.paper) + '</span>' : '') + '</td>' +
          '<td>' + h.correct + '/' + h.total + '</td>' +
          '<td>' + h.accuracy + '%</td>' +
          '<td>' + h.score.toFixed(1) + '/' + h.maxMarks + '</td>' +
          '<td>' + fmtTime(h.timeUsed) + '</td>' +
          '<td style="color:var(--purple);font-weight:700;">+' + h.xp + '</td>' +
        '</tr>';
      }).join("");
      el("historyTableWrap").innerHTML =
        '<table class="history-table"><thead><tr>' +
        '<th>Date</th><th>Mock</th><th>Correct</th><th>Accuracy</th><th>Score</th><th>Time</th><th>XP</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>';
    }
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  /* =====================================================================
     REPORT CARD EXPORT — CSV + printable PDF
     ===================================================================== */
  function downloadCSV() {
    if (gamo.history.length === 0) { toast("No attempts to export yet"); return; }
    const rows = [
      ["Date","Exam","Paper","File","Total","Correct","Wrong","Unattempted","Attempted","Accuracy(%)","Score","MaxMarks","TimeUsed(s)","TimeLimit(s)","XP","Subjects"]
    ];
    gamo.history.forEach(h => {
      rows.push([
        h.date, h.exam, h.paper, h.fileName,
        h.total, h.correct, h.wrong, h.unattempted, h.attempted,
        h.accuracy, h.score.toFixed(2), h.maxMarks,
        h.timeUsed, h.timeLimit, h.xp,
        JSON.stringify(h.subjects || {})
      ]);
    });
    const csv = rows.map(r => r.map(cell => {
      const s = String(cell);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sebi-report-card-" + todayStr() + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("CSV downloaded");
  }

  function buildReportCardHTML() {
    const info = levelFromXP(gamo.totalXP);
    const streak = streakData;
    const todayCount = gamo.history.filter(h => h.date === todayStr()).length;
    const totalCorrect = gamo.history.reduce((s,h) => s + h.correct, 0);
    const totalAttempted = gamo.history.reduce((s,h) => s + h.attempted, 0);
    const avgAcc = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    const earnedBadges = BADGES.filter(b => gamo.badges.includes(b.id));

    const historyRows = gamo.history.slice(0, 50).map(h =>
      '<tr><td>' + h.date + '</td>' +
      '<td>' + escapeHTML(h.exam) + '</td>' +
      '<td>' + h.correct + '/' + h.total + '</td>' +
      '<td>' + h.accuracy + '%</td>' +
      '<td>' + h.score.toFixed(1) + '/' + h.maxMarks + '</td>' +
      '<td>' + fmtTime(h.timeUsed) + '</td>' +
      '<td>+' + h.xp + '</td></tr>'
    ).join("");

    const badgeHTML = earnedBadges.length
      ? earnedBadges.map(b => '<span style="display:inline-block;margin:2px 6px 2px 0;padding:4px 10px;background:#fef3c7;border-radius:999px;font-size:12px;font-weight:700;">' + b.icon + ' ' + b.name + '</span>').join("")
      : '<span style="color:#9ca3af;font-style:italic;">No badges earned yet</span>';

    return '' +
    '<div class="report-card">' +
      '<h1>SEBI Grade A · IT Officer — Report Card</h1>' +
      '<div class="rc-meta">Generated ' + new Date().toLocaleString() + ' · Total XP: ' + gamo.totalXP + ' · Level ' + info.level + '</div>' +

      '<div class="rc-summary">' +
        '<div class="rc-stat"><div class="v">' + gamo.history.length + '</div><div class="l">Mocks Attempted</div></div>' +
        '<div class="rc-stat"><div class="v">' + avgAcc + '%</div><div class="l">Avg Accuracy</div></div>' +
        '<div class="rc-stat"><div class="v">' + (streak.best || 0) + '</div><div class="l">Best Streak (days)</div></div>' +
        '<div class="rc-stat"><div class="v">' + earnedBadges.length + '/' + BADGES.length + '</div><div class="l">Badges Earned</div></div>' +
      '</div>' +

      '<div class="rc-section"><h3>Level Progress</h3>' +
        '<div style="background:#f4f5fc;border:1px solid #e5e7f5;border-radius:10px;padding:10px 12px;font-size:13px;">' +
          'Level <strong>' + info.level + '</strong> · ' + info.intoLevel + ' / ' + info.span + ' XP to next level · ' +
          (info.span - info.intoLevel) + ' XP remaining' +
        '</div>' +
      '</div>' +

      '<div class="rc-section"><h3>Badges Earned</h3>' + badgeHTML + '</div>' +

      (gamo.history.length === 0 ? '<div class="rc-section"><h3>Attempt History</h3><div style="color:#9ca3af;font-style:italic;padding:14px 0;">No attempts yet.</div></div>' :
        '<div class="rc-section"><h3>Attempt History (latest 50)</h3>' +
        '<table><thead><tr><th>Date</th><th>Mock</th><th>Correct</th><th>Accuracy</th><th>Score</th><th>Time</th><th>XP</th></tr></thead>' +
        '<tbody>' + historyRows + '</tbody></table></div>'
      ) +
    '</div>';
  }

  function printReportCard() {
    el("reportPrintArea").innerHTML = buildReportCardHTML();
    el("reportModal").classList.remove("hidden");
    el("reportBackdrop").classList.remove("hidden");
    // give the DOM a tick to render before printing
    setTimeout(() => window.print(), 250);
  }

  /* =====================================================================
     TOAST + LEVEL UP OVERLAY
     ===================================================================== */
  let toastTimer = null;
  function toast(msg, icon) {
    const old = el("toast");
    if (old) old.remove();
    if (toastTimer) clearTimeout(toastTimer);
    const t = document.createElement("div");
    t.id = "toast"; t.className = "toast";
    t.innerHTML = (icon ? '<span>' + icon + '</span>' : '') + '<span>' + escapeHTML(msg) + '</span>';
    document.body.appendChild(t);
    toastTimer = setTimeout(() => {
      t.style.transition = "opacity .3s";
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 300);
    }, 3200);
  }

  function showLevelUp(level, newBadges) {
    const ov = el("levelupOverlay");
    el("luLevel").textContent = "Level " + level;
    const badgeHTML = newBadges.map(id => {
      const b = BADGES.find(x => x.id === id);
      return b ? '<div style="text-align:center;"><div style="font-size:34px;">' + b.icon + '</div><div style="font-size:12px;font-weight:700;color:var(--amber);">' + b.name + '</div></div>' : '';
    }).join("");
    el("luBadges").innerHTML = newBadges.length
      ? '<div style="margin-top:14px;"><div style="color:var(--muted);font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">New Badge' + (newBadges.length > 1 ? "s" : "") + '</div><div style="display:flex;gap:14px;justify-content:center;margin-top:8px;">' + badgeHTML + '</div></div>'
      : "";
    ov.classList.remove("hidden");
  }

  /* =====================================================================
     SOUND ALERT  (5-minute warning beep via WebAudio)
     ===================================================================== */
  let audioCtx = null;
  function beep() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx;
      const now = ctx.currentTime;
      // three short beeps
      [0, 0.25, 0.5].forEach(off => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, now + off);
        gain.gain.linearRampToValueAtTime(0.3, now + off + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + off + 0.18);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + off); osc.stop(now + off + 0.2);
      });
    } catch (e) { /* ignore */ }
  }

  /* =====================================================================
     CORE FLOW  (original, with shuffle + 5-min beep hooks)
     ===================================================================== */
  function showScreen(screenId) {
    ["loadScreen", "startScreen", "testScreen", "resultScreen"].forEach(id => {
      el(id).classList.add("hidden");
    });
    el(screenId).classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  function resetApp() {
    clearInterval(state.timerInterval);
    state = {
      data: null, questions: [], answers: {},
      marked: new Set(), visited: new Set(),
      currentIndex: 0, totalSeconds: 0, secondsLeft: 0,
      timerInterval: null, submitted: false, fileName: "",
      fiveMinAlerted: false
    };
    paletteButtons = [];
    palette.innerHTML = "";
    options.innerHTML = "";
    reviewContainer.innerHTML = "";
    reviewContainer.classList.add("hidden");
    reviewBtn.textContent = "📖 Show review";
    fileInput.value = "";
    fileNameDisplay.textContent = "Choose a .json question file";
    loadError.textContent = "";
    showScreen("loadScreen");
  }

  function validateData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return "Root JSON must be an object.";
    if (!Array.isArray(data.questions) || data.questions.length === 0) return "data.questions must be a non-empty array.";
    const ids = new Set();
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (!q || typeof q !== "object") return "Question " + (i + 1) + " is invalid.";
      if (!q.id) return "Question " + (i + 1) + " is missing id.";
      if (ids.has(q.id)) return "Duplicate question id: " + q.id;
      ids.add(q.id);
      if (!q.question || typeof q.question !== "string") return "Question " + q.id + " is missing question text.";
      if ((q.type || "mcq") !== "mcq") return "Question " + q.id + ": only type mcq is supported in this MVP.";
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

  function addChip(container, text) {
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = text;
    container.appendChild(span);
  }

  function loadData(data, sourceName) {
    const error = validateData(data);
    if (error) {
      loadError.textContent = error;
      showScreen("loadScreen");
      return;
    }
    state.data = data;
    state.questions = data.questions;
    state.fileName = sourceName;
    const meta = data.meta || {};
    const totalMarks = state.questions.reduce((s, q) => s + (Number(q.marks) || 1), 0);

    startExamName.textContent = meta.exam_name || "Mock Test";
    startChips.innerHTML = "";
    addChip(startChips, meta.paper || "General");
    addChip(startChips, state.questions.length + " questions");
    addChip(startChips, (meta.duration_minutes || 20) + " min");
    addChip(startChips, "Max " + totalMarks + " marks");
    addChip(startChips, "Negative " + (meta.negative_marking != null ? meta.negative_marking : "—"));
    if (prefs.shuffle) addChip(startChips, "🔀 Shuffled");

    // Settings summary
    el("startSettingsSummary").innerHTML =
      '<span class="muted" style="font-size:13px;">Active settings:</span> ' +
      '<span class="chip">' + (prefs.theme === "dark" ? "☾ Dark" : "☀ Light") + '</span>' +
      '<span class="chip">Font ' + prefs.fontSize.toUpperCase() + '</span>' +
      '<span class="chip">Timer ' + prefs.timerPosition + '</span>' +
      '<span class="chip">5-min beep ' + (prefs.soundAlert5min ? "on" : "off") + '</span>' +
      '<span class="chip">Shuffle ' + (prefs.shuffle ? "on" : "off") + '</span>';

    loadError.textContent = "";
    showScreen("startScreen");
  }

  function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        fileNameDisplay.textContent = file.name;
        loadData(parsed, file.name);
      } catch (err) {
        loadError.textContent = "Invalid JSON file: " + err.message;
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
    state.submitted = false;
    state.fiveMinAlerted = false;

    clearInterval(state.timerInterval);

    // Apply shuffle if enabled
    state.questions = prefs.shuffle
      ? shuffleArray(state.data.questions)
      : state.data.questions.slice();

    const duration = Number(state.data && state.data.meta ? state.data.meta.duration_minutes : NaN);
    state.totalSeconds = (Number.isFinite(duration) && duration > 0 ? duration : 20) * 60;
    state.secondsLeft = state.totalSeconds;

    examTitle.textContent = (state.data.meta && state.data.meta.exam_name) || "Mock Test";
    paperTitle.textContent = [state.data.meta && state.data.meta.paper, state.fileName]
      .filter(Boolean).join(" | ");

    // Apply timer position pref
    const header = el("testScreen").querySelector(".test-header");
    header.classList.toggle("timer-bottom", prefs.timerPosition === "bottom");

    buildPalette();
    renderQuestion();
    showScreen("testScreen");
    startTimer();
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
  }

  function updatePalette() {
    state.questions.forEach((q, index) => {
      const btn = paletteButtons[index];
      if (!btn) return;
      btn.className = "palette-btn";
      if (state.answers[q.id]) btn.classList.add("answered");
      else if (state.visited.has(q.id)) btn.classList.add("unanswered");
      if (state.marked.has(q.id)) btn.classList.add("marked");
      if (index === state.currentIndex) btn.classList.add("current");
    });
  }

  function updateOptionStyles() {
    options.querySelectorAll(".option").forEach(label => {
      const input = label.querySelector("input");
      label.classList.toggle("selected", input.checked);
    });
  }

  function renderQuestion() {
    const q = state.questions[state.currentIndex];
    state.visited.add(q.id);

    questionChips.innerHTML = "";
    addChip(questionChips, "Q" + (state.currentIndex + 1) + " / " + state.questions.length);
    addChip(questionChips, q.subject || "General");
    addChip(questionChips, q.topic || "Topic");
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
    q.options.forEach(opt => {
      const label = document.createElement("label");
      label.className = "option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = opt.id;
      input.checked = state.answers[q.id] === opt.id;
      input.addEventListener("change", () => selectOption(q.id, opt.id));
      const text = document.createElement("span");
      text.textContent = opt.id + ". " + opt.text;
      label.appendChild(input);
      label.appendChild(text);
      options.appendChild(label);
    });
    updateOptionStyles();

    prevBtn.disabled = state.currentIndex === 0;
    nextBtn.textContent = state.currentIndex === state.questions.length - 1 ? "Submit ✓" : "Save & Next →";
    markBtn.textContent = state.marked.has(q.id) ? "🔖 Unmark Review" : "🔖 Mark for Review";
    updatePalette();
  }

  function selectOption(questionId, optionId) {
    state.answers[questionId] = optionId;
    updateOptionStyles();
    updatePalette();
  }

  function clearResponse() {
    const q = state.questions[state.currentIndex];
    delete state.answers[q.id];
    renderQuestion();
  }

  function toggleMarkForReview() {
    const q = state.questions[state.currentIndex];
    if (state.marked.has(q.id)) state.marked.delete(q.id);
    else state.marked.add(q.id);
    renderQuestion();
  }

  function goToQuestion(index) {
    if (index < 0 || index >= state.questions.length) return;
    state.currentIndex = index;
    renderQuestion();
  }

  function nextQuestion() {
    if (state.currentIndex === state.questions.length - 1) submitTest(false);
    else { state.currentIndex++; renderQuestion(); }
  }

  function prevQuestion() {
    if (state.currentIndex > 0) { state.currentIndex--; renderQuestion(); }
  }

  function startTimer() {
    clearInterval(state.timerInterval);
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
      state.secondsLeft--;
      // 5-minute alert
      if (prefs.soundAlert5min && !state.fiveMinAlerted && state.secondsLeft <= 300 && state.secondsLeft > 0) {
        state.fiveMinAlerted = true;
        beep();
        toast("⏰ 5 minutes left!", "⏰");
      }
      if (state.secondsLeft <= 0) {
        state.secondsLeft = 0;
        updateTimerDisplay();
        submitTest(true);
      } else {
        updateTimerDisplay();
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
    timer.textContent = fmtTime(state.secondsLeft);
    timer.classList.remove("danger", "warning");
    if (state.secondsLeft <= 60) timer.classList.add("danger");
    else if (state.secondsLeft <= 300) timer.classList.add("warning");
  }

  function calculateResult() {
    let correct = 0, wrong = 0, unattempted = 0;
    let gained = 0, lost = 0, maxMarks = 0;
    const negRate = Number(state.data && state.data.meta && state.data.meta.negative_marking != null
      ? state.data.meta.negative_marking : 0);
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

    resultSummaryEls.title.textContent = (meta.paper || "Mock") + " — Result";
    resultSummaryEls.subtitle.textContent =
      total + " questions · scored with " + (meta.negative_marking != null ? meta.negative_marking : 0) +
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
    const pace = Math.round(elapsed / total);
    resultSummaryEls.pace.textContent = pace + "s/Q" +
      (meta.official_pace_seconds ? " · official " + meta.official_pace_seconds + "s" : "");

    const targetSec = Math.max(30, Math.round((elapsed * 0.9) / 5) * 5);
    resultSummaryEls.targetTime.textContent = fmtTime(targetSec);
    resultSummaryEls.targetNote.textContent = "(next " + total + "-Q mock · official " +
      fmtTime(state.totalSeconds) + " limit)";

    let msg;
    if (result.accuracy === 100 && result.attempted === total) {
      msg = "Exam-ready! 100% accuracy on 100% of the paper. You're both accurate and quick.";
    } else if (result.accuracy >= 80) {
      msg = "Strong performance! Keep polishing your weak topics.";
    } else if (result.accuracy >= 60) {
      msg = "Good progress. Review the explanations below to close the gaps.";
    } else {
      msg = "Keep going — consistency beats intensity. Review every explanation.";
    }
    resultSummaryEls.targetMessage.textContent = msg;

    // XP banner
    const xpBanner = el("xpBanner");
    const newBadgeHTML = gamoResult.newBadges.map(id => {
      const b = BADGES.find(x => x.id === id);
      return b ? '<span class="chip" style="background:rgba(245,158,11,.18);border-color:rgba(245,158,11,.4);color:#b45309;">' + b.icon + ' ' + b.name + '</span>' : '';
    }).join("");
    xpBanner.innerHTML =
      '<div style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;">XP Earned</div>' +
      '<div class="xp-amount">+' + gamoResult.xp + ' XP</div>' +
      (gamoResult.leveledUp ? '<span class="chip" style="background:rgba(109,91,231,.18);border-color:rgba(109,91,231,.4);color:var(--purple);">⭐ Level Up → L' + gamoResult.newLevel + '</span>' : '') +
      (newBadgeHTML ? '<div class="new-badges">' + newBadgeHTML + '</div>' : '');

    reviewContainer.innerHTML = "";
    state.questions.forEach((q, index) => {
      const selected = state.answers[q.id];
      let status = "unattempted";
      if (selected) status = selected === q.correct_option_id ? "correct" : "wrong";

      const item = document.createElement("div");
      item.className = "review-item " + status;
      const title = document.createElement("div");
      title.className = "review-title";
      title.textContent = "Q" + (index + 1) + ". " + (q.subject || "General") +
        (q.topic ? " | " + q.topic : "") + " | " + status.toUpperCase();
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
        if (opt.id === q.correct_option_id) suffix += " ✓ Correct";
        if (opt.id === selected) suffix += " • Your answer";
        optDiv.textContent = opt.id + ". " + opt.text + suffix;
        item.appendChild(optDiv);
      });
      if (q.explanation) {
        const exp = document.createElement("div");
        exp.className = "explanation";
        exp.textContent = "Explanation: " + q.explanation;
        item.appendChild(exp);
      }
      reviewContainer.appendChild(item);
    });
    reviewContainer.classList.add("hidden");
    reviewBtn.textContent = "📖 Show review";

    // Show level-up overlay if leveled up or earned badges
    if (gamoResult.leveledUp || gamoResult.newBadges.length > 0) {
      setTimeout(() => showLevelUp(gamoResult.newLevel, gamoResult.newBadges), 600);
    }
  }

  function submitTest(autoSubmit) {
    if (state.submitted) return;
    const unanswered = state.questions.filter(q => !state.answers[q.id]).length;
    if (!autoSubmit && unanswered > 0) {
      if (!confirm("You have " + unanswered + " unanswered question(s). Submit anyway?")) return;
    }
    clearInterval(state.timerInterval);
    state.submitted = true;
    const elapsed = state.totalSeconds - state.secondsLeft;
    const result = calculateResult();
    updateStreakOnSubmit();
    recordAttempt(result, elapsed).then(gamoResult => {
      renderResult(result, elapsed, gamoResult);
      renderHeaderGamification();
      showScreen("resultScreen");
    }).catch(() => {
      renderResult(result, elapsed, { xp: 0, leveledUp: false, newLevel: 1, newBadges: [] });
      renderHeaderGamification();
      showScreen("resultScreen");
    });
  }

  /* =====================================================================
     SETTINGS PANEL  — wire up UI
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
    // theme
    $$('#themeSeg button').forEach(b => b.classList.toggle("active", b.dataset.val === prefs.theme));
    // font size
    $$('#fontSeg button').forEach(b => b.classList.toggle("active", b.dataset.val === prefs.fontSize));
    // timer position
    $$('#timerPosSeg button').forEach(b => b.classList.toggle("active", b.dataset.val === prefs.timerPosition));
    // sound alert
    el("soundToggle").checked = !!prefs.soundAlert5min;
    // shuffle
    el("shuffleToggle").checked = !!prefs.shuffle;
    // daily goal
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
    reviewBtn.textContent = reviewContainer.classList.contains("hidden") ? "📖 Show review" : "🙈 Hide review";
  });

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

  // Result screen — download buttons
  el("resultCsvBtn").addEventListener("click", downloadCSV);
  el("resultPdfBtn").addEventListener("click", printReportCard);

  // Level-up overlay close
  el("levelupOverlay").addEventListener("click", () => el("levelupOverlay").classList.add("hidden"));

  // ESC to close modals
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      ["settingsModal","profileModal","reportModal"].forEach(id => {
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
  const appHeader = document.querySelector(".app-header");
  let authMode = "signin";
  let bootToken = 0;
  let lastUserId = null;

  function showAuth() {
    lastUserId = null;
    gamo = Object.assign({}, defaultGamo);
    streakData = { lastDate: null, streak: 0, best: 0 };
    resetApp();
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
    showScreen("loadScreen");
  }

  if (!sb) {
    authTitle.textContent = "Supabase not configured";
    authSubtitle.textContent = "Add your Project URL + anon key to supabase-config.js";
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
      authSubmitBtn.textContent = signingUp ? "Create account" : "Sign in";
      authToggleBtn.textContent = signingUp ? "Already have an account? Sign in" : "New here? Create an account";
      authPassword.setAttribute("autocomplete", signingUp ? "new-password" : "current-password");
    });

    signOutBtn.addEventListener("click", () => sb.auth.signOut());

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
        // same user, duplicate auth event — shows whatever we already have
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

        if (myBoot !== bootToken) return; // a newer session started — discard stale fetch

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

        console.log("[boot]", authEvent, uid, "xp:", gamo.totalXP, "attempts:", gamo.history.length, "streak:", streakData.streak);

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
