export const SESSIONS_KEY = "zyvexa_sessions";
export const PROFILE_KEY = "zyvexa_profile";

export const MODE_NAMES = {
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

export function loadSessions() {
	try {
		return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
	} catch {
		return [];
	}
}

export function saveSessions(sessions) {
	try {
		localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
	} catch (e) {
		console.warn("Failed to save sessions:", e);
	}
}

export function loadProfile() {
	try {
		return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
	} catch {
		return {};
	}
}

export function saveProfile(profile) {
	try {
		localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
	} catch (e) {
		console.warn("Failed to save profile:", e);
	}
}

export function dateKey(d) {
	return (
		d.getFullYear() +
		"-" +
		String(d.getMonth() + 1).padStart(2, "0") +
		"-" +
		String(d.getDate()).padStart(2, "0")
	);
}

export function calculateStreak(sessions) {
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

export function relativeTime(dateStr) {
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

export function escHtml(str) {
	return String(str || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * Render a 90-day activity heatmap into the specified container.
 * @param {Array} sessions - Array of session objects with lastActive and topic fields
 * @param {string} containerId - DOM id of the heatmap container
 * @param {string} detailsId - DOM id of the details text element
 */
export function renderHeatmap(sessions, containerId, detailsId) {
	const container = document.getElementById(containerId);
	const details = document.getElementById(detailsId);
	if (!container) return;

	const activityMap = {};
	for (const s of sessions) {
		if (!s.lastActive) continue;
		const key = dateKey(new Date(s.lastActive));
		if (!activityMap[key]) activityMap[key] = { count: 0, topics: [] };
		activityMap[key].count++;
		if (s.topic && !activityMap[key].topics.includes(s.topic)) {
			activityMap[key].topics.push(s.topic);
		}
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayKey = dateKey(today);

	/* Calculate start date — 90 days ago, aligned to Monday */
	const startDate = new Date(today);
	startDate.setDate(today.getDate() - 90);
	const dayOfWeek = startDate.getDay();
	const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
	startDate.setDate(startDate.getDate() - offset);

	let html = '<div class="heatmap-calendar">';

	/* Day labels */
	html += '<div class="heatmap-day-labels">';
	["M", "", "W", "", "F", "", ""].forEach((d) => {
		html += `<div class="day-lbl">${d}</div>`;
	});
	html += "</div>";

	html += '<div class="heatmap-cells">';

	const d = new Date(startDate);
	while (d <= today) {
		const key = dateKey(d);
		const act = activityMap[key] || { count: 0, topics: [] };
		let level = 0;
		if (act.count >= 4) level = 4;
		else if (act.count >= 3) level = 3;
		else if (act.count >= 2) level = 2;
		else if (act.count >= 1) level = 1;

		let classes = `heatmap-cell heatmap-cell--${level}`;
		if (key === todayKey) classes += " heatmap-cell--today";

		html += `<div class="${classes}" data-date="${key}" title="${key}: ${act.count} session${act.count !== 1 ? "s" : ""}"></div>`;
		d.setDate(d.getDate() + 1);
	}

	html += "</div></div>";

	/* Legend */
	html += '<div class="heatmap-legend-bar"><span>Less</span>';
	for (let i = 0; i <= 4; i++) {
		html += `<div class="heatmap-cell heatmap-cell--${i}" style="width:12px;height:12px;display:inline-block;border-radius:2px;margin:0 2px;cursor:default"></div>`;
	}
	html += "<span>More</span></div>";

	container.innerHTML = html;

	/* Hover details */
	container.querySelectorAll(".heatmap-cell[data-date]").forEach((cell) => {
		cell.addEventListener("mouseenter", () => {
			if (!details) return;
			const key = cell.dataset.date;
			const act = activityMap[key];
			if (!act || act.count === 0) {
				details.textContent = key + " — No study activity";
				return;
			}
			details.textContent = `${key} — ${act.count} session${act.count !== 1 ? "s" : ""}: ${act.topics.length ? act.topics.join(", ") : "Topics not recorded"}`;
		});
		cell.addEventListener("mouseleave", () => {
			if (details)
				details.textContent = "Hover over a day to see details";
		});
	});
}
