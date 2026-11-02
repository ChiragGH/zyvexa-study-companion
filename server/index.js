import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';

const app = express();
const PORT = process.env.PORT || 3001;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Per-mode configuration: max tokens
const MODE_CONFIG = {
  smart_diagnosis:   { maxTokens: 8192 },
  concept_builder:   { maxTokens: 8192 },
  adaptive_practice: { maxTokens: 8192 },
  mistake_analyzer:  { maxTokens: 8192 },
  exam_simulation:   { maxTokens: 8192 },
  quick_revision:    { maxTokens: 8192 },
  formula_facts:     { maxTokens: 8192 },
  memory_engine:     { maxTokens: 8192 },
  study_planner:     { maxTokens: 8192 },
};

function normalizeContent(content) {
  if (typeof content === 'string' || Array.isArray(content)) {
    return content;
  }

  if (content == null) {
    return '';
  }

  return JSON.stringify(content, null, 2);
}

function buildMessages(prompt) {
  if (typeof prompt === 'string') {
    return [{ role: 'user', content: prompt }];
  }

  if (!prompt || typeof prompt !== 'object' || Array.isArray(prompt)) {
    throw new Error('Invalid prompt payload. Expected a string or prompt object.');
  }

  if (Array.isArray(prompt.messages) && prompt.messages.length > 0) {
    return prompt.messages.map((message) => ({
      role: message?.role || 'user',
      content: normalizeContent(message?.content)
    }));
  }

  const messages = [];

  if (prompt.system) {
    messages.push({ role: 'system', content: normalizeContent(prompt.system) });
  }

  if (prompt.user) {
    messages.push({ role: 'user', content: normalizeContent(prompt.user) });
  }

  if (!messages.length && prompt.prompt) {
    messages.push({ role: 'user', content: normalizeContent(prompt.prompt) });
  }

  if (!messages.length) {
    throw new Error('Prompt object must include `system` and/or `user` content.');
  }

  return messages;
}

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

/* Serve static files from the project root */
app.use(express.static(path.join(__dirname, '..')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Zyvexa server running', deepseek: !!DEEPSEEK_API_KEY, groq: !!process.env.GROQ_API_KEY });
});

app.post('/api/ask', async (req, res) => {
  const { question, context, topic, mode, level, responseSummary, language, subjectType, weakAreas, recallPerformance, flashcardPerformance, conversationHistory } = req.body;
  console.log('ASK received:', String(question || '').slice(0, 60));

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: 'GROQ API key not configured' });
    return;
  }

  /* Build rich context for the Ask panel */
  const contextParts = [];
  if (topic) contextParts.push(`Topic: ${topic}`);
  if (mode) contextParts.push(`Study mode: ${mode}`);
  if (level) contextParts.push(`Academic level: ${level}`);
  if (subjectType) contextParts.push(`Subject type: ${subjectType}`);
  if (responseSummary) contextParts.push(`Content summary: ${responseSummary}`);
  if (weakAreas) contextParts.push(`Student weak areas: ${weakAreas}`);
  if (recallPerformance) contextParts.push(`Recall score: ${recallPerformance}%`);
  if (flashcardPerformance) contextParts.push(`Flashcard performance: ${flashcardPerformance}`);
  const richContext = contextParts.length > 0 ? contextParts.join('. ') : (context || 'General study help');

  /* Determine response language */
  const lang = (language || 'english').toLowerCase();
  const langInstruction = lang === 'hinglish'
    ? 'Respond in Hinglish naturally — mix Hindi and English the way Indian students actually talk. Use English for technical terms, Hindi for explanations.'
    : lang === 'hindi'
    ? 'Respond in Hindi using Devanagari script.'
    : 'If the question is in pure English, still keep it simple and casual.';

  /* Build multi-turn messages array */
  const messages = [
    {
      role: 'system',
      content: `You are a sharp, knowledgeable study companion helping an Indian student. You have full context of what they are studying right now. You are a subject-expert tutor who just taught this topic.

STUDENT CONTEXT: ${richContext}

RULES (follow strictly):
1. First line = direct answer. No preamble, no "Sure!", no "Great question!".
2. For word meanings or single-concept questions: give meaning in 1 crisp sentence in simple language, then 1 example if helpful. Done.
3. For multi-part concepts: use bullet points starting with • (the bullet character). Each bullet = 1 line max. No wrapping paragraphs.
4. Hard cap: max 6 bullets OR max 4 sentences. Never exceed.
5. ${langInstruction}
6. NEVER use markdown headers (#, ##). NEVER use bold (**) or italic (*) markdown syntax. Plain text only with • bullets.
7. If a formula is involved, write it inline clearly (no LaTeX, no $$).
8. Keep it like a smart friend explaining — direct, sharp, zero fluff.
9. If the question relates to the currently studied content, reference specific concepts from it.
10. If asked to compare, explain differences, or clarify confusion, be extra precise with technical distinctions.
11. You have memory of previous questions in this conversation. Reference them naturally if relevant.`
    }
  ];

  /* Add conversation history (up to 5 prior exchanges) */
  if (Array.isArray(conversationHistory)) {
    const recentHistory = conversationHistory.slice(-5);
    for (const exchange of recentHistory) {
      if (exchange.question) messages.push({ role: 'user', content: exchange.question });
      if (exchange.answer) messages.push({ role: 'assistant', content: exchange.answer });
    }
  }

  /* Add current question */
  messages.push({ role: 'user', content: question });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.5,
      messages
    });

    res.json({ answer: completion.choices?.[0]?.message?.content || '' });
  } catch (error) {
    console.error('ASK error:', error);
    res.status(500).json({ error: error.message || 'Ask request failed' });
  }
});

