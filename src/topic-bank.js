/* ============================================================
   Zyvexa Topic Bank and Subject Detection
   Canonical taxonomy aligned to prompt architecture
   ============================================================ */

const TOPIC_TREE = {
	pure_maths: {
		label: "Pure Maths",
		topics: [
			"Limits and Continuity",
			"Differentiation Rules",
			"Definite Integration",
			"Complex Numbers",
			"Matrices and Determinants",
			"Vector Algebra",
			"Probability Basics",
			"Trigonometric Identities",
			"Coordinate Geometry",
			"Sequences and Series"
		]
	},
	applied_engineering: {
		label: "Applied Engineering",
		topics: [
			"Strength of Materials",
			"Control Systems Basics",
			"Power Electronics",
			"Digital Signal Processing",
			"Thermal Engineering",
			"Fluid Mechanics Applications",
			"Machine Design Basics",
			"Industrial Instrumentation",
			"Engineering Economics",
			"Operations Research"
		]
	},
	physics: {
		label: "Physics",
		topics: [
			"Newton Laws of Motion",
			"Work Energy and Power",
			"Simple Harmonic Motion",
			"Electromagnetic Induction",
			"Current Electricity",
			"Ray and Wave Optics",
			"Thermodynamics",
			"Capacitance and Circuits",
			"Semiconductor Physics",
			"Nuclear Physics"
		]
	},
	chemistry: {
		label: "Chemistry",
		topics: [
			"Chemical Bonding",
			"Redox Reactions",
			"Chemical Equilibrium",
			"Ionic Equilibrium",
			"Electrochemistry",
			"Organic Reaction Mechanisms",
			"Coordination Compounds",
			"Thermochemistry",
			"Chemical Kinetics",
			"Periodic Trends"
		]
	},
	biology: {
		label: "Biology",
		topics: [
			"Cell Structure and Function",
			"Mitosis and Meiosis",
			"Genetics and Inheritance",
			"Human Physiology",
			"Photosynthesis",
			"Respiration",
			"Ecology and Ecosystems",
			"Biotechnology",
			"Molecular Basis of Inheritance",
			"Evolution"
		]
	},
	computer_science: {
		label: "Computer Science",
		topics: [
			"Data Structures",
			"Algorithms and Complexity",
			"Operating Systems",
			"Database Systems",
			"Computer Networks",
			"Object Oriented Programming",
			"Web Development",
			"Machine Learning Fundamentals",
			"Cloud Computing Basics",
			"Cybersecurity Fundamentals"
		]
	},
	history: {
		label: "History",
		topics: [
			"Indian Independence Movement",
			"French Revolution",
			"Industrial Revolution",
			"World War I and II",
			"Mughal Empire",
			"Mauryan Empire",
			"Cold War",
			"Revolt of 1857",
			"Harappan Civilization",
			"Partition of India"
		]
	},
	geography: {
		label: "Geography",
		topics: [
			"Monsoon System",
			"Plate Tectonics",
			"Soil and Vegetation",
			"Rivers of India",
			"Climate Zones",
			"Population Distribution",
			"Natural Resources",
			"Landforms",
			"Agriculture Patterns",
			"Ocean Currents"
		]
	},
	political_science: {
		label: "Political Science",
		topics: [
			"Indian Constitution",
			"Fundamental Rights",
			"Parliamentary System",
			"Federalism",
			"Judiciary Structure",
			"Election Process",
			"Public Policy",
			"Local Governance",
			"Political Ideologies",
			"Citizenship"
		]
	},
	economics: {
		label: "Economics",
		topics: [
			"Demand and Supply",
			"Inflation and Deflation",
			"GDP and National Income",
			"Fiscal Policy",
			"Monetary Policy",
			"Market Structures",
			"International Trade",
			"Poverty and Unemployment",
			"Consumer Theory",
			"Cost and Production"
		]
	},
	psychology_social: {
		label: "Psychology and Social",
		topics: [
			"Learning and Conditioning",
			"Memory and Forgetting",
			"Motivation and Emotion",
			"Personality Theories",
			"Social Influence",
			"Group Dynamics",
			"Cognitive Biases",
			"Stress and Coping",
			"Behavior Change",
			"Attitudes and Persuasion"
		]
	},
	philosophy: {
		label: "Philosophy",
		topics: [
			"Ethics and Morality",
			"Logic and Fallacies",
			"Epistemology",
			"Metaphysics",
			"Existentialism",
			"Utilitarianism vs Deontology",
			"Stoicism",
			"Indian Philosophy Schools",
			"Philosophy of Mind",
			"Political Philosophy"
		]
	},
	language_literature: {
		label: "Language and Literature",
		topics: [
			"Grammar and Syntax",
			"Essay Writing",
			"Comprehension Skills",
			"Poetry Analysis",
			"Narrative Structure",
			"Rhetorical Devices",
			"Formal Letter Writing",
			"Translation Basics",
			"Creative Writing",
			"Literary Themes"
		]
	},
	law: {
		label: "Law",
		topics: [
			"Indian Constitution Law",
			"Contract Act",
			"Law of Torts",
			"Criminal Procedure",
			"Family Law",
			"Cyber Law",
			"Labour Law",
			"Company Law",
			"Intellectual Property Rights",
			"Administrative Law"
		]
	},
	business_management: {
		label: "Business and Management",
		topics: [
			"Principles of Management",
			"Marketing Fundamentals",
			"Financial Accounting",
			"Human Resource Management",
			"Operations Management",
			"Strategic Management",
			"Entrepreneurship",
			"Business Communication",
			"Organizational Behavior",
			"Project Management"
		]
	},
	competitive_general: {
		label: "Competitive General",
		topics: [
			"Reasoning and Aptitude",
			"Current Affairs",
			"General Awareness",
			"Quantitative Aptitude",
			"Verbal Ability",
			"Mock Test Strategy",
			"Previous Year Questions",
			"Time Management for Exams",
			"Elimination Techniques",
			"Revision Strategy"
		]
	},
	diagram_technical: {
		label: "Diagram and Technical",
		topics: [
			"Engineering Drawing",
			"Circuit Diagrams",
			"Free Body Diagrams",
			"P and ID Basics",
			"Machine Component Sketching",
			"Control Block Diagrams",
			"AutoCAD Fundamentals",
			"Flowchart Design",
			"Technical Blueprint Reading",
			"Instrumentation Diagrams"
		]
	},
	medical: {
		label: "Medical",
		topics: [
			"Human Anatomy Basics",
			"Pathophysiology",
			"Clinical Diagnosis Basics",
			"Pharmacology Essentials",
			"Microbiology",
			"Public Health Fundamentals",
			"Nursing Fundamentals",
			"First Aid Protocols",
			"Disease Prevention",
			"Medical Ethics"
		]
	},
	general_knowledge_lifeskills: {
		label: "General Knowledge and Life Skills",
		topics: [
			"Manipulation and Defense",
			"Persuasion and Influence",
			"Dark Psychology Signals",
			"Stoicism in Daily Life",
			"Mindfulness and Meditation",
			"Productivity Systems",
			"Habit Formation",
			"Communication Mastery",
			"Leadership Fundamentals",
			"Negotiation Basics",
			"Personal Finance Fundamentals",
			"Human Behavior Patterns",
			"Critical Thinking",
			"Decision Making",
			"Self Discipline and Focus"
		]
	}
};

