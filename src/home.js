/* ═══════════════════════════════════════════════════════════
   Zyvexa — Home Page
   Quick Resume, Stats, Explore Subjects, Streak
   ═══════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);

const SESSIONS_KEY = "zyvexa_sessions";

const MODE_NAMES = {
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

const SUBJECTS = [
	{ name: "Physics", icon: "⚡", topic: "Physics" },
	{ name: "Chemistry", icon: "🧪", topic: "Chemistry" },
	{ name: "Mathematics", icon: "📐", topic: "Mathematics" },
	{ name: "Biology", icon: "🧬", topic: "Biology" },
	{ name: "Computer Science", icon: "💻", topic: "Computer Science" },
	{ name: "English", icon: "📖", topic: "English" },
	{ name: "History", icon: "📜", topic: "History" },
	{ name: "Economics", icon: "📊", topic: "Economics" },
	{ name: "Electrical", icon: "🔌", topic: "Electrical Engineering" },
	{ name: "Mechanical", icon: "⚙️", topic: "Mechanical Engineering" },
	{ name: "Civil", icon: "🏗️", topic: "Civil Engineering" },
	{ name: "Data Structures", icon: "🌲", topic: "Data Structures" },
];

/* ── Load sessions ── */
function loadSessions() {
	try {
		return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
	} catch {
		return [];
	}
}

/* ── Date key helper ── */
function dateKey(d) {
	return (
		d.getFullYear() +
		"-" +
		String(d.getMonth() + 1).padStart(2, "0") +
		"-" +
		String(d.getDate()).padStart(2, "0")
	);
}

/* ── Streak ── */
function calculateStreak(sessions) {
	if (sessions.length === 0) return 0;

	const dateSet = new Set();
	for (const s of sessions) {
		if (!s.lastActive) continue;
		dateSet.add(dateKey(new Date(s.lastActive)));
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	let check = new Date(today);

	if (!dateSet.has(dateKey(check))) {
		check.setDate(check.getDate() - 1);
		if (!dateSet.has(dateKey(check))) return 0;
	}

	let streak = 0;
	while (dateSet.has(dateKey(check))) {
		streak++;
		check.setDate(check.getDate() - 1);
	}
	return streak;
}

/* ── Relative time ── */
function relativeTime(dateStr) {
	if (!dateStr) return "";
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "Just now";
	if (mins < 60) return mins + "m ago";
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return hrs + "h ago";
	const days = Math.floor(hrs / 24);
	if (days === 1) return "Yesterday";
	if (days < 7) return days + "d ago";
	if (days < 30) return Math.floor(days / 7) + "w ago";
	return new Date(dateStr).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
	});
}

/* ── Escape HTML ── */
function esc(str) {
	return String(str || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/* ── Quick Resume ── */
function renderQuickResume(sessions) {
	const grid = $("resumeGrid");
	const empty = $("resumeEmpty");
	if (!grid) return;

	if (sessions.length === 0) {
		grid.innerHTML = "";
		if (empty) empty.classList.remove("hidden");
		return;
	}

	if (empty) empty.classList.add("hidden");

	/* Sort by most recent, take top 3 */
	const recent = [...sessions]
		.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive))
		.slice(0, 3);

	grid.innerHTML = recent
		.map((s) => {
			const mastery = Math.round(s.masteryPercent || 0);
			const modeLabel = s.activeMode ? (MODE_NAMES[s.activeMode] || s.activeMode) : "";
			return (
				'<article class="resume-card">' +
				"<h3>" + esc(s.topic || s.title || "Untitled Session") + "</h3>" +
				'<div class="session-card__mastery-track" style="margin:8px 0">' +
				'<div class="session-card__mastery-fill" style="width:' + mastery + '%"></div>' +
				"</div>" +
				'<p>' +
				'<span>🎯 ' + mastery + '% mastery</span>' +
				(modeLabel ? ' · <span>' + esc(modeLabel) + '</span>' : '') +
				' · <span>🕐 ' + relativeTime(s.lastActive) + '</span>' +
				"</p>" +
				'<div class="resume-actions">' +
				'<a href="app.html?session=' + encodeURIComponent(s.id) + '" class="btn-ghost">Resume →</a>' +
				"</div>" +
				"</article>"
			);
		})
		.join("");
}

/* ── Stats ── */
function renderStats(sessions) {
	const streak = calculateStreak(sessions);
	const topics = new Set(
		sessions.map((s) => (s.topic || "").toLowerCase().trim()).filter(Boolean)
	);
	const avgMastery =
		sessions.length > 0
			? Math.round(
					sessions.reduce((sum, s) => sum + (s.masteryPercent || 0), 0) /
						sessions.length
				)
			: 0;

	/* Animate count-up */
	function countUp(el, target, suffix) {
		if (!el) return;
		let current = 0;
		const step = Math.max(1, Math.ceil(target / 30));
		const interval = setInterval(() => {
			current += step;
			if (current >= target) {
				current = target;
				clearInterval(interval);
			}
			el.textContent = current + (suffix || "");
		}, 30);
	}

	countUp($("statCurrentStreak"), streak, " days");
	countUp($("statTopics"), topics.size, "");
	countUp($("statSessions"), sessions.length, "");
	countUp($("statMastery"), avgMastery, "%");

	/* Update streak in topbar */
	const streakEl = $("streakCount");
	if (streakEl) {
		streakEl.textContent = streak;
		const flame = streakEl.previousElementSibling;
		if (flame) {
			if (streak > 0) flame.style.color = "#ff8a00";
			else flame.style.color = "var(--text-ghost)";
		}
	}
}

/* ── Explore Subjects ── */
function renderSubjects() {
	const grid = $("subjectExploreGrid");
	if (!grid) return;

	grid.innerHTML = SUBJECTS.map(
		(s) =>
			'<article class="subject-card" role="listitem" data-topic="' +
			esc(s.topic) +
			'">' +
			'<h3 style="font-size:28px;margin-bottom:4px">' +
			s.icon +
			"</h3>" +
			"<h3>" +
			esc(s.name) +
			"</h3>" +
			'<p>Start studying ' +
			esc(s.name) +
			"</p>" +
			"</article>"
	).join("");

	grid.querySelectorAll(".subject-card").forEach((card) => {
		card.addEventListener("click", () => {
			const topic = card.dataset.topic;
			window.location.href =
				"app.html?topic=" + encodeURIComponent(topic);
		});
	});
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
	const sessions = loadSessions();
	renderQuickResume(sessions);
	renderStats(sessions);
	renderSubjects();
});