app.post('/api/eval-answer', async (req, res) => {
  const { question, answer, maxMarks, level } = req.body;
  console.log('EVAL received — maxMarks:', maxMarks, 'level:', level);

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: 'GROQ API key not configured' });
    return;
  }

  if (!question || answer === undefined || answer === null) {
    res.status(400).json({ error: 'question and answer are required' });
    return;
  }

  const max = Number(maxMarks) || 4;
  const lvl = level || 'diploma';

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 200,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are an Indian academic examiner evaluating a student's written answer. Be fair, consistent, and educationally constructive.

EVALUATION RULES:
1. Award marks from 0 to ${max} (integers only, no decimals).
2. Calibrate to ${lvl} level expectations.
3. Award full marks if the answer covers all key points correctly.
4. Award partial marks proportionally for partially correct answers.
5. Award 0 only if the answer is completely wrong, blank, or irrelevant.
6. Respond in EXACTLY this JSON format, nothing else:
{"score": <number>, "feedback": "<one sentence justification, max 20 words>"}`
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nStudent's Answer: ${answer || '[No answer provided]'}\n\nMaximum marks: ${max}\n\nEvaluate and respond in the required JSON format.`
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || '';
    let parsed;
    try {
      // Extract JSON even if there's surrounding text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0, feedback: 'Evaluation failed — please self-assess.' };
    } catch {
      parsed = { score: 0, feedback: 'Could not parse evaluation. Please self-assess.' };
    }

    // Clamp score to valid range
    const score = Math.max(0, Math.min(max, Math.round(Number(parsed.score) || 0)));
    res.json({ score, maxMarks: max, feedback: parsed.feedback || '' });
  } catch (error) {
    console.error('EVAL error:', error);
    res.status(500).json({ error: error.message || 'Evaluation request failed' });
  }
});

/* ═══════════════════════════════════════════════════════════
   /api/exam — Non-streaming JSON exam paper generation
   Uses DeepSeek for structured JSON output
   ═══════════════════════════════════════════════════════════ */
