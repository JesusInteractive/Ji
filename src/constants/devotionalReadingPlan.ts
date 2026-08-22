// A real, deterministic 365-day Bible reading plan (Genesis -> Revelation)
// for the Daily Devotions feature -- computed from actual canonical
// chapter counts below, not hand-typed day-by-day. See
// services/devotions.ts for how each day's actual devotional text
// (reflection + prayer) gets generated -- it is NOT stored here or
// anywhere in this file; this file only maps day-of-year -> a specific
// passage reference.
//
// WHY GENERATED, NOT WRITTEN: 3 years x 365 days = 1,095 devotions is
// roughly 150,000+ words of original devotional writing -- not something
// that can be hand-authored with real theological care and genuine
// non-repetitiveness in one pass. Instead, each day's reflection/prayer
// is generated on demand through the app's existing AI backend (the same
// Anthropic integration ChatScreen already uses), using this file's
// passage reference plus a per-year "lens" (see YEAR_LENSES in
// services/devotions.ts) so the same passage reads genuinely differently
// across the 3-year rotation -- and cached locally once generated (see
// services/devotions.ts) rather than regenerated on every view.
//
// Book IDs match backend/services/bibleApi.ts's existing convention
// (standard USFM 3-letter codes, e.g. 'GEN', 'REV') so a day's passage
// can be fetched as real scripture text via the same getChapter() call
// Scripture screen already uses -- no separate/duplicated verse text
// lives in this app; only the reference does.

export interface BibleBookMeta {
  id: string;
  name: string;
  chapters: number;
}

// Standard Protestant 66-book canon, canonical order, real chapter
// counts (929 Old Testament + 260 New Testament = 1,189 total chapters --
// well-known, fixed facts independent of translation/versification
// differences in verse numbering).
export const BIBLE_BOOKS: BibleBookMeta[] = [
  { id: 'GEN', name: 'Genesis', chapters: 50 },
  { id: 'EXO', name: 'Exodus', chapters: 40 },
  { id: 'LEV', name: 'Leviticus', chapters: 27 },
  { id: 'NUM', name: 'Numbers', chapters: 36 },
  { id: 'DEU', name: 'Deuteronomy', chapters: 34 },
  { id: 'JOS', name: 'Joshua', chapters: 24 },
  { id: 'JDG', name: 'Judges', chapters: 21 },
  { id: 'RUT', name: 'Ruth', chapters: 4 },
  { id: '1SA', name: '1 Samuel', chapters: 31 },
  { id: '2SA', name: '2 Samuel', chapters: 24 },
  { id: '1KI', name: '1 Kings', chapters: 22 },
  { id: '2KI', name: '2 Kings', chapters: 25 },
  { id: '1CH', name: '1 Chronicles', chapters: 29 },
  { id: '2CH', name: '2 Chronicles', chapters: 36 },
  { id: 'EZR', name: 'Ezra', chapters: 10 },
  { id: 'NEH', name: 'Nehemiah', chapters: 13 },
  { id: 'EST', name: 'Esther', chapters: 10 },
  { id: 'JOB', name: 'Job', chapters: 42 },
  { id: 'PSA', name: 'Psalms', chapters: 150 },
  { id: 'PRO', name: 'Proverbs', chapters: 31 },
  { id: 'ECC', name: 'Ecclesiastes', chapters: 12 },
  { id: 'SNG', name: 'Song of Solomon', chapters: 8 },
  { id: 'ISA', name: 'Isaiah', chapters: 66 },
  { id: 'JER', name: 'Jeremiah', chapters: 52 },
  { id: 'LAM', name: 'Lamentations', chapters: 5 },
  { id: 'EZK', name: 'Ezekiel', chapters: 48 },
  { id: 'DAN', name: 'Daniel', chapters: 12 },
  { id: 'HOS', name: 'Hosea', chapters: 14 },
  { id: 'JOL', name: 'Joel', chapters: 3 },
  { id: 'AMO', name: 'Amos', chapters: 9 },
  { id: 'OBA', name: 'Obadiah', chapters: 1 },
  { id: 'JON', name: 'Jonah', chapters: 4 },
  { id: 'MIC', name: 'Micah', chapters: 7 },
  { id: 'NAM', name: 'Nahum', chapters: 3 },
  { id: 'HAB', name: 'Habakkuk', chapters: 3 },
  { id: 'ZEP', name: 'Zephaniah', chapters: 3 },
  { id: 'HAG', name: 'Haggai', chapters: 2 },
  { id: 'ZEC', name: 'Zechariah', chapters: 14 },
  { id: 'MAL', name: 'Malachi', chapters: 4 },
  { id: 'MAT', name: 'Matthew', chapters: 28 },
  { id: 'MRK', name: 'Mark', chapters: 16 },
  { id: 'LUK', name: 'Luke', chapters: 24 },
  { id: 'JHN', name: 'John', chapters: 21 },
  { id: 'ACT', name: 'Acts', chapters: 28 },
  { id: 'ROM', name: 'Romans', chapters: 16 },
  { id: '1CO', name: '1 Corinthians', chapters: 16 },
  { id: '2CO', name: '2 Corinthians', chapters: 13 },
  { id: 'GAL', name: 'Galatians', chapters: 6 },
  { id: 'EPH', name: 'Ephesians', chapters: 6 },
  { id: 'PHP', name: 'Philippians', chapters: 4 },
  { id: 'COL', name: 'Colossians', chapters: 4 },
  { id: '1TH', name: '1 Thessalonians', chapters: 5 },
  { id: '2TH', name: '2 Thessalonians', chapters: 3 },
  { id: '1TI', name: '1 Timothy', chapters: 6 },
  { id: '2TI', name: '2 Timothy', chapters: 4 },
  { id: 'TIT', name: 'Titus', chapters: 3 },
  { id: 'PHM', name: 'Philemon', chapters: 1 },
  { id: 'HEB', name: 'Hebrews', chapters: 13 },
  { id: 'JAS', name: 'James', chapters: 5 },
  { id: '1PE', name: '1 Peter', chapters: 5 },
  { id: '2PE', name: '2 Peter', chapters: 3 },
  { id: '1JN', name: '1 John', chapters: 5 },
  { id: '2JN', name: '2 John', chapters: 1 },
  { id: '3JN', name: '3 John', chapters: 1 },
  { id: 'JUD', name: 'Jude', chapters: 1 },
  { id: 'REV', name: 'Revelation', chapters: 22 },
];

