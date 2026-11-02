/* ═══════════════════════════════════════════
	Zyvexa — UI Enhancements v3
   Sessions · Mastery · Recall · Flashcards · Pomodoro · History
   No API logic — visual layer only
   ═══════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  function migrateLegacyStorage() {
    try {
      const oldSessions = localStorage.getItem("studyai_sessions");
      const newSessions = localStorage.getItem("zyvexa_sessions");
      if (oldSessions && !newSessions) {
        localStorage.setItem("zyvexa_sessions", oldSessions);
      }
      if (oldSessions) {
        localStorage.removeItem("studyai_sessions");
      }

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("studyai_mastery_")) continue;
        const value = localStorage.getItem(key);
        const newKey = key.replace(/^studyai_mastery_/, "zyvexa_mastery_");
        if (value !== null && localStorage.getItem(newKey) === null) {
          localStorage.setItem(newKey, value);
        }
        localStorage.removeItem(key);
      }
    } catch (err) {
      console.warn("Storage migration skipped:", err);
    }
  }

  migrateLegacyStorage();
  if (typeof window.updateStreakUI === "function") window.updateStreakUI();

  /* ── Element Refs ── */
  const SBM = $("statusBarMode"),
    OC = $("outputContainer"),
    LS = $("loadingState"),
    LT = $("loadingText");
  const OF = $("outputFooter");
  const MF = $("masteryFill"),
    MP = $("masteryPct"),
    MS = $("masterySessions"),
    MT = $("masteryTopic"),
    MD = $("masteryDone");

  /* ── Constants ── */
  const names = {
    smart_diagnosis: "Smart Diagnosis",
    concept_builder: "Concept Builder",
    adaptive_practice: "Adaptive Practice",
    mistake_analyzer: "Mistake Analyzer",
    exam_simulation: "Exam Simulation",
    quick_revision: "Quick Revision",
    formula_facts: "Formula & Facts",
    memory_engine: "Memory Engine",
    study_planner: "Study Planner",
  };
  const modeBadges = {
    smart_diagnosis: "Diag",
    concept_builder: "Build",
    adaptive_practice: "Prac",
    mistake_analyzer: "Fix",
    exam_simulation: "Exam",
    quick_revision: "Revise",
    formula_facts: "Facts",
    memory_engine: "Mem",
    study_planner: "Plan",
  };
  const topicSuggestionsKey = "zyvexa_topic_suggestions_last";
  const topicPool = [
    { category: "Physics", topic: "Ohm's law and resistance" },
    { category: "Physics", topic: "Newton's laws of motion" },
    { category: "Physics", topic: "Electromagnetic induction" },
    { category: "Physics", topic: "Wave interference and diffraction" },
    { category: "Physics", topic: "Thermodynamics and heat engines" },
    { category: "Chemistry", topic: "Periodic trends and atomic structure" },
    { category: "Chemistry", topic: "Chemical bonding and hybridization" },
    { category: "Chemistry", topic: "Acids, bases, and pH" },
    { category: "Chemistry", topic: "Organic reaction mechanisms" },
    { category: "Chemistry", topic: "Electrochemistry and redox reactions" },
    { category: "Maths", topic: "Quadratic equations and roots" },
    { category: "Maths", topic: "Differentiation rules and applications" },
    { category: "Maths", topic: "Integration by substitution" },
    { category: "Maths", topic: "Probability and Bayes' theorem" },
    { category: "Maths", topic: "Vector algebra and 3D geometry" },
    { category: "Biology", topic: "Cell organelles and functions" },
    { category: "Biology", topic: "Photosynthesis and respiration" },
    { category: "Biology", topic: "Human digestive system" },
    { category: "Biology", topic: "Genetics and inheritance" },
    { category: "Biology", topic: "Ecology and food webs" },
    { category: "History", topic: "Indian freedom struggle timeline" },
    { category: "History", topic: "World War II causes and aftermath" },
    { category: "History", topic: "Medieval trade routes" },
    { category: "History", topic: "Industrial Revolution impacts" },
    { category: "History", topic: "Constitutional developments in India" },
    { category: "Geography", topic: "Monsoon systems and climate" },
    { category: "Geography", topic: "Rivers and drainage patterns" },
    { category: "Geography", topic: "Soil types and erosion" },
    { category: "Geography", topic: "Plate tectonics and earthquakes" },
    { category: "Geography", topic: "Population distribution and migration" },
    { category: "Political Science", topic: "Parliament and law-making" },
    { category: "Political Science", topic: "Fundamental rights and duties" },
    {
      category: "Political Science",
      topic: "Federalism and centre-state relations",
    },
    {
      category: "Political Science",
      topic: "Election Commission and elections",
    },
    {
      category: "Political Science",
      topic: "Judiciary and constitutional review",
    },
    { category: "Economics", topic: "Inflation and monetary policy" },
    { category: "Economics", topic: "Demand, supply, and market equilibrium" },
    { category: "Economics", topic: "National income accounting" },
    { category: "Economics", topic: "Economic growth vs development" },
    { category: "Economics", topic: "Budget deficit and fiscal policy" },
    { category: "Psychology", topic: "Memory and forgetting" },
    { category: "Psychology", topic: "Motivation and emotion" },
    { category: "Psychology", topic: "Personality theories" },
    { category: "Psychology", topic: "Cognitive biases and heuristics" },
    { category: "Psychology", topic: "Stress and coping strategies" },
    { category: "Philosophy", topic: "Ethics and moral reasoning" },
    { category: "Philosophy", topic: "Logic and argument validity" },
    { category: "Philosophy", topic: "Mind-body problem" },
    { category: "Philosophy", topic: "Existentialism and freedom" },
    { category: "Philosophy", topic: "Epistemology and knowledge claims" },
    { category: "Computer Science", topic: "Arrays, stacks, and queues" },
    { category: "Computer Science", topic: "SQL joins and normalization" },
    { category: "Computer Science", topic: "Operating systems and processes" },
    { category: "Computer Science", topic: "Data structures and algorithms" },
    { category: "Computer Science", topic: "Computer networks and protocols" },
    { category: "Engineering", topic: "Strength of materials" },
    { category: "Engineering", topic: "Thermodynamics and cycles" },
    { category: "Engineering", topic: "Control systems basics" },
    { category: "Engineering", topic: "Electrical circuits and power" },
    { category: "Engineering", topic: "Machine design fundamentals" },
    { category: "Law", topic: "Contract law essentials" },
    { category: "Law", topic: "Tort law and negligence" },
    { category: "Law", topic: "Constitutional law basics" },
    { category: "Law", topic: "Criminal procedure overview" },
    { category: "Law", topic: "Intellectual property rights" },
    { category: "Business", topic: "Marketing mix and segmentation" },
    { category: "Business", topic: "Accounting basics and ledgers" },
    { category: "Business", topic: "Entrepreneurship and startup planning" },
    { category: "Business", topic: "Operations and supply chain" },
    { category: "Business", topic: "Financial statements analysis" },
    { category: "Literature", topic: "Poetry devices and imagery" },
    { category: "Literature", topic: "Novel structure and themes" },
    { category: "Literature", topic: "Essay writing and rhetoric" },
    { category: "Literature", topic: "Grammar and sentence structure" },
    { category: "Literature", topic: "Comprehension and inference" },
    {
      category: "General Knowledge",
      topic: "Current affairs and world events",
    },
    { category: "General Knowledge", topic: "Personal finance and budgeting" },
    {
      category: "General Knowledge",
      topic: "Communication and public speaking",
    },
    { category: "General Knowledge", topic: "Productivity and habit building" },
    { category: "General Knowledge", topic: "Critical thinking and reasoning" },
  ];

  let curMode = null;
  let recallDoneThisSession = false;
  let flashDoneThisSession = false;

  let contentIsReady = false;
  let currentRawContent = "";
  const allowedRecallModes = [
    "smart_diagnosis",
    "concept_builder",
    "adaptive_practice",
    "mistake_analyzer",
    "quick_revision",
    "formula_facts",
    "memory_engine",
  ];

  window.addEventListener("zyvexaGenerateStart", () => {
    /* Only reset content state when a NEW generation actually starts */
    contentIsReady = false;
    currentRawContent = "";
    /* Hide action bar buttons during generation */
    const inlineActions = $("inline-actions");
    if (inlineActions) inlineActions.classList.add("hidden");
  });

  window.addEventListener("zyvexaContentReady", (e) => {
    contentIsReady = true;
    currentRawContent = e.detail.rawText;

    if (e.detail.mode === "exam_simulation") {
      if (typeof window.zRenderExamUI === "function") {
        window.zRenderExamUI(e.detail.rawText);
      }
      return; /* Skip standard handling for exams */
    }

    if (typeof window.updateStreakUI === "function") window.updateStreakUI();
    const recallBtn = $("recallBtn");
    if (recallBtn) {
      recallBtn.style.display = allowedRecallModes.includes(e.detail.mode)
        ? ""
        : "none";
    }

    /* ── Mastery: only add mode if stream completed naturally (not stopped) ── */
    const statusEl = $("statusMessage");
    const statusText = statusEl ? statusEl.textContent.toLowerCase() : "";
    const wasStopped =
      statusText.includes("stopped") || statusText.includes("partial");
    if (!wasStopped && e.detail.mode) {
      const topic = $("topicsInput")?.value?.trim() || "";
      if (topic) {
        if (mKey(topic) !== masteryTopicKey) masteryLoad(topic);
        masteryAddMode(e.detail.mode);
      }
    }

    /* ── Show Ask Anything panel now that content is available ── */
    const askPanel = $("ask-panel");
    if (askPanel) askPanel.classList.add("ask-panel--available");
    zSetAskAvailability(true);
    /* On desktop, adjust main-content margin */
    zUpdateAskPanelMargin();
    /* ── Show action bar buttons now that content is ready ── */
    const inlineActions = $("inline-actions");
    const outputDiv = $("outputContainer");
    if (inlineActions && outputDiv) {
        inlineActions.classList.remove("hidden");
        outputDiv.appendChild(inlineActions);
        /* Reset confidence tags state */
        const confBtns = inlineActions.querySelectorAll(".confidence-btn");
        confBtns.forEach(b => { b.classList.remove("selected"); b.disabled = false; });
    }
  });

  /* ── Confidence Tags Handler ── */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".confidence-btn");
    if (!btn) return;
    const level = btn.dataset.level;
    /* Visual feedback */
    const container = btn.closest(".confidence-tags");
    if (container) {
      container.querySelectorAll(".confidence-btn").forEach(b => {
        b.classList.remove("selected");
        b.disabled = true;
      });
      btn.classList.add("selected");
    }
    /* Feed into session intelligence */
    const sessionCtx = window.__zyvexa_sessionContext;
    if (sessionCtx && typeof sessionCtx.addConfidenceTag === "function") {
      sessionCtx.addConfidenceTag(level);
    }
  });

  function syncModeBadges() {
    document.querySelectorAll(".option-card").forEach((card) => {
      const mode = card.dataset.mode || "";
      const badge = card.querySelector(".mode-icon");
      const desc = card.querySelector(".mode-desc")?.textContent?.trim() || "";
      if (badge && modeBadges[mode]) badge.textContent = modeBadges[mode];
      if (desc) card.title = desc;
    });
  }

  function pickTopicSuggestions() {
    let lastSignature = "";
    try {
      lastSignature = sessionStorage.getItem(topicSuggestionsKey) || "";
    } catch {}
    let chosen = [];
    let signature = "";
    let attempts = 0;

    while (attempts < 20) {
      chosen = [];
      let previousCategory = "";
      for (let index = 0; index < 3; index++) {
        const available = topicPool.filter(
          (item) =>
            item.category !== previousCategory &&
            !chosen.some((existing) => existing.topic === item.topic),
        );
        const pick = available[Math.floor(Math.random() * available.length)];
        if (!pick) break;
        chosen.push(pick);
        previousCategory = pick.category;
      }
      signature = chosen.map((item) => item.topic).join(" | ");
      if (chosen.length === 3 && signature !== lastSignature) break;
      attempts++;
    }

    if (chosen.length < 3) {
      const fallbackCategories = [
        ...new Set(topicPool.map((item) => item.category)),
      ].slice(0, 3);
      chosen = fallbackCategories
        .map((category) => topicPool.find((item) => item.category === category))
        .filter(Boolean);
      signature = chosen.map((item) => item.topic).join(" | ");
    }

    try {
      sessionStorage.setItem(topicSuggestionsKey, signature);
    } catch {}
    return chosen;
  }

  function renderTopicSuggestions() {
    const host = $("topicSuggestions");
    if (!host) return;
    const suggestions = pickTopicSuggestions();
    host.innerHTML = "";
    suggestions.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chip";
      button.dataset.topic = item.topic;
      button.title = item.category;
      button.textContent = item.topic;
      host.appendChild(button);
    });
    bindChips();
  }

  window.zRenderSuggestedTopics = renderTopicSuggestions;
  syncModeBadges();

  /* ===========================
	   1. MODE SELECTION → STATUS BAR
	   =========================== */
  $("optionGrid")?.addEventListener("click", (e) => {
    const c = e.target.closest(".option-card");
    if (!c) return;
    curMode = c.dataset.mode;
    if (SBM) SBM.textContent = names[curMode] || curMode;
  });

  /* ===========================
	   2. TOPIC MASTERY (localStorage)
	   =========================== */
  let mastery = { percent: 0, modesUsed: [], recallDone: 0, flashcardsDone: 0 };
  let masteryTopicKey = "";

  function mKey(topic) {
    return (
      "zyvexa_mastery_" +
      topic
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
    );
  }

  function masteryLoad(topic) {
    if (!topic) {
      masteryRender();
      return;
    }
    masteryTopicKey = mKey(topic);
    const raw = localStorage.getItem(masteryTopicKey);
    if (raw) {
      try {
        mastery = JSON.parse(raw);
      } catch {
        mastery = {
          percent: 0,
          modesUsed: [],
          recallDone: 0,
          flashcardsDone: 0,
        };
      }
    } else {
      mastery = { percent: 0, modesUsed: [], recallDone: 0, flashcardsDone: 0 };
    }
    recallDoneThisSession = false;
    flashDoneThisSession = false;
    masteryRender();
  }

  function masterySave() {
    if (!masteryTopicKey) return;
    localStorage.setItem(masteryTopicKey, JSON.stringify(mastery));
  }

  function masteryAddMode(mode) {
    if (!mode || mastery.modesUsed.includes(mode)) return;
    mastery.modesUsed.push(mode);
    mastery.percent = Math.min(100, mastery.percent + 8);
    masterySave();
    masteryRender();
  }

  function masteryAddRecall() {
    if (recallDoneThisSession) return;
    recallDoneThisSession = true;
    mastery.recallDone++;
    mastery.percent = Math.min(100, mastery.percent + 15);
    masterySave();
    masteryRender();
  }

  function masteryAddFlashcards() {
    if (flashDoneThisSession) return;
    flashDoneThisSession = true;
    mastery.flashcardsDone++;
    mastery.percent = Math.min(100, mastery.percent + 20);
    masterySave();
    masteryRender();
  }

  window.masteryAddRecall = masteryAddRecall;
  window.masteryAddFlashcards = masteryAddFlashcards;

  function masteryRender() {
    const topic = $("topicsInput")?.value?.trim() || "";
    if (MT) MT.textContent = topic || "—";
    if (MF) MF.style.width = mastery.percent + "%";
    if (MP) MP.textContent = mastery.percent + "%";
    if (MS) MS.textContent = mastery.modesUsed.length + " modes";
    if (MD) {
      if (mastery.percent >= 100) MD.classList.remove("hidden");
      else MD.classList.add("hidden");
    }
  }

  /* Topic change detection */
  let lastTopic = "";
  function checkTopicChange() {
    const t = $("topicsInput")?.value?.trim() || "";
    if (t && t.toLowerCase() !== lastTopic.toLowerCase()) {
      lastTopic = t;
      masteryLoad(t);
    }
  }
  $("topicsInput")?.addEventListener("blur", checkTopicChange);
  $("topicsInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) checkTopicChange();
  });

  /* ===========================
	   3. SESSION SYSTEM (localStorage)
	   =========================== */
  let sessions = [];
  let activeSessionId = null;

  function sessionsLoad() {
    try {
      sessions = JSON.parse(localStorage.getItem("zyvexa_sessions") || "[]");
    } catch {
      sessions = [];
    }
    sessions.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
    if (sessions.length > 20) {
      sessions = sessions.slice(0, 20);
      sessionsSave();
    }
  }

  function sessionsSave() {
    localStorage.setItem("zyvexa_sessions", JSON.stringify(sessions));
  }

  function sessionGenId() {
    return (
      Date.now().toString(36) + "-" + Math.random().toString(36).substr(2, 5)
    );
  }

  function sessionAutoTitle(topic, exam) {
    let t = (topic || "Untitled") + " · " + (exam || "");
    return t.length > 20 ? t.substring(0, 20) + "…" : t;
  }

  function sessionsRender() {
    return;
  }

  function sessionCurrent() {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }

  function sessionSaveCurrent() {
    const s = sessionCurrent();
    if (!s) return;
    s.topic = $("topicsInput")?.value?.trim() || "";
    s.examType = $("boardType")?.value || "";
    s.level = $("levelType")?.value || "";
    const activeLang = document.querySelector(".lang-btn.active");
    s.language = activeLang?.dataset?.lang || "english";
    s.activeMode = curMode || "";
    s.masteryPercent = mastery.percent;
    s.modesUsed = [...(mastery.modesUsed || [])];
    const outputEl = OC?.querySelector(".output-content");
    if (outputEl) s.outputContent = outputEl.innerHTML;
    /* Compute word count and read time */
    const plainText = OC?.innerText || "";
    const wc = (plainText.trim().match(/\S+/g) || []).length;
    s.wordCount = wc;
    s.readTime = wc ? Math.max(1, Math.ceil(wc / 200)) : 0;
    s.lastActive = new Date().toISOString();
    s.title = s.topic || "Untitled Session";
    sessionsSave();
    sessionsRender();
  }

  function sessionCreateOnGenerate() {
    const topic = $("topicsInput")?.value?.trim() || "";
    /* Dedup: if a session with the same topic already exists, reuse it */
    if (!activeSessionId && topic) {
      const existing = sessions.find(
        (x) => (x.topic || "").toLowerCase().trim() === topic.toLowerCase().trim()
      );
      if (existing) {
        activeSessionId = existing.id;
        return;
      }
    }
    if (!activeSessionId) {
      const s = {
        id: sessionGenId(),
        title: topic || "Untitled Session",
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        topic,
        examType: $("boardType")?.value || "",
        level: $("levelType")?.value || "",
        language:
          document.querySelector(".lang-btn.active")?.dataset?.lang ||
          "english",
        activeMode: curMode || "",
        masteryPercent: 0,
        outputContent: "",
        modesUsed: [],
        wordCount: 0,
        readTime: 0,
      };
      if (sessions.length >= 20) sessions.pop();
      sessions.unshift(s);
      activeSessionId = s.id;
      sessionsSave();
      sessionsRender();
    }
  }

  function sessionSwitch(id) {
    sessionSaveCurrent();
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    activeSessionId = s.id;

    /* Restore UI state */
    if ($("topicsInput")) $("topicsInput").value = s.topic || "";
    if ($("boardType"))
      $("boardType").value = s.examType || "HSBTE Polytechnic";
    if ($("levelType")) {
      $("levelType").value = s.level || "diploma";
      $("levelType").dispatchEvent(new Event("change", { bubbles: true }));
    }

    /* Language */
    document
      .querySelectorAll(".lang-btn")
      .forEach((b) => b.classList.remove("active"));
    const langBtn = document.querySelector(
      '.lang-btn[data-lang="' + (s.language || "english") + '"]',
    );
    if (langBtn) langBtn.classList.add("active");

    /* Mode */
    if (s.activeMode) {
      const mc = document.querySelector(
        '.option-card[data-mode="' + s.activeMode + '"]',
      );
      if (mc) mc.click();
    } else {
      document
        .querySelectorAll(".option-card")
        .forEach((c) => c.classList.remove("selected"));
      curMode = null;
      if (SBM) SBM.textContent = "Select a mode to begin";
    }

    /* Mastery */
    lastTopic = s.topic || "";
    masteryLoad(s.topic);

    /* Output */
    if (s.outputContent && OC) {
      OC.innerHTML =
        '<div class="output-content">' + s.outputContent + "</div>";
      if (OF) OF.classList.add("output-footer--show");
    } else if (OC) {
      showEmptyState();
      if (OF) OF.classList.remove("output-footer--show");
    }

    sessionsRender();
  }

  function sessionNew() {
    sessionSaveCurrent();
    activeSessionId = null;
    if ($("topicsInput")) $("topicsInput").value = "";
    document
      .querySelectorAll(".option-card")
      .forEach((c) => c.classList.remove("selected"));
    curMode = null;
    if (SBM) SBM.textContent = "Select a mode to begin";
    mastery = { percent: 0, modesUsed: [], recallDone: 0, flashcardsDone: 0 };
    masteryTopicKey = "";
    lastTopic = "";
    masteryRender();
    showEmptyState();
    if (OF) OF.classList.remove("output-footer--show");
    /* Hide action bar on new topic */
    const inlineActions = $("inline-actions");
    if (inlineActions) inlineActions.classList.add("hidden");
    /* Hide ask panel on new topic */
    const askPanel = $("ask-panel");
    if (askPanel) askPanel.classList.remove("ask-panel--available");
    zSetAskAvailability(false);
    const askBodyEl = $("ask-body");
    if (askBodyEl) askBodyEl.classList.remove("open");
    zUpdateAskPanelMargin();
    renderTopicSuggestions();
    sessionsRender();
  }

  function showEmptyState() {
    if (!OC) return;
    OC.innerHTML = `<div class="empty-state">
			<svg class="empty-icon" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
				<rect x="8" y="4" width="48" height="56" rx="4"/><path d="M8 14h48"/><line x1="16" y1="24" x2="48" y2="24"/><line x1="16" y1="32" x2="42" y2="32"/><line x1="16" y1="40" x2="36" y2="40"/><line x1="16" y1="48" x2="44" y2="48"/>
			</svg>
			<h2 class="empty-title">Pick a mode, enter your topic</h2>
			<p class="empty-sub">Your study content will appear here — notes, practice, revision, whatever you need.</p>
			<div class="chip-row" id="topicSuggestions"></div>
		</div>`;
    renderTopicSuggestions();
  }

  function bindChips() {
    document.querySelectorAll(".chip[data-topic]").forEach((c) =>
      c.addEventListener("click", () => {
        const inp = $("topicsInput");
        if (inp) {
          inp.value = c.dataset.topic;
          inp.dispatchEvent(new Event("input"));
          checkTopicChange();
        }
      }),
    );
  }

  $("topicsInput")?.addEventListener("input", () => {
    if (($("topicsInput")?.value || "").trim()) return;
    renderTopicSuggestions();
  });

  /* ===========================
	   4. OUTPUT OBSERVER
	   =========================== */
  let outputObserverActive = true;
  if (OC)
    new MutationObserver(() => {
      if (!outputObserverActive) return;
      const has = OC.querySelector(".output-content");
      if (has && curMode) {
        /* Mastery is now handled in zyvexaContentReady — not here */
        sessionCreateOnGenerate();
        setTimeout(() => sessionSaveCurrent(), 500);
        if (OF) OF.classList.add("output-footer--show");
      } else if (!has && !OC.querySelector(".empty-state")) {
        /* cleared */
      }
    }).observe(OC, { childList: true });

  /* New topic */
  $("newTopicBtn")?.addEventListener("click", () => {
    sessionNew();
    const input = $("topicsInput");
    if (input) {
      input.value = "";
      input.focus();
    }
  });

  /* Copy feedback */
  const copyBtn = $("copyBtn");
  if (copyBtn)
    copyBtn.addEventListener("click", () => {
      setTimeout(() => {
        const s = $("statusMessage");
        const t = copyBtn.querySelector(".btn-copy__text");
        if (s && s.classList.contains("success") && t) {
          t.textContent = "✓ Copied!";
          setTimeout(() => {
            t.textContent = "Copy";
          }, 2000);
        }
      }, 150);
    });

  /* Loading message cycling */
  const msgs = [
    "Analyzing topic structure...",
    "Building knowledge map...",
    "Crafting study content...",
    "Almost ready...",
  ];
  let cyc = null,
    ci = 0;
  if (LS)
    new MutationObserver(() => {
      if (!LS.classList.contains("hidden")) {
        ci = 0;
        clearInterval(cyc);
        cyc = setInterval(() => {
          if (LS.classList.contains("hidden")) {
            clearInterval(cyc);
            return;
          }
          if (LT) LT.textContent = msgs[ci++ % msgs.length];
        }, 2200);
      } else {
        clearInterval(cyc);
      }
    }).observe(LS, { attributes: true, attributeFilter: ["class"] });

  /* Mobile drawer */
  const pan = $("panelLeft"),
    ov = $("mobileOverlay");
  function toggleDrawer() {
    pan?.classList.toggle("panel-left--open");
    ov?.classList.toggle("mobile-overlay--show");
  }
  $("mobileToggle")?.addEventListener("click", toggleDrawer);
  ov?.addEventListener("click", toggleDrawer);

  /* ===========================
	   5. ASK PANEL — Rich Context + Conversation Memory
	   =========================== */
  const ASK_API_URL = "http://localhost:3001/api/ask";
  const askBody = $("ask-body");
  const askTab = $("ask-tab");
  const askClose = $("ask-close");
  const askInput = $("ask-input");
  const askSubmit = $("ask-submit");
  const askResponse = $("ask-response");
  const askLoading = $("ask-loading");
  let askConversationHistory = [];

  function getAskRichContext() {
    const topic = $("topicsInput")?.value?.trim() || "";
    const activeModeId =
      curMode ||
      document.querySelector(".option-card.selected")?.dataset?.mode ||
      "";
    const level = $("levelType")?.value || "diploma";
    const language = document.querySelector(".lang-btn.active")?.dataset?.lang || "english";

    /* Get session intelligence if available */
    const sessionCtx = window.__zyvexa_sessionContext;
    const weakAreas = sessionCtx?.weakConcepts?.join(", ") || "";
    const recallPerformance = sessionCtx?.recallScore ?? "";
    const flashcardPerformance = sessionCtx?.flashcardPerformance
      ? `${sessionCtx.flashcardPerformance.got}/${sessionCtx.flashcardPerformance.total}`
      : "";

    /* Get a summary of current output */
    const outputContent = OC?.querySelector(".output-content");
    let responseSummary = "";
    if (outputContent) {
      const headings = outputContent.querySelectorAll("h2, h3");
      responseSummary = Array.from(headings).map(h => h.textContent.trim()).slice(0, 6).join(", ");
    }

    return {
      topic,
      mode: activeModeId,
      level,
      language,
      responseSummary,
      weakAreas,
      recallPerformance,
      flashcardPerformance,
      conversationHistory: askConversationHistory.slice(-5)
    };
  }

  async function submitAskPanel() {
    const question = askInput?.value?.trim() || "";
    if (!question || !askSubmit || !askResponse || !askLoading) return;

    askSubmit.disabled = true;
    askResponse.textContent = "";
    askResponse.classList.remove("has-content", "error-text");
    askLoading.classList.add("visible");

    try {
      const ctx = getAskRichContext();
      const response = await fetch(ASK_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          ...ctx
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Request failed");
      const answerText = data.answer || "";

      /* Save to conversation history for multi-turn */
      askConversationHistory.push({ question, answer: answerText });
      if (askConversationHistory.length > 10) askConversationHistory = askConversationHistory.slice(-10);

      const lines = answerText.split("\n").filter((l) => l.trim());
      const hasBullets = lines.some((l) => l.trim().startsWith("•"));
      let html = "";
      if (hasBullets) {
        let inList = false;
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("•")) {
            if (!inList) {
              html += "<ul>";
              inList = true;
            }
            html += "<li>" + escH(trimmed.replace(/^•\s*/, "")) + "</li>";
          } else {
            if (inList) {
              html += "</ul>";
              inList = false;
            }
            html += "<p>" + escH(trimmed) + "</p>";
          }
        }
        if (inList) html += "</ul>";
      } else {
        html = lines.map((l) => "<p>" + escH(l.trim()) + "</p>").join("");
      }
      askResponse.innerHTML = html;
      askResponse.classList.add("has-content");
      askInput.value = "";
    } catch {
      askResponse.textContent = "Couldn't get answer. Try again.";
      askResponse.classList.add("has-content", "error-text");
    } finally {
      askLoading.classList.remove("visible");
      askSubmit.disabled = false;
    }
  }

  function escH(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  /* Strip markdown formatting for clean display in recall/flashcard UI */
  function stripMd(s) {
    return s
      .replace(/#{1,6}\s*/g, "") /* headings */
      .replace(/\*\*([^*]+)\*\*/g, "$1") /* bold */
      .replace(/\*([^*]+)\*/g, "$1") /* italic */
      .replace(/__([^_]+)__/g, "$1") /* bold alt */
      .replace(/_([^_]+)_/g, "$1") /* italic alt */
      .replace(/`([^`]+)`/g, "$1") /* inline code */
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") /* links */
      .replace(/^[\s]*[-*+]\s/gm, "") /* list markers */
      .replace(/^\d+\.\s/gm, "") /* numbered lists */
      .replace(/\\([()\[\]])/g, "$1") /* escaped delimiters */
      .replace(/\$\$([^$]+)\$\$/g, "$1") /* display math */
      .replace(/\$([^$]+)\$/g, "$1") /* inline math */
      .trim();
  }

  askTab?.addEventListener("click", () => {
    if (askBody?.classList.contains("open")) zCloseAskSheet();
    else zOpenAskSheet();
  });
  askClose?.addEventListener("click", zCloseAskSheet);
  askSubmit?.addEventListener("click", submitAskPanel);
  askInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitAskPanel();
    }
  });

  /* ===========================
	   6. RECALL CHALLENGE — Overhauled
	   =========================== */
  const RI = $("recallOverlay"),
    RB = $("recallBody"),
    RP = $("recallProgress");

  let recallQs = [],
    recallIdx = 0;
  let recallScore = { mcq: 0, word: 0, line: 0, app: 0, deep: 0, total: 0 };
  let savedOutputHTML = "";

  function parseSections() {
    let text = currentRawContent || window.__zyvexa_lastRawText || "";
    if (!text || text.trim().length < 50) return [];
    const parts = text.split(/\n#{1,3} /).filter((s) => s.trim().length > 10);
    return parts.map((p) => {
      const lines = p
        .trim()
        .split("\n")
        .filter((l) => l.trim());
      const title = (lines[0] || "")
        .replace(/^#+\s*/, "")
        .replace(/^\d+[\.)]\s*/, "")
        .trim();
      const body = lines.slice(1).join(" ").trim();
      const firstLine = (lines[1] || lines[0] || "").trim();
      const firstSentence = (body.split(/[.!?]/)[0] || "").trim();
      const allSentences = body
        .split(/[.!?]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);
      const words = body
        .split(/\s+/)
        .filter((w) => w.length > 4 && /^[a-zA-Z]/i.test(w));
      const keyTerm =
        words.sort((a, b) => b.length - a.length)[0] ||
        title.split(" ")[0] ||
        "";
      // Extract numbers, examples, percentages from body for deep-memory questions
      const numbers = body.match(/\d+(?:\.\d+)?(?:\s*%|\s*[a-z]+)?/g) || [];
      const examples =
        body.match(
          /(?:for example|e\.g\.|such as|like|example:|viz\.)[^.!?]*/gi,
        ) || [];
      return {
        title,
        body,
        firstLine,
        firstSentence,
        allSentences,
        keyTerm,
        numbers,
        examples,
      };
    });
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function makeMCQ(question, correctText, wrongs, explanation) {
    const correct = (correctText || "Correct answer").substring(0, 140);
    const opts = [{ text: correct, correct: true }];
    wrongs
      .filter((w) => w && w !== correctText)
      .slice(0, 3)
      .forEach((w) => opts.push({ text: w.substring(0, 140), correct: false }));
    while (opts.length < 4)
      opts.push({ text: "None of the above", correct: false });
    return {
      type: "mcq",
      question,
      options: shuffle(opts),
      explanation: explanation || "",
    };
  }

  function getQuestionCount(text) {
    const wordCount = (text || "")
      .trim()
      .split(/\s+/)
      .filter((w) => w).length;
    if (wordCount >= 2000) return 16;
    if (wordCount >= 800) return 12;
    return 8;
  }

  function generateRecallQuestions() {
    const sections = parseSections();
    const topic = $("topicsInput")?.value?.trim() || "the topic";
    const text = currentRawContent || window.__zyvexa_lastRawText || "";
    if (sections.length < 2) return [];

    const totalQ = getQuestionCount(text);
    const s = (i) => sections[i % sections.length];
    const qs = [];

    // Distribute: 30% MCQ, 20% word, 20% line, 15% application, 15% deep-memory
    const nMCQ = Math.max(1, Math.round(totalQ * 0.3));
    const nWord = Math.max(1, Math.round(totalQ * 0.2));
    const nLine = Math.max(1, Math.round(totalQ * 0.2));
    const nApp = Math.max(1, Math.round(totalQ * 0.15));
    const nDeep = totalQ - nMCQ - nWord - nLine - nApp;

    // MCQ questions — test specific facts and definitions
    for (let i = 0; i < nMCQ; i++) {
      const sec = s(i);
      const sec2 = s(i + 1);
      const sec3 = s(i + 2);
      const sec4 = s(i + 3);
      qs.push(
        makeMCQ(
          'Which of the following best describes "' + sec.title + '"?',
          sec.firstSentence || sec.body.substring(0, 120),
          [
            sec2.firstSentence || sec2.title,
            sec3.firstSentence || sec3.title,
            sec4.title,
          ],
          sec.allSentences.slice(0, 2).join(". "),
        ),
      );
    }

    // One-word / one-term questions — direct recall
    for (let i = 0; i < nWord; i++) {
      const sec = s(nMCQ + i);
      qs.push({
        type: "word",
        question: 'Name one key term from: "' + sec.firstLine + '"',
        keyTerm: sec.keyTerm,
        answer: sec.keyTerm,
      });
    }

    // One-line explanation questions
    for (let i = 0; i < nLine; i++) {
      const sec = s(nMCQ + nWord + i);
      qs.push({
        type: "line",
        question: 'In one sentence, explain: "' + sec.title + '"',
        keyTerm: sec.keyTerm,
        answer: sec.firstSentence,
      });
    }

    // Application questions — "if X then what happens to Y"
    for (let i = 0; i < nApp; i++) {
      const sec = s(nMCQ + nWord + nLine + i);
      const appQ =
        sec.allSentences.length > 1
          ? 'How would "' +
            sec.title +
            '" apply in a real scenario? What is the practical outcome?'
          : "If " +
            sec.title +
            " is applied, what is the expected result based on the content?";
      qs.push({
        type: "app",
        question: appQ,
        keyTerm: sec.keyTerm,
        answer: sec.allSentences.slice(0, 2).join(". ") || sec.firstSentence,
      });
    }

    // Deep-memory questions — reward careful reading
    for (let i = 0; i < nDeep; i++) {
      const sec = s(nMCQ + nWord + nLine + nApp + i);
      let deepQ = "";
      let deepAns = "";
      if (sec.numbers.length > 0) {
        deepQ =
          'What specific number or quantity was mentioned in the section about "' +
          sec.title +
          '"?';
        deepAns = sec.numbers.slice(0, 3).join(", ");
      } else if (sec.examples.length > 0) {
        deepQ =
          'What example or analogy was used to explain "' + sec.title + '"?';
        deepAns = sec.examples[0] || sec.firstSentence;
      } else if (sec.allSentences.length >= 3) {
        deepQ =
          'What was the key condition or requirement stated in the section "' +
          sec.title +
          '"?';
        deepAns =
          sec.allSentences[Math.floor(sec.allSentences.length / 2)] ||
          sec.firstSentence;
      } else {
        deepQ =
          'What specific detail from "' +
          sec.title +
          '" would you recall if asked in an exam?';
        deepAns = sec.firstSentence || sec.body.substring(0, 100);
      }
      qs.push({
        type: "deep",
        question: deepQ,
        keyTerm: sec.keyTerm,
        answer: deepAns,
      });
    }

    // Shuffle the questions for variety
    return shuffle(qs);
  }

  function recallShowIntro() {
    if (!RB || !RI) return;
    savedOutputHTML = OC ? OC.innerHTML : "";
    RI.classList.add("active");
    RI.setAttribute("aria-hidden", "false");
    zLockOverlay("recall-overlay");
    if (RP) RP.innerHTML = "Ready";

    const totalQ = getQuestionCount(
      currentRawContent || window.__zyvexa_lastRawText || "",
    );
    RB.innerHTML = `
			<div class="recall-intro">
				<div class="recall-intro__title">🧠 Recall Challenge</div>
				<div class="recall-intro__desc">
					Test your memory. Questions are based on what you just studied.<br>
					<strong>${totalQ} questions</strong> — multiple choice, key terms, short answers, application, and deep-memory questions.
				</div>
				<div class="recall-intro__btns">
					<button class="btn-gen" id="recallStartBtn" style="flex:none;width:auto;padding:0 32px">Start Challenge</button>
					<button class="btn-outline" id="recallGoBackBtn">← Go Back</button>
				</div>
			</div>`;

    $("recallStartBtn")?.addEventListener("click", recallBegin);
    $("recallGoBackBtn")?.addEventListener("click", recallEnd);
  }

  function recallBegin() {
    recallQs = generateRecallQuestions();
    if (!recallQs.length) {
      RB.innerHTML =
        '<div class="rq-card"><div class="rq-question">Not enough content sections to generate questions. Try a longer response.</div><button class="btn-gen" id="rqBackEmpty" style="margin-top:18px;flex:none;width:auto;padding:0 32px">Back</button></div>';
      $("rqBackEmpty")?.addEventListener("click", recallEnd);
      return;
    }
    recallIdx = 0;
    recallScore = { mcq: 0, word: 0, line: 0, app: 0, deep: 0, total: 0 };
    recallRenderQ();
  }

  function recallStart() {
    const recallSourceText = (
      currentRawContent ||
      window.__zyvexa_lastRawText ||
      ""
    ).trim();
    if (recallSourceText.length > 0) {
      contentIsReady = true;
      currentRawContent = recallSourceText;
    }

    if (!contentIsReady) {
      if (RB) {
        savedOutputHTML = OC ? OC.innerHTML : "";
        RI.classList.add("active");
        RI.setAttribute("aria-hidden", "false");
        zLockOverlay("recall-overlay");
        RB.innerHTML =
          '<div class="rq-card"><div class="rq-question">Generate content first to start the recall challenge.</div><button class="btn-gen" id="rqBackEmpty" style="margin-top:18px;flex:none;width:auto;padding:0 32px">Back</button></div>';
        $("rqBackEmpty")?.addEventListener("click", recallEnd);
      }
      return;
    }
    if (!allowedRecallModes.includes(curMode)) {
      if (RB) {
        savedOutputHTML = OC ? OC.innerHTML : "";
        RI.classList.add("active");
        RI.setAttribute("aria-hidden", "false");
        zLockOverlay("recall-overlay");
        RB.innerHTML =
          '<div class="rq-card"><div class="rq-question">Recall Challenge is not supported in ' +
          (names[curMode] || curMode) +
          ' mode.</div><button class="btn-gen" id="rqBackEmpty" style="margin-top:18px;flex:none;width:auto;padding:0 32px">Back</button></div>';
        $("rqBackEmpty")?.addEventListener("click", recallEnd);
      }
      return;
    }
    // Show intro screen first
    recallShowIntro();
  }

  function recallEnd() {
    if (RI) {
      RI.classList.remove("active");
      RI.setAttribute("aria-hidden", "true");
    }
    zUnlockOverlay("recall-overlay");
  }

  function renderExitBar() {
    // Renders a small exit button at top of question card area
    const exitBar = document.createElement("div");
    exitBar.style.cssText =
      "display:flex;justify-content:flex-end;margin-bottom:8px;";
    exitBar.innerHTML =
      '<button class="recall-exit-btn" id="recallExitBtn">✕ Exit</button>';
    RB.insertBefore(exitBar, RB.firstChild);
    $("recallExitBtn")?.addEventListener("click", () => {
      // Show inline confirmation
      const existingConfirm = $("recallExitConfirm");
      if (existingConfirm) {
        existingConfirm.remove();
        return;
      }
      const confirmDiv = document.createElement("div");
      confirmDiv.id = "recallExitConfirm";
      confirmDiv.className = "recall-exit-confirm";
      confirmDiv.innerHTML =
        "Exit recall? Your progress will be lost. &nbsp;&nbsp;" +
        '<button class="btn-outline btn-outline--red" id="recallExitConfirmYes" style="padding:4px 12px;font-size:12px">Confirm</button>' +
        ' <button class="btn-outline" id="recallExitConfirmNo" style="padding:4px 12px;font-size:12px">Cancel</button>';
      exitBar.after(confirmDiv);
      $("recallExitConfirmYes")?.addEventListener("click", recallEnd);
      $("recallExitConfirmNo")?.addEventListener("click", () =>
        confirmDiv.remove(),
      );
    });
  }

  function recallRenderQ() {
    if (!RB || !RP) return;
    if (recallIdx >= recallQs.length) {
      recallRenderScore();
      return;
    }
    const q = recallQs[recallIdx];
    const total = recallQs.length;
    const progress = ((recallIdx + 1) / total) * 100;
    RP.innerHTML = "Question " + (recallIdx + 1) + " of " + total;

    const typeLabels = {
      mcq: "Multiple Choice",
      word: "Key Term Recall",
      line: "Short Answer",
      app: "Application",
      deep: "Deep Memory",
    };
    const typeLabel = typeLabels[q.type] || "Question";

    let html = '<div class="rq-card recall-min-height">';
    html +=
      '<div class="rq-progress-bar"><div class="rq-progress-fill" style="width:' +
      progress +
      '%"></div></div>';
    html += '<div class="rq-label">' + typeLabel + "</div>";
    html += '<div class="rq-question">' + escH(stripMd(q.question)) + "</div>";

    if (q.type === "mcq") {
      html += '<div class="rq-options">';
      const letters = ["A", "B", "C", "D"];
      q.options.forEach((opt, i) => {
        html +=
          '<div class="rq-opt" data-idx="' +
          i +
          '"><span class="rq-opt-letter">' +
          letters[i] +
          "</span><span>" +
          escH(stripMd(opt.text)) +
          "</span></div>";
      });
      html += "</div>";
    } else {
      const isLong = q.type === "app" || q.type === "deep";
      const rows = isLong ? "3" : "1";
      const cls = isLong ? " rq-textarea--long" : "";
      const placeholders = {
        word: "One word or short phrase...",
        line: "One sentence (under 15 words)...",
        app: "Describe the practical outcome (2-3 sentences)...",
        deep: "Recall the specific detail from the content...",
      };
      html +=
        '<textarea class="rq-textarea' +
        cls +
        '" id="rqAnswer" rows="' +
        rows +
        '" placeholder="' +
        (placeholders[q.type] || "Your answer...") +
        '"></textarea>';
      html +=
        '<button class="btn-gen rq-submit" id="rqSubmit" style="flex:none;width:auto;padding:0 24px">Submit Answer</button>';
    }
    html += '<div id="rqFeedback"></div><div id="rqNextWrap"></div></div>';
    RB.innerHTML = html;

    // Insert exit button at top
    renderExitBar();

    if (q.type === "mcq") {
      RB.querySelectorAll(".rq-opt").forEach((opt) =>
        opt.addEventListener("click", () => recallAnswerMCQ(opt, q)),
      );
    } else {
      $("rqSubmit")?.addEventListener("click", () => recallAnswerText(q));
      $("rqAnswer")?.addEventListener("keydown", (e) => {
        if (
          e.key === "Enter" &&
          !e.shiftKey &&
          q.type !== "app" &&
          q.type !== "deep"
        ) {
          e.preventDefault();
          recallAnswerText(q);
        }
      });
    }
  }

  function recallAnswerMCQ(optEl, q) {
    const idx = parseInt(optEl.dataset.idx);
    const correct = q.options[idx]?.correct;
    RB.querySelectorAll(".rq-opt").forEach((o) => {
      o.classList.add("rq-opt--disabled");
      const i = parseInt(o.dataset.idx);
      if (q.options[i]?.correct) o.classList.add("rq-opt--correct");
      else if (o === optEl && !correct) o.classList.add("rq-opt--wrong");
    });
    if (correct) recallScore.mcq++;
    recallScore.total++;
    // Show explanation if available
    if (q.explanation) {
      const fb = $("rqFeedback");
      if (fb)
        fb.innerHTML =
          '<div class="rq-feedback ' +
          (correct ? "rq-feedback--good" : "rq-feedback--bad") +
          '">' +
          (correct ? "✓ Correct! " : "✗ Incorrect. ") +
          escH(stripMd(q.explanation.substring(0, 160))) +
          "</div>";
    }
    setTimeout(() => {
      recallIdx++;
      recallRenderQ();
    }, 1400);
  }

  function recallAnswerText(q) {
    const ans = $("rqAnswer")?.value?.trim() || "";
    const fb = $("rqFeedback");
    const wrap = $("rqNextWrap");
    if (!fb || !wrap) return;

    let feedClass = "",
      feedText = "",
      scored = false;

    if (q.type === "word") {
      const key = (q.keyTerm || "").toLowerCase();
      if (key && ans.toLowerCase().includes(key)) {
        feedClass = "rq-feedback--good";
        feedText = '✓ Correct! Expected: "' + q.keyTerm + '"';
        scored = true;
      } else {
        feedClass = "rq-feedback--ok";
        feedText = 'Expected: "' + q.keyTerm + '"';
      }
      if (scored) recallScore.word++;
    } else if (q.type === "line") {
      const wc = ans.split(/\s+/).filter((w) => w).length;
      if (wc >= 4) {
        feedClass = "rq-feedback--good";
        feedText = "✓ Good answer!";
        scored = true;
      } else {
        feedClass = "rq-feedback--bad";
        feedText = "Too brief. Try: " + (q.answer || "").substring(0, 100);
      }
      if (scored) recallScore.line++;
    } else if (q.type === "app") {
      const wc = ans.split(/\s+/).filter((w) => w).length;
      if (wc >= 12) {
        feedClass = "rq-feedback--good";
        feedText = "✓ Good application answer!";
        scored = true;
      } else if (wc >= 6) {
        feedClass = "rq-feedback--ok";
        feedText =
          "✓ Acceptable — add more detail. Expected: " +
          (q.answer || "").substring(0, 100);
        scored = true;
      } else {
        feedClass = "rq-feedback--bad";
        feedText =
          "Too brief. Describe the practical outcome. Expected: " +
          (q.answer || "").substring(0, 100);
      }
      if (scored) recallScore.app++;
    } else {
      /* deep memory */
      const wc = ans.split(/\s+/).filter((w) => w).length;
      const key = (q.keyTerm || "").toLowerCase();
      const hasKey = key && ans.toLowerCase().includes(key);
      if (wc >= 4 || hasKey) {
        feedClass = "rq-feedback--good";
        feedText =
          "✓ Good recall! From content: " + (q.answer || "").substring(0, 120);
        scored = true;
      } else {
        feedClass = "rq-feedback--bad";
        feedText =
          "The answer in the content was: " +
          (q.answer || "").substring(0, 120);
      }
      if (scored) recallScore.deep++;
    }
    recallScore.total++;
    $("rqSubmit")?.setAttribute("disabled", "true");
    fb.innerHTML =
      '<div class="rq-feedback ' + feedClass + '">' + feedText + "</div>";
    wrap.innerHTML =
      '<button class="btn-outline btn-outline--fill rq-next" id="rqNext">Next Question →</button>';
    $("rqNext")?.addEventListener("click", () => {
      recallIdx++;
      recallRenderQ();
    });
  }

  function recallRenderScore() {
    if (!RB || !RP) return;
    RP.textContent = "Complete!";
    const total = recallQs.length;
    const correct =
      recallScore.mcq +
      recallScore.word +
      recallScore.line +
      recallScore.app +
      recallScore.deep;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const msgClass =
      pct >= 80
        ? "rq-score__msg--great"
        : pct >= 60
          ? "rq-score__msg--good"
          : pct >= 40
            ? "rq-score__msg--ok"
            : "rq-score__msg--bad";
    const msg =
      pct >= 80
        ? "🎉 Excellent recall!"
        : pct >= 60
          ? "👍 Good — minor gaps remain."
          : pct >= 40
            ? "📖 Needs more review."
            : "🔁 Re-read the content carefully.";

    RB.innerHTML =
      '<div class="rq-score">' +
      '<div class="rq-score__number">' +
      pct +
      "%</div>" +
      '<div class="rq-score__label">Recall Complete — ' +
      correct +
      " / " +
      total +
      " correct</div>" +
      '<div style="font-size:12px;color:var(--text-muted);margin:6px 0 12px">MCQ: ' +
      recallScore.mcq +
      " | Terms: " +
      recallScore.word +
      " | Lines: " +
      recallScore.line +
      " | Application: " +
      recallScore.app +
      " | Deep: " +
      recallScore.deep +
      "</div>" +
      '<div class="rq-score__msg ' +
      msgClass +
      '">' +
      msg +
      "</div>" +
      (pct >= 50
        ? '<div style="margin-top:4px;font-size:13px;color:var(--success)">+15% mastery added!</div>'
        : "") +
      '<button class="btn-gen" id="rqBack" style="margin-top:18px;flex:none;width:auto;padding:0 32px">Back to Content</button>' +
      "</div>";
    $("rqBack")?.addEventListener("click", () => {
      if (pct >= 50) masteryAddRecall();
      sessionSaveCurrent();
      recallEnd();
    });
  }

  $("recallBtn")?.addEventListener("click", recallStart);
  $("recallClose")?.addEventListener("click", recallEnd);
  $("recallOverlay")?.addEventListener("click", (e) => {
    if (e.target === $("recallOverlay")) recallEnd();
  });

  /* ===========================
	   6. FLASHCARDS (Complete Rewrite — Dynamic Count)
	   =========================== */
  let flashCards = [],
    flashIdx = 0,
    flashGotCount = 0,
    flashMissedCards = [];
  let flashIsReviewMode = false;

  function flashEscapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value || "";
    return div.innerHTML;
  }

  function buildFlashcardMarkupMap() {
    const content = OC?.querySelector(".output-content");
    const map = new Map();
    if (!content) return map;

    const headings = content.querySelectorAll("h2, h3");
    headings.forEach((heading) => {
      const front = heading.textContent.trim().replace(/^#+\s*/, "");
      if (!front || front.length < 2 || map.has(front)) return;

      const stopTags =
        heading.tagName === "H2" ? ["H1", "H2"] : ["H1", "H2", "H3"];
      const htmlChunks = [];
      let sibling = heading.nextElementSibling;
      let textSize = 0;

      while (sibling && !stopTags.includes(sibling.tagName)) {
        const usefulNode =
          sibling.matches(
            "p, ul, ol, blockquote, pre, .table-wrapper, table, .code-block-wrapper",
          ) || sibling.querySelector(".katex, .katex-display");
        if (usefulNode) {
          const siblingText = sibling.textContent.trim();
          if (siblingText) {
            htmlChunks.push(sibling.outerHTML);
            textSize += siblingText.length;
          }
          if (htmlChunks.length >= 2 || textSize > 320) break;
        }
        sibling = sibling.nextElementSibling;
      }

      map.set(front, {
        frontHtml: heading.innerHTML,
        backHtml: htmlChunks.join(""),
      });
    });

    return map;
  }

  function extractFlashcards() {
    const markupMap = buildFlashcardMarkupMap();
    /* Use the master DOM-based flashcard generator if available */
    if (typeof window.generateFlashcards === "function") {
      return window.generateFlashcards(OC).map((card) => {
        const enriched = markupMap.get(card.front) || {};
        return {
          ...card,
          frontHtml:
            enriched.frontHtml || "<p>" + flashEscapeHtml(card.front) + "</p>",
          backHtml:
            enriched.backHtml || "<p>" + flashEscapeHtml(card.back) + "</p>",
        };
      });
    }
    /* Fallback: simple heading-based extraction */
    const content = OC?.querySelector(".output-content");
    if (!content) return [];
    const cards = [];
    const headings = content.querySelectorAll("h2, h3");
    headings.forEach((h) => {
      const front = h.textContent.trim().replace(/^#+\s*/, "");
      if (!front || front.length < 2) return;
      const sib = h.nextElementSibling;
      let back = sib ? sib.textContent.trim() : front;
      const enriched = markupMap.get(front) || {};
      cards.push({
        front,
        back,
        frontHtml:
          enriched.frontHtml || "<p>" + flashEscapeHtml(front) + "</p>",
        backHtml: enriched.backHtml || "<p>" + flashEscapeHtml(back) + "</p>",
      });
    });
    return cards;
  }

  function flashOpen(cardList) {
    flashCards = cardList;
    if (!flashCards.length) {
      /* inline message instead of alert */
      showFlashMessage("Generate content first to create flashcards.");
      return;
    }
    flashIdx = 0;
    flashGotCount = 0;
    flashMissedCards = [];
    flashIsReviewMode = false;
    flashRender();
    zOpenFlashOverlay();
  }

  function showFlashMessage(msg) {
    const overlay = $("flashOverlay");
    if (!overlay) return;
    zOpenFlashOverlay();
    const modal = overlay.querySelector(".flash-modal");
    if (modal) {
      modal.innerHTML =
        '<div style="text-align:center;padding:40px 20px"><p style="font-size:15px;color:var(--text-secondary);margin-bottom:20px">' +
        msg +
        '</p><button class="btn-gen" id="flashMsgClose" style="flex:none;width:auto;padding:0 32px">Close</button></div>';
      document
        .getElementById("flashMsgClose")
        ?.addEventListener("click", zCloseFlashOverlay);
    }
  }

  function flashRenderMath(container) {
    if (!container || typeof renderMathInElement === "undefined") return;
    try {
      renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
        throwOnError: false,
        strict: false,
        trust: true,
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
      });
    } catch {}
  }

  function flashRender() {
    const overlay = $("flashOverlay");
    if (!overlay || !flashCards.length) return;
    const card = flashCards[flashIdx];
    const total = flashCards.length;

    const modal = overlay.querySelector(".flash-modal");
    if (!modal) return;

    const frontMarkup =
      card.frontHtml ||
      '<p id="flashQText">' + escH(stripMd(card.front || "")) + "</p>";
    const backMarkup =
      card.backHtml ||
      '<p id="flashAText">' + escH(stripMd(card.back || "")) + "</p>";

    modal.innerHTML = `
			<div class="flash-toprow">
				<span class="flash-counter">Card ${flashIdx + 1} / ${total}</span>
				<div class="flash-progress-bar"><div class="flash-progress-fill" style="width:${((flashIdx + 1) / total) * 100}%"></div></div>
				<button class="flash-close" id="flashCloseBtn">✕</button>
			</div>
			<div class="flash-card" id="flashCard">
				<div class="flash-inner" id="flashInner">
					<div class="flash-front">
						<span class="flash-face-label" style="color:var(--accent)">TERM</span>
						<div class="flash-front-content" id="flashQ">${frontMarkup}</div>
						<span class="flash-hint">Click to reveal</span>
					</div>
					<div class="flash-back">
						<span class="flash-face-label" style="color:var(--success)">DEFINITION</span>
						<div class="flash-back-content" id="flashA">${backMarkup}</div>
						<div class="flash-judge">
							<button class="btn-outline btn-outline--green" id="flashGot">✓ Got it</button>
							<button class="btn-outline btn-outline--red" id="flashMiss">✗ Need review</button>
						</div>
					</div>
				</div>
			</div>
			<div class="flash-nav">
				<button class="btn-outline" id="flashPrev">← Prev</button>
				<span id="flashCount">${flashIdx + 1} / ${total}</span>
				<button class="btn-outline" id="flashNext">Next →</button>
			</div>
			<div class="flash-score hidden" id="flashScore"></div>
		`;

    flashRenderMath($("flashQ"));
    flashRenderMath($("flashA"));

    /* Bind events */
    $("flashCloseBtn")?.addEventListener("click", zCloseFlashOverlay);
    $("flashCard")?.addEventListener("click", () =>
      $("flashInner")?.classList.toggle("flipped"),
    );
    $("flashPrev")?.addEventListener("click", () => {
      if (flashIdx > 0) {
        flashIdx--;
        flashRender();
      }
    });
    $("flashNext")?.addEventListener("click", () => {
      if (flashIdx < flashCards.length - 1) {
        flashIdx++;
        flashRender();
      }
    });
    $("flashGot")?.addEventListener("click", (e) => {
      e.stopPropagation();
      flashGotCount++;
      flashAdvance();
    });
    $("flashMiss")?.addEventListener("click", (e) => {
      e.stopPropagation();
      flashMissedCards.push(flashCards[flashIdx]);
      flashAdvance();
    });
  }

  function flashAdvance() {
    if (flashIdx < flashCards.length - 1) {
      flashIdx++;
      flashRender();
    } else {
      flashShowEnd();
    }
  }

  function flashShowEnd() {
    const overlay = $("flashOverlay");
    if (!overlay) return;
    const modal = overlay.querySelector(".flash-modal");
    if (!modal) return;
    const missed = flashMissedCards.length;
    const total = flashCards.length;

    let html = '<div class="flash-score">';
    html += '<div class="flash-summary__title">Flashcard Round Complete!</div>';
    html +=
      '<div class="flash-summary__meta">Got it: <span class="flash-summary__count flash-summary__count--good">' +
      flashGotCount +
      '</span> | Need review: <span class="flash-summary__count flash-summary__count--missed">' +
      missed +
      "</span> | Total: " +
      total +
      "</div>";

    const success = flashGotCount / total >= 0.6;
    if (success) {
      html +=
        '<div class="flash-summary__award">Mastery +20% Awarded! Great job!</div>';
    } else {
      html +=
        '<div class="flash-summary__warning">Review the marked cards to earn mastery points</div>';
    }

    html += '<div class="flash-summary__actions">';
    if (missed > 0) {
      html +=
        '<button class="btn-outline btn-outline--fill" id="flashReviewMissed">Review Missed Cards (' +
        missed +
        ")</button>";
    }
    html +=
      '<button class="btn-gen" id="flashDone" style="flex:none;width:auto;padding:0 32px">Done</button>';
    html += "</div></div>";

    modal.innerHTML = html;

    $("flashReviewMissed")?.addEventListener("click", () => {
      flashCards = [...flashMissedCards];
      flashIdx = 0;
      flashGotCount = 0;
      flashMissedCards = [];
      flashIsReviewMode = true;
      flashRender();
    });

    $("flashDone")?.addEventListener("click", () => {
      zCloseFlashOverlay();
      if (flashGotCount / total >= 0.6) {
        masteryAddFlashcards();
      }
      sessionSaveCurrent();
    });
  }

  /* Flashcard button click */
  $("flashBtn")?.addEventListener("click", () => {
    flashOpen(extractFlashcards());
  });

  /* Keyboard nav for flashcards */
  document.addEventListener("keydown", (e) => {
    const overlay = $("flashOverlay");
    if (!overlay || !overlay.classList.contains("active")) return;
    if (e.key === "ArrowLeft") {
      $("flashPrev")?.click();
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      $("flashNext")?.click();
      e.preventDefault();
    }
    if (e.key === " ") {
      $("flashCard")?.click();
      e.preventDefault();
    }
  });

  /* Close overlay on background click */
  $("flashOverlay")?.addEventListener("click", (e) => {
    if (e.target === $("flashOverlay")) zCloseFlashOverlay();
  });

  /* ===========================
	   7. POMODORO TIMER
	   =========================== */
  let pomoDuration = 1500,
    pomoRemaining = 1500,
    pomoRunning = false,
    pomoInterval = null;
  const PT = $("pomoTime"),
    PP = $("pomoProgress"),
    PB = $("pomoPlay");
  const pomModalTime = $("pomModalTime");
  const pomModalPlay = $("pom-modal-play");
  const pomProgressRing = document.querySelector(
    "#pomodoro-modal .pom-progress",
  );
  const pomoModes = document.querySelectorAll(".pomo-mode");
  const pomRingRadius = 100;
  const pomRingCircumference = 2 * Math.PI * pomRingRadius;

  if (pomProgressRing) {
    pomProgressRing.style.strokeDasharray = String(pomRingCircumference);
    pomProgressRing.style.strokeDashoffset = String(pomRingCircumference);
    pomProgressRing.style.transformOrigin = "50% 50%";
    pomProgressRing.style.transform = "rotate(-90deg)";
  }

  function pomoFormat(s) {
    return (
      String(Math.floor(s / 60)).padStart(2, "0") +
      ":" +
      String(s % 60).padStart(2, "0")
    );
  }
  function pomoRender() {
    if (PT) {
      PT.textContent = pomoFormat(pomoRemaining);
      PT.classList.toggle("pomo-time--running", pomoRunning);
    }
    if (PP) {
      PP.style.width =
        (pomoDuration > 0
          ? ((pomoDuration - pomoRemaining) / pomoDuration) * 100
          : 0) + "%";
    }
    if (PB) PB.textContent = pomoRunning ? "⏸" : "▶";
  }
  function pomoRenderModal() {
    const nextText = pomoFormat(pomoRemaining);
    if (pomModalTime) pomModalTime.textContent = nextText;
    if (pomModalPlay) pomModalPlay.textContent = pomoRunning ? "⏸" : "▶";
    if (pomProgressRing) {
      const progress =
        pomoDuration > 0 ? (pomoDuration - pomoRemaining) / pomoDuration : 0;
      pomProgressRing.style.strokeDashoffset = String(
        pomRingCircumference * (1 - progress),
      );
    }
  }
  function pomoTick() {
    if (pomoRemaining <= 0) {
      pomoStop();
      pomoFlash();
      return;
    }
    pomoRemaining--;
    pomoRender();
    pomoRenderModal();
  }
  function pomoStart() {
    if (pomoRunning) return;
    pomoRunning = true;
    pomoInterval = setInterval(pomoTick, 1000);
    pomoRender();
    pomoRenderModal();
  }
  function pomoStop() {
    pomoRunning = false;
    clearInterval(pomoInterval);
    pomoInterval = null;
    pomoRender();
    pomoRenderModal();
  }
  function pomoReset() {
    pomoStop();
    pomoRemaining = pomoDuration;
    pomoRender();
    pomoRenderModal();
  }
  function pomoFlash() {
    const bb = $("bottomBar");
    if (bb) {
      bb.style.animation = "flashBar 0.6s ease 3";
      setTimeout(() => {
        bb.style.animation = "";
      }, 2000);
    }
    $("pomoShort")?.click();
    if (PT) PT.textContent = "Time's up!";
    if (pomModalTime) pomModalTime.textContent = "Time's up!";
    setTimeout(pomoRender, 3000);
  }

  PB?.addEventListener("click", () => {
    pomoRunning ? pomoStop() : pomoStart();
  });
  $("pomoReset")?.addEventListener("click", pomoReset);
  pomoModes.forEach((btn) =>
    btn.addEventListener("click", () => {
      pomoModes.forEach((b) => b.classList.remove("pomo-mode--active"));
      btn.classList.add("pomo-mode--active");
      pomoDuration = parseInt(btn.dataset.dur) || 1500;
      pomoRemaining = pomoDuration;
      pomoStop();
      pomoRender();
    }),
  );
  pomoRender();
  pomoRenderModal();

  /* ===========================
	   8. SESSION SAVE ON UNLOAD
	   =========================== */
  window.addEventListener("beforeunload", () => {
    sessionSaveCurrent();
  });

  /* ===========================
	   9. SESSION RESTORE FROM URL PARAM
	   =========================== */
  function restoreSessionFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session");
    if (!sessionId) return false;

    sessionsLoad();
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return false;

    activeSessionId = s.id;

    /* Restore UI state */
    if ($("topicsInput")) $("topicsInput").value = s.topic || "";
    if ($("boardType"))
      $("boardType").value = s.examType || "HSBTE Polytechnic";
    if ($("levelType")) {
      $("levelType").value = s.level || "diploma";
      $("levelType").dispatchEvent(new Event("change", { bubbles: true }));
    }

    /* Language */
    document
      .querySelectorAll(".lang-btn")
      .forEach((b) => b.classList.remove("active"));
    const langBtn = document.querySelector(
      '.lang-btn[data-lang="' + (s.language || "english") + '"]',
    );
    if (langBtn) langBtn.classList.add("active");

    /* Mode */
    if (s.activeMode) {
      curMode = s.activeMode;
      document
        .querySelectorAll(".option-card")
        .forEach((c) => c.classList.remove("selected"));
      const mc = document.querySelector(
        '.option-card[data-mode="' + s.activeMode + '"]',
      );
      if (mc) mc.classList.add("selected");
      if (SBM) SBM.textContent = names[s.activeMode] || s.activeMode;
    }

    /* Mastery */
    lastTopic = s.topic || "";
    masteryLoad(s.topic);

    /* Output */
    if (s.outputContent && OC) {
      outputObserverActive = false;
      OC.innerHTML =
        '<div class="output-content">' + s.outputContent + "</div>";
      outputObserverActive = true;
      if (OF) OF.classList.add("output-footer--show");

      /* ── Bug 4 fix: update word count after restore ── */
      const restoredText = OC.innerText || "";
      const restoredWords = (restoredText.trim().match(/\S+/g) || []).length;
      const restoredReadMin = restoredWords
        ? Math.max(1, Math.ceil(restoredWords / 200))
        : 0;
      const outputMetaSrc = $("outputMeta");
      if (outputMetaSrc)
        outputMetaSrc.textContent =
          restoredWords + " words \u2022 " + restoredReadMin + " min read";

      /* ── Bug 2 fix: enable Recall / Flashcards after restore ── */
      contentIsReady = true;
      currentRawContent = restoredText;
      /* Show recall button if mode allows it */
      const recallBtn = $("recallBtn");
      if (recallBtn) {
        recallBtn.style.display = allowedRecallModes.includes(
          s.activeMode || "",
        )
          ? ""
          : "none";
      }
    }

    sessionsRender();

    /* Clean URL */
    if (window.history.replaceState) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    return true;
  }

  /* ===========================
	   10. INIT
	   =========================== */
  sessionsLoad();
  const restored = restoreSessionFromURL();
  if (!restored) {
    sessionsRender();
    showEmptyState();
  }

  /* Pre-fill topic from URL param (e.g. from Home page Explore Subjects) */
  const _urlParams = new URLSearchParams(window.location.search);
  const _topicParam = _urlParams.get("topic");
  if (_topicParam && !restored) {
    const topicInput = $("topicsInput");
    if (topicInput) {
      topicInput.value = _topicParam;
      topicInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const mobileInput = $("mobile-topic-input");
    if (mobileInput) mobileInput.value = _topicParam;
    /* Clean URL */
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  const initTopic = $("topicsInput")?.value?.trim();
  if (initTopic && !restored) {
    lastTopic = initTopic;
    masteryLoad(initTopic);
  } else if (!restored) masteryRender();
  if (!restored) renderTopicSuggestions();

  /* ===========================
	   11. Zyvexa 2.0 Mobile + Shell Layer (Additive)
	   =========================== */
  const sidebar = $("sidebar");
  const menuToggle = $("menu-toggle");
  const sidebarOverlay = $("sidebar-overlay");
  const sheetBackdrop = $("sheet-backdrop");
  const mainContent = $("main-content");
  const activeModeBadge = $("active-mode-badge");
  const outputMetaMirror = $("word-count-display");
  const outputMetaSource = $("outputMeta");
  const mobileTopicInput = $("mobile-topic-input");
  const generateFab = $("generate-fab");
  const zStopBtn = $("stopBtn");
  const zOutputRevealWrap = $("output-reveal-wrap");
  const zOutputSkeleton = $("output-skeleton");
  const pomodoroModal = $("pomodoro-modal");
  const masteryModal = $("mastery-modal");
  const masteryRing = $("masteryRingProgress");
  const topNewTopicBtn = $("new-topic-btn");
  const topicUploadBtn = $("topic-upload-btn");
  const mobileUploadBtn = document.querySelector(".mobile-upload-btn");

  const zIsDesktop = () => window.matchMedia("(min-width: 1024px)").matches;
  const zOverlayLocks = new Set();

  function zApplyBodyScrollLock() {
    document.body.classList.toggle(
      "body-scroll-locked",
      zOverlayLocks.size > 0,
    );
  }

  function zLockOverlay(key) {
    if (!key) return;
    zOverlayLocks.add(key);
    zApplyBodyScrollLock();
  }

  function zUnlockOverlay(key) {
    if (!key) return;
    zOverlayLocks.delete(key);
    zApplyBodyScrollLock();
  }

  function zModalLockKey(modal) {
    return modal?.id ? "modal:" + modal.id : "";
  }

  function zOpenFlashOverlay() {
    const overlay = $("flashOverlay");
    if (!overlay) return;
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    zLockOverlay("flash-overlay");
  }

  function zCloseFlashOverlay() {
    const overlay = $("flashOverlay");
    if (!overlay) return;
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
    zUnlockOverlay("flash-overlay");
  }

  function zOpenSidebar() {
    if (!sidebar || zIsDesktop()) return;
    sidebar.classList.add("open");
    sidebarOverlay?.classList.add("visible");
  }

  function zCloseSidebar() {
    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("visible");
  }

  function zInputPanelIsOpen() {
    const panel = $("controls-panel");
    return (
      !!panel &&
      panel.classList.contains("open") &&
      !panel.classList.contains("panel-hidden")
    );
  }

  function zToggleMobileInputPanel() {
    if (zIsDesktop()) return;
    if (zInputPanelIsOpen()) zHideInputPanel();
    else zShowInputPanel();
  }

  menuToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    zToggleMobileInputPanel();
  });

  sidebarOverlay?.addEventListener("click", zCloseSidebar);

  function zShowBackdrop() {
    sheetBackdrop?.classList.add("visible");
  }

  function zHideBackdropIfNoSheet() {
    const askOpen = askBody?.classList.contains("open") && !zIsDesktop();
    const pomOpen = pomodoroModal?.classList.contains("open");
    const masteryOpen = masteryModal?.classList.contains("open");
    const inputOpen = !zIsDesktop() && zInputPanelIsOpen();
    if (!askOpen && !pomOpen && !masteryOpen && !inputOpen) {
      sheetBackdrop?.classList.remove("visible");
    }
  }

  function zOpenAskSheet() {
    if (!askBody) return;
    askBody.classList.add("open");
    zLockOverlay("ask-panel");
    if (!zIsDesktop()) {
      zShowBackdrop();
    }
    zUpdateAskPanelMargin();
  }

  function zCloseAskSheet() {
    if (!askBody) return;
    askBody.classList.remove("open");
    askBody.style.transform = "";
    zUnlockOverlay("ask-panel");
    zHideBackdropIfNoSheet();
    zUpdateAskPanelMargin();
  }

  function zOpenModal(modal) {
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    zLockOverlay(zModalLockKey(modal));
    zShowBackdrop();
    zTrapFocus(modal);
  }

  function zCloseModal(modal) {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    zUnlockOverlay(zModalLockKey(modal));
    if (modal === pomodoroModal && !zIsDesktop()) {
      zSetActiveNav("home");
    }
    zReleaseFocus(modal);
    zHideBackdropIfNoSheet();
  }

  sheetBackdrop?.addEventListener("click", () => {
    zHideInputPanel();
    zCloseAskSheet();
    zCloseModal(pomodoroModal);
    zCloseModal(masteryModal);
    zCloseSidebar();
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = $(btn.getAttribute("data-close-modal"));
      zCloseModal(target);
    });
  });

  pomodoroModal?.addEventListener("click", (event) => {
    if (event.target === pomodoroModal) {
      zCloseModal(pomodoroModal);
    }
  });

  topNewTopicBtn?.addEventListener("click", () => {
    sessionNew();
    const input = $("topicsInput");
    if (input) {
      input.value = "";
      input.focus();
    }
  });
  topicUploadBtn?.addEventListener("click", () => $("fileInput")?.click());
  mobileUploadBtn?.addEventListener("click", () => $("fileInput")?.click());

  if (mobileTopicInput && $("topicsInput")) {
    mobileTopicInput.value = $("topicsInput").value;
    mobileTopicInput.addEventListener("input", () => {
      if (!$("topicsInput")) return;
      $("topicsInput").value = mobileTopicInput.value;
      $("topicsInput").dispatchEvent(new Event("input", { bubbles: true }));
    });

    $("topicsInput").addEventListener("input", () => {
      if (document.activeElement !== mobileTopicInput) {
        mobileTopicInput.value = $("topicsInput").value;
      }
    });
  }

  const mobileModePills = Array.from(
    document.querySelectorAll("#mobile-modes-strip .m-mode-pill"),
  );

  function zSyncActiveMode() {
    const selected =
      document.querySelector(".option-card.selected")?.dataset?.mode || null;
    const modeText = selected
      ? names[selected] || selected
      : "Select a mode to begin";
    if (SBM) SBM.textContent = modeText;
    if (activeModeBadge) activeModeBadge.textContent = modeText;

    document.querySelectorAll(".option-card").forEach((card) => {
      const mode = card.dataset.mode;
      card.classList.toggle("active", !!selected && mode === selected);
    });

    mobileModePills.forEach((pill) => {
      pill.classList.toggle(
        "active",
        !!selected && pill.dataset.mode === selected,
      );
    });
  }

  $("optionGrid")?.addEventListener("click", () => {
    setTimeout(zSyncActiveMode, 0);
    if (!zIsDesktop()) zCloseSidebar();
  });

  mobileModePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const mode = pill.dataset.mode;
      const desktopCard = document.querySelector(
        '.option-card[data-mode="' + mode + '"]',
      );
      desktopCard?.click();
      zSyncActiveMode();
    });
  });

  const modeObs = new MutationObserver(zSyncActiveMode);
  document.querySelectorAll(".option-card").forEach((card) => {
    modeObs.observe(card, { attributes: true, attributeFilter: ["class"] });
  });
  zSyncActiveMode();

  function zSyncWordMeta() {
    if (!outputMetaMirror || !outputMetaSource) return;
    outputMetaMirror.textContent =
      outputMetaSource.textContent || "0 words • 0 min read";
  }
  if (outputMetaSource && outputMetaMirror) {
    new MutationObserver(zSyncWordMeta).observe(outputMetaSource, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    zSyncWordMeta();
  }

  const mobileChips = Array.from(
    document.querySelectorAll(".mobile-chips-row .chip"),
  );
  function zSyncChipsFromState() {
    const examVal = $("boardType")?.value;
    const levelVal = $("levelType")?.value;
    const langVal =
      document.querySelector(".lang-btn.active")?.dataset?.lang || "english";
    mobileChips.forEach((chip) => {
      const type = chip.dataset.chipType;
      const value = chip.dataset.value;
      const active =
        (type === "exam" && value === examVal) ||
        (type === "level" && value === levelVal) ||
        (type === "lang" && value === langVal);
      chip.classList.toggle("active", active);
    });
  }

  mobileChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const type = chip.dataset.chipType;
      const value = chip.dataset.value;
      if (type === "exam" && $("boardType")) {
        $("boardType").value = value;
        $("boardType").dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (type === "level" && $("levelType")) {
        $("levelType").value = value;
        $("levelType").dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (type === "lang") {
        document.querySelector('.lang-btn[data-lang="' + value + '"]')?.click();
      }
      zSyncChipsFromState();
    });
  });

  $("boardType")?.addEventListener("change", zSyncChipsFromState);
  $("levelType")?.addEventListener("change", zSyncChipsFromState);
  $("langSelector")?.addEventListener("click", () =>
    setTimeout(zSyncChipsFromState, 0),
  );
  zSyncChipsFromState();

  const navItems = Array.from(
    document.querySelectorAll("#bottom-nav .nav-item"),
  );
  function zSetActiveNav(type) {
    navItems.forEach((item) =>
      item.classList.toggle("active", item.dataset.nav === type),
    );
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const tab = item.dataset.nav;
      const icon = item.querySelector(".nav-icon");
      icon?.classList.remove("tap");
      void icon?.offsetWidth;
      icon?.classList.add("tap");
      setTimeout(() => icon?.classList.remove("tap"), 220);

      zSetActiveNav(tab);
      if (tab === "home") {
        mainContent?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (tab === "timer") {
        zOpenModal(pomodoroModal);
      }
      if (tab === "profile") {
        zSetActiveNav("home");
        /* Profile tab — placeholder for now */
      }
    });
  });

  /* ===========================
	   MOBILE INPUT PANEL — Slide up/down logic
	   =========================== */
  const inputPanel = $("controls-panel");
  const mobileGenBtn = $("mobile-generate-btn");
  const mobileClearBtn = $("mobile-clear-btn");
  const mobileLevelSelect = $("mobile-level-select");
  const mobileLangBtns = Array.from(
    document.querySelectorAll(".mobile-lang-selector .lang-btn"),
  );

  function zShowInputPanel() {
    if (!inputPanel || zIsDesktop()) return;
    inputPanel.classList.remove("panel-hidden");
    inputPanel.classList.add("open");
    zLockOverlay("input-panel");
    zShowBackdrop();
  }

  function zHideInputPanel() {
    if (!inputPanel) return;
    if (zIsDesktop()) {
      inputPanel.classList.remove("open");
      inputPanel.classList.add("panel-hidden");
      zUnlockOverlay("input-panel");
      zHideBackdropIfNoSheet();
      return;
    }
    inputPanel.classList.remove("open");
    inputPanel.classList.add("panel-hidden");
    zUnlockOverlay("input-panel");
    zHideBackdropIfNoSheet();
  }

  /* Sync mobile level select → sidebar level select */
  if (mobileLevelSelect && $("levelType")) {
    mobileLevelSelect.value = $("levelType").value;
    mobileLevelSelect.addEventListener("change", () => {
      if ($("levelType")) {
        $("levelType").value = mobileLevelSelect.value;
        $("levelType").dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    $("levelType").addEventListener("change", () => {
      if (mobileLevelSelect) mobileLevelSelect.value = $("levelType").value;
    });
  }

  /* Sync mobile lang buttons → sidebar lang buttons */
  mobileLangBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      mobileLangBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const lang = btn.dataset.lang;
      /* Also update sidebar lang buttons */
      document
        .querySelectorAll("#langSelector .lang-btn")
        .forEach((b) => b.classList.remove("active"));
      const sidebarLangBtn = document.querySelector(
        '#langSelector .lang-btn[data-lang="' + lang + '"]',
      );
      if (sidebarLangBtn) sidebarLangBtn.classList.add("active");
    });
  });

  /* Sync sidebar lang → mobile lang */
  document.querySelectorAll("#langSelector .lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setTimeout(() => {
        const activeLang =
          document.querySelector("#langSelector .lang-btn.active")?.dataset
            ?.lang || "english";
        mobileLangBtns.forEach((b) =>
          b.classList.toggle("active", b.dataset.lang === activeLang),
        );
      }, 0);
    });
  });

  /* Mobile Generate → trigger sidebar generate and hide panel */
  mobileGenBtn?.addEventListener("click", () => {
    zHideInputPanel();
    $("generateBtn")?.click();
  });

  /* Mobile Clear → trigger sidebar clear */
  mobileClearBtn?.addEventListener("click", () => {
    $("clearBtn")?.click();
    /* Clear mobile inputs too */
    if (mobileTopicInput) mobileTopicInput.value = "";
  });

  /* Hamburger menu re-opens sidebar which contains all controls */
  /* Already wired above via menuToggle → zOpenSidebar */

  /* When generation starts, hide input panel */
  window.addEventListener("zyvexaGenerateStart", () => {
    zHideInputPanel();
  });

  /* Show input panel on new topic */
  const origSessionNew = sessionNew;
  function sessionNewWithPanel() {
    origSessionNew.call(this);
    zHideInputPanel();
  }
  topNewTopicBtn?.removeEventListener("click", sessionNewWithPanel);
  topNewTopicBtn?.addEventListener("click", () => {
    sessionNew();
    zHideInputPanel();
    if (mobileTopicInput) mobileTopicInput.value = "";
  });

  function zMarkGenerating(on) {
    if ($("generateBtn")) $("generateBtn").classList.toggle("generating", on);
    if (mobileGenBtn) mobileGenBtn.classList.toggle("generating", on);
  }

  window.addEventListener("zyvexaGenerateStart", () => {
    zMarkGenerating(true);
    if (zOutputSkeleton) zOutputSkeleton.classList.add("visible");
  });

  window.addEventListener("zyvexaContentReady", () => {
    zMarkGenerating(false);
    if (zOutputSkeleton) zOutputSkeleton.classList.remove("visible");
    if (zOutputRevealWrap) {
      zOutputRevealWrap.classList.remove("revealed");
      void zOutputRevealWrap.offsetWidth;
      zOutputRevealWrap.classList.add("revealed");
      setTimeout(() => zOutputRevealWrap.classList.remove("revealed"), 420);
    }
  });

  if (zStopBtn) {
    new MutationObserver(() => {
      const stopVisible = !zStopBtn.classList.contains("hidden");
      zMarkGenerating(stopVisible);
      if (!stopVisible) {
        zOutputSkeleton?.classList.remove("visible");
      }
    }).observe(zStopBtn, { attributes: true, attributeFilter: ["class"] });
  }

  if (OC) {
    new MutationObserver(() => {
      const txt = (OC.innerText || "").replace(/\s+/g, " ").trim();
      if (txt.length > 5 && !/will appear here/i.test(txt)) {
        zOutputSkeleton?.classList.remove("visible");
      }
    }).observe(OC, { childList: true, subtree: true, characterData: true });
  }

  let askStartY = 0;
  let askCurrentY = 0;
  const askHandle = document.querySelector(".ask-panel-handle");
  askHandle?.addEventListener("touchstart", (e) => {
    if (zIsDesktop() || !askBody?.classList.contains("open")) return;
    askStartY = e.touches[0].clientY;
    askCurrentY = 0;
  });
  askHandle?.addEventListener("touchmove", (e) => {
    if (zIsDesktop() || !askBody?.classList.contains("open")) return;
    const delta = e.touches[0].clientY - askStartY;
    askCurrentY = Math.max(0, delta);
    askBody.style.transform = "translateY(" + askCurrentY + "px)";
  });
  askHandle?.addEventListener("touchend", () => {
    if (zIsDesktop() || !askBody) return;
    const threshold = askBody.offsetHeight * 0.4;
    if (askCurrentY > threshold) zCloseAskSheet();
    else askBody.style.transform = "";
  });

  askClose?.addEventListener("click", zCloseAskSheet);
  askTab?.addEventListener("click", () => {
    setTimeout(() => {
      if (zIsDesktop()) return;
      if (askBody?.classList.contains("open")) zShowBackdrop();
      else zHideBackdropIfNoSheet();
    }, 0);
  });

  let ringCurrent = 0;
  const ringRadius = 36;
  const ringCircumference = 2 * Math.PI * ringRadius;
  if (masteryRing) {
    masteryRing.style.strokeDasharray = String(ringCircumference);
    masteryRing.style.strokeDashoffset = String(ringCircumference);
  }

  function zAnimateMasteryRing(nextPercent) {
    if (!masteryRing) return;
    const start = ringCurrent;
    const end = Math.max(0, Math.min(100, nextPercent));
    const duration = 800;
    const startTime = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const p = Math.min(1, (now - startTime) / duration);
      const current = start + (end - start) * easeOut(p);
      const offset = ringCircumference * (1 - current / 100);
      masteryRing.style.strokeDashoffset = String(offset);
      masteryRing.style.setProperty("--ring-end", String(offset));
      if (p < 1) requestAnimationFrame(tick);
      else ringCurrent = end;
    };
    requestAnimationFrame(tick);
  }

  function zMasteryPercentFromText() {
    const txt = $("masteryPct")?.textContent || "";
    const m = txt.match(/(\d+(?:\.\d+)?)/);
    return m ? Number(m[1]) : 0;
  }

  if ($("masteryPct")) {
    new MutationObserver(() => {
      const pct = zMasteryPercentFromText();
      zAnimateMasteryRing(pct);
      const mm = $("mastery-modal-text");
      if (mm)
        mm.textContent =
          "Current mastery is " +
          Math.round(pct) +
          "%. Keep practicing to reach 100%.";
    }).observe($("masteryPct"), {
      childList: true,
      subtree: true,
      characterData: true,
    });
    zAnimateMasteryRing(zMasteryPercentFromText());
  }

  const zTrapMap = new Map();
  function zFocusable(container) {
    if (!container) return [];
    return Array.from(
      container.querySelectorAll(
        'button, [href], textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
  }
  function zTrapFocus(container) {
    if (!container || zTrapMap.has(container)) return;
    const prev = document.activeElement;
    zTrapMap.set(container, prev);
    const nodes = zFocusable(container);
    nodes[0]?.focus();
  }
  function zReleaseFocus(container) {
    if (!container || !zTrapMap.has(container)) return;
    const prev = zTrapMap.get(container);
    zTrapMap.delete(container);
    if (prev && typeof prev.focus === "function") prev.focus();
  }

  function zActiveTrapContainer() {
    if (masteryModal?.classList.contains("open")) return masteryModal;
    if (pomodoroModal?.classList.contains("open")) return pomodoroModal;
    if ($("flashOverlay") && $("flashOverlay").classList.contains("active"))
      return $("flashOverlay");
    if ($("recallOverlay") && $("recallOverlay").classList.contains("active"))
      return $("recallOverlay");
    if (!zIsDesktop() && askBody?.classList.contains("open")) return askBody;
    if (!zIsDesktop() && sidebar?.classList.contains("open")) return sidebar;
    return null;
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      zHideInputPanel();
      zCloseSidebar();
      zCloseAskSheet();
      zCloseModal(pomodoroModal);
      zCloseModal(masteryModal);
      zCloseFlashOverlay();
      if (
        $("recallOverlay") &&
        $("recallOverlay").classList.contains("active")
      ) {
        recallEnd();
      }
    }
    if (e.key !== "Tab") return;
    const container = zActiveTrapContainer();
    if (!container) return;
    const nodes = zFocusable(container);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  new MutationObserver(() => {
    const container = zActiveTrapContainer();
    if (container) zTrapFocus(container);
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  window.addEventListener("resize", () => {
    if (zIsDesktop()) {
      zHideInputPanel();
      zCloseSidebar();
      sheetBackdrop?.classList.remove("visible");
      /* Don't auto-open ask panel — it should only appear when content is available */
    }
    zSyncChipsFromState();
    zUpdateAskPanelMargin();
  });

  $("pom-modal-play")?.addEventListener("click", () => $("pomoPlay")?.click());
  $("pom-modal-reset")?.addEventListener("click", () =>
    $("pomoReset")?.click(),
  );

  /* ===========================
	   12. ASK PANEL VISIBILITY & MARGIN MANAGEMENT
	   =========================== */
  function zUpdateAskPanelMargin() {
    /* Bug 1 fix: Ask panel is a floating overlay — it must NEVER push main content.
		   Main content margin-right stays at 0 always on desktop. The panel overlaps. */
    if (mainContent) mainContent.style.marginRight = "";
    const footer = $("outputFooter");
    if (footer) footer.style.right = "";
  }

  function zSetAskAvailability(isAvailable) {
    const askPanel = $("ask-panel");
    if (askPanel) {
      askPanel.classList.toggle("ask-panel--available", !!isAvailable);
    }
    if (!isAvailable) {
      zCloseAskSheet();
    }
    zUpdateAskPanelMargin();
  }

  /* Run initial margin check */
  zUpdateAskPanelMargin();

  /* If session was restored and has output content, show ask panel */
  if (restored && OC?.querySelector(".output-content")) {
    const askPanel = $("ask-panel");
    if (askPanel) askPanel.classList.add("ask-panel--available");
    zSetAskAvailability(true);
    if (zIsDesktop() && askBody) zOpenAskSheet();
    zUpdateAskPanelMargin();
  }

  if (OC) {
    new MutationObserver(() => {
      const liveOutput = OC.querySelector(".output-content");
      const outputText = (OC.textContent || "").replace(/\s+/g, " ").trim();
      const hasVisibleContent =
        !!liveOutput &&
        outputText.length > 0 &&
        !/your generated content will appear here/i.test(outputText);
      zSetAskAvailability(hasVisibleContent);
    }).observe(OC, { childList: true, subtree: true, characterData: true });
  }

  /* Streaming uses markdown-only rendering; KaTeX is reserved for the final render pass. */
  /* ═══════════════════════════════════════════════════════════
	   15. STREAK SYSTEM
	   ═══════════════════════════════════════════════════════════ */
  function calculateStreak() {
    try {
      const sessions = JSON.parse(
        localStorage.getItem("zyvexa_sessions") || "[]",
      );
      if (sessions.length === 0) return 0;

      function _dateKey(d) {
        return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      }

      const dateSet = new Set();
      for (const s of sessions) {
        if (!s.lastActive) continue;
        dateSet.add(_dateKey(new Date(s.lastActive)));
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let check = new Date(today);

      /* Allow today or yesterday as start */
      if (!dateSet.has(_dateKey(check))) {
        check.setDate(check.getDate() - 1);
        if (!dateSet.has(_dateKey(check))) return 0;
      }

      let streak = 0;
      while (dateSet.has(_dateKey(check))) {
        streak++;
        check.setDate(check.getDate() - 1);
      }
      return streak;
    } catch (e) {
      return 0;
    }
  }

  window.updateStreakUI = function () {
    const streakCount = $("streakCount");
    if (streakCount) {
      const streak = calculateStreak();
      streakCount.textContent = streak;
      const flame = streakCount.previousElementSibling;
      if (flame) {
        if (streak > 0) flame.style.color = "#ff8a00";
        else flame.style.color = "var(--text-ghost)";
      }
    }
  };

  /* ═══════════════════════════════════════════════════════════
	   16. EXAM SIMULATION RENDERER
	   ═══════════════════════════════════════════════════════════ */
  window.zRenderExamUI = function (rawText) {
    const oc = $("outputContainer");
    const of = $("outputFooter");
    if (!oc) return;

    oc.innerHTML = "";
    if (of) of.classList.remove("output-footer--show");

    try {
      /* Look for JSON content */
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON payload found");

      const exam = JSON.parse(jsonMatch[0]);

      let html =
        '<div class="exam-paper-wrap" style="padding: 24px; background: var(--surface-1); border-radius: 12px; border: 1px solid var(--line-1);">';
      html +=
        '<div class="exam-header" style="text-align: center; border-bottom: 2px solid var(--line-2); padding-bottom: 16px; margin-bottom: 24px;">';
      html +=
        '<h1 style="margin: 0 0 8px; font-family: var(--font-head); font-size: 24px;">' +
        (exam.title || "Exam Simulation") +
        "</h1>";
      html +=
        '<p style="margin: 0; color: var(--text-secondary); font-size: 14px;">Attempt all sections sequentially. Answers are hidden until submitted.</p>';
      html += "</div>";

      html += '<div class="exam-body">';

      /* Section A: MCQ */
      if (exam.section_a && exam.section_a.mcq) {
        html += '<div class="exam-section" style="margin-bottom: 32px;">';
        html +=
          '<h2 style="font-size: 18px; margin-bottom: 16px; color: var(--accent-primary);">Section A: Multiple Choice</h2>';
        exam.section_a.mcq.forEach((q, i) => {
          html +=
            '<div class="exam-q" style="margin-bottom: 16px; background: var(--surface-2); padding: 16px; border-radius: 8px;">';
          html +=
            '<div class="q-text" style="font-weight: 600; margin-bottom: 12px;">Q' +
            (i + 1) +
            ". " +
            escapeHtml(q.question) +
            "</div>";
          html += '<div class="q-opts" style="display: grid; gap: 8px;">';
          const opts = Array.isArray(q.options)
            ? q.options
            : [q.option_a, q.option_b, q.option_c, q.option_d];
          const labels = ["A", "B", "C", "D"];
          opts.forEach((opt, oi) => {
            if (!opt) return;
            html +=
              '<label style="display: flex; gap: 8px; cursor: pointer; padding: 8px; border: 1px solid var(--line-1); border-radius: 6px;">';
            html +=
              '<input type="radio" name="q_mcq_' +
              i +
              '" value="' +
              labels[oi] +
              '"> ';
            html +=
              "<span><strong>" +
              labels[oi] +
              ")</strong> " +
              escapeHtml(opt) +
              "</span>";
            html += "</label>";
          });
          html += "</div>";
          html += "</div>";
        });
        html += "</div>";
      }

      /* Submission */
      html +=
        '<div class="exam-submit-wrap" style="text-align: center; margin-top: 32px;">';
      html +=
        '<button id="examSubmitBtn" class="btn-generate" style="padding: 12px 32px; font-size: 16px;">Submit Exam</button>';
      html += "</div>";

      html += "</div></div>";
      oc.innerHTML = html;

      const submitBtn = document.getElementById("examSubmitBtn");
      if (submitBtn) {
        submitBtn.addEventListener("click", () => {
          submitBtn.textContent = "Evaluating...";
          submitBtn.disabled = true;
          setTimeout(() => {
            submitBtn.textContent = "Exam Submitted";
            /* Minimal logic: just reveal answers for now */
            alert(
              "Exam submitted! In a full implementation, this triggers /api/evaluate.",
            );
          }, 1000);
        });
      }
    } catch (e) {
      oc.innerHTML =
        '<div class="error-text" style="padding: 24px; background: rgba(239, 86, 86, 0.1); border: 1px solid rgba(239, 86, 86, 0.3); border-radius: 8px;">' +
        '<h3 style="color: var(--accent-danger); margin-top: 0;">Exam Formatting Error</h3>' +
        "<p>Failed to parse the exam structure. Ensure the backend returns valid JSON matching the schema.</p>" +
        '<pre style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 4px; overflow: auto; max-height: 200px;">' +
        escapeHtml(rawText) +
        "</pre></div>";
    }
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ═══════════════════════════════════════════════════════════
	   17. SMART TOPIC AUTOCOMPLETE
	   ═══════════════════════════════════════════════════════════ */
  let _autocompleteTimeout = null;
  let _autocompleteSuppressed = false;
  const topicInputEl = $("topicsInput");
  const mobileTopicEl = $("mobile-topic-input");

  function zDismissAllAutocompletes() {
    document
      .querySelectorAll(".topic-autocomplete.open")
      .forEach((d) => d.classList.remove("open"));
  }

  function zInitAutocomplete(inputEl) {
    if (!inputEl) return;

    const wrapper =
      inputEl.closest(".topic-input-wrap") || inputEl.parentElement;
    if (!wrapper) return;
    wrapper.style.position = "relative";

    let dropdown = wrapper.querySelector(".topic-autocomplete");
    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.className = "topic-autocomplete";
      wrapper.appendChild(dropdown);
    }

    let highlightIdx = -1;

    function selectItem(topic) {
      _autocompleteSuppressed = true;
      clearTimeout(_autocompleteTimeout);
      dropdown.classList.remove("open");
      inputEl.value = topic;
      const other = inputEl === topicInputEl ? mobileTopicEl : topicInputEl;
      if (other) other.value = topic;
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      checkTopicChange();
      setTimeout(() => {
        _autocompleteSuppressed = false;
      }, 350);
    }

    inputEl.addEventListener("input", () => {
      if (_autocompleteSuppressed) return;
      clearTimeout(_autocompleteTimeout);
      _autocompleteTimeout = setTimeout(() => {
        if (_autocompleteSuppressed) return;
        const query = inputEl.value.trim();
        const searchFn = window.__zyvexa_searchTopics;
        if (!searchFn || query.length < 2) {
          dropdown.classList.remove("open");
          return;
        }

        const results = searchFn(query, 6);
        if (results.length === 0) {
          dropdown.classList.remove("open");
          return;
        }

        highlightIdx = -1;
        dropdown.innerHTML = results
          .map(
            (r, i) =>
              '<div class="topic-autocomplete__item" data-idx="' +
              i +
              '" data-topic="' +
              escapeHtml(r.topic) +
              '">' +
              '<span class="topic-autocomplete__topic">' +
              escapeHtml(r.topic) +
              "</span>" +
              '<span class="topic-autocomplete__cat">' +
              escapeHtml(r.categoryLabel) +
              "</span>" +
              "</div>",
          )
          .join("");
        dropdown.classList.add("open");

        dropdown
          .querySelectorAll(".topic-autocomplete__item")
          .forEach((item) => {
            item.addEventListener("mousedown", (e) => {
              e.preventDefault();
              selectItem(item.dataset.topic);
            });
          });
      }, 200);
    });

    inputEl.addEventListener("keydown", (e) => {
      if (!dropdown.classList.contains("open")) return;
      const items = dropdown.querySelectorAll(".topic-autocomplete__item");
      if (e.key === "ArrowDown") {
        e.preventDefault();
        highlightIdx = Math.min(highlightIdx + 1, items.length - 1);
        items.forEach((it, i) =>
          it.classList.toggle("highlighted", i === highlightIdx),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlightIdx = Math.max(highlightIdx - 1, 0);
        items.forEach((it, i) =>
          it.classList.toggle("highlighted", i === highlightIdx),
        );
      } else if (
        e.key === "Enter" &&
        highlightIdx >= 0 &&
        items[highlightIdx]
      ) {
        e.preventDefault();
        selectItem(items[highlightIdx].dataset.topic);
      } else if (e.key === "Escape") {
        dropdown.classList.remove("open");
      }
    });

    inputEl.addEventListener("blur", () => {
      setTimeout(() => dropdown.classList.remove("open"), 200);
    });
  }

  /* Dismiss autocomplete on outside click */
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".topic-input-wrap") &&
      !e.target.closest(".topic-autocomplete")
    ) {
      zDismissAllAutocompletes();
    }
  });
  const btnGen = $("generateBtn");
  if (btnGen) btnGen.addEventListener("click", zDismissAllAutocompletes);
  const mobileBtnGen = $("mobile-generate-btn");
  if (mobileBtnGen)
    mobileBtnGen.addEventListener("click", zDismissAllAutocompletes);

  zInitAutocomplete(topicInputEl);
  zInitAutocomplete(mobileTopicEl);

  /* Duplicate overlay code removed — primary Recall (section 6) and Flashcard (section 6) above handle all logic */

  /* ===========================
     URL PARAM HANDLING — Session Resume & Topic Pre-fill
     =========================== */
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session");
    const topicParam = urlParams.get("topic");

    if (sessionId) {
      /* Resume a specific session */
      sessionsLoad();
      const target = sessions.find((s) => s.id === sessionId);
      if (target) {
        sessionSwitch(sessionId);
        /* Re-render output content with KaTeX/Mermaid if present */
        setTimeout(() => {
          if (typeof window.zRenderMathAndDiagrams === "function") {
            window.zRenderMathAndDiagrams();
          }
          /* Make content available for recall/flashcards */
          if (target.outputContent) {
            contentIsReady = true;
            currentRawContent = target.outputContent;
            window.__zyvexa_lastRawText = target.outputContent;
            /* Show action bar */
            const inlineActions = $("inline-actions");
            if (inlineActions) inlineActions.classList.remove("hidden");
            /* Show ask panel */
            const askPanelEl = $("ask-panel");
            if (askPanelEl) askPanelEl.classList.add("ask-panel--available");
            zSetAskAvailability(true);
            zUpdateAskPanelMargin();
          }
        }, 300);
      }
      /* Clean URL */
      window.history.replaceState({}, "", window.location.pathname);
    } else if (topicParam) {
      /* Pre-fill topic from Home page subject cards */
      const inp = $("topicsInput");
      if (inp) {
        inp.value = topicParam;
        checkTopicChange();
      }
      /* Clean URL */
      window.history.replaceState({}, "", window.location.pathname);
    }
  } catch (e) {
    console.warn("URL param handling error:", e);
  }

});

