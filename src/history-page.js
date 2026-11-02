/* ═══════════════════════════════════════════════════════════
   Zyvexa — History Page
   Session list, sorting, 90-day activity heatmap, bulk actions
   ═══════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);

import {
	SESSIONS_KEY, MODE_NAMES,
	loadSessions, saveSessions,
	relativeTime, escHtml as esc,
	dateKey, calculateStreak, renderHeatmap
} from "./utils.js";

/* ── Render session cards ── */
function renderSessions(sessions, sortBy) {
	const list = $("historyList");
	const empty = $("historyEmpty");
	if (!list) return;

	if (sessions.length === 0) {
		list.innerHTML = "";
		if (empty) empty.classList.remove("hidden");
		return;
	}

	if (empty) empty.classList.add("hidden");

	/* Sort */
	const sorted = [...sessions];
	if (sortBy === "mastery") {
		sorted.sort(
			(a, b) => (b.masteryPercent || 0) - (a.masteryPercent || 0)
		);
	} else if (sortBy === "topic") {
		sorted.sort((a, b) =>
			(a.topic || "").localeCompare(b.topic || "", "en", {
				sensitivity: "base",
			})
		);
	} else {
		sorted.sort(
			(a, b) => new Date(b.lastActive) - new Date(a.lastActive)
		);
	}

	list.innerHTML = sorted
		.map((s) => {
			const mastery = Math.round(s.masteryPercent || 0);
			const modesPills = (s.modesUsed || [])
				.slice(0, 4)
				.map(
					(m) =>
						'<span class="session-card__mode-pill">' +
						esc(MODE_NAMES[m] || m) +
						"</span>"
				)
				.join("");

			const wc = s.wordCount || 0;
			const rt = s.readTime || 0;

			return (
				'<article class="session-card" data-id="' +
				esc(s.id) +
				'">' +
				'<label class="session-card__checkbox"><input type="checkbox" value="' + esc(s.id) + '" class="session-check"></label>' +
				'<div class="session-card__head">' +
				'<div class="session-card__topic">' +
				esc(s.topic || "Untitled Session") +
				"</div>" +
				(s.level
					? '<span class="session-card__badge">' +
						esc(s.level) +
						"</span>"
					: "") +
				"</div>" +
				'<div class="session-card__mastery-track">' +
				'<div class="session-card__mastery-fill" style="width:' +
				mastery +
				'%"></div>' +
				"</div>" +
				(modesPills
					? '<div class="session-card__modes">' +
						modesPills +
						"</div>"
					: "") +
				'<div class="session-card__meta">' +
				"<span>🎯 " +
				mastery +
				"% mastery</span>" +
				(wc > 0
					? "<span>📝 " + wc.toLocaleString() + " words</span>"
					: "") +
				(rt > 0 ? "<span>⏱ " + rt + " min read</span>" : "") +
				"<span>🕐 " +
				relativeTime(s.lastActive) +
				"</span>" +
				"</div>" +
				'<div class="session-card__actions">' +
				'<button class="session-card__delete" data-session="' +
				esc(s.id) +
				'">✕</button>' +
				'<button class="session-card__resume" data-session="' +
				esc(s.id) +
				'">Resume →</button>' +
				"</div>" +
				"</article>"
			);
		})
		.join("");

	/* Resume button handlers */
	list.querySelectorAll(".session-card__resume").forEach((btn) => {
		btn.addEventListener("click", () => {
			const sid = btn.dataset.session;
			window.location.href = "app.html?session=" + encodeURIComponent(sid);
		});
	});

	/* Inline Delete handlers */
	list.querySelectorAll(".session-card__delete").forEach((btn) => {
		btn.addEventListener("click", () => {
			const sid = btn.dataset.session;
			const card = btn.closest(".session-card");
			const actionsDiv = card.querySelector(".session-card__actions");

			actionsDiv.innerHTML = `
				<span style="font-size: 13px; color: var(--text-ghost); font-weight: 500; margin-right: auto; align-self: center;">Delete this session?</span>
				<button class="session-card__delete confirm" id="confirmDel-${sid}">Yes, delete</button>
				<button class="session-card__delete" id="cancelDel-${sid}" style="background:transparent; color:var(--text-ghost)">Cancel</button>
			`;

			document.getElementById("confirmDel-" + sid).addEventListener("click", () => {
				card.style.height = card.offsetHeight + "px";
				card.style.overflow = "hidden";
				card.style.transition = "all 250ms ease";
				setTimeout(() => {
					card.style.opacity = "0";
					card.style.padding = "0";
					card.style.height = "0";
					card.style.marginBottom = "0";
					card.style.borderWidth = "0";
				}, 10);

				setTimeout(() => {
					let allSessions = loadSessions();
					allSessions = allSessions.filter(s => s.id !== sid);
					saveSessions(allSessions);
					renderSessions(allSessions, sortBy);
					renderHeatmap(allSessions, "historyHeatmap", "heatmapDetails");
				}, 260);
			});

			document.getElementById("cancelDel-" + sid).addEventListener("click", () => {
				let allSessions = loadSessions();
				renderSessions(allSessions, sortBy);
			});
		});
	});

	/* Checkbox handlers */
	const checkboxes = list.querySelectorAll(".session-check");
	checkboxes.forEach(cb => {
		cb.addEventListener("change", updateBulkActionState);
	});
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
	let sessions = loadSessions();
	let currentSort = "recent";

	/* ── Title migration: fix any sessions with empty or placeholder titles ── */
	let migrated = false;
	for (const s of sessions) {
		if (!s.title || s.title === "Untitled Session" || s.title === "Untitled") {
			if (s.topic && s.topic.trim()) {
				s.title = s.topic.trim();
				migrated = true;
			}
		}
		/* Ensure all sessions have required fields */
		if (!s.wordCount && s.outputContent) {
			const tmp = document.createElement("div");
			tmp.innerHTML = s.outputContent;
			const wc = (tmp.textContent.trim().match(/\S+/g) || []).length;
			s.wordCount = wc;
			s.readTime = wc ? Math.max(1, Math.ceil(wc / 200)) : 0;
			migrated = true;
		}
		if (!s.modesUsed) { s.modesUsed = []; migrated = true; }
		if (s.masteryPercent === undefined) { s.masteryPercent = 0; migrated = true; }
	}
	if (migrated) saveSessions(sessions);

	/* Render initial state */
	renderSessions(sessions, currentSort);
	renderHeatmap(sessions, "historyHeatmap", "heatmapDetails");

	/* Update streak */
	const streakEl = $("streakCount");
	if (streakEl) {
		streakEl.textContent = calculateStreak(sessions);
	}

	/* Sort buttons */
	const sortBtns = document.querySelectorAll(".hist-sort-btn");
	sortBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			sortBtns.forEach((b) => b.classList.remove("is-active"));
			btn.classList.add("is-active");
			currentSort = btn.dataset.sort || "recent";
			sessions = loadSessions();
			renderSessions(sessions, currentSort);
		});
	});

	/* Clear All */
	const clearBtn = $("clearAllHistory");
	const overlay = $("historyConfirmOverlay");
	const confirmClose = $("historyConfirmClose");
	const confirmCancel = $("historyConfirmCancel");
	const confirmClear = $("historyConfirmClear");

	clearBtn?.addEventListener("click", () => {
		if (overlay) {
			overlay.classList.remove("hidden");
			overlay.setAttribute("aria-hidden", "false");
		}
	});

	function closeConfirm() {
		if (overlay) {
			overlay.classList.add("hidden");
			overlay.setAttribute("aria-hidden", "true");
		}
	}

	confirmClose?.addEventListener("click", closeConfirm);
	confirmCancel?.addEventListener("click", closeConfirm);

	overlay?.addEventListener("click", (e) => {
		if (e.target === overlay) closeConfirm();
	});

	confirmClear?.addEventListener("click", () => {
		localStorage.removeItem("zyvexa_sessions");
		sessions = [];
		renderSessions(sessions, currentSort);
		renderHeatmap(sessions, "historyHeatmap", "heatmapDetails");
		if (streakEl) streakEl.textContent = "0";
		closeConfirm();
	});

	/* Bulk Actions Initialization */
	const toggleSelectBtn = $("toggleSelectMode");
	const bulkBar = $("bulkActionBar");
	const selectAllCb = $("selectAllSessions");
	const bulkCancelBtn = $("bulkCancel");
	const bulkDeleteBtn = $("bulkDelete");
	const bulkCountSpan = $("bulkSelectCount");

	function toggleSelectMode() {
		const list = $("historyList");
		if (!list) return;
		list.classList.toggle("select-mode-active");
		const isActive = list.classList.contains("select-mode-active");
		toggleSelectBtn.classList.toggle("is-active", isActive);

		if (isActive) {
			bulkBar.classList.remove("hidden");
			updateBulkActionState();
		} else {
			bulkBar.classList.add("hidden");
			list.querySelectorAll(".session-check").forEach(cb => cb.checked = false);
			if (selectAllCb) selectAllCb.checked = false;
		}
	}

	window.updateBulkActionState = function() {
		if (!bulkCountSpan) return;
		const checkboxes = document.querySelectorAll(".session-check:checked");
		const count = checkboxes.length;
		bulkCountSpan.textContent = count + " selected";
		if (selectAllCb) {
			const allCb = document.querySelectorAll(".session-check");
			selectAllCb.checked = allCb.length > 0 && count === allCb.length;
		}
	};

	toggleSelectBtn?.addEventListener("click", toggleSelectMode);
	bulkCancelBtn?.addEventListener("click", toggleSelectMode);

	selectAllCb?.addEventListener("change", (e) => {
		const checkboxes = document.querySelectorAll(".session-check");
		checkboxes.forEach(cb => cb.checked = e.target.checked);
		updateBulkActionState();
	});

	bulkDeleteBtn?.addEventListener("click", () => {
		const checkboxes = document.querySelectorAll(".session-check:checked");
		if (checkboxes.length === 0) return;

		const idsToDelete = Array.from(checkboxes).map(cb => cb.value);
		sessions = sessions.filter(s => !idsToDelete.includes(s.id));
		saveSessions(sessions);

		checkboxes.forEach(cb => {
			const card = cb.closest(".session-card");
			if (card) {
				card.classList.add("fade-out");
			}
		});

		setTimeout(() => {
			renderSessions(sessions, currentSort);
			renderHeatmap(sessions, "historyHeatmap", "heatmapDetails");
			toggleSelectMode();
		}, 300);
	});
});
