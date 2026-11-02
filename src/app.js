import { API_URL } from "./config.js";
import {
	buildSmartDiagnosisPrompt,
	buildConceptBuilderPrompt,
	buildAdaptivePracticePrompt,
	buildMistakeAnalyzerPrompt,
	buildExamSimulationPrompt,
	buildQuickRevisionPrompt,
	buildFormulaFactsPrompt,
	buildMemoryEnginePrompt,
	buildStudyPlannerPrompt,
	getDepthTokenMultiplier
} from "./prompts.js";
import { sessionContext } from "./session-intelligence.js";
import { getTopicTimeDelta, getForgettingCurveModifier } from "./learning-science.js";
import { searchTopics, isVagueTopic, suggestSpecificTopics, detectSubjectType } from "./topic-bank.js";

// Mode ID to builder function mapping
const modeBuilders = {
	smart_diagnosis: buildSmartDiagnosisPrompt,
	concept_builder: buildConceptBuilderPrompt,
	adaptive_practice: buildAdaptivePracticePrompt,
	mistake_analyzer: buildMistakeAnalyzerPrompt,
	exam_simulation: buildExamSimulationPrompt,
	quick_revision: buildQuickRevisionPrompt,
	formula_facts: buildFormulaFactsPrompt,
	memory_engine: buildMemoryEnginePrompt,
	study_planner: buildStudyPlannerPrompt
};

const form = document.getElementById("studyForm");
const topicsInput = document.getElementById("topicsInput");
const boardTypeSelect = document.getElementById("boardType");
const levelTypeSelect = document.getElementById("levelType");
const langSelector = document.getElementById("langSelector");
const optionGrid = document.getElementById("optionGrid");
const optionCards = Array.from(document.querySelectorAll(".option-card"));
const levelPills = Array.from(document.querySelectorAll(".level-pill"));
const langButtons = Array.from(document.querySelectorAll(".lang-btn"));
const uploadZone = document.getElementById("uploadZone");
const fileInput = document.getElementById("fileInput");
const previewGrid = document.getElementById("previewGrid");
const fileProgress = document.getElementById("fileProgress");
const fileProgressFill = document.getElementById("fileProgressFill");
const fileStatus = document.getElementById("fileStatus");
const outputContainer = document.getElementById("outputContainer");
const outputMeta = document.getElementById("outputMeta");
const statusMessage = document.getElementById("statusMessage");
const loadingState = document.getElementById("loadingState");
const loadingText = document.getElementById("loadingText");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const pdfBtn = document.getElementById("pdfBtn");

const selectedOptions = new Set();
let uploadedFiles = [];
let selectedLang = "english";
let cleanupStreamScroll = null;
let activeStreamController = null; // AbortController for current generation

// Expose session intelligence, topic bank, and learning science to ui.js
window.__zyvexa_sessionContext = sessionContext;
window.__zyvexa_searchTopics = searchTopics;
window.__zyvexa_isVagueTopic = isVagueTopic;
window.__zyvexa_suggestSpecificTopics = suggestSpecificTopics;

// ── TASK 9: Cache helpers ──
const CACHE_KEY = "zyvexa_cache";
const CACHE_MAX = 50;
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function buildCacheKey(topic, modeId, examType, level, language) {
	return [
		(topic || "").toLowerCase().trim(),
		modeId || "",
		examType || "",
		level || "",
		language || "english"
	].join("|");
}

function getCacheStore() {
	try {
		return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
	} catch {
		return [];
	}
}

function getCachedResponse(cacheKey) {
	const store = getCacheStore();
	const now = Date.now();
	const entry = store.find(e => e.key === cacheKey);
	if (!entry) return null;
	if (now - entry.timestamp > CACHE_EXPIRY_MS) return null;
	return entry; // return full entry so callers can check .partial
}

function saveToCacheStore(cacheKey, content, topic, mode, partial = false) {
	if (!content || content.length < 100) return;
	let store = getCacheStore();
	// Remove existing entry with same key
	store = store.filter(e => e.key !== cacheKey);
	// Remove expired entries
	const now = Date.now();
	store = store.filter(e => now - e.timestamp < CACHE_EXPIRY_MS);
	// Add new entry at front
	store.unshift({
		key: cacheKey,
		content: content,
		timestamp: now,
		topic: topic,
		mode: mode,
		partial: partial
	});
	// Enforce max limit
	if (store.length > CACHE_MAX) {
		store = store.slice(0, CACHE_MAX);
	}
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(store));
	} catch (e) {
		console.warn("Cache save failed:", e);
	}
}

function buildContinuationPrompt(basePrompt, partialText) {
	const promptPayload =
		basePrompt && typeof basePrompt === "object" && !Array.isArray(basePrompt)
			? basePrompt
			: { user: String(basePrompt || "") };
	const baseUserText = promptPayload.user || promptPayload.prompt || "";
	const partialTail = (partialText || "").slice(-5000);

	return {
		...promptPayload,
		user: `${baseUserText}\n\nYou already generated a partial response. Continue from the exact point it ended. Do not restart from the beginning. Do not repeat previous headings, sections, or sentences.\n\nPARTIAL RESPONSE (DO NOT REPEAT):\n${partialTail}\n\nContinue from the next line only.`
	};
}

function logMissingElement(element, name) {
	if (!element) {
		console.error(`${name} not found`);
	}
	return element;
}

