export interface LessonPlanContent {
  slos: string;
  previousKnowledge: string;
  teachingAids: string;
  introduction: string;
  procedure: string;
  teacherActivities: string;
  studentActivities: string;
  assessment: string;
  homework: string;
  vocabulary: string;
  lifeSkills: string;
  teacherReflection: string;
  questions: string;
  exercise: string;
  worksheetPrompt: string;
  bloomAssessment: string;
}

export interface SyllabusPreset extends LessonPlanContent {
  id: string;
  board: 'Sindh STBB' | 'Punjab PTB';
  section: 'Primary' | 'Middle' | 'Secondary' | 'Higher Secondary';
  className: string;
  subject: string;
  chapter: string;
  topic: string;
  duration: string;
  planType: 'Daily' | 'Weekly';
}

export const CLASS_OPTIONS_BY_SECTION: Record<string, string[]> = {
  Primary: ['KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
  Middle: ['Class 6', 'Class 7', 'Class 8'],
  Secondary: ['Class 9', 'Class 10'],
  'Higher Secondary': ['Class 11', 'Class 12'],
};

export const ALL_CLASSES = [
  'KG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
];

export const SUBJECT_OPTIONS = [
  'English',
  'Urdu',
  'Asan Urdu',
  'Sindhi',
  'Mathematics',
  'Maths',
  'Math',
  'General Knowledge',
  'General Knowledge (Urdu)',
  'Science (Urdu)',
  'General Science',
  'Social Studies',
  'Social Studies (Sindhi)',
  'Social Studies (Urdu)',
  'Muasharti Uloom',
  'Islamiat',
  'Islamiat (Urdu)',
  'Mazhabi Taleemat',
  'ECCE',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
];

export function inferSectionFromClass(
  className: string
): 'Primary' | 'Middle' | 'Secondary' | 'Higher Secondary' {
  const norm = className.trim();
  if (['KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'].includes(norm)) {
    return 'Primary';
  }
  if (['Class 6', 'Class 7', 'Class 8'].includes(norm)) {
    return 'Middle';
  }
  if (['Class 9', 'Class 10'].includes(norm)) {
    return 'Secondary';
  }
  return 'Higher Secondary';
}

/**
 * Deterministic hash function that supports full Unicode (Urdu, Sindhi, English)
 * so every topic gets a unique, deterministic Firestore document ID matching ^[a-zA-Z0-9_\-]+$
 */
function unicodeHash(str: string): string {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return combined.toString(36);
}

/**
 * Generates a deterministic, Firestore-safe document ID matching ^[a-zA-Z0-9_\-]+$ and length <= 128
 * Preserves uniqueness even when Chapter/Topic are in Urdu or Sindhi script.
 */
export function getSyllabusDocId(
  board: string,
  className: string,
  subject: string,
  chapter: string,
  topic: string
): string {
  const normBoard = (board || 'Sindh STBB').trim().toLowerCase();
  const normClass = (className || '').trim().toLowerCase();
  const normSubject = (subject || '').trim().toLowerCase();
  const normChapter = (chapter || '').trim().toLowerCase();
  const normTopic = (topic || '').trim().toLowerCase();

  const hash = unicodeHash(`${normBoard}|${normClass}|${normSubject}|${normChapter}|${normTopic}`);
  const asciiPrefix = `${normClass}_${normSubject}_${normTopic}`
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);

  return `${asciiPrefix || 'syllabus'}_${hash}`.slice(0, 120);
}

/**
 * Sanitizes and truncates outgoing payload fields to strictly satisfy firebase-blueprint.json & firestore.rules
 */
export function sanitizeLessonPlanForFirestore(
  meta: {
    board: 'Sindh STBB' | 'Punjab PTB';
    section: 'Primary' | 'Middle' | 'Secondary' | 'Higher Secondary';
    className: string;
    subject: string;
    chapter: string;
    topic: string;
    duration: string;
    planType: 'Daily' | 'Weekly';
  },
  content: LessonPlanContent,
  authorId: string
) {
  const clamp = (val: string | undefined, max: number, fallback: string) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return fallback;
    return trimmed.slice(0, max);
  };

  return {
    board: meta.board === 'Punjab PTB' ? 'Punjab PTB' : 'Sindh STBB',
    section: ['Primary', 'Middle', 'Secondary', 'Higher Secondary'].includes(meta.section)
      ? meta.section
      : inferSectionFromClass(meta.className),
    className: clamp(meta.className, 30, 'Class 1'),
    subject: clamp(meta.subject, 100, 'Urdu'),
    chapter: clamp(meta.chapter, 200, 'Unit 1'),
    topic: clamp(meta.topic, 200, 'Lesson 1'),
    duration: clamp(meta.duration, 50, '40 Minutes'),
    planType: meta.planType === 'Weekly' ? 'Weekly' : 'Daily',
    slos: clamp(content.slos, 3000, 'Achieve core curriculum learning outcomes.'),
    previousKnowledge: clamp(content.previousKnowledge, 2000, 'Review prior class concepts.'),
    teachingAids: clamp(content.teachingAids, 2000, 'Textbook, whiteboard, markers, charts.'),
    introduction: clamp(content.introduction, 3000, 'Introduce the topic with real-life examples.'),
    procedure: clamp(content.procedure, 5000, 'Step 1: Warm-up.\nStep 2: Explanation.\nStep 3: Activity.'),
    teacherActivities: clamp(content.teacherActivities, 3000, 'Explain concepts and guide students.'),
    studentActivities: clamp(content.studentActivities, 3000, 'Participate in group discussion and worksheet.'),
    assessment: clamp(content.assessment, 3000, 'Oral and written formative check.'),
    homework: clamp(content.homework, 2000, 'Complete textbook review questions.'),
    vocabulary: clamp(content.vocabulary, 4000, 'Concept :: Fundamental idea of the lesson'),
    lifeSkills: clamp(content.lifeSkills, 2000, 'Critical thinking and collaboration.'),
    teacherReflection: clamp(content.teacherReflection, 2000, 'Students engaged well with visual aids.'),
    questions: clamp(content.questions, 4000, 'Review questions from the lesson.'),
    exercise: clamp(content.exercise, 4000, 'Complete textbook exercises.'),
    worksheetPrompt: clamp(content.worksheetPrompt, 4000, 'Answer the questions and draw a labeled diagram.'),
    bloomAssessment: clamp(
      content.bloomAssessment,
      4000,
      'Remembering :: Define the main term. :: 2\nUnderstanding :: Explain with an example. :: 3'
    ),
    visibility: 'public',
    authorId: authorId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128) || 'teacher_user',
  };
}

