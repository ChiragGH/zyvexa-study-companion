/* ═══════════════════════════════════════════════════════════
   Zyvexa — Learning Science Engine
   Forgetting curve, cognitive load, interleaving, metacognition
   ═══════════════════════════════════════════════════════════ */

/**
 * Calculate days since a topic was last studied.
 * Reads from localStorage mastery entries which store timestamps.
 */
export function getTopicTimeDelta(topic) {
	if (!topic) return 0;
	const key = 'zyvexa_mastery_' + topic.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return -1; /* Never studied before */
		const data = JSON.parse(raw);

		/* Check for lastStudied timestamp, or fall back to session timestamps */
		let lastTime = data.lastStudied || data.timestamp || 0;

		/* Also check session history for this topic */
		const sessions = JSON.parse(localStorage.getItem('zyvexa_sessions') || '[]');
		const topicSessions = sessions.filter(s =>
			(s.topic || '').toLowerCase().trim() === topic.toLowerCase().trim()
		);
		if (topicSessions.length > 0) {
			const latestSession = topicSessions.reduce((latest, s) =>
				new Date(s.lastActive) > new Date(latest.lastActive) ? s : latest
			);
			const sessionTime = new Date(latestSession.lastActive).getTime();
			if (sessionTime > lastTime) lastTime = sessionTime;
		}

		if (!lastTime) return -1;
		const daysDelta = (Date.now() - lastTime) / (1000 * 60 * 60 * 24);
		return Math.floor(daysDelta);
	} catch {
		return -1;
	}
}

/**
 * Generate a forgetting curve prompt modifier based on time since last study.
 * Returns a string to inject into AI prompts.
 */
export function getForgettingCurveModifier(daysSinceStudy) {
	if (daysSinceStudy < 0) {
		/* Never studied — no modifier needed, this is first exposure */
		return '';
	}

	if (daysSinceStudy < 3) {
		/* Recent study — no special treatment */
		return '';
	}

	if (daysSinceStudy >= 3 && daysSinceStudy < 7) {
		return `\n## SPACED REPETITION AWARE (3-7 day gap detected)
The student last studied this topic ${daysSinceStudy} days ago. According to the forgetting curve, they have likely forgotten 40-60% of the details but retain the core framework.

Before diving into new content, START with a brief warm-up:
1. Open with "Let's quickly recall what you learned about [topic] last time..."
2. State the 3-4 most important concepts from this topic as rapid-fire recall prompts
3. Then seamlessly transition into the main content

Do NOT make the warm-up feel like a test — make it feel like a friendly "previously on..." recap.\n`;
	}

	if (daysSinceStudy >= 7) {
		return `\n## SPACED REPETITION AWARE (7+ day gap — significant forgetting expected)
The student last studied this topic ${daysSinceStudy} days ago. The forgetting curve predicts 70-85% detail loss at this interval. Core frameworks may be fuzzy.

You MUST begin with a structured mini-review before any new content:
1. "It's been a while since you studied [topic]. Let's rebuild your mental model step by step."
2. Present the 5-6 foundational concepts as a quick refresher (2-3 sentences each, not full explanations)
3. For each concept, include one "check yourself" micro-question (rhetorical — provide the answer inline)
4. Then transition: "Now that we've refreshed the foundation, let's build on it..."

The mini-review should take ~15% of the total response. The student should feel their memory being actively reactivated, not lectured at.\n`;
	}

	return '';
}

/**
 * Analyze a response for cognitive load indicators.
 * Returns an object with load assessment and whether a chunk summary is needed.
 */
