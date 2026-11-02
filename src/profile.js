/* ═══════════════════════════════════════════════════════════
   Zyvexa — Profile Page
   Persistence, stats, mastery display, heatmap, settings
   ═══════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);

import {
	SESSIONS_KEY, PROFILE_KEY, MODE_NAMES,
	loadSessions, loadProfile, saveProfile,
	dateKey, calculateStreak, escHtml, renderHeatmap
} from "./utils.js";

/* ── Stats Grid ── */
function renderStats(sessions) {
	const grid = $("profileStatsGrid");
	if (!grid) return;

	const streak = calculateStreak(sessions);
	const topics = new Set(
		sessions.map((s) => (s.topic || "").toLowerCase().trim()).filter(Boolean)
	);
	const totalWords = sessions.reduce((sum, s) => sum + (s.wordCount || 0), 0);
	const avgMastery =
		sessions.length > 0
			? Math.round(
					sessions.reduce((sum, s) => sum + (s.masteryPercent || 0), 0) /
						sessions.length
				)
			: 0;

	const stats = [
		{ label: "Current streak", value: streak + " days", icon: "🔥" },
		{ label: "Total topics", value: topics.size, icon: "📚" },
		{ label: "Total sessions", value: sessions.length, icon: "📋" },
		{ label: "Words generated", value: totalWords.toLocaleString(), icon: "📝" },
		{ label: "Average mastery", value: avgMastery + "%", icon: "🎯" },
		{
			label: "Time studied",
			value:
				sessions.reduce((sum, s) => sum + (s.readTime || 0), 0) + " min",
			icon: "⏱",
		},
	];

	grid.innerHTML = stats
		.map(
			(s) =>
				'<article class="stat-card"><span>' +
				s.icon +
				" " +
				s.label +
				"</span><strong>" +
				s.value +
				"</strong></article>"
		)
		.join("");
}

/* ── Mastery Topics List ── */
function renderMasteryList(sessions) {
	const container = $("masteryTopicList");
	const filter = $("profileSubjectFilter");
	if (!container) return;

	/* Group sessions by topic */
	const topicMap = {};
	for (const s of sessions) {
		const t = (s.topic || "").trim();
		if (!t) continue;
		const key = t.toLowerCase();
		if (!topicMap[key]) {
			topicMap[key] = {
				topic: t,
				mastery: 0,
				modes: new Set(),
				lastActive: s.lastActive,
			};
		}
		topicMap[key].mastery = Math.max(
			topicMap[key].mastery,
			s.masteryPercent || 0
		);
		(s.modesUsed || []).forEach((m) => topicMap[key].modes.add(m));
		if (new Date(s.lastActive) > new Date(topicMap[key].lastActive)) {
			topicMap[key].lastActive = s.lastActive;
		}
	}

	const topics = Object.values(topicMap).sort(
		(a, b) => b.mastery - a.mastery
	);

	if (topics.length === 0) {
		container.innerHTML =
			'<p style="color:var(--text-ghost)">No mastery data yet. Start studying!</p>';
		return;
	}

	/* Populate subject filter */
	if (filter) {
		filter.innerHTML = '<option value="all">All subjects</option>';
	}

	container.innerHTML = topics
		.map((t) => {
			const pct = Math.round(t.mastery);
			const modesArr = Array.from(t.modes);
			const modesPills = modesArr.slice(0, 3).map(m =>
				'<span class="session-card__mode-pill">' + escHtml(MODE_NAMES[m] || m) + '</span>'
			).join('');
			return (
				'<div class="mastery-topic-row">' +
				'<div class="mastery-topic-row__head">' +
				'<span class="mastery-topic-row__name">' +
				escHtml(t.topic) +
				"</span>" +
				'<span class="mastery-topic-row__pct">' +
				pct +
				"%</span>" +
				"</div>" +
				'<div class="mastery-topic-row__track">' +
				'<div class="mastery-topic-row__fill" style="width:' +
				pct +
				'%"></div>' +
				"</div>" +
				(modesPills ? '<div class="mastery-topic-row__modes">' + modesPills + '</div>' : '') +
				"</div>"
			);
		})
		.join("");
}