export function parseVocabularyList(vocabString: string): Array<{ term: string; definition: string }> {
  const raw = (vocabString || '').trim();
  if (!raw) return [];

  // Check if formatted with numbered "1. Term = Meaning 2. Term = Meaning" on single or multiple lines
  if (/\d+\.\s*[^=]+=[^0-9]+/.test(raw) && !raw.includes('::')) {
    const matches = raw.split(/(?=\d+\.\s)/).map((s) => s.trim()).filter(Boolean);
    const parsedItems: Array<{ term: string; definition: string }> = [];
    for (const item of matches) {
      const cleaned = item.replace(/^\d+\.\s*/, '').trim();
      if (cleaned.includes('=')) {
        const [t, ...rest] = cleaned.split('=');
        parsedItems.push({
          term: t.trim(),
          definition: rest.join('=').trim(),
        });
      } else if (cleaned.includes(':')) {
        const [t, ...rest] = cleaned.split(':');
        parsedItems.push({
          term: t.trim(),
          definition: rest.join(':').trim(),
        });
      }
    }
    if (parsedItems.length > 0) return parsedItems;
  }

  const lines = raw
    .split(/\n|\|/)
    .map((l) => l.trim())
    .filter(Boolean);

  // If single line with comma/Arabic-comma separated words (e.g., "الف، ب، ٻ، نقطو، اکر")
  if (lines.length === 1 && !lines[0].includes('::') && !lines[0].includes('=')) {
    const tokens = lines[0]
      .split(/[,،|]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length > 1) {
      return tokens.map((token, idx) => ({
        term: token,
        definition: `Key curriculum vocabulary term #${idx + 1} from this lesson.`,
      }));
    }
  }

  return lines.map((line, idx) => {
    if (line.includes('::')) {
      const [term, ...rest] = line.split('::');
      return {
        term: term.replace(/^\d+[\.\)]\s*/, '').trim() || `Term ${idx + 1}`,
        definition: rest.join('::').trim() || 'Key term from lesson.',
      };
    }
    if (line.includes('=')) {
      const [term, ...rest] = line.split('=');
      return {
        term: term.replace(/^\d+[\.\)]\s*/, '').trim() || `Term ${idx + 1}`,
        definition: rest.join('=').trim() || 'Key term from lesson.',
      };
    }
    if (line.includes(':')) {
      const [term, ...rest] = line.split(':');
      return {
        term: term.replace(/^\d+[\.\)]\s*/, '').trim() || `Term ${idx + 1}`,
        definition: rest.join(':').trim() || 'Key term from lesson.',
      };
    }
    return {
      term: line.replace(/^\d+[\.\)]\s*/, '').trim() || `Key Term ${idx + 1}`,
      definition: 'Key vocabulary term from textbook lesson.',
    };
  });
}

export interface BloomQuestion {
  level: string;
  question: string;
  marks: number;
}

export function parseBloomAssessment(bloomString: string): BloomQuestion[] {
  const lines = (bloomString || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const defaultLevels = [
    'Remembering (تذکر / یادداشت)',
    'Understanding (تفہیم / سمجھ)',
    'Applying (اطلاق / استعمال)',
    'Analyzing (تجزیہ)',
    'Evaluating (جائزہ / قدر پیمائی)',
    'Creating (تخلیق)',
  ];

  return lines.map((line, idx) => {
    const parts = line.split('::').map((p) => p.trim());
    if (parts.length >= 3) {
      return {
        level: parts[0] || defaultLevels[idx % defaultLevels.length],
        question: parts[1] || line,
        marks: Number(parts[2]) || 3,
      };
    }
    if (parts.length === 2) {
      return {
        level: parts[0] || defaultLevels[idx % defaultLevels.length],
        question: parts[1],
        marks: 3,
      };
    }
    return {
      level: defaultLevels[idx % defaultLevels.length],
      question: line,
      marks: 3,
    };
  });
}

export const STBB_SYLLABUS_PRESETS: SyllabusPreset[] = [];