const SUBJECT_PRIORITY = [
	"diagram_technical",
	"medical",
	"computer_science",
	"applied_engineering",
	"pure_maths",
	"physics",
	"chemistry",
	"biology",
	"history",
	"geography",
	"political_science",
	"economics",
	"psychology_social",
	"philosophy",
	"language_literature",
	"law",
	"business_management",
	"competitive_general",
	"general_knowledge_lifeskills"
];

const DETECTION_RULES = [
	{
		category: "general_knowledge_lifeskills",
		re: /manipulation|persuasion|influence|dark psychology|stoicism|meditation|mindfulness|productivity|habit|communication|leadership|negotiation|personal finance|self[-\s]?improvement|self[-\s]?development|human behavior|social behavior|behavioral|decision making|critical thinking|focus|discipline|confidence|emotional intelligence/
	},
	{
		category: "diagram_technical",
		re: /diagram|schematic|blueprint|technical drawing|engineering drawing|autocad|cad|circuit diagram|free body|p and id|block diagram|flowchart|orthographic|isometric/
	},
	{
		category: "medical",
		re: /disease|diagnosis|symptom|treatment|patient|pathology|pharmacology|surgery|clinical|nursing|medicine|anatomy|physiology|mbbs|drug|dosage|healthcare|microbiology|public health/
	},
	{
		category: "computer_science",
		re: /algorithm|programming|code|data structure|database|sql|network|operating system|compiler|python|java|javascript|html|css|api|cloud|cybersecurity|machine learning|ai|recursion|complexity/
	},
	{
		category: "applied_engineering",
		re: /engineering|control system|mechanics of materials|strength of materials|power electronics|machine design|instrumentation|thermodynamics application|manufacturing|plc|cnc|industrial/
	},
	{
		category: "pure_maths",
		re: /calculus|integration|differentiation|derivative|limits?|continuity|matrix|determinant|vector|trigonometry|probability|sequence|series|complex number|geometry|algebra|number theory/
	},
	{
		category: "physics",
		re: /newton|motion|force|energy|power|optics|electricity|magnetism|thermodynamics|wave|oscillation|semiconductor|nuclear|gravitation|current|voltage|resistance/
	},
	{
		category: "chemistry",
		re: /atom|molecule|chemical|reaction|bonding|acid|base|salt|equilibrium|kinetics|organic|inorganic|electrochemistry|stoichiometry|periodic table/
	},
	{
		category: "biology",
		re: /cell|dna|rna|genetics|photosynthesis|respiration|ecology|hormone|enzyme|evolution|inheritance|biotechnology|physiology|anatomy of plant|mitosis|meiosis/
	},
	{
		category: "history",
		re: /history|revolution|empire|dynasty|independence|war|colonial|partition|civilization|medieval|modern history|freedom movement/
	},
	{
		category: "geography",
		re: /geography|climate|monsoon|river|soil|vegetation|population|plate tectonics|landform|resource|ocean|weather/
	},
	{
		category: "political_science",
		re: /constitution|parliament|democracy|federalism|judiciary|election|citizenship|political|governance|rights|policy/
	},
	{
		category: "economics",
		re: /economics|gdp|inflation|deflation|demand|supply|fiscal|monetary|market|trade|production|consumption|national income/
	},
	{
		category: "psychology_social",
		re: /psychology|cognitive|perception|motivation|emotion|personality|behaviorism|social psychology|conditioning|memory|stress|coping/
	},
	{
		category: "philosophy",
		re: /philosophy|ethics|logic|epistemology|metaphysics|existentialism|utilitarianism|deontology|stoic|ontology/
	},
	{
		category: "language_literature",
		re: /grammar|literature|poetry|essay|comprehension|writing|rhetoric|linguistics|novel|prose|translation/
	},
	{
		category: "law",
		re: /law|legal|constitution law|contract act|tort|criminal procedure|cyber law|jurisprudence|court|rights law/
	},
	{
		category: "business_management",
		re: /management|marketing|finance|accounting|hrm|human resource|operations|strategy|entrepreneurship|business communication|organizational behavior/
	},
	{
		category: "competitive_general",
		re: /jee|neet|upsc|ssc|gate|cat|aptitude|reasoning|current affairs|general awareness|pyq|mock test/
	}
];

