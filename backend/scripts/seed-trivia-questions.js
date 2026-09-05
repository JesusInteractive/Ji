// One-time (re-run-safe) seed script -- NOT part of the running server.
// Loads every backend/scripts/trivia-seed-data/*.json file and inserts
// them directly into Postgres via the same db.js/lib/triviaInsert.js the
// server itself uses, bypassing HTTP/DEVELOPER_TOKEN entirely since this
// runs with direct database access as a local one-off, not as an API
// caller. Safe to re-run: each run just adds more rows (there's no
// unique constraint on question text), so don't re-run against a
// database that's already been seeded unless you want duplicates -- this
// intentionally does NOT dedupe, since editing/adding questions going
// forward goes through the admin API (see server.js's
// POST /v1/admin/trivia/questions/bulk), not this script.
//
// Run:
//   cd backend && node scripts/seed-trivia-questions.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sql, ensureSchema, hasDatabase } = require('../db');
const { bulkInsertTriviaQuestions } = require('../lib/triviaInsert');

async function main() {
  if (!hasDatabase) {
    console.error('DATABASE_URL is not set -- cannot seed.');
    process.exit(1);
  }
  await ensureSchema();

  const dir = path.join(__dirname, 'trivia-seed-data');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  if (files.length === 0) {
    console.error(`No .json files found in ${dir}`);
    process.exit(1);
  }

  let total = 0;
  for (const file of files) {
    const questions = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (!Array.isArray(questions) || questions.length === 0) {
      console.warn(`Skipping ${file} -- not a non-empty array`);
      continue;
    }
    const ids = await bulkInsertTriviaQuestions(sql, questions);
    total += ids.length;
    console.log(`Inserted ${ids.length} from ${file}`);
  }
  console.log(`Done -- ${total} questions total.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