export interface DevotionDay {
  day: number; // 1-365
  bookId: string;
  bookName: string;
  chapterStart: number;
  chapterEnd: number;
  reference: string; // e.g. "Genesis 1-3" or "Obadiah 1"
}

const TOTAL_DAYS = 365;

// Distributes `total` items across `slots` slots as evenly as possible
// (each slot gets Math.floor or Math.ceil of total/slots, never fewer),
// returning each slot's item count. Cumulative-rounding so the sum is
// always exactly `total` regardless of remainders.
function distributeEvenly(total: number, slots: number): number[] {
  const counts: number[] = [];
  let assigned = 0;
  for (let i = 1; i <= slots; i++) {
    const targetCumulative = Math.round((i * total) / slots);
    counts.push(targetCumulative - assigned);
    assigned = targetCumulative;
  }
  return counts;
}

// Distributes `total` items across slots proportional to `weights`
// (cumulative-rounding by weight share), guaranteeing the sum is exactly
// `total`.
function distributeWeighted(total: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  if (totalWeight === 0) return weights.map(() => 0);
  const counts: number[] = [];
  let assigned = 0;
  let cumWeight = 0;
  weights.forEach((w) => {
    cumWeight += w;
    const targetCumulative = Math.round((cumWeight / totalWeight) * total);
    counts.push(targetCumulative - assigned);
    assigned = targetCumulative;
  });
  return counts;
}

function buildReadingPlan(): DevotionDay[] {
  const bookCount = BIBLE_BOOKS.length;

  // Every book gets at least 1 day (otherwise 1-chapter books like
  // Obadiah/Philemon/Jude round down to 0 days and silently vanish from
  // the plan) -- reserve 1 day per book up front, then distribute the
  // remaining days across books proportional to chapter count. A book
  // can never be given more days than it has chapters (a day needs at
  // least 1 chapter); any days a tiny book (e.g. Obadiah, 1 chapter)
  // can't absorb are redistributed to the remaining books, proportional
  // to their own chapter counts, until the full day budget is placed.
  const daysPerBook = BIBLE_BOOKS.map(() => 1);
  let remainingDays = TOTAL_DAYS - bookCount;
  let eligible = BIBLE_BOOKS.map((_, i) => i).filter((i) => daysPerBook[i] < BIBLE_BOOKS[i].chapters);

  while (remainingDays > 0 && eligible.length > 0) {
    const shares = distributeWeighted(
      remainingDays,
      eligible.map((i) => BIBLE_BOOKS[i].chapters)
    );
    let distributed = 0;
    const stillEligible: number[] = [];
    eligible.forEach((bookIdx, k) => {
      const room = BIBLE_BOOKS[bookIdx].chapters - daysPerBook[bookIdx];
      const give = Math.min(shares[k], room);
      daysPerBook[bookIdx] += give;
      distributed += give;
      if (daysPerBook[bookIdx] < BIBLE_BOOKS[bookIdx].chapters) stillEligible.push(bookIdx);
    });
    remainingDays -= distributed;
    eligible = stillEligible;
    if (distributed === 0) break; // safety net against an infinite loop; shouldn't trigger given the checks above
  }

  const plan: DevotionDay[] = [];
  let day = 1;
  BIBLE_BOOKS.forEach((book, i) => {
    const chaptersPerDay = distributeEvenly(book.chapters, daysPerBook[i]);
    let chapter = 1;
    for (const count of chaptersPerDay) {
      const chapterStart = chapter;
      const chapterEnd = chapter + count - 1;
      plan.push({
        day,
        bookId: book.id,
        bookName: book.name,
        chapterStart,
        chapterEnd,
        reference: chapterStart === chapterEnd
          ? `${book.name} ${chapterStart}`
          : `${book.name} ${chapterStart}-${chapterEnd}`,
      });
      chapter = chapterEnd + 1;
      day++;
    }
  });

  return plan;
}

export const READING_PLAN: DevotionDay[] = buildReadingPlan();

// 1-indexed day-of-year, clamped to 1-365 (day 366 on a leap year reuses
// day 365's passage rather than needing a 366th plan entry).
export function getDayOfYear(date: Date = new Date()): number {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfYear = Math.floor((today - startOfYear) / 86400000) + 1;
  return Math.min(Math.max(dayOfYear, 1), TOTAL_DAYS);
}

export function getDevotionForDay(dayOfYear: number): DevotionDay {
  return READING_PLAN[Math.min(Math.max(dayOfYear, 1), TOTAL_DAYS) - 1];
}