const ALL_TOPICS = [];
for (const [category, entry] of Object.entries(TOPIC_TREE)) {
	for (const topic of entry.topics) {
		ALL_TOPICS.push({
			topic,
			category,
			categoryLabel: entry.label
		});
	}
}

export function detectSubjectType(topic) {
	const normalized = String(topic || "").toLowerCase().trim();
	if (!normalized) return "general_knowledge_lifeskills";

	for (const rule of DETECTION_RULES) {
		if (rule.re.test(normalized)) {
			return rule.category;
		}
	}

	return "general_knowledge_lifeskills";
}

export function searchTopics(query, maxResults = 8) {
	const q = String(query || "").toLowerCase().trim();
	if (q.length < 2) return [];

	const scored = [];
	for (const entry of ALL_TOPICS) {
		const t = entry.topic.toLowerCase();
		let score = 0;

		if (t.startsWith(q)) {
			score = 100;
		} else if (t.split(/[\s-]+/).some((w) => w.startsWith(q))) {
			score = 82;
		} else if (t.includes(q)) {
			score = 64;
		} else {
			const words = q.split(/\s+/).filter(Boolean);
			const hits = words.filter((w) => t.includes(w)).length;
			if (hits > 0) {
				score = 30 + (hits / words.length) * 30;
			}
		}

		if (score > 0) {
			score += Math.max(0, 20 - entry.topic.length * 0.1);
			scored.push({ ...entry, score });
		}
	}

	scored.sort((a, b) => b.score - a.score);
	return scored.slice(0, maxResults);
}

const VAGUE_TOPICS = new Set([
	"math",
	"maths",
	"mathematics",
	"science",
	"physics",
	"chemistry",
	"biology",
	"history",
	"geography",
	"economics",
	"political science",
	"computer",
	"computer science",
	"engineering",
	"law",
	"business",
	"management",
	"psychology",
	"philosophy",
	"language",
	"literature",
	"general knowledge",
	"life skills"
]);

export function isVagueTopic(topic) {
	const normalized = String(topic || "").toLowerCase().trim();
	if (!normalized) return false;
	return VAGUE_TOPICS.has(normalized) || normalized.length < 3;
}

export function suggestSpecificTopics(vagueTopic) {
	const q = String(vagueTopic || "").toLowerCase().trim();
	if (!q) return [];

	const categoryAliases = {
		math: ["pure_maths"],
		maths: ["pure_maths"],
		mathematics: ["pure_maths"],
		science: ["physics", "chemistry", "biology"],
		physics: ["physics"],
		chemistry: ["chemistry"],
		biology: ["biology"],
		history: ["history"],
		geography: ["geography"],
		economics: ["economics"],
		"political science": ["political_science"],
		"computer science": ["computer_science"],
		computer: ["computer_science"],
		engineering: ["applied_engineering", "diagram_technical"],
		law: ["law"],
		business: ["business_management"],
		management: ["business_management"],
		psychology: ["psychology_social"],
		philosophy: ["philosophy"],
		language: ["language_literature"],
		literature: ["language_literature"],
		"general knowledge": ["competitive_general", "general_knowledge_lifeskills"],
		"life skills": ["general_knowledge_lifeskills"]
	};

	const matchedCategories = categoryAliases[q] || [detectSubjectType(q)];
	const out = [];

	for (const category of matchedCategories) {
		const node = TOPIC_TREE[category];
		if (!node) continue;
		const sample = [...node.topics]
			.sort(() => Math.random() - 0.5)
			.slice(0, 3)
			.map((topic) => ({ topic, category, categoryLabel: node.label }));
		out.push(...sample);
	}

	return out.slice(0, 6);
}

export { TOPIC_TREE, ALL_TOPICS, SUBJECT_PRIORITY };
