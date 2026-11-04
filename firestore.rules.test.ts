/**
 * Firestore Security Rules Specification Test Suite
 * Verifies that all "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

const VALID_BASE_PAYLOAD = {
  board: 'Sindh STBB',
  section: 'Primary',
  className: 'Class 5',
  subject: 'General Science',
  chapter: 'Chapter 1: Classification of Living Things',
  topic: 'Five Kingdom System',
  duration: '40 Minutes',
  planType: 'Daily',
  slos: 'Students will be able to classify living organisms into five kingdoms.',
  previousKnowledge: 'Ask students to name living and non-living things around the classroom.',
  teachingAids: 'Textbook, chart of five kingdoms, flashcards, whiteboard.',
  introduction: 'Show specimens/pictures of plants, animals, fungi, and bacteria.',
  procedure: 'Step 1: Introduce classification.\nStep 2: Explain each kingdom.',
  teacherActivities: 'Present chart and explain characteristics of Monera, Protista, Fungi, Plantae, Animalia.',
  studentActivities: 'Group sorting activity using organism flashcards.',
  assessment: 'Match each organism to its respective kingdom.',
  homework: 'Draw and label two examples each of Plantae and Animalia in notebook.',
  vocabulary: 'Classification :: Grouping organisms based on similarities\nKingdom :: Highest taxonomic rank',
  lifeSkills: 'Observation, scientific curiosity, environmental stewardship.',
  teacherReflection: 'Students actively participated in the flashcard sorting activity.',
  questions: '1. What is classification?\n2. Name the five kingdoms.',
  exercise: '1. Fill in the blanks.\n2. Match the organism to its kingdom.',
  worksheetPrompt: 'Fill in the blanks and draw a labeled plant cell in the box.',
  bloomAssessment: 'Remembering :: Define classification. :: 2\nUnderstanding :: Differentiate between Fungi and Plantae. :: 3',
  visibility: 'public',
  authorId: 'teacher_uid_01',
  createdAt: 'REQUEST_TIME',
  updatedAt: 'REQUEST_TIME',
};

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection',
    operation: 'create',
    path: '/syllabus_data/stbb_c5_sci_ch1',
    auth: { uid: 'teacher_uid_01', email: 'teacher@seld.gos.pk', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, ghostField: 'injected' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Identity Spoofing on Create',
    operation: 'create',
    path: '/syllabus_data/stbb_c5_sci_ch1',
    auth: { uid: 'teacher_uid_01', email: 'teacher@seld.gos.pk', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, authorId: 'spoofed_uid_99' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Email Write',
    operation: 'create',
    path: '/syllabus_data/stbb_c5_sci_ch1',
    auth: { uid: 'teacher_uid_01', email: 'teacher@seld.gos.pk', email_verified: false },
    payload: VALID_BASE_PAYLOAD,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'ID Poisoning Attack',
    operation: 'create',
    path: '/syllabus_data/bad$id*with!invalid@chars',
    auth: { uid: 'teacher_uid_01', email: 'teacher@seld.gos.pk', email_verified: true },
    payload: VALID_BASE_PAYLOAD,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Denial-of-Wallet String Overflow',
    operation: 'create',
    path: '/syllabus_data/stbb_c5_sci_ch1',
    auth: { uid: 'teacher_uid_01', email: 'teacher@seld.gos.pk', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, procedure: 'A'.repeat(5001) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Enum Bypass Attack',
    operation: 'create',
    path: '/syllabus_data/stbb_c5_sci_ch1',
    auth: { uid: 'teacher_uid_01', email: 'teacher@seld.gos.pk', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, board: 'Invalid Board' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Timestamp Forgery on Create',
    operation: 'create',
    path: '/syllabus_data/stbb_c5_sci_ch1',
    auth: { uid: 'teacher_uid_01', email: 'teacher@seld.gos.pk', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Ownership Hijack on Update',
    operation: 'update',
    path: '/syllabus_data/stbb_c5_sci_ch1',
    auth: { uid: 'teacher_uid_01', email: 'teacher@seld.gos.pk', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, authorId: 'attacker_uid_02' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Immortal Field Mutation (createdAt)',
    operation: 'update',
    path: '/syllabus_data/stbb_c5_sci_ch1',
    auth: { uid: 'teacher_uid_01', email: 'teacher@seld.gos.pk', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, createdAt: '2026-10-27T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Value Poisoning on Update',
    operation: 'update',
    path: '/syllabus_data/stbb_c5_sci_ch1',
    auth: { uid: 'teacher_uid_01', email: 'teacher@seld.gos.pk', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, slos: '' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Private Document Read Leak',
    operation: 'get',
    path: '/syllabus_data/private_doc_01',
    auth: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unauthorized Delete by Non-Owner',
    operation: 'delete',
    path: '/syllabus_data/stbb_c5_sci_ch1',
    auth: { uid: 'other_teacher_99', email: 'other@seld.gos.pk', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];
