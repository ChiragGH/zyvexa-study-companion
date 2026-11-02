/* ═══════════════════════════════════════════════════════════
   Zyvexa — Session Intelligence Layer
   Maintains running context per session for conversational AI continuity.
   Tracks modes, summaries, mistakes, weak concepts, and performance.
   ═══════════════════════════════════════════════════════════ */

const SESSION_STORAGE_KEY = 'zyvexa_session_ctx';

/**
 * Compress a raw AI response into pedagogically meaningful signals.
 * Extracts key information in ~150–200 tokens for prompt injection.
 */
function compressResponse(rawText, mode) {
	if (!rawText || rawText.length < 100) return null;

	const text = rawText;
	const headings = (text.match(/^#{1,3}\s+.+$/gm) || [])
		.map(h => h.replace(/^#+\s*/, '').trim())
		.filter(h => h.length > 3)
		.slice(0, 8);

	/* Extract key formulas (lines with LaTeX markers) */
	const formulas = (text.match(/\$\$.+?\$\$/gs) || []).slice(0, 4)
		.map(f => f.replace(/\$\$/g, '').trim().substring(0, 60));

	/* Count examples and worked solutions */
	const exampleCount = (text.match(/example|worked|solution|solve|calculate/gi) || []).length;

	/* Extract concepts that were compared or contrasted */
	const comparisons = (text.match(/(?:vs|versus|compared to|difference between|unlike)\s+[\w\s]+/gi) || [])
		.slice(0, 3)
		.map(c => c.trim().substring(0, 50));

	/* Detect difficulty signals */
	const hasAdvanced = /advanced|complex|challenging|difficult|tricky/i.test(text);
	const hasBasic = /basic|fundamental|simple|introduction|beginner/i.test(text);
	const difficulty = hasAdvanced ? 'advanced' : hasBasic ? 'basic' : 'moderate';

	/* Extract key terms (bold text or defined terms) */
	const boldTerms = (text.match(/\*\*([^*]{3,40})\*\*/g) || [])
		.map(b => b.replace(/\*\*/g, ''))
		.filter(t => t.length > 3 && !/^\d/.test(t))
		.slice(0, 10);

	/* Detect mistakes/misconceptions mentioned */
	const mistakes = (text.match(/(?:mistake|misconception|common error|wrong|incorrect|avoid)\s*:?\s*[^.\n]{10,80}/gi) || [])
		.slice(0, 5)
		.map(m => m.trim().substring(0, 80));

	const wordCount = text.split(/\s+/).filter(Boolean).length;

	return {
		mode,
		headings,
		formulas,
		exampleCount,
		comparisons,
		difficulty,
		keyTerms: boldTerms,
		mistakes,
		wordCount,
		timestamp: Date.now()
	};
}

/**
 * Build a compact context injection string from session history.
 * Designed to stay under ~300 tokens for prompt efficiency.
 */
function buildContextInjection(context) {
	if (!context || !context.topic) return '';

	const parts = [];

	/* Topic continuity */
	if (context.modesCompleted.length > 0) {
		const modeNames = {
			smart_diagnosis: 'Diagnosis', concept_builder: 'Concept Building',
			adaptive_practice: 'Practice', mistake_analyzer: 'Mistake Analysis',
			exam_simulation: 'Exam Simulation', quick_revision: 'Quick Revision',
			formula_facts: 'Formula Reference', memory_engine: 'Memory Techniques',
			study_planner: 'Study Planning'
		};
		const completed = context.modesCompleted
			.map(m => modeNames[m] || m)
			.join(', ');
		parts.push(`Student has already completed: ${completed} on this topic in this session.`);
	}

	/* Key concepts already covered */
	if (context.coveredConcepts.length > 0) {
		const concepts = context.coveredConcepts.slice(0, 12).join(', ');
		parts.push(`Concepts already covered: ${concepts}.`);
	}

	/* Known weaknesses from recall/practice */
	if (context.weakConcepts.length > 0) {
		const weak = context.weakConcepts.slice(0, 5).join(', ');
		parts.push(`Student showed weakness in: ${weak}. Focus extra attention here.`);
	}

	/* Mistakes identified */
	if (context.identifiedMistakes.length > 0) {
		const mistakes = context.identifiedMistakes.slice(0, 4).join('; ');
		parts.push(`Known mistakes: ${mistakes}.`);
	}

	/* Performance data */
	if (context.recallScore !== null) {
		parts.push(`Recall challenge score: ${context.recallScore}%.`);
	}
	if (context.flashcardPerformance !== null) {
		const fc = context.flashcardPerformance;
		parts.push(`Flashcard performance: ${fc.got}/${fc.total} cards mastered.`);
	}

	/* Confidence state */
	if (context.confusedCount >= 2) {
		parts.push(`IMPORTANT: Student has indicated confusion multiple times. Use simpler explanations, more analogies, and break concepts into smaller steps.`);
	}

	/* Difficulty observation */
	if (context.observedDifficulty) {
		parts.push(`Previous content was at ${context.observedDifficulty} difficulty level.`);
	}

	if (parts.length === 0) return '';

	return `\n## SESSION CONTEXT (from this study session — use this to personalize your response)\n${parts.join('\n')}\n`;
}


class SessionContext {
	constructor() {
		this.topic = '';
		this.modesCompleted = [];
		this.responseSummaries = [];
		this.coveredConcepts = [];
		this.weakConcepts = [];
		this.identifiedMistakes = [];
		this.recallScore = null;
		this.flashcardPerformance = null;
		this.confusedCount = 0;
		this.confidenceHistory = [];
		this.observedDifficulty = null;
		this.startedAt = Date.now();

		this._restore();
	}

	/**
	 * Set the active topic. Resets context if topic changes.
	 */
	setTopic(topic) {
		const normalized = (topic || '').toLowerCase().trim();
		const currentNormalized = (this.topic || '').toLowerCase().trim();

		if (normalized && normalized !== currentNormalized) {
			this.topic = topic;
			this.modesCompleted = [];
			this.responseSummaries = [];
			this.coveredConcepts = [];
			this.weakConcepts = [];
			this.identifiedMistakes = [];
			this.recallScore = null;
			this.flashcardPerformance = null;
			this.confusedCount = 0;
			this.confidenceHistory = [];
			this.observedDifficulty = null;
			this.startedAt = Date.now();
			this._persist();
		}
	}

	/**
	 * Record that a mode was completed and compress the response.
	 */
	addModeCompletion(mode, rawText) {
		if (!mode) return;

		if (!this.modesCompleted.includes(mode)) {
			this.modesCompleted.push(mode);
		}

		const summary = compressResponse(rawText, mode);
		if (summary) {
			/* Keep only last 4 summaries to control context size */
			this.responseSummaries.push(summary);
			if (this.responseSummaries.length > 4) {
				this.responseSummaries.shift();
			}

			/* Accumulate covered concepts from headings and key terms */
			const newConcepts = [...summary.headings, ...summary.keyTerms]
				.filter(c => !this.coveredConcepts.includes(c));
			this.coveredConcepts.push(...newConcepts);

			/* Cap covered concepts at 20 */
			if (this.coveredConcepts.length > 20) {
				this.coveredConcepts = this.coveredConcepts.slice(-20);
			}

			/* Track difficulty */
			this.observedDifficulty = summary.difficulty;

			/* Extract mistakes */
			if (summary.mistakes.length > 0) {
				this.identifiedMistakes.push(...summary.mistakes);
				if (this.identifiedMistakes.length > 10) {
					this.identifiedMistakes = this.identifiedMistakes.slice(-10);
				}
			}
		}

		this._persist();
	}

	/**
	 * Record recall challenge results.
	 */
	updateFromRecall(scorePercent, weakTopics) {
		this.recallScore = scorePercent;
		if (weakTopics && weakTopics.length > 0) {
			const newWeak = weakTopics.filter(w => !this.weakConcepts.includes(w));
			this.weakConcepts.push(...newWeak);
			if (this.weakConcepts.length > 8) {
				this.weakConcepts = this.weakConcepts.slice(-8);
			}
		}
		this._persist();
	}

	/**
	 * Record flashcard session results.
	 */
	updateFromFlashcards(gotCount, totalCount, missedTopics) {
		this.flashcardPerformance = { got: gotCount, total: totalCount };
		if (missedTopics && missedTopics.length > 0) {
			const newWeak = missedTopics.filter(w => !this.weakConcepts.includes(w));
			this.weakConcepts.push(...newWeak);
			if (this.weakConcepts.length > 8) {
				this.weakConcepts = this.weakConcepts.slice(-8);
			}
		}
		this._persist();
	}

	/**
	 * Record confidence tagging from student.
	 * @param {'got_it' | 'mostly_clear' | 'still_confused'} level
	 */
	addConfidenceTag(level) {
		this.confidenceHistory.push({ level, timestamp: Date.now() });
		if (level === 'still_confused') {
			this.confusedCount++;
		}
		this._persist();
	}

	/**
	 * Get the context injection string for prompts.
	 */
	getContextInjection() {
		return buildContextInjection(this);
	}

	/**
	 * Check if student needs simpler explanations.
	 */
	needsSimplification() {
		return this.confusedCount >= 2;
	}

	/**
	 * Check if a specific mode was already run this session.
	 */
	hasDoneMode(mode) {
		return this.modesCompleted.includes(mode);
	}

	/**
	 * Persist to sessionStorage for tab-lifetime persistence.
	 */
	_persist() {
		try {
			const data = {
				topic: this.topic,
				modesCompleted: this.modesCompleted,
				responseSummaries: this.responseSummaries,
				coveredConcepts: this.coveredConcepts,
				weakConcepts: this.weakConcepts,
				identifiedMistakes: this.identifiedMistakes,
				recallScore: this.recallScore,
				flashcardPerformance: this.flashcardPerformance,
				confusedCount: this.confusedCount,
				confidenceHistory: this.confidenceHistory,
				observedDifficulty: this.observedDifficulty,
				startedAt: this.startedAt
			};
			sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
		} catch {
			/* sessionStorage full or unavailable — continue without persistence */
		}
	}

	/**
	 * Restore from sessionStorage on page load.
	 */
	_restore() {
		try {
			const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
			if (!raw) return;
			const data = JSON.parse(raw);

			/* Only restore if session is less than 4 hours old */
			if (data.startedAt && (Date.now() - data.startedAt) > 4 * 60 * 60 * 1000) {
				sessionStorage.removeItem(SESSION_STORAGE_KEY);
				return;
			}

			this.topic = data.topic || '';
			this.modesCompleted = data.modesCompleted || [];
			this.responseSummaries = data.responseSummaries || [];
			this.coveredConcepts = data.coveredConcepts || [];
			this.weakConcepts = data.weakConcepts || [];
			this.identifiedMistakes = data.identifiedMistakes || [];
			this.recallScore = data.recallScore ?? null;
			this.flashcardPerformance = data.flashcardPerformance ?? null;
			this.confusedCount = data.confusedCount || 0;
			this.confidenceHistory = data.confidenceHistory || [];
			this.observedDifficulty = data.observedDifficulty || null;
			this.startedAt = data.startedAt || Date.now();
		} catch {
			/* Corrupt data — start fresh */
		}
	}

	/**
	 * Clear session context entirely.
	 */
	reset() {
		this.topic = '';
		this.modesCompleted = [];
		this.responseSummaries = [];
		this.coveredConcepts = [];
		this.weakConcepts = [];
		this.identifiedMistakes = [];
		this.recallScore = null;
		this.flashcardPerformance = null;
		this.confusedCount = 0;
		this.confidenceHistory = [];
		this.observedDifficulty = null;
		this.startedAt = Date.now();
		this._persist();
	}
}

/* Singleton instance */
const sessionContext = new SessionContext();

export { SessionContext, sessionContext, compressResponse };
