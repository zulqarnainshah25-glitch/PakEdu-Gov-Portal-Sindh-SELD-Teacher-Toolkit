import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Security Audit Rule 3: Restrict JSON payload size to prevent DoS memory exhaustion
app.use(express.json({ limit: '256kb' }));

// Security headers middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Load & Concurrency Simulation Rule 4: In-memory cache & per-IP rate limiter for 1,000 concurrent users
const lessonPlanCache = new Map<string, { source: string; plan: Record<string, string>; timestamp: number }>();
const MAX_CACHE_ENTRIES = 500;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

const ipRequestCounts = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_IP_PER_MINUTE = 45;

function cleanServerField(val: unknown, fallback: string, maxLen = 100): string {
  if (typeof val !== 'string') return fallback;
  const cleaned = val
    .replace(/[<>`]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
  return cleaned || fallback;
}

interface LessonPlanRequest {
  board: string;
  section: string;
  className: string;
  subject: string;
  chapter: string;
  topic: string;
  duration: string;
  planType: string;
}

function buildFallbackLessonPlan(req: LessonPlanRequest) {
  const { board, section, className, subject, chapter, topic, duration, planType } = req;
  const questions = [
    `1. What is the main concept of "${topic}" in ${chapter}?`,
    `2. Give two real-life examples of "${topic}".`,
    `3. Why is "${topic}" important in ${subject} (${className})?`
  ].join('\n');

  const exercise = [
    `1. Fill in the blanks using key terms from "${topic}".`,
    `2. Write True or False for the statements in ${chapter}.`,
    `3. Use 5 vocabulary words from "${topic}" in your own sentences.`
  ].join('\n');

  return {
    slos: [
      `Define and explain the core concepts of "${topic}" from ${chapter} (${board} ${className} ${subject}).`,
      `Identify real-life examples and practical applications of "${topic}" in daily life within Pakistan.`,
      `Analyze key relationships, terminology, and structured steps associated with "${topic}".`,
      `Demonstrate mastery of "${topic}" through collaborative group work and formative written exercises.`
    ].join('\n'),
    previousKnowledge: `Ask students 2–3 targeted warm-up questions connecting their prior experiences to "${topic}" (e.g., "What do you already observe in your surroundings related to ${topic}?" and "How does this connect to our previous lesson in ${chapter}?").`,
    teachingAids: `${board} Prescribed ${subject} Textbook (${className}), Whiteboard & Colored Markers, Chart Paper illustrating "${topic}", Vocabulary Flashcards, Printable Student Worksheets.`,
    introduction: `Begin the ${duration} (${planType}) session by showing a visual chart or relatable classroom object connected to "${topic}". Pose an engaging inquiry question to spark curiosity, summarize student responses on the board, and announce today's Student Learning Outcomes (SLOs).`,
    procedure: [
      `Step 1 (Warm-Up & Brainstorming - 5 mins): Greet the class, review previous homework, and conduct the prior-knowledge check on "${topic}".`,
      `Step 2 (Concept Presentation - 12 mins): Introduce "${topic}" from ${chapter} using the ${board} textbook and visual chart. Explain key definitions and core principles clearly.`,
      `Step 3 (Guided Demonstration - 8 mins): Work through 2 structured examples on the whiteboard, highlighting key vocabulary and step-by-step reasoning.`,
      `Step 4 (Collaborative Pair/Group Activity - 8 mins): Divide students into small groups (${section} level) to complete the interactive flashcard and worksheet task.`,
      `Step 5 (Formative Assessment & Wrap-Up - 7 mins): Ask oral spot-check questions across Bloom's Taxonomy levels, summarize the main takeaways, and assign homework.`
    ].join('\n'),
    teacherActivities: `Facilitate inquiry discussion; model accurate pronunciation and conceptual diagrams on the board; circulate around the classroom during group tasks to scaffold struggling learners; provide constructive real-time feedback.`,
    studentActivities: `Participate actively in the warm-up brainstorming; take structured notes and label diagrams; collaborate in pairs using vocabulary flashcards; solve the guided worksheet problems and present findings.`,
    assessment: `Conduct rapid oral questioning (3 questions), evaluate group worksheet accuracy, and use a 2-minute exit ticket asking students to state one key rule/concept of "${topic}" and one real-world application.`,
    homework: `Read the section on "${topic}" in ${chapter} (${board} ${subject} Textbook for ${className}). Answer Review Questions 1–3 in your neat notebook and prepare 3 flashcards of key terms.`,
    vocabulary: [
      `${topic} :: The central concept studied in ${chapter} (${subject}, ${className}).`,
      `Concept Analysis :: Breaking down a topic into fundamental components to understand how it works.`,
      `Observation :: Carefully examining facts, patterns, or phenomena to gather accurate information.`,
      `Classification :: Organizing ideas, terms, or elements into structured categories based on shared traits.`,
      `Application :: Using learned classroom knowledge to solve practical real-world problems.`,
      `Synthesis :: Combining key ideas from ${chapter} to form a complete understanding.`
    ].join('\n'),
    lifeSkills: `Critical Thinking & Problem Solving, Collaborative Teamwork, Effective Communication, Curiosity & Lifelong Learning.`,
    teacherReflection: `Most students achieved the targeted SLOs for "${topic}" within the ${duration} timeframe. Interactive visual aids and pair discussions improved engagement; slower learners will be given a 5-minute recap before the next lesson.`,
    questions,
    exercise,
    worksheetPrompt: [
      `Q1. Define "${topic}" in your own words and write two important features from ${chapter}.`,
      `Q2. Explain how "${topic}" is useful or observed in our daily environment.`,
      `Q3. Complete the diagram / visual model of "${topic}" in the Creative Drawing Box below and label at least 3 key parts.`
    ].join('\n'),
    bloomAssessment: [
      `Remembering :: Define "${topic}" and list its fundamental terms from ${chapter}. :: 2`,
      `Understanding :: Explain the main concept of "${topic}" in your own words with one example. :: 3`,
      `Applying :: How would you apply the principles of "${topic}" to solve a practical classroom or daily-life scenario? :: 3`,
      `Analyzing :: Compare and contrast the key components of "${topic}" discussed in ${chapter}. :: 4`,
      `Evaluating :: Justify why understanding "${topic}" is important for students in ${className} (${subject}). :: 4`,
      `Creating :: Design a labeled diagram, flowchart, or short summary model illustrating how "${topic}" works. :: 4`
    ].join('\n')
  };
}

app.post('/api/generate-lesson-plan', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const rateEntry = ipRequestCounts.get(clientIp);
  if (!rateEntry || now - rateEntry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipRequestCounts.set(clientIp, { count: 1, windowStart: now });
  } else {
    rateEntry.count += 1;
    if (rateEntry.count > MAX_REQUESTS_PER_IP_PER_MINUTE) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Serving cached/fallback lesson plan to protect server stability.',
      });
    }
  }

  const payload = (req.body || {}) as Partial<LessonPlanRequest>;
  const board = cleanServerField(payload.board, 'Sindh STBB', 40);
  const section = cleanServerField(payload.section, 'Primary', 40);
  const className = cleanServerField(payload.className, 'Class 5', 30);
  const subject = cleanServerField(payload.subject, 'General Science', 60);
  const chapter = cleanServerField(payload.chapter, 'Chapter 1', 100);
  const topic = cleanServerField(payload.topic, 'Introduction', 120);
  const duration = cleanServerField(payload.duration, '40 Minutes', 30);
  const planType = cleanServerField(payload.planType, 'Daily', 20);

  const cacheKey = `${board}|${section}|${className}|${subject}|${chapter}|${topic}|${duration}|${planType}`.toLowerCase();
  const cached = lessonPlanCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return res.json({
      source: cached.source,
      plan: cached.plan,
      cached: true,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const fallbackPlan = buildFallbackLessonPlan({ board, section, className, subject, chapter, topic, duration, planType });
    lessonPlanCache.set(cacheKey, { source: 'ai-fallback', plan: fallbackPlan, timestamp: now });
    return res.json({
      source: 'ai-fallback',
      plan: fallbackPlan
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are a Senior Curriculum Specialist for Pakistani Schools (${board} - Sindh Textbook Board STBB / Punjab Curriculum & Textbook Board PTB).
Generate a comprehensive, classroom-ready ${planType} Lesson Plan for:
- Board: ${board}
- Section: ${section}
- Class: ${className}
- Subject: ${subject}
- Chapter: ${chapter}
- Topic: ${topic}
- Duration: ${duration}

Formatting requirements for the JSON fields:
- slos: 4 clear Student Learning Outcomes separated by newlines (\\n).
- previousKnowledge: 2-3 specific prior-knowledge questions or warm-up checks.
- teachingAids: Specific low-cost and standard teaching aids suited for Pakistani classrooms.
- introduction: Engaging hook and topic introduction paragraph.
- procedure: 5 numbered step-by-step instructional phases separated by newlines (\\n) with time breakdown matching ${duration}.
- teacherActivities: Clear list/paragraph of teacher actions.
- studentActivities: Clear list/paragraph of student participatory activities.
- assessment: Formative classroom assessment checks.
- homework: Practical homework assignment from the textbook/notebook.
- vocabulary: Exactly 6 key terms formatted strictly as "Term :: Clear student-friendly definition" separated by newlines (\\n).
- lifeSkills: Relevant life skills and values integrated into the lesson.
- teacherReflection: Realistic post-lesson reflection notes for the teacher.
- questions: 5 Q&A comprehension questions and answers separated by newlines (\\n).
- exercise: 5 fill-in-the-blanks or sentence exercises separated by newlines (\\n).
- worksheetPrompt: 3 structured student worksheet questions separated by newlines (\\n).
- bloomAssessment: 6 assessment questions covering all 6 Bloom's Taxonomy levels, formatted strictly as "Level :: Question text :: Marks" separated by newlines (\\n), where Level is one of Remembering, Understanding, Applying, Analyzing, Evaluating, Creating.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slos: { type: Type.STRING },
            previousKnowledge: { type: Type.STRING },
            teachingAids: { type: Type.STRING },
            introduction: { type: Type.STRING },
            procedure: { type: Type.STRING },
            teacherActivities: { type: Type.STRING },
            studentActivities: { type: Type.STRING },
            assessment: { type: Type.STRING },
            homework: { type: Type.STRING },
            vocabulary: { type: Type.STRING },
            lifeSkills: { type: Type.STRING },
            teacherReflection: { type: Type.STRING },
            questions: { type: Type.STRING },
            exercise: { type: Type.STRING },
            worksheetPrompt: { type: Type.STRING },
            bloomAssessment: { type: Type.STRING },
          },
          required: [
            'slos',
            'previousKnowledge',
            'teachingAids',
            'introduction',
            'procedure',
            'teacherActivities',
            'studentActivities',
            'assessment',
            'homework',
            'vocabulary',
            'lifeSkills',
            'teacherReflection',
            'questions',
            'exercise',
            'worksheetPrompt',
            'bloomAssessment',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini model');
    }

    const parsed = JSON.parse(text);
    if (lessonPlanCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = lessonPlanCache.keys().next().value;
      if (oldestKey) lessonPlanCache.delete(oldestKey);
    }
    lessonPlanCache.set(cacheKey, { source: 'gemini-ai', plan: parsed, timestamp: Date.now() });
    return res.json({
      source: 'gemini-ai',
      plan: parsed,
    });
  } catch (error) {
    console.warn('Gemini generation encountered an issue, serving structured curriculum plan:', error);
    const fallbackPlan = buildFallbackLessonPlan({ board, section, className, subject, chapter, topic, duration, planType });
    return res.json({
      source: 'ai-fallback',
      plan: fallbackPlan,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
