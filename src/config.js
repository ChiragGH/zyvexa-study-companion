const API_URL = "http://localhost:3001/api/generate";
const EXAM_API_URL = "http://localhost:3001/api/exam";
const EVALUATE_API_URL = "http://localhost:3001/api/evaluate";
const ASK_API_URL = "http://localhost:3001/api/ask";

const STUDY_MODES = [
	{
		id: "smart_diagnosis",
		displayName: "Smart Diagnosis",
		icon: "🧠",
		model: "deepseek-chat",
		max_tokens: 8192
	},
	{
		id: "concept_builder",
		displayName: "Concept Builder",
		icon: "🧩",
		model: "deepseek-chat",
		max_tokens: 8192
	},
	{
		id: "adaptive_practice",
		displayName: "Adaptive Practice",
		icon: "📊",
		model: "deepseek-chat",
		max_tokens: 8192
	},
	{
		id: "mistake_analyzer",
		displayName: "Mistake Analyzer",
		icon: "❌",
		model: "deepseek-chat",
		max_tokens: 8192
	},
	{
		id: "exam_simulation",
		displayName: "Exam Simulation",
		icon: "🧪",
		model: "deepseek-chat",
		max_tokens: 8192
	},
	{
		id: "quick_revision",
		displayName: "Quick Revision",
		icon: "⚡",
		model: "deepseek-chat",
		max_tokens: 8192
	},
	{
		id: "formula_facts",
		displayName: "Formula & Core Facts",
		icon: "📌",
		model: "deepseek-chat",
		max_tokens: 8192
	},
	{
		id: "memory_engine",
		displayName: "Memory Engine",
		icon: "🧠",
		model: "deepseek-chat",
		max_tokens: 8192
	},
	{
		id: "study_planner",
		displayName: "Study Planner",
		icon: "📈",
		model: "deepseek-chat",
		max_tokens: 8192
	}
];

export { API_URL, EXAM_API_URL, EVALUATE_API_URL, ASK_API_URL, STUDY_MODES };
