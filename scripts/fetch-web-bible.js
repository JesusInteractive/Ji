#!/usr/bin/env node
// One-off build-time script -- NOT part of the running app, same category
// as backend/scripts/*.js. Run manually by a developer to (re)generate the
// bundled World English Bible dataset the Jesus Interactive Bible Games
// feature reads from at runtime, entirely offline.
//
// Source: the same public API src/services/bibleApi.ts already uses for
// live per-chapter fetches (https://bible.helloao.org), but here via its
// single-request "complete.simple.json" endpoint for translation id
// ENGWEBP (shortName "WEB", the standard public-domain World English
// Bible -- confirmed against the live /api/available_translations.json
// list, which also has eng_web/eng_webc/eng_webpb/eng_webu variants;
// ENGWEBP is the plain WEB, not the Classic/Catholic/British/Updated
// editions). One ~6.8MB download instead of ~1,189 individual chapter
// requests.
//
// Writes:
//   src/data/web-bible/{BOOKID}.json  x66 -- per-book verse text
//   src/data/bible-word-index.json    -- normalizedWord -> [{b,c,v}, ...]
//   src/data/scrabble-vocabulary.json -- flat sorted unique game-legal words
//
// Usage: node scripts/fetch-web-bible.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const TRANSLATION_ID = 'ENGWEBP';
const SOURCE_URL = `https://bible.helloao.org/api/${TRANSLATION_ID}/complete.simple.json`;
const REPO_ROOT = path.join(__dirname, '..');
const WEB_BIBLE_DIR = path.join(REPO_ROOT, 'src', 'data', 'web-bible');
const WORD_INDEX_PATH = path.join(REPO_ROOT, 'src', 'data', 'bible-word-index.json');
const VOCAB_PATH = path.join(REPO_ROOT, 'src', 'data', 'scrabble-vocabulary.json');

// First 39 books in the standard 66-book Protestant canon order (which
// matches this API's own book order exactly, per the fetched book list)
// are Old Testament; the remaining 27 are New Testament. No separate
// testament field exists on the source data, so this position-based
// split is the simplest reliable derivation.
const OT_BOOK_COUNT = 39;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJson(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Request failed: ${res.statusCode} ${url}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Lowercase, strip everything but letters and internal apostrophes, then
// drop the apostrophes too -- "God's" and "Gods" both index as "gods".
// Keeps the word-index and Scrabble vocabulary using the exact same
// normalization so a Crossword/Wordle answer is always a legal Scrabble
// play too.
function normalizeWord(raw) {
  return raw.toLowerCase().replace(/[^a-z']/g, '').replace(/'/g, '');
}

function extractWords(text) {
  return text.split(/[\s—–-]+/).map(normalizeWord).filter((w) => w.length > 0);
}

async function main() {
  console.log(`Fetching ${SOURCE_URL} ...`);
  const data = await fetchJson(SOURCE_URL);
  const books = data.books;
  if (!Array.isArray(books) || books.length !== 66) {
    throw new Error(`Expected 66 books, got ${books ? books.length : 'none'}`);
  }

  fs.mkdirSync(WEB_BIBLE_DIR, { recursive: true });

  const wordIndex = new Map(); // normalizedWord -> [{b,c,v}, ...]
  const vocabulary = new Set();

  books.forEach((book, bookIndex) => {
    const testament = bookIndex < OT_BOOK_COUNT ? 'OT' : 'NT';
    const chapters = book.chapters.map((chapterWrap) => {
      const chapter = chapterWrap.chapter;
      const verses = chapter.content
        .filter((item) => item.type === 'verse')
        .map((v) => ({ number: v.number, text: v.text }));

      verses.forEach((v) => {
        extractWords(v.text).forEach((word) => {
          if (word.length < 2) return; // single letters aren't useful in any game
          vocabulary.add(word);
          let refs = wordIndex.get(word);
          if (!refs) {
            refs = [];
            wordIndex.set(word, refs);
          }
          refs.push({ b: book.id, c: chapter.number, v: v.number });
        });
      });

      return { number: chapter.number, verses };
    });

    const bookOut = {
      id: book.id,
      name: book.name,
      commonName: book.commonName,
      testament,
      order: bookIndex + 1,
      chapters,
    };
    fs.writeFileSync(
      path.join(WEB_BIBLE_DIR, `${book.id}.json`),
      JSON.stringify(bookOut)
    );
    console.log(`  wrote ${book.id}.json (${chapters.length} chapters)`);
  });

  const wordIndexOut = {};
  for (const [word, refs] of wordIndex) wordIndexOut[word] = refs;
  fs.writeFileSync(WORD_INDEX_PATH, JSON.stringify(wordIndexOut));
  console.log(`Wrote word index: ${wordIndex.size} unique words -> ${WORD_INDEX_PATH}`);

  // Scrabble-legal vocabulary: letters-only words already guaranteed by
  // normalizeWord, length-capped to fit a 15x15 board (the longest single
  // play on a 15-wide board is 15 letters).
  const vocabArray = Array.from(vocabulary)
    .filter((w) => w.length >= 2 && w.length <= 15)
    .sort();
  fs.writeFileSync(VOCAB_PATH, JSON.stringify(vocabArray));
  console.log(`Wrote Scrabble vocabulary: ${vocabArray.length} unique words -> ${VOCAB_PATH}`);

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