export function assessCognitiveLoad(responseText) {
	if (!responseText) return { needsChunkSummary: false, wordCount: 0, conceptCount: 0 };

	const wordCount = responseText.split(/\s+/).filter(Boolean).length;

	/* Count distinct concepts by counting h2/h3 headings */
	const headings = (responseText.match(/^#{2,3}\s+.+$/gm) || []);
	const conceptCount = headings.length;

	/* Count formulas (LaTeX blocks) */
	const formulaCount = (responseText.match(/\$\$.+?\$\$/gs) || []).length;

	/* High cognitive load thresholds */
	const isLong = wordCount > 2000;
	const isDense = conceptCount > 8;
	const isFormulaHeavy = formulaCount > 6;

	const needsChunkSummary = isLong || isDense || (isFormulaHeavy && wordCount > 1200);

	return {
		needsChunkSummary,
		wordCount,
		conceptCount,
		formulaCount,
		loadLevel: needsChunkSummary ? 'high' : (wordCount > 1000 ? 'moderate' : 'low')
	};
}

/**
 * Generate a cognitive load management instruction for prompts.
 * Only adds the instruction when the mode typically produces long output.
 */
export function getCognitiveLoadInstruction(mode) {
	const longModes = [
		'concept_builder', 'smart_diagnosis', 'adaptive_practice',
		'mistake_analyzer', 'formula_facts', 'quick_revision'
	];

	if (!longModes.includes(mode)) return '';

	return `\n## COGNITIVE LOAD MANAGEMENT
If your response covers more than 6 distinct sub-concepts or exceeds 2000 words:
- End with a "## Quick Summary" section containing exactly 3 lines
- Line 1: The single most important concept from this response
- Line 2: The most common mistake or confusion point
- Line 3: The one thing to practice first
- This summary is for working memory retention — be crisp, not comprehensive\n`;
}

/**
 * Build an interleaving instruction when the student has run multiple modes
 * on the same topic in the same session.
 */
export function getInterleavingInstruction(sessionContext) {
	if (!sessionContext || sessionContext.modesCompleted.length < 2) return '';

	const completed = sessionContext.modesCompleted;
	const parts = [];

	/* Concept Builder → Practice: don't repeat examples */
	if (completed.includes('concept_builder') && completed.includes('adaptive_practice')) {
		parts.push('The student already studied concepts with examples. Use DIFFERENT examples in practice problems — do not reuse the same scenarios.');
	}

	/* Mistake Analyzer → Practice: focus on mistake areas */
	if (completed.includes('mistake_analyzer')) {
		const mistakes = sessionContext.identifiedMistakes.slice(0, 3);
		if (mistakes.length > 0) {
			parts.push(`The Mistake Analyzer identified these errors: ${mistakes.join('; ')}. Weave practice around these specific weak points.`);
		}
	}

	/* Concept Builder → Quick Revision: don't re-explain, compress */
	if (completed.includes('concept_builder') && completed.includes('quick_revision')) {
		parts.push('The student already received detailed concept explanations. Focus the revision on compressed recall triggers and formula sheets — not re-explanation.');
	}

	/* Weak concepts from recall should influence next generation */
	if (sessionContext.weakConcepts.length > 0) {
		const weak = sessionContext.weakConcepts.slice(0, 4).join(', ');
		parts.push(`Recall testing showed weakness in: ${weak}. Give these concepts extra depth and clarity.`);
	}

	if (parts.length === 0) return '';

	return `\n## INTERLEAVING INTELLIGENCE (same topic, multiple modes)
${parts.join('\n')}\nMake this response feel like the next chapter of a learning journey, not a separate standalone resource.\n`;
}

/**
 * Build the metacognition prompt for recall/flashcard scoring.
 * Returns the question to ask before revealing the score.
 */
export function buildMetacognitionQuestion(type, totalQuestions) {
	if (type === 'recall') {
		return {
			question: `Before seeing your score — you answered ${totalQuestions} questions. What percentage do you think you got right, and why?`,
			placeholder: 'e.g., "I think about 60% — I was confident on MCQs but unsure about application questions"',
			followUp: (predicted, actual) => {
				const diff = Math.abs(predicted - actual);
				if (diff <= 10) return 'Your self-assessment was very accurate. This is a strong metacognitive skill.';
				if (diff <= 25) return 'Reasonably close. Keep practicing self-assessment — it improves exam performance.';
				if (predicted > actual) return 'You overestimated your performance. This is common — review the areas you felt "sure" about most carefully.';
				return 'You underestimated yourself. Your knowledge is stronger than you think — trust your preparation more.';
			}
		};
	}

	if (type === 'flashcard') {
		return {
			question: `You reviewed ${totalQuestions} flashcards. How many do you think you truly knew vs. needed review?`,
			placeholder: 'e.g., "I think I got 7 out of 10 — the formula cards were harder"',
			followUp: (predictedGot, actualGot) => {
				const diff = Math.abs(predictedGot - actualGot);
				if (diff <= 1) return 'Excellent self-awareness. You know exactly where you stand.';
				if (predictedGot > actualGot) return 'You thought you knew more than you did. Focus on cards you marked "Got it" quickly — they may need deeper review.';
				return 'You knew more than you thought. Confidence matters in exams — trust your recall.';
			}
		};
	}

	return null;
}

/**
 * Get simplification instruction when student has indicated confusion multiple times.
 */
export function getSimplificationInstruction(confusedCount) {
	if (confusedCount < 2) return '';

	return `\n## SIMPLIFICATION MODE ACTIVE
The student has indicated confusion ${confusedCount} times on this topic. Adjust your approach:
- Use simpler language — avoid jargon unless immediately defined
- Break every concept into 2-3 smaller steps before combining
- Use at least 2 everyday analogies per major concept
- Keep paragraphs to 3 lines maximum
- After each sub-concept, add a one-line "In simple terms: ..." summary
- Reduce mathematical formality — show the intuition first, formalism second\n`;
}
