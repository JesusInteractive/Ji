// Shared trivia-question insert/validation logic, used by BOTH the
// admin bulk-create route (server.js's POST /v1/admin/trivia/questions/bulk)
// and the one-off seed script (scripts/seed-trivia-questions.js) -- kept
// in one place so the rules for "seeded once at launch" and "added/edited
// later via the app" never drift apart.
const TESTAMENTS = ['old', 'new'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const CORRECT_OPTIONS = ['A', 'B', 'C'];
const REQUIRED_STRING_FIELDS = [
  'bookId',
  'testament',
  'difficulty',
  'question',
  'optionA',
  'optionB',
  'optionC',
  'correctOption',
  'reference',
];

function validateQuestion(q, index) {
  const errors = [];
  for (const field of REQUIRED_STRING_FIELDS) {
    if (!q || typeof q[field] !== 'string' || q[field].trim().length === 0) {
      errors.push(`[${index}] ${field} is required`);
    }
  }
  if (q && q.testament && !TESTAMENTS.includes(q.testament)) {
    errors.push(`[${index}] testament must be 'old' or 'new'`);
  }
  if (q && q.difficulty && !DIFFICULTIES.includes(q.difficulty)) {
    errors.push(`[${index}] difficulty must be 'easy', 'medium', or 'hard'`);
  }
  if (q && q.correctOption && !CORRECT_OPTIONS.includes(q.correctOption)) {
    errors.push(`[${index}] correctOption must be 'A', 'B', or 'C'`);
  }
  return errors;
}

function validateQuestions(questions) {
  return questions.flatMap((q, i) => validateQuestion(q, i));
}

// Single multi-row INSERT via UNNEST rather than N round-trips -- this is
// what makes seeding 1500 questions (or a 500-question admin batch) one
// query instead of hundreds.
async function bulkInsertTriviaQuestions(sql, questions) {
  const errors = validateQuestions(questions);
  if (errors.length > 0) {
    const err = new Error(
      `Invalid trivia questions: ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? ` (+${errors.length - 5} more)` : ''}`
    );
    err.validationErrors = errors;
    throw err;
  }
  const rows = await sql`
    INSERT INTO trivia_questions (book_id, testament, difficulty, question, option_a, option_b, option_c, correct_option, reference)
    SELECT * FROM UNNEST(
      ${questions.map((q) => q.bookId)}::text[],
      ${questions.map((q) => q.testament)}::text[],
      ${questions.map((q) => q.difficulty)}::text[],
      ${questions.map((q) => q.question)}::text[],
      ${questions.map((q) => q.optionA)}::text[],
      ${questions.map((q) => q.optionB)}::text[],
      ${questions.map((q) => q.optionC)}::text[],
      ${questions.map((q) => q.correctOption)}::text[],
      ${questions.map((q) => q.reference)}::text[]
    )
    RETURNING id
  `;
  return rows.map((r) => r.id);
}

module.exports = { bulkInsertTriviaQuestions, validateQuestions, validateQuestion, TESTAMENTS, DIFFICULTIES, CORRECT_OPTIONS };