/* ── Subject Mastery (Horizontal Bar Chart) ── */
function renderSubjectMastery(sessions) {
	const chart = $("subjectMasteryChart");
	if (!chart) return;

	const subjMap = {
		'Physics': { masterySum: 0, count: 0, keywords: ['physic','ohm','newton','wave','thermo','electric'] },
		'Chemistry': { masterySum: 0, count: 0, keywords: ['chem','bond','acid','base','organic','periodic'] },
		'Maths': { masterySum: 0, count: 0, keywords: ['math','algebra','calc','prob','equat','vector','trig'] },
		'Biology': { masterySum: 0, count: 0, keywords: ['bio','cell','digest','genetic','resp','eco'] },
		'Computer Science': { masterySum: 0, count: 0, keywords: ['algorithm','program','code','data struct','database','sql','network','operating','python','java'] },
		'History': { masterySum: 0, count: 0, keywords: ['hist','war','revolution','medieval','empire','independence'] },
		'Engineering': { masterySum: 0, count: 0, keywords: ['engineer','control','machine','strength','power elec','instrument'] },
		'General': { masterySum: 0, count: 0, keywords: [] }
	};

	for (const s of sessions) {
		const t = (s.topic || "").toLowerCase();
		let found = false;
		for(const subj in subjMap) {
			if(subjMap[subj].keywords.some(k => t.includes(k))) {
				subjMap[subj].masterySum += (s.masteryPercent || 0);
				subjMap[subj].count++;
				found = true;
				break;
			}
		}
		if(!found) {
			subjMap['General'].masterySum += (s.masteryPercent || 0);
			subjMap['General'].count++;
		}
	}

	const data = Object.keys(subjMap)
		.filter(k => subjMap[k].count > 0)
		.map(k => ({
			subject: k,
			mastery: Math.round(subjMap[k].masterySum / subjMap[k].count),
			count: subjMap[k].count
		}))
		.sort((a, b) => b.mastery - a.mastery);

	if(data.length === 0) {
		chart.innerHTML = '<p style="color:var(--text-ghost)">Not enough data yet.</p>';
		return;
	}

	chart.innerHTML = data.map(d => `
		<div class="subj-bar-row">
			<div class="subj-bar-label">${d.subject} <span class="subj-bar-count">(${d.count})</span></div>
			<div class="subj-bar-track">
				<div class="subj-bar-fill" style="width: ${d.mastery}%"></div>
			</div>
			<div class="subj-bar-pct">${d.mastery}%</div>
		</div>
	`).join('');
}

/* Init */
document.addEventListener("DOMContentLoaded", () => {
	const profile = loadProfile();
	const sessions = loadSessions();

	/* Populate identity fields */
	const nameInput = $("profileName");
	const levelSelect = $("profileLevel");
	const langSelect = $("profileLanguage");
	const avatar = $("profileAvatar");

	if (nameInput) nameInput.value = profile.name || "Zyvexa Student";
	if (levelSelect) levelSelect.value = profile.level || "diploma";
	if (langSelect) langSelect.value = profile.language || "english";
	if (avatar) {
		avatar.textContent = (profile.name || "Z").charAt(0).toUpperCase();
	}

	function syncProfile() {
		const p = loadProfile();
		if (nameInput) p.name = nameInput.value.trim();
		if (levelSelect) p.level = levelSelect.value;
		if (langSelect) p.language = langSelect.value;
		if (avatar && p.name) {
			avatar.textContent = p.name.charAt(0).toUpperCase();
		}
		saveProfile(p);
	}

	nameInput?.addEventListener("change", syncProfile);
	nameInput?.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			syncProfile();
			nameInput.blur();
		}
	});
	levelSelect?.addEventListener("change", syncProfile);
	langSelect?.addEventListener("change", syncProfile);

	/* Segmented Control for Response Depth */
	const depthBtns = document.querySelectorAll("#responseDepthControl .segment-btn");
	const currentDepth = profile.responseDepth || "balanced";

	depthBtns.forEach(btn => {
		if (btn.dataset.val === currentDepth) btn.classList.add("active");

		btn.addEventListener("click", () => {
			depthBtns.forEach(b => b.classList.remove("active"));
			btn.classList.add("active");
			const p = loadProfile();
			p.responseDepth = btn.dataset.val;
			saveProfile(p);
		});
	});

	/* Streak */
	const streakEl = $("streakCount");
	if (streakEl) streakEl.textContent = calculateStreak(sessions);

	/* Render all sections */
	renderStats(sessions);
	renderMasteryList(sessions);
	renderHeatmap(sessions, "profileHeatmap", "profileHeatmapDetails");
	renderSubjectMastery(sessions);
});