app.post('/api/exam', async (req, res) => {
  const { prompt, topic, level, language } = req.body;
  console.log('EXAM generation request:', topic, level);

  if (!DEEPSEEK_API_KEY) {
    res.status(500).json({ error: 'DeepSeek API key not configured' });
    return;
  }

  try {
    const messages = buildMessages(prompt);

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        max_tokens: 8192,
        temperature: 0.4,
        stream: false,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(300000) // 5 minute timeout
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek exam error:', response.status, errText);
      res.status(500).json({ error: `DeepSeek API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    /* Try to extract JSON from response */
    let examJSON;
    try {
      /* Direct parse first */
      examJSON = JSON.parse(rawContent);
    } catch {
      /* Try extracting JSON from markdown code block or surrounding text */
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || rawContent.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          examJSON = JSON.parse(jsonMatch[1].trim());
        } catch {
          examJSON = null;
        }
      }
    }

    if (!examJSON) {
      console.error('Failed to parse exam JSON. Raw content:', rawContent.slice(0, 500));
      res.status(500).json({ error: 'AI response was not valid JSON. Please try again.', rawContent: rawContent.slice(0, 2000) });
      return;
    }

    res.json({ exam: examJSON });
  } catch (error) {
    console.error('EXAM error:', error);
    res.status(500).json({ error: error.message || 'Exam generation failed' });
  }
});

/* ═══════════════════════════════════════════════════════════
   /api/evaluate — Per-question AI evaluation with model answer
   ═══════════════════════════════════════════════════════════ */
app.post('/api/evaluate', async (req, res) => {
  const { question, model_answer, student_answer, marks, level, image_base64 } = req.body;
  console.log('EVALUATE received — marks:', marks);

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: 'GROQ API key not configured' });
    return;
  }

  if (!question) {
    res.status(400).json({ error: 'question is required' });
    return;
  }

  const max = Number(marks) || 4;
  const lvl = level || 'diploma';
  const studentAns = student_answer || '[No answer provided]';

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You are an Indian academic examiner evaluating a student's answer against a model answer. Be fair, precise, and constructive.

EVALUATION RULES:
1. Award marks from 0 to ${max} (integers only).
2. Calibrate to ${lvl} level expectations.
3. Compare the student's answer with the model answer for accuracy and completeness.
4. Award full marks if all key points from the model answer are covered correctly.
5. Award partial marks proportionally for partially correct answers.
6. Award 0 only if the answer is completely wrong, blank, or irrelevant.
7. Respond in EXACTLY this JSON format, nothing else:
{"score": <number>, "feedback": "<specific 1-2 sentence feedback citing what was right/wrong>", "key_missing": "<what key points were missed, or empty string if full marks>"}`
        },
        {
          role: 'user',
          content: `Question (${max} marks): ${question}\n\nModel Answer: ${model_answer || '[Not available]'}\n\nStudent's Answer: ${studentAns}${image_base64 ? '\n[Student also uploaded a handwritten answer image]' : ''}\n\nEvaluate and respond in the required JSON format.`
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || '';
    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0, feedback: 'Evaluation failed.', key_missing: '' };
    } catch {
      parsed = { score: 0, feedback: 'Could not parse evaluation.', key_missing: '' };
    }

    const score = Math.max(0, Math.min(max, Math.round(Number(parsed.score) || 0)));
    res.json({ score, maxMarks: max, feedback: parsed.feedback || '', key_missing: parsed.key_missing || '' });
  } catch (error) {
    console.error('EVALUATE error:', error);
    res.status(500).json({ error: error.message || 'Evaluation request failed' });
  }
});

/* ═══════════════════════════════════════════════════════════
   INTELLIGENT MODEL ROUTING
   Routes between deepseek-chat and deepseek-reasoner based on
   mode, subject type, response depth, and topic complexity.
   ═══════════════════════════════════════════════════════════ */

const REASONER_MODES = new Set([
  'concept_builder', 'smart_diagnosis', 'mistake_analyzer', 'adaptive_practice'
]);

const REASONER_SUBJECTS = new Set([
  'pure_maths', 'physics', 'chemistry', 'applied_engineering',
  'computer_science', 'diagram_technical', 'medical'
]);

const REASONER_KEYWORDS = /derivation|proof|theorem|analysis|mechanism|algorithm|complex|advanced|optimization|design|architecture|pathophysiology|differential equation/i;

function selectModel(mode, subjectType, responseDepth, topic) {
  /* Quick/lightweight modes always use chat */
  if (['quick_revision', 'formula_facts', 'study_planner', 'memory_engine'].includes(mode)) {
    return 'deepseek-chat';
  }

  /* Exam simulation always uses chat (structured JSON output) */
  if (mode === 'exam_simulation') {
    return 'deepseek-chat';
  }

  /* Comprehensive depth on STEM subjects → reasoner */
  if (responseDepth === 'comprehensive' && REASONER_SUBJECTS.has(subjectType)) {
    return 'deepseek-reasoner';
  }

  /* Concise depth → always chat (speed priority) */
  if (responseDepth === 'concise') {
    return 'deepseek-chat';
  }

  /* Complex modes on STEM subjects → reasoner */
  if (REASONER_MODES.has(mode) && REASONER_SUBJECTS.has(subjectType)) {
    return 'deepseek-reasoner';
  }

  /* Topic keyword trigger → reasoner */
  if (topic && REASONER_KEYWORDS.test(topic)) {
    return 'deepseek-reasoner';
  }

  /* Default: chat (faster, cheaper) */
  return 'deepseek-chat';
}

/* Depth-based token adjustment (server-side safety net) */
const DEPTH_TOKEN_MULTIPLIERS = {
  concise: 0.6,
  balanced: 1.0,
  comprehensive: 1.5
};