logMissingElement(form, "studyForm");
logMissingElement(topicsInput, "topicsInput");
logMissingElement(outputContainer, "outputContainer");
logMissingElement(statusMessage, "statusMessage");
logMissingElement(generateBtn, "generateBtn");
logMissingElement(clearBtn, "clearBtn");
logMissingElement(copyBtn, "copyBtn");
logMissingElement(loadingState, "loadingState");
logMissingElement(loadingText, "loadingText");

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initializeMermaidRenderer);
} else {
	initializeMermaidRenderer();
}

if (window.pdfjsLib) {
	window.pdfjsLib.GlobalWorkerOptions.workerSrc =
		"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

if (form) {
	form.addEventListener("submit", handleGenerate);
}
if (clearBtn) {
	clearBtn.addEventListener("click", handleClear);
}
if (copyBtn) {
	copyBtn.addEventListener("click", handleCopy);
}
if (optionGrid) {
	optionGrid.addEventListener("click", handleOptionToggle);
}
for (const pill of levelPills) {
	pill.addEventListener("click", handleLevelSelect);
}
if (levelTypeSelect) {
	levelTypeSelect.addEventListener("change", updateLevelUI);
}
if (langSelector) {
	langSelector.addEventListener("click", handleLanguageSelect);
}
if (previewGrid) {
	previewGrid.addEventListener("click", handleFileRemove);
}
if (topicsInput) {
	topicsInput.addEventListener("input", updateGenerateState);
}

if (uploadZone) {
	uploadZone.addEventListener("dragover", (event) => {
		event.preventDefault();
		uploadZone.classList.add("dragover");
	});

	uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));

	uploadZone.addEventListener("drop", (event) => {
		event.preventDefault();
		uploadZone.classList.remove("dragover");
		handleFiles(event.dataTransfer.files);
	});

	uploadZone.addEventListener("click", () => fileInput?.click());
}

if (fileInput) {
	fileInput.addEventListener("change", (event) => handleFiles(event.target.files));
}

// ── TASK 6: PDF Export ──
if (pdfBtn) {
	pdfBtn.addEventListener("click", handlePdfExport);
}

// ── Stop generation button ──
const stopBtn = document.getElementById("stopBtn");
if (stopBtn) {
	stopBtn.addEventListener("click", () => {
		if (activeStreamController) {
			activeStreamController.abort();
		}
	});
}

