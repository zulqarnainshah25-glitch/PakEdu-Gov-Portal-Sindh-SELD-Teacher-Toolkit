import {
  SyllabusPreset,
  getSyllabusDocId,
  inferSectionFromClass,
} from './syllabusPresets';

interface FormResponseEntry {
  className: string;
  subject: string;
  topic: string;
  wordMeanings: string;
  qa: string;
  otherExercises: string;
}

function cleanText(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/\[span_\d+\]\(start_span\)/g, '')
    .replace(/\[span_\d+\]\(end_span\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKey(str: string): string {
  return cleanText(str).toLowerCase().replace(/\s+/g, ' ');
}

function formatListItems(raw: string): string {
  const cleaned = cleanText(raw);
  if (!cleaned) return '';
  // Split on pipe `|` or ` , ` used as list separators in the Google Sheet
  const parts = cleaned
    .split(/\s*\|\s*|\s+,\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.join('\n');
}

function formatWordMeaningsToVocabulary(
  wordMeanings: string,
  sheetVocab: string
): string {
  const wm = cleanText(wordMeanings);
  const sv = cleanText(sheetVocab);

  const lines: string[] = [];

  if (wm && wm !== 'Test Data') {
    // Split numbered items like "1. نام = اسم 2. عمر = سال"
    const numberedParts = wm
      .split(/(?=\d+\.\s)/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (numberedParts.length > 1) {
      for (const part of numberedParts) {
        const stripped = part.replace(/^\d+\.\s*/, '').trim();
        if (stripped.includes('=')) {
          const [term, ...rest] = stripped.split('=');
          lines.push(`${term.trim()} :: ${rest.join('=').trim()}`);
        } else if (stripped.includes(':')) {
          const [term, ...rest] = stripped.split(':');
          lines.push(`${term.trim()} :: ${rest.join(':').trim()}`);
        } else if (stripped) {
          lines.push(stripped);
        }
      }
    } else {
      lines.push(wm);
    }
  }

  if (sv) {
    const tokens = sv
      .split(/\s*\|\s*|\s*,\s*|\s*،\s*/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      for (const token of tokens) {
        lines.push(`${token} :: کلیدی لفظ / Key Vocabulary Term`);
      }
    } else if (tokens.length > 0) {
      lines.push(`Key Terms :: ${tokens.join(' ، ')}`);
    }
  }

  return lines.join('\n') || 'Key Term :: Curriculum vocabulary item';
}

function formatQuestionsAndQA(sheetQuestions: string, formQA: string): string {
  const sq = formatListItems(sheetQuestions);
  const fqa = cleanText(formQA);

  const combined: string[] = [];
  if (fqa && fqa !== 'Test Data') {
    const numbered = fqa
      .split(/(?=\d+\.\s)/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (numbered.length > 1) {
      combined.push(...numbered);
    } else {
      combined.push(fqa);
    }
  }
  if (sq) {
    combined.push(...sq.split('\n').filter(Boolean));
  }
  return combined.join('\n') || 'آج ہم نے کیا سیکھا؟ / What did we learn today?';
}

function formatExercisesAndWorksheet(
  sheetExercise: string,
  formOtherExercises: string,
  questionsText: string,
  topic: string
): { exercise: string; worksheetPrompt: string } {
  const se = cleanText(sheetExercise);
  const foe = cleanText(formOtherExercises);

  const items: string[] = [];
  if (foe && foe !== 'Test Dat' && foe !== 'Test Data') {
    const numbered = foe
      .split(/(?=\d+\.\s)/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (numbered.length > 1) {
      items.push(...numbered);
    } else {
      items.push(foe);
    }
  }
  if (se && se !== '-') {
    items.push(se);
  }

  const exerciseStr =
    items.join('\n') ||
    questionsText.split('\n').slice(0, 3).join('\n') ||
    `Complete the textbook exercise for "${topic}".`;

  const worksheetLines = items.length > 0 ? items : questionsText.split('\n').slice(0, 4);
  return {
    exercise: exerciseStr,
    worksheetPrompt: worksheetLines.join('\n') || `Answer the questions on "${topic}".`,
  };
}

function buildBloomFromQuestions(questionsText: string, assessmentText: string): string {
  const levels = [
    'Remembering (تذکر)',
    'Understanding (تفہیم)',
    'Applying (اطلاق)',
    'Analyzing (تجزیہ)',
    'Evaluating (قدر پیمائی)',
    'Creating (تخلیق)',
  ];

  const lines = questionsText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0 && assessmentText) {
    lines.push(assessmentText);
  }

  return lines
    .slice(0, 6)
    .map((q, idx) => `${levels[idx % levels.length]} :: ${q} :: ${idx < 2 ? 2 : 4}`)
    .join('\n');
}

let cachedSyllabusList: SyllabusPreset[] | null = null;

/**
 * Loads and parses both attached Google Sheet TSV files:
 * 1. /assets/aistudio/Lesson_Planner_-_Sheet1_4b6f0681.tsv
 * 2. /assets/aistudio/Lesson_Planner_-_Form_Responses_1_d17b9ca8.tsv
 */
export async function loadGoogleSheetSyllabusData(): Promise<SyllabusPreset[]> {
  if (cachedSyllabusList && cachedSyllabusList.length > 0) {
    return cachedSyllabusList;
  }

  const [sheet1Res, formRes] = await Promise.all([
    fetch('/assets/aistudio/Lesson_Planner_-_Sheet1_4b6f0681.tsv'),
    fetch('/assets/aistudio/Lesson_Planner_-_Form_Responses_1_d17b9ca8.tsv'),
  ]);

  const [sheet1Text, formText] = await Promise.all([
    sheet1Res.text(),
    formRes.text(),
  ]);

  // 1. Parse Form_Responses_1 TSV
  const formByExactKey = new Map<string, FormResponseEntry>();
  const formByClassTopicKey = new Map<string, FormResponseEntry>();
  const matchedFormKeys = new Set<string>();

  const formLines = formText.split(/\r?\n/);
  for (let i = 1; i < formLines.length; i++) {
    const line = formLines[i];
    if (!line || !line.trim()) continue;
    const cols = line.split('\t');
    const className = cleanText(cols[1]);
    const subject = cleanText(cols[2]);
    const topic = cleanText(cols[3]);
    const wordMeanings = cleanText(cols[4]);
    const qa = cleanText(cols[5]);
    const otherExercises = cleanText(cols[6]);

    if (!className || !subject || !topic) continue;
    if (topic === '[Reserved/Spacing]') continue;
    if (wordMeanings === 'Test Data' && qa === 'Test Data') continue;

    const entry: FormResponseEntry = {
      className,
      subject,
      topic,
      wordMeanings,
      qa,
      otherExercises,
    };

    const exactKey = `${normalizeKey(className)}__${normalizeKey(subject)}__${normalizeKey(topic)}`;
    const classTopicKey = `${normalizeKey(className)}__${normalizeKey(topic)}`;

    formByExactKey.set(exactKey, entry);
    formByClassTopicKey.set(classTopicKey, entry);
  }

  // 2. Parse Sheet1 TSV
  const results: SyllabusPreset[] = [];
  const seenIds = new Set<string>();

  const sheet1Lines = sheet1Text.split(/\r?\n/);
  for (let i = 1; i < sheet1Lines.length; i++) {
    const line = sheet1Lines[i];
    if (!line || !line.trim()) continue;
    const cols = line.split('\t');

    const className = cleanText(cols[0]);
    const subject = cleanText(cols[1]);
    const chapter = cleanText(cols[2]);
    const topic = cleanText(cols[3]);

    // Skip repeated header rows embedded in Sheet1
    if (!className || !subject || !topic) continue;
    if (className === 'Class' || subject === 'Subject' || topic === 'Topic') continue;
    if (topic === '[Reserved/Spacing]' || cleanText(cols[4]) === '-') continue;

    const exactKey = `${normalizeKey(className)}__${normalizeKey(subject)}__${normalizeKey(topic)}`;
    const classTopicKey = `${normalizeKey(className)}__${normalizeKey(topic)}`;

    const formMatch =
      formByExactKey.get(exactKey) || formByClassTopicKey.get(classTopicKey);
    if (formMatch) {
      const matchedKey = `${normalizeKey(formMatch.className)}__${normalizeKey(formMatch.subject)}__${normalizeKey(formMatch.topic)}`;
      matchedFormKeys.add(matchedKey);
    }

    const slos = formatListItems(cols[4]) || `${topic} کے بنیادی تصورات سمجھ سکیں۔`;
    const previousKnowledge =
      cleanText(cols[5]) || 'طلبہ اس موضوع سے متعلق بنیادی معلومات رکھتے ہیں۔';
    const teachingAids =
      formatListItems(cols[6]) || 'درسی کتاب، تختہ سیاہ، چاک، چارٹ۔';
    const introduction =
      cleanText(cols[7]) ||
      'بچوں سے پچھلا سبق دہرائیں اور آج کے نئے موضوع کا تعارف کروائیں۔';
    const procedure =
      formatListItems(cols[8]) ||
      'سبق کی بلند خوانی اور اہم نکات کی وضاحت۔\nمشکل الفاظ کے معنی اور مشق۔';
    const teacherActivities =
      cleanText(cols[9]) ||
      'استاد واضح آواز میں پڑھائے گا اور بورڈ کی مدد سے وضاحت کرے گا۔';
    const studentActivities =
      cleanText(cols[10]) ||
      'طلبہ غور سے سنیں گے، پڑھیں گے اور مشق کے سوالات حل کریں گے۔';
    const assessment =
      cleanText(cols[11]) || 'زبانی اور تحریری سوالات کے ذریعے جائزہ۔';
    const homework =
      cleanText(cols[12]) || 'مشق کے سوالات اپنی کاپی پر حل کر کے لائیں۔';
    const teacherReflection =
      cleanText(cols[13]) ||
      'طلبہ نے اس سبق میں گہری دلچسپی لی اور نئی معلومات حاصل کیں۔';
    const rawQuestions = cols[14] || '';
    const rawVocab = cols[15] || '';
    const lifeSkills =
      formatListItems(cols[16]) || 'علم کا عملی استعمال اور اخلاقی تربیت۔';
    const rawExercise = cols[17] || '';

    const vocabulary = formatWordMeaningsToVocabulary(
      formMatch?.wordMeanings || '',
      rawVocab
    );
    const questions = formatQuestionsAndQA(rawQuestions, formMatch?.qa || '');
    const { exercise, worksheetPrompt } = formatExercisesAndWorksheet(
      rawExercise,
      formMatch?.otherExercises || '',
      questions,
      topic
    );
    const bloomAssessment = buildBloomFromQuestions(questions, assessment);

    const board: 'Sindh STBB' | 'Punjab PTB' = 'Sindh STBB';
    const section = inferSectionFromClass(className);
    const id = getSyllabusDocId(board, className, subject, chapter || 'Unit 1', topic);

    if (!seenIds.has(id)) {
      seenIds.add(id);
      results.push({
        id,
        board,
        section,
        className,
        subject,
        chapter: chapter || `${subject} - ${topic}`,
        topic,
        duration: '40 Minutes',
        planType: 'Daily',
        slos,
        previousKnowledge,
        teachingAids,
        introduction,
        procedure,
        teacherActivities,
        studentActivities,
        assessment,
        homework,
        vocabulary,
        lifeSkills,
        teacherReflection,
        questions,
        exercise,
        worksheetPrompt,
        bloomAssessment,
      });
    }
  }

  // 3. Also include any remaining rows from Form_Responses_1 that were not in Sheet1
  for (const [exactKey, entry] of formByExactKey.entries()) {
    if (matchedFormKeys.has(exactKey)) continue;

    const { className, subject, topic, wordMeanings, qa, otherExercises } = entry;
    const chapter = `${subject} (${className})`;
    const board: 'Sindh STBB' | 'Punjab PTB' = 'Sindh STBB';
    const section = inferSectionFromClass(className);
    const id = getSyllabusDocId(board, className, subject, chapter, topic);

    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const vocabulary = formatWordMeaningsToVocabulary(wordMeanings, '');
    const questions = formatQuestionsAndQA('', qa);
    const { exercise, worksheetPrompt } = formatExercisesAndWorksheet(
      '',
      otherExercises,
      questions,
      topic
    );
    const bloomAssessment = buildBloomFromQuestions(questions, qa);

    const isSindhi = subject.toLowerCase().includes('sindhi');
    const isEnglish =
      subject.toLowerCase().includes('english') &&
      !/[\u0600-\u06FF]/.test(qa);

    results.push({
      id,
      board,
      section,
      className,
      subject,
      chapter,
      topic,
      duration: '40 Minutes',
      planType: 'Daily',
      slos: isSindhi
        ? `شاگرد "${topic}" جا بنيادي تصور، نوان لفظ ۽ سوال جواب سمجهي ۽ لکي سگهندا.`
        : isEnglish
        ? `Students will be able to understand "${topic}", learn key vocabulary meanings, and answer comprehension questions.`
        : `طلبہ سبق "${topic}" کے بنیادی تصورات، الفاظ معنی اور سوالات کے جوابات سمجھ کر لکھ سکیں گے۔`,
      previousKnowledge: isSindhi
        ? 'شاگرد اڳ ۾ سيکاريل سبق ۽ بنيادي ڄاڻ رکن ٿا.'
        : isEnglish
        ? 'Students have basic familiarity with the topic from daily life.'
        : 'طلبہ اس موضوع سے متعلق بنیادی معلومات رکھتے ہیں۔',
      teachingAids: isSindhi
        ? 'درسي ڪتاب، وائٹ بورڊ، مارڪر، چارٽ ۽ فليش ڪارڊ.'
        : isEnglish
        ? 'Textbook, Whiteboard, Markers, Flashcards, Charts.'
        : 'درسی کتاب، وائٹ بورڈ، مارکر، چارٹ اور فلیش کارڈز۔',
      introduction: isSindhi
        ? `ٻارن کان پويون سبق پڇو ۽ اڄ جي نئين موضوع "${topic}" جو تعارف ڪرايو.`
        : isEnglish
        ? `Greet the students, ask warm-up questions, and introduce today's topic "${topic}".`
        : `بچوں کی توجہ مرکوز کروائیں، پچھلا سبق دہرائیں اور آج کے عنوان "${topic}" کا تعارف کروائیں۔`,
      procedure: isSindhi
        ? `1. سبق "${topic}" جي بلند خواني ۽ وضاحت.\n2. نون لفظن جي معنيٰ بورڊ تي لکڻ.\n3. سوالن جا جواب ۽ مشق حل ڪرائڻ.`
        : isEnglish
        ? `1. Read the lesson "${topic}" aloud with clear pronunciation.\n2. Explain word meanings on the board.\n3. Guide students through Q&A and exercises.`
        : `1. سبق "${topic}" کی درست تلفظ کے ساتھ بلند خوانی اور وضاحت۔\n2. مشکل الفاظ کے معنی تختہ سیاہ پر لکھوانا۔\n3. سوالات کے جوابات اور مشقی سرگرمیاں حل کروانا۔`,
      teacherActivities: isSindhi
        ? 'استاد صاف آواز ۾ تلفظ سيکاريندو ۽ بورڊ تي لفظن جي معنيٰ ۽ سوال سمجهائيندو.'
        : isEnglish
        ? 'The teacher will model pronunciation, explain word meanings on the board, and guide exercise completion.'
        : 'استاد واضح آواز میں پڑھائے گا اور بورڈ پر الفاظ معنی اور سوالات کی وضاحت کرے گا۔',
      studentActivities: isSindhi
        ? 'شاگرد ڌيان سان ٻڌندا، لفظن جي معنيٰ ياد ڪندا ۽ مشق حل ڪندا.'
        : isEnglish
        ? 'Students will read the text, practice vocabulary meanings, and complete the exercises in notebooks.'
        : 'طلبہ غور سے سنیں گے، الفاظ کے معنی یاد کریں گے اور مشق حل کریں گے۔',
      assessment: questions.split('\n').slice(0, 3).join('\n') || 'زبانی اور تحریری سوالات۔',
      homework: isSindhi
        ? `سبق "${topic}" جا لفظ معنيٰ ۽ سوال جواب ڪاپي تي لکي اچو.`
        : isEnglish
        ? `Write the word meanings and Q&A of "${topic}" neatly in your notebook.`
        : `سبق "${topic}" کے الفاظ معنی اور سوالات کے جوابات کاپی پر خوش خط لکھ کر لائیں۔`,
      vocabulary,
      lifeSkills: isSindhi
        ? 'علم جي سکيا ۽ روزمره زندگي ۾ ان جو عملي استعمال.'
        : isEnglish
        ? 'Communication skills, vocabulary building, and practical application.'
        : 'روزمرہ زندگی میں علم کا عملی استعمال اور اخلاقی تربیت۔',
      teacherReflection: isSindhi
        ? 'ٻارن هن سبق ۾ دلچسپي ورتي ۽ نوان لفظ ۽ سوال جواب سکيا.'
        : isEnglish
        ? 'Students actively participated and learned the vocabulary and Q&A effectively.'
        : 'بچوں نے اس سبق میں دلچسپی لی اور الفاظ معنی و سوالات کے جوابات سیکھے۔',
      questions,
      exercise,
      worksheetPrompt,
      bloomAssessment,
    });
  }

  cachedSyllabusList = results;
  return results;
}