app.post('/api/generate', async (req, res) => {
  console.log('Mode received:', req.body.mode);

  const { prompt, mode, system, user, max_tokens, subjectType, responseDepth, topic } = req.body;
  const config = MODE_CONFIG[mode] || { maxTokens: 6144 };

  /* Select model dynamically */
  const selectedModel = selectModel(mode, subjectType, responseDepth, topic);
  console.log(`Model routing: mode=${mode}, subject=${subjectType || 'unknown'}, depth=${responseDepth || 'balanced'} → ${selectedModel}`);

  /* Apply depth multiplier server-side as safety net */
  const depthMultiplier = DEPTH_TOKEN_MULTIPLIERS[responseDepth] || 1.0;
  const baseTokens = Number.isFinite(Number(max_tokens)) ? Number(max_tokens) : config.maxTokens;
  const maxTokens = Math.round(baseTokens * (Number.isFinite(Number(max_tokens)) ? 1.0 : depthMultiplier));

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  if (!DEEPSEEK_API_KEY) {
    console.error('API error: API key not configured');
    res.write(`data: ${JSON.stringify({ error: 'API key not configured' })}\n\n`);
    res.end();
    return;
  }

  /* Keepalive ping to prevent connection drops during long streams */
  const keepalive = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': keepalive\n\n');
    } else {
      clearInterval(keepalive);
    }
  }, 15000);

  /* Client disconnect detection */
  req.on('close', () => {
    clearInterval(keepalive);
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300000); // 5 minutes for long responses

  try {
    const messages = prompt ? buildMessages(prompt) : [];
    const finalSystem = system || messages.find((m) => m.role === 'system')?.content || 'You are a helpful academic assistant.';
    const finalUser = user || messages.filter((m) => m.role !== 'system').map((m) => normalizeContent(m.content)).join('\n\n').trim();

    console.log(`Streaming started with ${selectedModel}, maxTokens=${maxTokens}`);

    /* Build request body — deepseek-reasoner doesn't support temperature */
    const requestBody = {
      model: selectedModel,
      messages: [
        { role: 'system', content: finalSystem },
        { role: 'user', content: finalUser }
      ],
      max_tokens: maxTokens,
      stream: true
    };

    /* Only add temperature for deepseek-chat (reasoner doesn't support it) */
    if (selectedModel === 'deepseek-chat') {
      requestBody.temperature = 0.7;
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek error:', response.status, errText);
      /* Send recoverable error for client-side retry logic */
      const isRecoverable = response.status >= 500 || response.status === 429;
      res.write(`data: ${JSON.stringify({ error: errText, recoverable: isRecoverable, status: response.status })}\n\n`);
      clearInterval(keepalive);
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let chunkErrors = 0;

    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const trimmedLine = rawLine.trim();
        if (!trimmedLine) {
          continue;
        }

        const line = trimmedLine.startsWith('data: ') ? trimmedLine.slice(6) : trimmedLine;

        if (line === '[DONE]') {
          console.log('Streaming complete');
          clearInterval(keepalive);
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }

        try {
          const parsed = JSON.parse(line);
          const delta = parsed.choices[0]?.delta;
          const text = delta?.content;
          const finishReason = parsed.choices[0]?.finish_reason;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
          // Forward finish_reason so client can detect truncation
          if (finishReason) {
            res.write(`data: ${JSON.stringify({ finish_reason: finishReason })}\n\n`);
          }
          /* Reset chunk error counter on successful parse */
          chunkErrors = 0;
        } catch (parseError) {
          chunkErrors++;
          /* Skip malformed chunks gracefully instead of crashing */
          if (chunkErrors <= 3) {
            console.warn('Streaming parse error (skipped):', parseError.message, line.substring(0, 80));
          }
          /* If too many consecutive errors, something is truly broken */
          if (chunkErrors > 10) {
            console.error('Too many consecutive parse errors, aborting stream');
            clearInterval(keepalive);
            res.write(`data: ${JSON.stringify({ error: 'Stream corrupted', recoverable: true })}\n\n`);
            res.end();
            return;
          }
        }
      }
    }

    if (buffer.trim()) {
      const line = buffer.trim().startsWith('data: ') ? buffer.trim().slice(6) : buffer.trim();
      if (line === '[DONE]') {
        console.log('Streaming complete');
        clearInterval(keepalive);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      try {
        const parsed = JSON.parse(line);
        const delta = parsed.choices[0]?.delta;
        const text = delta?.content;
        const finishReason = parsed.choices[0]?.finish_reason;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
        if (finishReason) {
          res.write(`data: ${JSON.stringify({ finish_reason: finishReason })}\n\n`);
        }
      } catch (parseError) {
        console.warn('Final buffer parse error (skipped):', parseError.message);
      }
    }

    console.log('Streaming complete');
    clearInterval(keepalive);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    clearTimeout(timeout);
    clearInterval(keepalive);

    if (err.name === 'AbortError') {
      console.error('DeepSeek request timed out');
    } else {
      console.error('API error:', err.message);
    }

    if (!res.writableEnded) {
      const isTimeout = err.name === 'AbortError';
      res.write(`data: ${JSON.stringify({
        error: isTimeout ? 'DeepSeek request timed out' : err.message,
        recoverable: true
      })}\n\n`);
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log('Zyvexa server running at http://localhost:' + PORT);
  console.log("DEEPSEEK KEY LOADED:", !!process.env.DEEPSEEK_API_KEY);
});