function handlePdfExport() {
	const outputContent = outputContainer?.querySelector(".output-content");
	if (!outputContent) {
		setStatus("No content to export as PDF.", "error");
		return;
	}
	const contentHTML = outputContent.innerHTML;
	const topicTitle = topicsInput?.value?.trim() || "Zyvexa Study Notes";

	const printWindow = window.open("", "_blank");
	if (!printWindow) {
		setStatus("Popup blocked. Allow popups to export PDF.", "error");
		return;
	}

	printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(topicTitle)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />
<style>
	body {
		font-family: Georgia, 'Times New Roman', serif;
		color: #111;
		background: #fff;
		max-width: 800px;
		margin: 0 auto;
		padding: 32px 24px;
		font-size: 14px;
		line-height: 1.7;
	}
	h1, h2, h3, h4 { font-family: Arial, Helvetica, sans-serif; color: #222; margin-top: 24px; }
	h1 { font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 6px; }
	h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
	h3 { font-size: 15px; }
	p { margin: 8px 0; }
	ul, ol { margin: 8px 0 12px 20px; }
	li { margin: 4px 0; }
	strong { font-weight: 700; }
	code { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 0.9em; }
	pre { background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; padding: 12px; overflow-x: auto; font-size: 12px; }
	pre code { background: none; padding: 0; }
	table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px; }
	th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
	th { background: #f0f0f0; font-weight: 600; }
	blockquote { border-left: 3px solid #999; margin: 12px 0; padding: 8px 16px; color: #555; font-style: italic; }
	hr { border: 0; height: 1px; background: #ccc; margin: 20px 0; }
	.katex { font-size: 1em !important; }
	.katex-display { margin: 16px 0 !important; }
	@media print {
		body { padding: 0; margin: 0 auto; }
	}
</style>
</head>
<body>
<h1>${escapeHtml(topicTitle)}</h1>
${contentHTML}
<script>window.onload = function() { setTimeout(function(){ window.print(); }, 400); }<\/script>
</body>
</html>`);
	printWindow.document.close();
}

updateGenerateState();
updateLevelUI();

function handleOptionToggle(event) {
	const card = event.target.closest(".option-card");
	if (!card) {
		return;
	}

	const mode = card.dataset.mode;
	if (!mode) {
		return;
	}

	if (selectedOptions.has(mode)) {
		selectedOptions.delete(mode);
	} else {
		selectedOptions.clear();
		selectedOptions.add(mode);
	}

	updateOptionUI();
	updateGenerateState();
}

function updateLevelUI() {
	if (!levelTypeSelect) {
		return;
	}

	const selectedLevel = levelTypeSelect.value || "diploma";
	for (const pill of levelPills) {
		const isSelected = pill.dataset.level === selectedLevel;
		pill.classList.toggle("selected", isSelected);
		pill.classList.toggle("level-pill--active", isSelected);
	}
}

function handleLevelSelect(event) {
	const pill = event.target.closest(".level-pill");
	if (!pill || !levelTypeSelect) {
		return;
	}

	const level = pill.dataset.level;
	if (!level) {
		return;
	}

	levelTypeSelect.value = level;
	levelTypeSelect.dispatchEvent(new Event("change", { bubbles: true }));
}

function handleLanguageSelect(event) {
	const langButton = event.target.closest(".lang-btn");
	if (!langButton) {
		return;
	}

	selectedLang = langButton.dataset.lang || "english";
	for (const button of langButtons) {
		button.classList.remove("active");
	}
	langButton.classList.add("active");
}

function updateOptionUI() {
	for (const card of optionCards) {
		const mode = card.dataset.mode;
		card.classList.toggle("selected", selectedOptions.has(mode));
	}
}

function handleFiles(fileList) {
	const files = Array.from(fileList || []);
	if (!files.length) {
		return;
	}

	for (const file of files) {
		uploadedFiles.push({ id: crypto.randomUUID(), file });
	}

	renderPreviews();
	fileInput.value = "";
	updateGenerateState();
}

function handleFileRemove(event) {
	const removeButton = event.target.closest("button[data-remove-id]");
	if (!removeButton) {
		return;
	}

	const removeId = removeButton.dataset.removeId;
	uploadedFiles = uploadedFiles.filter((entry) => entry.id !== removeId);
	renderPreviews();
	updateGenerateState();
}

function renderPreviews() {
	if (!uploadedFiles.length) {
		previewGrid.innerHTML = "";
		fileStatus.textContent = "";
		return;
	}

	previewGrid.innerHTML = uploadedFiles
		.map((entry) => {
			const { id, file } = entry;
			if (file.type.startsWith("image/")) {
				const src = URL.createObjectURL(file);
				return `<div class="preview-item" title="${escapeHtml(file.name)}">
					<img src="${src}" alt="${escapeHtml(file.name)}" onload="URL.revokeObjectURL(this.src)" />
					<button type="button" class="remove-btn" data-remove-id="${id}">×</button>
				</div>`;
			}

			const fileIcon = getFileIcon(file);
			return `<div class="preview-item" title="${escapeHtml(file.name)}">
				<div class="file-icon">${fileIcon}</div>
				<button type="button" class="remove-btn" data-remove-id="${id}">×</button>
			</div>`;
		})
		.join("");

	fileStatus.textContent = `${uploadedFiles.length} file(s) ready.`;
}

function getFileIcon(file) {
	const name = file.name.toLowerCase();
	if (name.endsWith(".pdf")) {
		return "📄";
	}
	if (name.endsWith(".doc") || name.endsWith(".docx")) {
		return "📝";
	}
	return "📎";
}

function updateGenerateState() {
	if (!topicsInput || !generateBtn) {
		return;
	}

	const hasText = topicsInput.value.trim().length > 0;
	const hasFiles = uploadedFiles.length > 0;
	const ready = hasText || hasFiles;
	generateBtn.classList.toggle("btn-ready", ready && !generateBtn.disabled);
}

// ── Helpers to show/hide stop vs action buttons ──
function showStopButton() {
	const stop = document.getElementById("stopBtn");
	if (stop) stop.classList.remove("hidden");
}
function hideStopButton() {
	const stop = document.getElementById("stopBtn");
	if (stop) stop.classList.add("hidden");
}

async function handleGenerate(event) {
	event?.preventDefault();
	const activeMode = Array.from(selectedOptions)[0] || "";
	console.log("Generate clicked — mode: " + activeMode);

	if (!topicsInput || !boardTypeSelect || !levelTypeSelect || !outputContainer || !statusMessage) {
		console.error("Generate aborted: required form or output element missing");
		setStatus("Unable to generate content right now. Required UI element is missing.", "error");
		return;
	}

	if (!outputContainer) {
		console.error("OUTPUT DIV NOT FOUND — check selector");
		return;
	}

	const userText = topicsInput.value.trim();
	const board = boardTypeSelect.value;
	const level = levelTypeSelect.value;
	const detectedSubjectType = detectSubjectType(userText);
	const effectiveLevel = detectedSubjectType === "general_knowledge_lifeskills"
		? "general_knowledge_lifeskills"
		: level;
	const hasFiles = uploadedFiles.length > 0;
	const selectedModes = Array.from(selectedOptions);

	// Read language from active toggle at generation time
	const activeLangBtn = document.querySelector(".lang-btn.active");
	selectedLang = activeLangBtn?.dataset?.lang || "english";

	// Auto-detect Hinglish/Hindi
	const hindiRegex = /[\u0900-\u097F]|\b(kya|kaise|kyun|hai|nahi|aur|mein|ki|se|ko|par|kar|bhi|ye|woh|kab)\b/i;
	if (hindiRegex.test(userText) && selectedLang !== "hinglish") {
		selectedLang = "hinglish";
		const langBtn = document.querySelector('.lang-btn[data-lang="hinglish"]');
		if (langBtn) {
			document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
			langBtn.classList.add('active');
		}
		setStatus("Responding in Hinglish based on your input.", "");
	}

	if (!userText && !hasFiles) {
		setStatus("Enter instruction/topics or upload at least one file.", "error");
		return;
	}

	if (selectedModes.length === 0) {
		setStatus("Select at least one study mode.", "error");
		return;
	}

	const modeId = selectedModes[0];
	const cacheKey = buildCacheKey(userText, modeId, board, effectiveLevel, selectedLang);
	const cachedEntry = getCachedResponse(cacheKey);

	if (detectedSubjectType === "general_knowledge_lifeskills") {
		window.dispatchEvent(new CustomEvent("zyvexaGeneralKnowledgeTopic", {
			detail: { message: "This topic is treated as general knowledge. Level context is not applied." }
		}));
	}

	if (cachedEntry) {
		console.log("Cache hit for:", cacheKey, "partial:", cachedEntry.partial);
		outputContainer.innerHTML = "";
		window.__zyvexa_lastRawText = cachedEntry.content;
		if (modeId !== "exam_simulation") {
			/* Bug 3 fix: for exam_simulation, skip markdown rendering on cache hit too */
			if (modeId !== 'exam_simulation') {
				setOutputContent(cachedEntry.content, { isMasterMode: false });
			} else {
				/* Exam cache hit: let zyvexaContentReady event handler render the exam UI */
			}
			updateOutputMeta(outputContainer.innerText);
		}

		if (cachedEntry.partial) {
			// Show partial content instantly, then stream continuation in background
			setStatus(modeId === "exam_simulation" ? "Preparing saved exam paper..." : "⚡ Showing saved preview — loading full response...", "");
			showStopButton();
			// Insert subtle indicator below content
			const indicator = document.createElement("div");
			indicator.id = "partial-load-indicator";
			indicator.style.cssText = "font-size:12px;color:var(--text-muted);padding:8px 0 4px;text-align:center;";
			indicator.textContent = modeId === "exam_simulation"
				? "Preparing saved exam paper..."
				: "⚡ Showing saved preview — loading full response...";
			outputContainer.appendChild(indicator);

			// Signal content ready with partial content so Recall/Flashcards still work
			window.dispatchEvent(new CustomEvent("zyvexaContentReady", { detail: { mode: modeId, rawText: cachedEntry.content } }));

			// Background full generation
			(async () => {
				try {
					const extractedText = hasFiles ? await extractTextFromFiles(uploadedFiles) : "";
					const subjectMatter = [userText, extractedText].filter(Boolean).join("\n\n").trim();
					const builderFunction = modeBuilders[modeId];
					if (!builderFunction || !subjectMatter) return;
					const basePrompt = builderFunction(subjectMatter, effectiveLevel, selectedLang);
					const continuationPrompt = buildContinuationPrompt(basePrompt, cachedEntry.content);
					const bgResult = await callBackend(continuationPrompt, modeId, {
						isBackground: true,
						continuation: {
							initialRawText: cachedEntry.content,
							cacheKey,
							topic: userText
						}
					});
					const bgContinuationText = bgResult && typeof bgResult === "object" ? bgResult.rawText : (bgResult || "");
					const fullText = `${cachedEntry.content}${bgContinuationText}`;
					// Replace cache entry with full content
					saveToCacheStore(cacheKey, fullText, userText, modeId, false);
					window.__zyvexa_lastRawText = fullText;
					if (modeId !== "exam_simulation") {
						setOutputContent(fullText, { isMasterMode: false });
						updateOutputMeta(outputContainer.innerText);
						setStatus("✔ Full content loaded.", "success");
					} else {
						setStatus("Exam paper generated.", "success");
					}
					window.dispatchEvent(new CustomEvent("zyvexaContentReady", { detail: { mode: modeId, rawText: fullText } }));
				} catch (error) {
					if (error?.name === "AbortError") {
						setStatus("⏹ Generation stopped — partial content saved", "");
					} else {
						setStatus("⚡ Showing saved preview (full load failed).", "");
					}
				} finally {
					document.getElementById("partial-load-indicator")?.remove();
					hideStopButton();
				}
			})();
		} else {
			setStatus(modeId === "exam_simulation" ? "Exam paper loaded from cache." : "⚡ Loaded from cache", "success");
			window.dispatchEvent(new CustomEvent("zyvexaContentReady", { detail: { mode: modeId, rawText: cachedEntry.content } }));
		}
		return;
	}

	setLoading(true, "Generating your content...");
	showStopButton();
	const inlineActions = document.getElementById("inline-actions");
	if (inlineActions) {
		inlineActions.classList.add("hidden");
		document.body.appendChild(inlineActions);
	}
	outputContainer.innerHTML = "";
	statusMessage.innerHTML = '<span class="status-spinner"></span><span class="status-loading-text">Generating your response...</span>';
	statusMessage.classList.add("status--loading");
	statusMessage.classList.remove("status--success", "status--error");
	normalizeOutputViewport(outputContainer);
	window.dispatchEvent(new Event("zyvexaGenerateStart"));

	try {
		const extractedText = hasFiles ? await extractTextFromFiles(uploadedFiles) : "";
		const subjectMatter = [userText, extractedText].filter(Boolean).join("\n\n").trim();

		if (!subjectMatter.trim()) {
			throw new Error("No readable content found to generate output.");
		}

		setStatus("Generating content...", "");
		
		const builderFunction = modeBuilders[modeId];

		if (!builderFunction) {
			console.error(`Mode builder not found for mode: ${modeId}`);
			throw new Error(`Unknown mode: ${modeId}`);
		}

		/* Session Intelligence: update topic + compute forgetting curve */
		sessionContext.setTopic(userText);
		const daysDelta = getTopicTimeDelta(userText);
		const forgettingMod = getForgettingCurveModifier(daysDelta);
		if (forgettingMod) {
			sessionContext._forgettingCurveModifier = forgettingMod;
		} else {
			delete sessionContext._forgettingCurveModifier;
		}

		const basePrompt = builderFunction(subjectMatter, effectiveLevel, selectedLang, sessionContext);

		// Bug 3 fix: continuation loop — if finish_reason is "length" (model was cut off),
		// automatically request continuation up to 2 more times (3 total attempts).
		const MAX_CONTINUATIONS = 2;
		let fullGeneratedText = "";
		let currentPrompt = basePrompt;
		let continuationAttempts = 0;

		while (continuationAttempts <= MAX_CONTINUATIONS) {
			if (continuationAttempts > 0) {
				// Show continuation indicator and rebuild prompt
				setStatus("⏳ Continuing response...", "");
				currentPrompt = buildContinuationPrompt(basePrompt, fullGeneratedText);
			}

			const result = await callBackend(currentPrompt, modeId, {
			skipOutputReset: continuationAttempts > 0,
			prependText: continuationAttempts > 0 ? fullGeneratedText : ""
		});
			const chunkText = result && typeof result === "object" ? result.rawText : (result || "");
			const finishReason = result && typeof result === "object" ? result.finishReason : "";

			fullGeneratedText += chunkText;
			continuationAttempts++;

			// If model finished naturally (or no finish_reason received), stop looping
			if (finishReason !== "length") break;
			// If stop button was clicked, activeStreamController will have been aborted — loop terminates via thrown AbortError
		}

		// Store rawText globally for recall access
		window.__zyvexa_lastRawText = fullGeneratedText;
		window.dispatchEvent(new CustomEvent("zyvexaContentReady", { detail: { mode: modeId, rawText: fullGeneratedText } }));

		if (modeId !== "exam_simulation") {
		/* Bug 3 fix: for exam_simulation, skip markdown rendering — let the
		   zyvexaContentReady handler in ui.js parse and render the interactive exam UI */
		if (modeId !== 'exam_simulation') {
			setOutputContent(fullGeneratedText, { isMasterMode: false });
			updateOutputMeta(outputContainer.innerText);
			setStatus("Content generated successfully.", "success");
		} else {
			/* Exam mode: the raw structured text is already dispatched via zyvexaContentReady.
			   ui.js will parse ===SECTION_A=== delimiters and render the interactive exam paper.
			   We just need to set a success status. */
			setStatus("Exam paper generated.", "success");
		}
		} else {
			setStatus("Exam paper generated.", "success");
		}

		/* Session Intelligence: record mode completion with raw text */
		sessionContext.addModeCompletion(modeId, fullGeneratedText);

		// Save to cache after successful generation
		saveToCacheStore(cacheKey, fullGeneratedText, userText, modeId, false);
	} catch (error) {
		if (error.name === "AbortError") {
			// Handled inside callBackend — do nothing here
		} else {
			const message = error instanceof Error ? error.message : "Unexpected error occurred.";
			setStatus(`Unable to generate content right now. ${message}`, "error");
			outputContainer.innerHTML =
				'<p class="output-placeholder">No content generated yet. Please correct the issue and try again.</p>';
			normalizeOutputViewport(outputContainer);
			updateOutputMeta("");
		}
	} finally {
		cleanupStreamScroll?.();
		cleanupStreamScroll = null;
		hideStopButton();
		setLoading(false);
		activeStreamController = null;
	}
}

async function extractTextFromFiles(fileEntries) {
	showFileProgress(true);
	let combinedText = "";

	for (let i = 0; i < fileEntries.length; i += 1) {
		const { file } = fileEntries[i];
		const index = i + 1;
		setFileProgress((i / fileEntries.length) * 100, `Reading file ${index} of ${fileEntries.length}: ${file.name}`);

		let chunk = "";
		if (file.type.startsWith("image/")) {
			chunk = await extractImageText(file, index, fileEntries.length, (progress) => {
				const totalProgress = ((i + progress) / fileEntries.length) * 100;
				setFileProgress(totalProgress, `Reading image ${index} of ${fileEntries.length}... ${Math.round(progress * 100)}%`);
			});
		} else if (file.name.toLowerCase().endsWith(".pdf")) {
			chunk = await extractPdfText(file);
		} else if (file.name.toLowerCase().endsWith(".doc") || file.name.toLowerCase().endsWith(".docx")) {
			chunk = await extractDocxText(file);
		} else {
			chunk = await extractPlainText(file);
		}

		combinedText += `\n\n[Source: ${file.name}]\n${chunk}`;
	}

	setFileProgress(100, `Finished reading ${fileEntries.length} file(s).`);
	showFileProgress(false);
	return combinedText.trim();
}

async function extractImageText(file, index, total, onProgress) {
	if (!window.Tesseract) {
		throw new Error("Tesseract.js failed to load.");
	}

	const result = await window.Tesseract.recognize(file, "eng", {
		logger: (message) => {
			if (message.status === "recognizing text") {
				onProgress(message.progress || 0);
			}
		}
	});

	setFileProgress((index / total) * 100, `Image ${index} OCR complete.`);
	return result?.data?.text || "";
}

async function extractPdfText(file) {
	if (!window.pdfjsLib) {
		throw new Error("PDF.js failed to load.");
	}

	const data = await file.arrayBuffer();
	const pdf = await window.pdfjsLib.getDocument({ data }).promise;
	let text = "";

	for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
		const page = await pdf.getPage(pageNum);
		const content = await page.getTextContent();
		text += `${content.items.map((item) => item.str).join(" ")}\n`;
	}

	return text;
}

async function extractDocxText(file) {
	if (!window.mammoth) {
		throw new Error("mammoth.js failed to load.");
	}

	const arrayBuffer = await file.arrayBuffer();
	const result = await window.mammoth.extractRawText({ arrayBuffer });
	return result.value || "";
}

async function extractPlainText(file) {
	try {
		return await file.text();
	} catch {
		return "Unsupported file for text extraction.";
	}
}

function showFileProgress(isVisible) {
	fileProgress.classList.toggle("hidden", !isVisible);
	if (!isVisible) {
		setTimeout(() => {
			fileProgressFill.style.width = "0%";
		}, 250);
	}
}

function setFileProgress(value, message) {
	fileProgressFill.style.width = `${Math.max(0, Math.min(100, value))}%`;
	fileStatus.textContent = message;
}

function normalizeOutputViewport(outputBox) {
	outputBox.scrollTop = 0;
	if (outputBox.parentElement) {
		outputBox.parentElement.scrollTop = 0;
	}

	outputBox.style.height = "";
	outputBox.style.maxHeight = "";
}

function renderStreamingContent(rawText, outputDiv) {
	if (!outputDiv) {
		return;
	}

	const normalizedText = String(rawText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\t/g, "    ").trim();
	const parsedHtml = typeof marked !== "undefined"
		? marked.parse(normalizedText)
		: `<p>${escapeHtml(normalizedText)}</p>`;

	const wrappedHtml = typeof wrapUndelimitedLatex !== "undefined"
		? wrapUndelimitedLatex(parsedHtml)
		: parsedHtml;

	outputDiv.innerHTML = `<div class="output-content" id="stream-live-output">${wrappedHtml}<span class="stream-cursor">▌</span></div>`;
}

function setOutputContent(responseText, { isMasterMode = false } = {}) {
	const outputDiv = outputContainer;
	window.renderOutput(responseText || "", outputDiv);
	normalizeOutputViewport(outputDiv);

	if (isMasterMode) {
		outputDiv.scrollTop = 0;
		if (outputDiv.parentElement) {
			outputDiv.parentElement.scrollTop = 0;
		}
	}

}

function initializeMermaidRenderer() {
	if (typeof mermaid === "undefined") {
		return;
	}

	mermaid.initialize({
		startOnLoad: false,
		theme: "dark",
		themeVariables: {
			primaryColor: "#22c55e",
			primaryTextColor: "#eff3ff",
			primaryBorderColor: "#22c55e",
			lineColor: "#555",
			background: "#05070d",
			mainBkg: "#0d1117"
		}
	});
}

function renderDiagrams(container) {
	if (!container) {
		return;
	}

	const mermaidBlocks = container.querySelectorAll("code.language-mermaid, pre code.language-mermaid");
	mermaidBlocks.forEach(async (block, i) => {
		const code = block.textContent;
		const wrapper = document.createElement("div");
		wrapper.className = "mermaid-wrapper";
		wrapper.id = `mermaid-${i}`;

		try {
			if (typeof mermaid === "undefined") {
				throw new Error("Mermaid library not loaded");
			}
			const { svg } = await mermaid.render(`mermaid-svg-${i}`, code);
			wrapper.innerHTML = svg;
		} catch {
			wrapper.innerHTML = '<p style="color:#ef4444">Diagram render error</p>';
		}

		block.closest("pre")?.replaceWith(wrapper);
	});

	const svgDiagramRegex = /<svg-diagram title="([^"]*)">([\s\S]*?)<\/svg-diagram>/g;
	let html = container.innerHTML;
	html = html.replace(svgDiagramRegex, (match, title, svgContent) => {
		return `<div class="svg-diagram-wrapper">
			<div class="svg-diagram-title">🗺️ ${title}</div>
			<div class="svg-diagram-content">${svgContent}</div>
		</div>`;
	});
	container.innerHTML = html;
}

window.renderZyvexaDiagrams = renderDiagrams;

async function callBackend(finalPrompt, selectedMode, { isBackground = false, continuation = null, skipOutputReset = false, prependText = "" } = {}) {
	const outputDiv = outputContainer;

	if (!outputDiv) {
		console.error("OUTPUT DIV NOT FOUND — check selector");
		throw new Error("Output container not found.");
	}

	const promptPayload =
		finalPrompt && typeof finalPrompt === "object" && !Array.isArray(finalPrompt)
			? finalPrompt
			: { user: String(finalPrompt || "") };
	const maxTokensByMode = {
		smart_diagnosis: 8192,
		concept_builder: 8192,
		adaptive_practice: 8192,
		mistake_analyzer: 8192,
		exam_simulation: 8192,
		quick_revision: 8192,
		formula_facts: 8192,
		memory_engine: 8192,
		study_planner: 8192
	};

	// Create AbortController for this stream — stored globally so Stop button can abort it
	const controller = new AbortController();
	activeStreamController = controller;

	if (!isBackground && !skipOutputReset) {
		// Show a blinking cursor immediately so user sees something right away
		outputDiv.innerHTML = '<div class="output-content" id="stream-live-output"></div>';
		normalizeOutputViewport(outputDiv);
	}

	const continuationState =
		isBackground && continuation && typeof continuation.initialRawText === "string"
			? {
				initialRawText: continuation.initialRawText,
				cacheKey: continuation.cacheKey,
				topic: continuation.topic,
				cleanupScroll: null
			}
			: null;

	let userHasScrolled = false;
	const handleOutputScroll = () => {
		const distanceFromBottom =
			outputContainer.scrollHeight - outputContainer.scrollTop - outputContainer.clientHeight;
		userHasScrolled = distanceFromBottom > 80;
	};

	if (!isBackground) {
		cleanupStreamScroll?.();
		outputContainer.addEventListener("scroll", handleOutputScroll, { passive: true });
		cleanupStreamScroll = () => {
			outputContainer.removeEventListener("scroll", handleOutputScroll);
		};
	} else if (continuationState) {
		outputContainer.addEventListener("scroll", handleOutputScroll, { passive: true });
		continuationState.cleanupScroll = () => {
			outputContainer.removeEventListener("scroll", handleOutputScroll);
		};
	}

	let rawText = "";
	let buffer = "";
	let streamDone = false;
	let lastRenderTime = 0;
	let wasAborted = false;
	// Bug 3 fix: track finish_reason from DeepSeek to detect truncation
	let lastFinishReason = "";

	try {
		const targetUrl = selectedMode === "exam_simulation" ? "/api/exam" : API_URL;
		const depthMultiplier = getDepthTokenMultiplier();
		const adjustedTokens = Math.round((maxTokensByMode[selectedMode] || 8192) * depthMultiplier);
		const topicVal = document.getElementById("topicsInput")?.value?.trim() || "";
		const subjectType = detectSubjectType(topicVal);
		let responseDepth = "balanced";
		try { responseDepth = JSON.parse(localStorage.getItem("zyvexa_profile") || "{}").responseDepth || "balanced"; } catch {}

		const response = await fetch(targetUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				prompt: {
					system: promptPayload.system,
					user: promptPayload.user || promptPayload.prompt || ""
				},
				system: promptPayload.system,
				user: promptPayload.user || promptPayload.prompt || "",
				topic: topicVal,
				level: document.getElementById("levelType")?.value || "",
				language: document.querySelector(".lang-btn.active")?.dataset?.lang || "english",
				max_tokens: adjustedTokens,
				mode: selectedMode,
				subjectType: subjectType,
				responseDepth: responseDepth
			}),
			signal: controller.signal
		});

		if (selectedMode === "exam_simulation") {
			if (!response.ok) {
				let errMsg = "Exam generation failed (server error " + response.status + ")";
				try { const errData = await response.json(); errMsg = errData.error || errMsg; } catch {}
				throw new Error(errMsg);
			}
			const data = await response.json();
			if (data.error) throw new Error(data.error);
			const rawText = JSON.stringify(data.exam);
			return { rawText, finishReason: "stop" };
		}

		if (!response.body) {
			throw new Error("Streaming response body is unavailable.");
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();

		while (!streamDone) {
			const { done, value } = await reader.read();
			if (done) { break; }

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const rawLine of lines) {
				const trimmedLine = rawLine.trim();
				if (!trimmedLine) continue;

				const line = trimmedLine.startsWith("data: ")
					? trimmedLine.slice(6)
					: trimmedLine;

				if (line === "[DONE]") { streamDone = true; break; }

				if (line.startsWith("{")) {
					let parsed;
					try { parsed = JSON.parse(line); } catch { continue; }
					if (parsed.error) throw new Error(parsed.error);
					// Bug 3: capture finish_reason when server forwards it
					if (parsed.finish_reason) {
						lastFinishReason = parsed.finish_reason;
					}
					if (parsed.text) {
						rawText += parsed.text;
						if (!isBackground) {
							const now = Date.now();
							if (now - lastRenderTime > 300) {
								lastRenderTime = now;
								// Exam simulation: suppress raw streaming render — show loading state only
								if (selectedMode === 'exam_simulation') {
									const progressDots = '.'.repeat(Math.floor((rawText.length / 80)) % 4 + 1);
									const livEl = outputDiv.querySelector('#stream-live-output') || outputDiv;
									if (livEl) livEl.innerHTML = `<div class="exam-generating-state"><div class="exam-gen-spinner"></div><div class="exam-gen-text">Generating exam paper${progressDots}</div><div class="exam-gen-sub">${rawText.length > 500 ? 'Building sections…' : 'Setting up questions…'}</div></div>`;
								} else {
									// Normal streaming render pipeline
									const _renderText = prependText ? prependText + rawText : rawText;
									try {
										renderStreamingContent(_renderText, outputDiv);
									} catch {
										const fallbackText = prependText ? prependText + rawText : rawText;
										if (outputDiv) {
											outputDiv.innerHTML = `<div class="output-content" id="stream-live-output">${escapeHtml(fallbackText)}<span class="stream-cursor">▌</span></div>`;
										}
									}
								}
								if (!userHasScrolled) {
									outputContainer.scrollTop = outputContainer.scrollHeight;
								}
							}
						} else if (continuationState) {
							const now = Date.now();
							if (now - lastRenderTime > 300) {
								lastRenderTime = now;
								const combinedText = `${continuationState.initialRawText}${rawText}`;
								try {
									renderStreamingContent(combinedText, outputDiv);
								} catch {
									const continuationOutput = outputDiv.querySelector(".output-content");
									if (continuationOutput) {
										continuationOutput.innerHTML = `${escapeHtml(combinedText)}<span class="stream-cursor">▌</span>`;
									}
								}
								if (!userHasScrolled) {
									outputContainer.scrollTop = outputContainer.scrollHeight;
								}
							}
						}
					}
				}
			}
		}

		// Stream completed — attach finishReason to returned value for continuation check
		// Return an object so callers can detect truncation
		return { rawText, finishReason: lastFinishReason };

	} catch (error) {
		if (error.name === "AbortError") {
			wasAborted = true;

			if (!isBackground) {
				// Remove cursor if present
				outputDiv.querySelector(".stream-cursor")?.remove();

				// If this was a continuation round, combine with prior text
				const savedRawText = prependText ? prependText + rawText : rawText;

				if (savedRawText.length >= 150) {
					// Enough content — render it and save as partial
					setStatus("⏹ Generation stopped — partial content saved", "");
					window.__zyvexa_lastRawText = savedRawText;

					// Run full final pipeline on partial content
					window.renderOutput(savedRawText, outputDiv);
					updateOutputMeta(outputDiv.innerText);

					// Determine cache key from current inputs
					const userText = topicsInput?.value?.trim() || "";
					const board = boardTypeSelect?.value || "";
					const level = levelTypeSelect?.value || "";
					const detected = detectSubjectType(userText);
					const effectiveLevel = detected === "general_knowledge_lifeskills"
						? "general_knowledge_lifeskills"
						: level;
					const lang = document.querySelector(".lang-btn.active")?.dataset?.lang || "english";
					const ck = buildCacheKey(userText, selectedMode, board, effectiveLevel, lang);
					saveToCacheStore(ck, savedRawText, userText, selectedMode, true);

					// Signal content ready so Recall/Flashcard buttons work
					window.dispatchEvent(new CustomEvent("zyvexaContentReady", {
						detail: { mode: selectedMode, rawText: savedRawText }
					}));
				} else {
					// Not enough content
					setStatus("Generation stopped — not enough content to save", "");
					outputDiv.innerHTML = '<p class="output-placeholder">Generation stopped. Enter a topic and try again.</p>';
					normalizeOutputViewport(outputDiv);
					updateOutputMeta("");
				}
			} else if (continuationState) {
				outputDiv.querySelector(".stream-cursor")?.remove();
				const combinedPartialText = `${continuationState.initialRawText}${rawText}`;

				setStatus("⏹ Generation stopped — partial content saved", "");
				window.__zyvexa_lastRawText = combinedPartialText;

				window.renderOutput(combinedPartialText, outputDiv);
				updateOutputMeta(outputDiv.innerText);

				if (continuationState.cacheKey) {
					saveToCacheStore(
						continuationState.cacheKey,
						combinedPartialText,
						continuationState.topic || "",
						selectedMode,
						true
					);
				}

				window.dispatchEvent(new CustomEvent("zyvexaContentReady", {
					detail: { mode: selectedMode, rawText: combinedPartialText }
				}));
			}

			// Re-throw as AbortError so handleGenerate catch can identify it
			throw error;
		}

		// Non-abort error
		if (!isBackground) {
			outputDiv.querySelector(".stream-cursor")?.remove();
			const message = error instanceof Error ? error.message : "Unexpected error occurred.";
			setStatus(`Unable to generate content right now. ${message}`, "error");
		}
		throw error;

	} finally {
		if (continuationState) {
			outputDiv.querySelector(".stream-cursor")?.remove();
			continuationState.cleanupScroll?.();
		}
		// Clean up AbortController reference if it's still ours
		if (activeStreamController === controller) {
			activeStreamController = null;
		}
	}
}

function updateOutputMeta(text) {
	const words = (text.trim().match(/\S+/g) || []).length;
	const readMinutes = words ? Math.max(1, Math.ceil(words / 200)) : 0;
	outputMeta.textContent = `${words} words • ${readMinutes} min read`;
}

function handleClear() {
	topicsInput.value = "";
	selectedOptions.clear();
	uploadedFiles = [];
	selectedLang = "english";
	for (const card of optionCards) {
		card.classList.remove("selected");
	}
	for (const button of langButtons) {
		button.classList.toggle("active", button.dataset.lang === "english");
	}
	renderPreviews();
	showFileProgress(false);
	setFileProgress(0, "");
	outputContainer.innerHTML = '<p class="output-placeholder">Your generated content will appear here.</p>';
	normalizeOutputViewport(outputContainer);
	updateOutputMeta("");
	setStatus("Cleared input and output.", "");
	window.zRenderSuggestedTopics?.();
	updateGenerateState();
}

async function handleCopy() {
	const plainText = outputContainer.innerText.trim();
	if (!plainText || plainText.includes("will appear here")) {
		setStatus("Nothing to copy yet.", "error");
		return;
	}

	try {
		await navigator.clipboard.writeText(plainText);
		setStatus("Output copied to clipboard.", "success");
	} catch {
		setStatus("Copy failed. Please copy manually.", "error");
	}
}

function setLoading(isLoading, message = "Generating your content...") {
	if (loadingText) {
		loadingText.textContent = message;
	}
	if (loadingState) {
		loadingState.classList.toggle("hidden", !isLoading);
	}
	if (generateBtn) {
		generateBtn.disabled = isLoading;
	}
	if (clearBtn) {
		clearBtn.disabled = isLoading;
	}
	if (copyBtn) {
		copyBtn.disabled = isLoading;
	}
	updateGenerateState();
}

function setStatus(message, type = "") {
	if (!statusMessage) {
		console.error("statusMessage not found");
		return;
	}

	statusMessage.textContent = message;
	statusMessage.classList.remove("error", "success");
	if (type) {
		statusMessage.classList.add(type);
	}
}

function escapeHtml(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
