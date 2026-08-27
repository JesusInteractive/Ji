// An independently curated set of real Bible promise references, one per
// day of the year (index 0 = day 1) -- provision, protection, salvation,
// peace, guidance, forgiveness, eternal life, God's presence, and more,
// spread across both Old and New Testaments.
//
// WHY A YEAR-ROTATION ARRAY OF ARRAYS: same problem, same fix as
// getDevotionYear() in services/devotions.ts. A calendar day only ever
// maps to one index (0-364) via day-of-year, so a single flat 365-entry
// list would repeat verbatim every single year forever -- there is no
// way to "keep adding promises" to a flat list without those extras
// landing past index 364 and becoming permanently unreachable. Instead,
// PROMISES_OF_GOD_BY_YEAR holds multiple independent 365-entry sets
// ("lenses"), and getDailyPromise() in services/devotions.ts picks which
// set to read from using the SAME getDevotionYear() rotation (calendar
// year mod N) that already varies the AI-generated devotion reflections
// across years -- so returning users see fresh promises year over year
// instead of an identical repeat, with no extra state to persist.
//
// Index 0 is the original, independently-verified 365-entry set (see the
// provenance note below -- unchanged from before this file was
// restructured). Index 1 is a second, brand-new 365-entry set curated
// with the same care, deliberately avoiding every reference already used
// in index 0 (a different verse from the same chapter as an index-0
// entry is fine and intentional -- e.g. index 0 has John 3:16, index 1
// uses John 3:17 -- just never the literal same reference twice). A
// third set can be appended the same way later; getDailyPromise() reads
// `PROMISES_OF_GOD_BY_YEAR[getDevotionYear(date) % PROMISES_OF_GOD_BY_YEAR.length]`,
// so with only 2 sets present today, the 3rd rotation slot wraps back to
// index 0 via modulo until a 3rd set is added -- an acceptable interim
// behavior, not a bug.
//
// IMPORTANT PROVENANCE NOTE: every set here was curated from scratch
// using ordinary knowledge of Scripture (references and citations are
// facts, not copyrightable), NOT copied from any third-party compilation
// (e.g. the "365 Promises" project at 365promises.com/thelogchurch, which
// is a copyrighted editorial work with its own paraphrased wording and
// day-by-day numbering scheme). This file stores ONLY book/chapter/verse
// references -- never any paraphrased summary text -- and the app always
// fetches and displays the real, live translation text for the reference
// via services/bibleApi.ts's getChapter(), exactly like every other
// Scripture feature in this app. The day-of-year assignment is a simple
// canonical Genesis -> Revelation ordering within each set, not any
// external scheme.
//
// Book IDs match the standard USX 3-letter codes used throughout this app
// (see BIBLE_BOOKS in constants/devotionalReadingPlan.ts) so references
// here can be fetched via the same getChapter(bookId, chapter, translationId)
// call. Ranges are kept short (at most 2-3 verses) so each stays a single
// quotable promise.
//
// Set 0 (index 0): every entry was checked against the app's own
// knowledge of Scripture for accuracy; a large, spread-out sample (83
// entries, at least one per book used, more for less-common references)
// was additionally cross-checked live against biblehub.com during
// curation.
//
// Set 1 (index 1): every entry was likewise checked against the app's
// own knowledge of Scripture, cross-referenced against set 0 to guarantee
// zero overlapping references, and a large, spread-out sample (covering
// every book used at least once) was additionally cross-checked live
// against biblehub.com/biblegateway.com during curation -- see the git
// history / PR description for exactly which references were
// live-verified.

export interface PromiseReference {
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number; // omit if single verse
}

// Set 0 -- year-rotation index 0 (unchanged from the original flat list).
const PROMISES_OF_GOD_YEAR_0: PromiseReference[] = [
  // Genesis (8)
  { bookId: 'GEN', chapter: 9, verseStart: 13 },
  { bookId: 'GEN', chapter: 12, verseStart: 2, verseEnd: 3 },
  { bookId: 'GEN', chapter: 15, verseStart: 1 },
  { bookId: 'GEN', chapter: 17, verseStart: 7 },
  { bookId: 'GEN', chapter: 22, verseStart: 17, verseEnd: 18 },
  { bookId: 'GEN', chapter: 26, verseStart: 3, verseEnd: 4 },
  { bookId: 'GEN', chapter: 28, verseStart: 15 },
  { bookId: 'GEN', chapter: 50, verseStart: 20 },

  // Exodus (6)
  { bookId: 'EXO', chapter: 3, verseStart: 12 },
  { bookId: 'EXO', chapter: 14, verseStart: 14 },
  { bookId: 'EXO', chapter: 15, verseStart: 26 },
  { bookId: 'EXO', chapter: 19, verseStart: 5 },
  { bookId: 'EXO', chapter: 23, verseStart: 25, verseEnd: 26 },
  { bookId: 'EXO', chapter: 33, verseStart: 14 },

  // Leviticus (2)
  { bookId: 'LEV', chapter: 26, verseStart: 6 },
  { bookId: 'LEV', chapter: 26, verseStart: 12 },

  // Numbers (3)
  { bookId: 'NUM', chapter: 6, verseStart: 24, verseEnd: 26 },
  { bookId: 'NUM', chapter: 14, verseStart: 8 },
  { bookId: 'NUM', chapter: 23, verseStart: 19 },

  // Deuteronomy (10)
  { bookId: 'DEU', chapter: 4, verseStart: 29 },
  { bookId: 'DEU', chapter: 4, verseStart: 31 },
  { bookId: 'DEU', chapter: 7, verseStart: 9 },
  { bookId: 'DEU', chapter: 7, verseStart: 13 },
  { bookId: 'DEU', chapter: 8, verseStart: 18 },
  { bookId: 'DEU', chapter: 20, verseStart: 4 },
  { bookId: 'DEU', chapter: 30, verseStart: 3 },
  { bookId: 'DEU', chapter: 31, verseStart: 6 },
  { bookId: 'DEU', chapter: 31, verseStart: 8 },
  { bookId: 'DEU', chapter: 33, verseStart: 27 },

  // Joshua (5)
  { bookId: 'JOS', chapter: 1, verseStart: 5 },
  { bookId: 'JOS', chapter: 1, verseStart: 9 },
  { bookId: 'JOS', chapter: 3, verseStart: 5 },
  { bookId: 'JOS', chapter: 21, verseStart: 45 },
  { bookId: 'JOS', chapter: 23, verseStart: 14 },

  // Judges (2)
  { bookId: 'JDG', chapter: 6, verseStart: 16 },
  { bookId: 'JDG', chapter: 6, verseStart: 23 },

  // Ruth (1)
  { bookId: 'RUT', chapter: 2, verseStart: 12 },

  // 1 Samuel (3)
  { bookId: '1SA', chapter: 2, verseStart: 9 },
  { bookId: '1SA', chapter: 12, verseStart: 22 },
  { bookId: '1SA', chapter: 17, verseStart: 47 },

  // 2 Samuel (3)
  { bookId: '2SA', chapter: 7, verseStart: 16 },
  { bookId: '2SA', chapter: 22, verseStart: 3 },
  { bookId: '2SA', chapter: 22, verseStart: 31 },

  // 1 Kings (3)
  { bookId: '1KI', chapter: 8, verseStart: 23 },
  { bookId: '1KI', chapter: 8, verseStart: 56 },
  { bookId: '1KI', chapter: 17, verseStart: 14 },

  // 2 Kings (2)
  { bookId: '2KI', chapter: 6, verseStart: 16 },
  { bookId: '2KI', chapter: 20, verseStart: 5 },

  // 1 Chronicles (2)
  { bookId: '1CH', chapter: 16, verseStart: 34 },
  { bookId: '1CH', chapter: 28, verseStart: 20 },

  // 2 Chronicles (3)
  { bookId: '2CH', chapter: 7, verseStart: 14 },
  { bookId: '2CH', chapter: 15, verseStart: 2 },
  { bookId: '2CH', chapter: 16, verseStart: 9 },

  // Ezra (1)
  { bookId: 'EZR', chapter: 8, verseStart: 22 },

  // Nehemiah (2)
  { bookId: 'NEH', chapter: 8, verseStart: 10 },
  { bookId: 'NEH', chapter: 9, verseStart: 31 },

  // Job (6)
  { bookId: 'JOB', chapter: 5, verseStart: 17, verseEnd: 18 },
  { bookId: 'JOB', chapter: 8, verseStart: 21 },
  { bookId: 'JOB', chapter: 11, verseStart: 18 },
  { bookId: 'JOB', chapter: 19, verseStart: 25 },
  { bookId: 'JOB', chapter: 23, verseStart: 10 },
  { bookId: 'JOB', chapter: 42, verseStart: 2 },

  // Psalms (55)
  { bookId: 'PSA', chapter: 1, verseStart: 3 },
  { bookId: 'PSA', chapter: 3, verseStart: 3 },
  { bookId: 'PSA', chapter: 4, verseStart: 8 },
  { bookId: 'PSA', chapter: 5, verseStart: 12 },
  { bookId: 'PSA', chapter: 9, verseStart: 9, verseEnd: 10 },
  { bookId: 'PSA', chapter: 16, verseStart: 11 },
  { bookId: 'PSA', chapter: 18, verseStart: 2 },
  { bookId: 'PSA', chapter: 18, verseStart: 30 },
  { bookId: 'PSA', chapter: 20, verseStart: 4 },
  { bookId: 'PSA', chapter: 23, verseStart: 1 },
  { bookId: 'PSA', chapter: 23, verseStart: 4 },
  { bookId: 'PSA', chapter: 27, verseStart: 1 },
  { bookId: 'PSA', chapter: 27, verseStart: 10 },
  { bookId: 'PSA', chapter: 28, verseStart: 7 },
  { bookId: 'PSA', chapter: 30, verseStart: 5 },
  { bookId: 'PSA', chapter: 32, verseStart: 8 },
  { bookId: 'PSA', chapter: 33, verseStart: 18, verseEnd: 19 },
  { bookId: 'PSA', chapter: 34, verseStart: 4 },
  { bookId: 'PSA', chapter: 34, verseStart: 10 },
  { bookId: 'PSA', chapter: 34, verseStart: 17, verseEnd: 18 },
  { bookId: 'PSA', chapter: 34, verseStart: 19 },
  { bookId: 'PSA', chapter: 37, verseStart: 4 },
  { bookId: 'PSA', chapter: 37, verseStart: 5 },
  { bookId: 'PSA', chapter: 37, verseStart: 23, verseEnd: 24 },
  { bookId: 'PSA', chapter: 37, verseStart: 25 },
  { bookId: 'PSA', chapter: 40, verseStart: 1, verseEnd: 2 },
  { bookId: 'PSA', chapter: 41, verseStart: 1, verseEnd: 2 },
  { bookId: 'PSA', chapter: 46, verseStart: 1 },
  { bookId: 'PSA', chapter: 46, verseStart: 10 },
  { bookId: 'PSA', chapter: 55, verseStart: 22 },
  { bookId: 'PSA', chapter: 56, verseStart: 3 },
  { bookId: 'PSA', chapter: 57, verseStart: 1 },
  { bookId: 'PSA', chapter: 62, verseStart: 1, verseEnd: 2 },
  { bookId: 'PSA', chapter: 62, verseStart: 8 },
  { bookId: 'PSA', chapter: 68, verseStart: 5, verseEnd: 6 },
  { bookId: 'PSA', chapter: 71, verseStart: 5 },
  { bookId: 'PSA', chapter: 84, verseStart: 11 },
  { bookId: 'PSA', chapter: 86, verseStart: 5 },
  { bookId: 'PSA', chapter: 91, verseStart: 1, verseEnd: 2 },
  { bookId: 'PSA', chapter: 91, verseStart: 11 },
  { bookId: 'PSA', chapter: 91, verseStart: 14, verseEnd: 15 },
  { bookId: 'PSA', chapter: 94, verseStart: 14 },
  { bookId: 'PSA', chapter: 100, verseStart: 5 },
  { bookId: 'PSA', chapter: 103, verseStart: 2, verseEnd: 3 },
  { bookId: 'PSA', chapter: 103, verseStart: 12 },
  { bookId: 'PSA', chapter: 103, verseStart: 13 },
  { bookId: 'PSA', chapter: 107, verseStart: 9 },
  { bookId: 'PSA', chapter: 112, verseStart: 6, verseEnd: 7 },
  { bookId: 'PSA', chapter: 116, verseStart: 15 },
  { bookId: 'PSA', chapter: 118, verseStart: 6 },
  { bookId: 'PSA', chapter: 121, verseStart: 3 },
  { bookId: 'PSA', chapter: 121, verseStart: 7, verseEnd: 8 },
  { bookId: 'PSA', chapter: 126, verseStart: 5 },
  { bookId: 'PSA', chapter: 138, verseStart: 8 },
  { bookId: 'PSA', chapter: 145, verseStart: 18, verseEnd: 19 },

  // Proverbs (20)
  { bookId: 'PRO', chapter: 1, verseStart: 33 },
  { bookId: 'PRO', chapter: 2, verseStart: 6 },
  { bookId: 'PRO', chapter: 3, verseStart: 5, verseEnd: 6 },
  { bookId: 'PRO', chapter: 3, verseStart: 9, verseEnd: 10 },
  { bookId: 'PRO', chapter: 3, verseStart: 24 },
  { bookId: 'PRO', chapter: 3, verseStart: 33 },
  { bookId: 'PRO', chapter: 4, verseStart: 18 },
  { bookId: 'PRO', chapter: 10, verseStart: 22 },
  { bookId: 'PRO', chapter: 11, verseStart: 25 },
  { bookId: 'PRO', chapter: 12, verseStart: 25 },
  { bookId: 'PRO', chapter: 14, verseStart: 26 },
  { bookId: 'PRO', chapter: 15, verseStart: 29 },
  { bookId: 'PRO', chapter: 16, verseStart: 3 },
  { bookId: 'PRO', chapter: 16, verseStart: 9 },
  { bookId: 'PRO', chapter: 18, verseStart: 10 },
  { bookId: 'PRO', chapter: 19, verseStart: 23 },
  { bookId: 'PRO', chapter: 22, verseStart: 4 },
  { bookId: 'PRO', chapter: 28, verseStart: 13 },
  { bookId: 'PRO', chapter: 29, verseStart: 25 },
  { bookId: 'PRO', chapter: 30, verseStart: 5 },

  // Ecclesiastes (3)
  { bookId: 'ECC', chapter: 3, verseStart: 11 },
  { bookId: 'ECC', chapter: 5, verseStart: 19 },
  { bookId: 'ECC', chapter: 11, verseStart: 1 },

  // Isaiah (31)
  { bookId: 'ISA', chapter: 1, verseStart: 18 },
  { bookId: 'ISA', chapter: 9, verseStart: 6 },
  { bookId: 'ISA', chapter: 12, verseStart: 2 },
  { bookId: 'ISA', chapter: 25, verseStart: 1 },
  { bookId: 'ISA', chapter: 25, verseStart: 8 },
  { bookId: 'ISA', chapter: 26, verseStart: 3 },
  { bookId: 'ISA', chapter: 26, verseStart: 4 },
  { bookId: 'ISA', chapter: 30, verseStart: 15 },
  { bookId: 'ISA', chapter: 30, verseStart: 18 },
  { bookId: 'ISA', chapter: 32, verseStart: 17, verseEnd: 18 },
  { bookId: 'ISA', chapter: 33, verseStart: 2 },
  { bookId: 'ISA', chapter: 35, verseStart: 4 },
  { bookId: 'ISA', chapter: 35, verseStart: 10 },
  { bookId: 'ISA', chapter: 40, verseStart: 8 },
  { bookId: 'ISA', chapter: 40, verseStart: 11 },
  { bookId: 'ISA', chapter: 40, verseStart: 29 },
  { bookId: 'ISA', chapter: 40, verseStart: 31 },
  { bookId: 'ISA', chapter: 41, verseStart: 10 },
  { bookId: 'ISA', chapter: 41, verseStart: 13 },
  { bookId: 'ISA', chapter: 43, verseStart: 1, verseEnd: 2 },
  { bookId: 'ISA', chapter: 43, verseStart: 18, verseEnd: 19 },
  { bookId: 'ISA', chapter: 43, verseStart: 25 },
  { bookId: 'ISA', chapter: 46, verseStart: 4 },
  { bookId: 'ISA', chapter: 49, verseStart: 15, verseEnd: 16 },
  { bookId: 'ISA', chapter: 49, verseStart: 23 },
  { bookId: 'ISA', chapter: 51, verseStart: 6 },
  { bookId: 'ISA', chapter: 54, verseStart: 10 },
  { bookId: 'ISA', chapter: 54, verseStart: 17 },
  { bookId: 'ISA', chapter: 55, verseStart: 11 },
  { bookId: 'ISA', chapter: 58, verseStart: 11 },
  { bookId: 'ISA', chapter: 65, verseStart: 24 },

  // Jeremiah (12)
  { bookId: 'JER', chapter: 1, verseStart: 8 },
  { bookId: 'JER', chapter: 1, verseStart: 19 },
  { bookId: 'JER', chapter: 17, verseStart: 7, verseEnd: 8 },
  { bookId: 'JER', chapter: 24, verseStart: 7 },
  { bookId: 'JER', chapter: 29, verseStart: 11 },
  { bookId: 'JER', chapter: 29, verseStart: 12, verseEnd: 13 },
  { bookId: 'JER', chapter: 30, verseStart: 17 },
  { bookId: 'JER', chapter: 31, verseStart: 3 },
  { bookId: 'JER', chapter: 31, verseStart: 33, verseEnd: 34 },
  { bookId: 'JER', chapter: 32, verseStart: 17 },
  { bookId: 'JER', chapter: 32, verseStart: 27 },
  { bookId: 'JER', chapter: 33, verseStart: 3 },

  // Lamentations (3)
  { bookId: 'LAM', chapter: 3, verseStart: 22, verseEnd: 23 },
  { bookId: 'LAM', chapter: 3, verseStart: 25 },
  { bookId: 'LAM', chapter: 3, verseStart: 31, verseEnd: 32 },

  // Ezekiel (5)
  { bookId: 'EZK', chapter: 34, verseStart: 11 },
  { bookId: 'EZK', chapter: 34, verseStart: 26 },
  { bookId: 'EZK', chapter: 36, verseStart: 26 },
  { bookId: 'EZK', chapter: 36, verseStart: 27 },
  { bookId: 'EZK', chapter: 37, verseStart: 14 },

  // Daniel (4)
  { bookId: 'DAN', chapter: 2, verseStart: 22 },
  { bookId: 'DAN', chapter: 3, verseStart: 17 },
  { bookId: 'DAN', chapter: 6, verseStart: 22 },
  { bookId: 'DAN', chapter: 12, verseStart: 3 },

  // Hosea (3)
  { bookId: 'HOS', chapter: 2, verseStart: 19, verseEnd: 20 },
  { bookId: 'HOS', chapter: 6, verseStart: 1 },
  { bookId: 'HOS', chapter: 14, verseStart: 4 },

  // Joel (2)
  { bookId: 'JOL', chapter: 2, verseStart: 13 },
  { bookId: 'JOL', chapter: 2, verseStart: 25 },

  // Amos (1)
  { bookId: 'AMO', chapter: 9, verseStart: 14 },

  // Obadiah (1)
  { bookId: 'OBA', chapter: 1, verseStart: 17 },

  // Jonah (1)
  { bookId: 'JON', chapter: 2, verseStart: 9 },

  // Micah (3)
  { bookId: 'MIC', chapter: 4, verseStart: 3 },
  { bookId: 'MIC', chapter: 7, verseStart: 8 },
  { bookId: 'MIC', chapter: 7, verseStart: 19 },

  // Nahum (1)
  { bookId: 'NAM', chapter: 1, verseStart: 7 },

  // Habakkuk (2)
  { bookId: 'HAB', chapter: 2, verseStart: 3 },
  { bookId: 'HAB', chapter: 3, verseStart: 19 },

  // Zephaniah (2)
  { bookId: 'ZEP', chapter: 3, verseStart: 17 },
  { bookId: 'ZEP', chapter: 3, verseStart: 20 },

  // Haggai (1)
  { bookId: 'HAG', chapter: 2, verseStart: 9 },

  // Zechariah (3)
  { bookId: 'ZEC', chapter: 3, verseStart: 4 },
  { bookId: 'ZEC', chapter: 4, verseStart: 6 },
  { bookId: 'ZEC', chapter: 8, verseStart: 8 },

  // Malachi (2)
  { bookId: 'MAL', chapter: 3, verseStart: 6 },
  { bookId: 'MAL', chapter: 3, verseStart: 10 },

  // Matthew (13)
  { bookId: 'MAT', chapter: 5, verseStart: 4 },
  { bookId: 'MAT', chapter: 5, verseStart: 6 },
  { bookId: 'MAT', chapter: 6, verseStart: 26 },
  { bookId: 'MAT', chapter: 6, verseStart: 33 },
  { bookId: 'MAT', chapter: 7, verseStart: 7 },
  { bookId: 'MAT', chapter: 7, verseStart: 11 },
  { bookId: 'MAT', chapter: 11, verseStart: 28 },
  { bookId: 'MAT', chapter: 11, verseStart: 29, verseEnd: 30 },
  { bookId: 'MAT', chapter: 18, verseStart: 20 },
  { bookId: 'MAT', chapter: 19, verseStart: 26 },
  { bookId: 'MAT', chapter: 21, verseStart: 22 },
  { bookId: 'MAT', chapter: 24, verseStart: 35 },
  { bookId: 'MAT', chapter: 28, verseStart: 20 },

  // Mark (4)
  { bookId: 'MRK', chapter: 8, verseStart: 35 },
  { bookId: 'MRK', chapter: 9, verseStart: 23 },
  { bookId: 'MRK', chapter: 10, verseStart: 29, verseEnd: 30 },
  { bookId: 'MRK', chapter: 11, verseStart: 24 },

  // Luke (8)
  { bookId: 'LUK', chapter: 1, verseStart: 37 },
  { bookId: 'LUK', chapter: 6, verseStart: 21 },
  { bookId: 'LUK', chapter: 6, verseStart: 38 },
  { bookId: 'LUK', chapter: 11, verseStart: 9, verseEnd: 10 },
  { bookId: 'LUK', chapter: 12, verseStart: 7 },
  { bookId: 'LUK', chapter: 12, verseStart: 32 },
  { bookId: 'LUK', chapter: 18, verseStart: 27 },
  { bookId: 'LUK', chapter: 21, verseStart: 33 },

  // John (20)
  { bookId: 'JHN', chapter: 1, verseStart: 12 },
  { bookId: 'JHN', chapter: 3, verseStart: 16 },
  { bookId: 'JHN', chapter: 3, verseStart: 36 },
  { bookId: 'JHN', chapter: 4, verseStart: 14 },
  { bookId: 'JHN', chapter: 5, verseStart: 24 },
  { bookId: 'JHN', chapter: 6, verseStart: 35 },
  { bookId: 'JHN', chapter: 6, verseStart: 37 },
  { bookId: 'JHN', chapter: 6, verseStart: 40 },
  { bookId: 'JHN', chapter: 7, verseStart: 38 },
  { bookId: 'JHN', chapter: 8, verseStart: 12 },
  { bookId: 'JHN', chapter: 8, verseStart: 36 },
  { bookId: 'JHN', chapter: 10, verseStart: 10 },
  { bookId: 'JHN', chapter: 10, verseStart: 27, verseEnd: 28 },
  { bookId: 'JHN', chapter: 11, verseStart: 25, verseEnd: 26 },
  { bookId: 'JHN', chapter: 14, verseStart: 1, verseEnd: 3 },
  { bookId: 'JHN', chapter: 14, verseStart: 13 },
  { bookId: 'JHN', chapter: 14, verseStart: 16 },
  { bookId: 'JHN', chapter: 14, verseStart: 27 },
  { bookId: 'JHN', chapter: 15, verseStart: 7 },
  { bookId: 'JHN', chapter: 16, verseStart: 33 },

  // Acts (6)
  { bookId: 'ACT', chapter: 1, verseStart: 8 },
  { bookId: 'ACT', chapter: 2, verseStart: 21 },
  { bookId: 'ACT', chapter: 2, verseStart: 38, verseEnd: 39 },
  { bookId: 'ACT', chapter: 3, verseStart: 19 },
  { bookId: 'ACT', chapter: 16, verseStart: 31 },
  { bookId: 'ACT', chapter: 20, verseStart: 32 },

  // Romans (13)
  { bookId: 'ROM', chapter: 1, verseStart: 16 },
  { bookId: 'ROM', chapter: 5, verseStart: 1 },
  { bookId: 'ROM', chapter: 5, verseStart: 5 },
  { bookId: 'ROM', chapter: 5, verseStart: 8 },
  { bookId: 'ROM', chapter: 6, verseStart: 23 },
  { bookId: 'ROM', chapter: 8, verseStart: 1 },
  { bookId: 'ROM', chapter: 8, verseStart: 11 },
  { bookId: 'ROM', chapter: 8, verseStart: 26 },
  { bookId: 'ROM', chapter: 8, verseStart: 28 },
  { bookId: 'ROM', chapter: 8, verseStart: 31 },
  { bookId: 'ROM', chapter: 8, verseStart: 38, verseEnd: 39 },
  { bookId: 'ROM', chapter: 10, verseStart: 9 },
  { bookId: 'ROM', chapter: 15, verseStart: 13 },

  // 1 Corinthians (8)
  { bookId: '1CO', chapter: 1, verseStart: 8, verseEnd: 9 },
  { bookId: '1CO', chapter: 2, verseStart: 9 },
  { bookId: '1CO', chapter: 6, verseStart: 14 },
  { bookId: '1CO', chapter: 10, verseStart: 13 },
  { bookId: '1CO', chapter: 13, verseStart: 7, verseEnd: 8 },
  { bookId: '1CO', chapter: 15, verseStart: 22 },
  { bookId: '1CO', chapter: 15, verseStart: 57 },
  { bookId: '1CO', chapter: 15, verseStart: 58 },

  // 2 Corinthians (6)
  { bookId: '2CO', chapter: 1, verseStart: 3, verseEnd: 4 },
  { bookId: '2CO', chapter: 1, verseStart: 20 },
  { bookId: '2CO', chapter: 4, verseStart: 16, verseEnd: 17 },
  { bookId: '2CO', chapter: 5, verseStart: 17 },
  { bookId: '2CO', chapter: 9, verseStart: 8 },
  { bookId: '2CO', chapter: 12, verseStart: 9 },

  // Galatians (4)
  { bookId: 'GAL', chapter: 2, verseStart: 20 },
  { bookId: 'GAL', chapter: 3, verseStart: 13, verseEnd: 14 },
  { bookId: 'GAL', chapter: 5, verseStart: 22, verseEnd: 23 },
  { bookId: 'GAL', chapter: 6, verseStart: 9 },

  // Ephesians (6)
  { bookId: 'EPH', chapter: 1, verseStart: 7 },
  { bookId: 'EPH', chapter: 1, verseStart: 13, verseEnd: 14 },
  { bookId: 'EPH', chapter: 2, verseStart: 8, verseEnd: 9 },
  { bookId: 'EPH', chapter: 3, verseStart: 20 },
  { bookId: 'EPH', chapter: 4, verseStart: 32 },
  { bookId: 'EPH', chapter: 6, verseStart: 10, verseEnd: 11 },

  // Philippians (6)
  { bookId: 'PHP', chapter: 1, verseStart: 6 },
  { bookId: 'PHP', chapter: 2, verseStart: 13 },
  { bookId: 'PHP', chapter: 3, verseStart: 20, verseEnd: 21 },
  { bookId: 'PHP', chapter: 4, verseStart: 6, verseEnd: 7 },
  { bookId: 'PHP', chapter: 4, verseStart: 13 },
  { bookId: 'PHP', chapter: 4, verseStart: 19 },

  // Colossians (4)
  { bookId: 'COL', chapter: 1, verseStart: 13, verseEnd: 14 },
  { bookId: 'COL', chapter: 2, verseStart: 13, verseEnd: 14 },
  { bookId: 'COL', chapter: 3, verseStart: 3, verseEnd: 4 },
  { bookId: 'COL', chapter: 3, verseStart: 23, verseEnd: 24 },

  // 1 Thessalonians (3)
  { bookId: '1TH', chapter: 4, verseStart: 16, verseEnd: 17 },
  { bookId: '1TH', chapter: 5, verseStart: 9, verseEnd: 10 },
  { bookId: '1TH', chapter: 5, verseStart: 24 },

  // 2 Thessalonians (2)
  { bookId: '2TH', chapter: 2, verseStart: 16, verseEnd: 17 },
  { bookId: '2TH', chapter: 3, verseStart: 3 },

  // 1 Timothy (3)
  { bookId: '1TI', chapter: 1, verseStart: 15 },
  { bookId: '1TI', chapter: 4, verseStart: 8 },
  { bookId: '1TI', chapter: 6, verseStart: 12 },

  // 2 Timothy (3)
  { bookId: '2TI', chapter: 1, verseStart: 7 },
  { bookId: '2TI', chapter: 1, verseStart: 12 },
  { bookId: '2TI', chapter: 4, verseStart: 18 },

  // Titus (1)
  { bookId: 'TIT', chapter: 3, verseStart: 5 },

  // Hebrews (9)
  { bookId: 'HEB', chapter: 4, verseStart: 9, verseEnd: 10 },
  { bookId: 'HEB', chapter: 4, verseStart: 16 },
  { bookId: 'HEB', chapter: 6, verseStart: 19 },
  { bookId: 'HEB', chapter: 7, verseStart: 25 },
  { bookId: 'HEB', chapter: 9, verseStart: 28 },
  { bookId: 'HEB', chapter: 10, verseStart: 23 },
  { bookId: 'HEB', chapter: 11, verseStart: 6 },
  { bookId: 'HEB', chapter: 13, verseStart: 5 },
  { bookId: 'HEB', chapter: 13, verseStart: 6 },

  // James (5)
  { bookId: 'JAS', chapter: 1, verseStart: 5 },
  { bookId: 'JAS', chapter: 1, verseStart: 12 },
  { bookId: 'JAS', chapter: 4, verseStart: 7, verseEnd: 8 },
  { bookId: 'JAS', chapter: 4, verseStart: 10 },
  { bookId: 'JAS', chapter: 5, verseStart: 15 },

  // 1 Peter (6)
  { bookId: '1PE', chapter: 1, verseStart: 3, verseEnd: 4 },
  { bookId: '1PE', chapter: 1, verseStart: 8, verseEnd: 9 },
  { bookId: '1PE', chapter: 2, verseStart: 24 },
  { bookId: '1PE', chapter: 3, verseStart: 12 },
  { bookId: '1PE', chapter: 5, verseStart: 6, verseEnd: 7 },
  { bookId: '1PE', chapter: 5, verseStart: 10 },

  // 2 Peter (2)
  { bookId: '2PE', chapter: 1, verseStart: 3, verseEnd: 4 },
  { bookId: '2PE', chapter: 3, verseStart: 9 },

  // 1 John (6)
  { bookId: '1JN', chapter: 1, verseStart: 9 },
  { bookId: '1JN', chapter: 2, verseStart: 25 },
  { bookId: '1JN', chapter: 3, verseStart: 1 },
  { bookId: '1JN', chapter: 3, verseStart: 2 },
  { bookId: '1JN', chapter: 4, verseStart: 4 },
  { bookId: '1JN', chapter: 5, verseStart: 14, verseEnd: 15 },

  // 2 John (1)
  { bookId: '2JN', chapter: 1, verseStart: 3 },

  // 3 John (1)
  { bookId: '3JN', chapter: 1, verseStart: 2 },

  // Jude (1)
  { bookId: 'JUD', chapter: 1, verseStart: 24, verseEnd: 25 },

  // Revelation (7)
  { bookId: 'REV', chapter: 3, verseStart: 5 },
  { bookId: 'REV', chapter: 3, verseStart: 20 },
  { bookId: 'REV', chapter: 7, verseStart: 17 },
  { bookId: 'REV', chapter: 21, verseStart: 3, verseEnd: 4 },
  { bookId: 'REV', chapter: 21, verseStart: 5 },
  { bookId: 'REV', chapter: 22, verseStart: 5 },
  { bookId: 'REV', chapter: 22, verseStart: 12 },
];

// Set 1 -- year-rotation index 1 (brand new, zero overlap with set 0).
const PROMISES_OF_GOD_YEAR_1: PromiseReference[] = [
  // Genesis (8)
  { bookId: 'GEN', chapter: 6, verseStart: 18 },
  { bookId: 'GEN', chapter: 8, verseStart: 22 },
  { bookId: 'GEN', chapter: 13, verseStart: 15 },
  { bookId: 'GEN', chapter: 17, verseStart: 19 },
  { bookId: 'GEN', chapter: 21, verseStart: 1 },
  { bookId: 'GEN', chapter: 27, verseStart: 28 },
  { bookId: 'GEN', chapter: 35, verseStart: 11 },
  { bookId: 'GEN', chapter: 46, verseStart: 4 },

  // Exodus (6)
  { bookId: 'EXO', chapter: 6, verseStart: 7 },
  { bookId: 'EXO', chapter: 12, verseStart: 13 },
  { bookId: 'EXO', chapter: 15, verseStart: 2 },
  { bookId: 'EXO', chapter: 20, verseStart: 6 },
  { bookId: 'EXO', chapter: 23, verseStart: 22 },
  { bookId: 'EXO', chapter: 34, verseStart: 6 },

  // Leviticus (2)
  { bookId: 'LEV', chapter: 20, verseStart: 24 },
  { bookId: 'LEV', chapter: 26, verseStart: 44 },

  // Numbers (3)
  { bookId: 'NUM', chapter: 10, verseStart: 29 },
  { bookId: 'NUM', chapter: 14, verseStart: 21 },
  { bookId: 'NUM', chapter: 23, verseStart: 20 },

  // Deuteronomy (10)
  { bookId: 'DEU', chapter: 1, verseStart: 29 },
  { bookId: 'DEU', chapter: 5, verseStart: 29 },
  { bookId: 'DEU', chapter: 6, verseStart: 3 },
  { bookId: 'DEU', chapter: 11, verseStart: 14 },
  { bookId: 'DEU', chapter: 15, verseStart: 6 },
  { bookId: 'DEU', chapter: 23, verseStart: 14 },
  { bookId: 'DEU', chapter: 28, verseStart: 2 },
  { bookId: 'DEU', chapter: 28, verseStart: 12 },
  { bookId: 'DEU', chapter: 30, verseStart: 6 },
  { bookId: 'DEU', chapter: 32, verseStart: 39 },

  // Joshua (5)
  { bookId: 'JOS', chapter: 1, verseStart: 8 },
  { bookId: 'JOS', chapter: 10, verseStart: 8 },
  { bookId: 'JOS', chapter: 11, verseStart: 6 },
  { bookId: 'JOS', chapter: 23, verseStart: 10 },
  { bookId: 'JOS', chapter: 24, verseStart: 13 },

  // Judges (2)
  { bookId: 'JDG', chapter: 2, verseStart: 18 },
  { bookId: 'JDG', chapter: 6, verseStart: 12 },

  // Ruth (1)
  { bookId: 'RUT', chapter: 4, verseStart: 14 },

  // 1 Samuel (3)
  { bookId: '1SA', chapter: 2, verseStart: 30 },
  { bookId: '1SA', chapter: 3, verseStart: 19 },
  { bookId: '1SA', chapter: 30, verseStart: 8 },

  // 2 Samuel (3)
  { bookId: '2SA', chapter: 7, verseStart: 28 },
  { bookId: '2SA', chapter: 22, verseStart: 29 },
  { bookId: '2SA', chapter: 23, verseStart: 5 },

  // 1 Kings (3)
  { bookId: '1KI', chapter: 3, verseStart: 12 },
  { bookId: '1KI', chapter: 9, verseStart: 3 },
  { bookId: '1KI', chapter: 17, verseStart: 16 },

  // 2 Kings (2)
  { bookId: '2KI', chapter: 4, verseStart: 16 },
  { bookId: '2KI', chapter: 19, verseStart: 34 },

  // 1 Chronicles (2)
  { bookId: '1CH', chapter: 16, verseStart: 15 },
  { bookId: '1CH', chapter: 17, verseStart: 27 },

  // 2 Chronicles (3)
  { bookId: '2CH', chapter: 20, verseStart: 15 },
  { bookId: '2CH', chapter: 20, verseStart: 17 },
  { bookId: '2CH', chapter: 32, verseStart: 8 },

  // Ezra (1)
  { bookId: 'EZR', chapter: 8, verseStart: 31 },

  // Nehemiah (2)
  { bookId: 'NEH', chapter: 1, verseStart: 9 },
  { bookId: 'NEH', chapter: 9, verseStart: 17 },

  // Job (6)
  { bookId: 'JOB', chapter: 5, verseStart: 19 },
  { bookId: 'JOB', chapter: 8, verseStart: 7 },
  { bookId: 'JOB', chapter: 22, verseStart: 27 },
  { bookId: 'JOB', chapter: 33, verseStart: 24 },
  { bookId: 'JOB', chapter: 36, verseStart: 11 },
  { bookId: 'JOB', chapter: 42, verseStart: 10 },

  // Psalms (55)
  { bookId: 'PSA', chapter: 2, verseStart: 8 },
  { bookId: 'PSA', chapter: 5, verseStart: 3 },
  { bookId: 'PSA', chapter: 6, verseStart: 9 },
  { bookId: 'PSA', chapter: 9, verseStart: 10 },
  { bookId: 'PSA', chapter: 10, verseStart: 17 },
  { bookId: 'PSA', chapter: 12, verseStart: 5 },
  { bookId: 'PSA', chapter: 13, verseStart: 5 },
  { bookId: 'PSA', chapter: 15, verseStart: 5 },
  { bookId: 'PSA', chapter: 17, verseStart: 6 },
  { bookId: 'PSA', chapter: 18, verseStart: 19 },
  { bookId: 'PSA', chapter: 18, verseStart: 35 },
  { bookId: 'PSA', chapter: 19, verseStart: 7 },
  { bookId: 'PSA', chapter: 21, verseStart: 6 },
  { bookId: 'PSA', chapter: 22, verseStart: 24 },
  { bookId: 'PSA', chapter: 23, verseStart: 6 },
  { bookId: 'PSA', chapter: 25, verseStart: 9 },
  { bookId: 'PSA', chapter: 25, verseStart: 10 },
  { bookId: 'PSA', chapter: 29, verseStart: 11 },
  { bookId: 'PSA', chapter: 31, verseStart: 24 },
  { bookId: 'PSA', chapter: 32, verseStart: 10 },
  { bookId: 'PSA', chapter: 33, verseStart: 22 },
  { bookId: 'PSA', chapter: 34, verseStart: 7 },
  { bookId: 'PSA', chapter: 34, verseStart: 15 },
  { bookId: 'PSA', chapter: 34, verseStart: 22 },
  { bookId: 'PSA', chapter: 36, verseStart: 7 },
  { bookId: 'PSA', chapter: 36, verseStart: 9 },
  { bookId: 'PSA', chapter: 37, verseStart: 3 },
  { bookId: 'PSA', chapter: 37, verseStart: 11 },
  { bookId: 'PSA', chapter: 37, verseStart: 39 },
  { bookId: 'PSA', chapter: 41, verseStart: 3 },
  { bookId: 'PSA', chapter: 42, verseStart: 8 },
  { bookId: 'PSA', chapter: 43, verseStart: 5 },
  { bookId: 'PSA', chapter: 47, verseStart: 4 },
  { bookId: 'PSA', chapter: 50, verseStart: 15 },
  { bookId: 'PSA', chapter: 51, verseStart: 17 },
  { bookId: 'PSA', chapter: 55, verseStart: 16 },
  { bookId: 'PSA', chapter: 56, verseStart: 11 },
  { bookId: 'PSA', chapter: 61, verseStart: 2 },
  { bookId: 'PSA', chapter: 63, verseStart: 7 },
  { bookId: 'PSA', chapter: 66, verseStart: 20 },
  { bookId: 'PSA', chapter: 68, verseStart: 19 },
  { bookId: 'PSA', chapter: 69, verseStart: 33 },
  { bookId: 'PSA', chapter: 73, verseStart: 26 },
  { bookId: 'PSA', chapter: 84, verseStart: 5 },
  { bookId: 'PSA', chapter: 85, verseStart: 8 },
  { bookId: 'PSA', chapter: 90, verseStart: 14 },
  { bookId: 'PSA', chapter: 92, verseStart: 12 },
  { bookId: 'PSA', chapter: 97, verseStart: 10 },
  { bookId: 'PSA', chapter: 103, verseStart: 17 },
  { bookId: 'PSA', chapter: 105, verseStart: 4 },
  { bookId: 'PSA', chapter: 111, verseStart: 5 },
  { bookId: 'PSA', chapter: 115, verseStart: 12 },
  { bookId: 'PSA', chapter: 121, verseStart: 2 },
  { bookId: 'PSA', chapter: 130, verseStart: 7 },
  { bookId: 'PSA', chapter: 147, verseStart: 3 },

  // Proverbs (20)
  { bookId: 'PRO', chapter: 1, verseStart: 23 },
  { bookId: 'PRO', chapter: 2, verseStart: 7 },
  { bookId: 'PRO', chapter: 3, verseStart: 8 },
  { bookId: 'PRO', chapter: 8, verseStart: 35 },
  { bookId: 'PRO', chapter: 9, verseStart: 11 },
  { bookId: 'PRO', chapter: 10, verseStart: 3 },
  { bookId: 'PRO', chapter: 11, verseStart: 30 },
  { bookId: 'PRO', chapter: 12, verseStart: 28 },
  { bookId: 'PRO', chapter: 13, verseStart: 9 },
  { bookId: 'PRO', chapter: 14, verseStart: 11 },
  { bookId: 'PRO', chapter: 15, verseStart: 3 },
  { bookId: 'PRO', chapter: 16, verseStart: 20 },
  { bookId: 'PRO', chapter: 17, verseStart: 22 },
  { bookId: 'PRO', chapter: 19, verseStart: 17 },
  { bookId: 'PRO', chapter: 20, verseStart: 22 },
  { bookId: 'PRO', chapter: 21, verseStart: 21 },
  { bookId: 'PRO', chapter: 23, verseStart: 18 },
  { bookId: 'PRO', chapter: 24, verseStart: 16 },
  { bookId: 'PRO', chapter: 28, verseStart: 25 },
  { bookId: 'PRO', chapter: 29, verseStart: 18 },

  // Ecclesiastes (3)
  { bookId: 'ECC', chapter: 2, verseStart: 26 },
  { bookId: 'ECC', chapter: 7, verseStart: 14 },
  { bookId: 'ECC', chapter: 8, verseStart: 12 },

  // Isaiah (31)
  { bookId: 'ISA', chapter: 2, verseStart: 4 },
  { bookId: 'ISA', chapter: 4, verseStart: 2 },
  { bookId: 'ISA', chapter: 7, verseStart: 14 },
  { bookId: 'ISA', chapter: 11, verseStart: 9 },
  { bookId: 'ISA', chapter: 14, verseStart: 3 },
  { bookId: 'ISA', chapter: 17, verseStart: 7 },
  { bookId: 'ISA', chapter: 19, verseStart: 20 },
  { bookId: 'ISA', chapter: 25, verseStart: 9 },
  { bookId: 'ISA', chapter: 27, verseStart: 6 },
  { bookId: 'ISA', chapter: 28, verseStart: 16 },
  { bookId: 'ISA', chapter: 29, verseStart: 18 },
  { bookId: 'ISA', chapter: 30, verseStart: 19 },
  { bookId: 'ISA', chapter: 32, verseStart: 2 },
  { bookId: 'ISA', chapter: 33, verseStart: 6 },
  { bookId: 'ISA', chapter: 35, verseStart: 5 },
  { bookId: 'ISA', chapter: 38, verseStart: 17 },
  { bookId: 'ISA', chapter: 40, verseStart: 1 },
  { bookId: 'ISA', chapter: 41, verseStart: 17 },
  { bookId: 'ISA', chapter: 42, verseStart: 3 },
  { bookId: 'ISA', chapter: 42, verseStart: 16 },
  { bookId: 'ISA', chapter: 44, verseStart: 3 },
  { bookId: 'ISA', chapter: 44, verseStart: 22 },
  { bookId: 'ISA', chapter: 45, verseStart: 2 },
  { bookId: 'ISA', chapter: 45, verseStart: 22 },
  { bookId: 'ISA', chapter: 46, verseStart: 9 },
  { bookId: 'ISA', chapter: 48, verseStart: 17 },
  { bookId: 'ISA', chapter: 49, verseStart: 8 },
  { bookId: 'ISA', chapter: 52, verseStart: 12 },
  { bookId: 'ISA', chapter: 53, verseStart: 5 },
  { bookId: 'ISA', chapter: 57, verseStart: 15 },
  { bookId: 'ISA', chapter: 61, verseStart: 1 },

  // Jeremiah (12)
  { bookId: 'JER', chapter: 3, verseStart: 22 },
  { bookId: 'JER', chapter: 7, verseStart: 23 },
  { bookId: 'JER', chapter: 15, verseStart: 20 },
  { bookId: 'JER', chapter: 16, verseStart: 15 },
  { bookId: 'JER', chapter: 23, verseStart: 6 },
  { bookId: 'JER', chapter: 29, verseStart: 14 },
  { bookId: 'JER', chapter: 30, verseStart: 11 },
  { bookId: 'JER', chapter: 30, verseStart: 22 },
  { bookId: 'JER', chapter: 31, verseStart: 9 },
  { bookId: 'JER', chapter: 31, verseStart: 25 },
  { bookId: 'JER', chapter: 32, verseStart: 38 },
  { bookId: 'JER', chapter: 42, verseStart: 12 },

  // Lamentations (3)
  { bookId: 'LAM', chapter: 3, verseStart: 24 },
  { bookId: 'LAM', chapter: 3, verseStart: 26 },
  { bookId: 'LAM', chapter: 5, verseStart: 19 },

  // Ezekiel (5)
  { bookId: 'EZK', chapter: 11, verseStart: 19 },
  { bookId: 'EZK', chapter: 16, verseStart: 60 },
  { bookId: 'EZK', chapter: 34, verseStart: 15 },
  { bookId: 'EZK', chapter: 36, verseStart: 29 },
  { bookId: 'EZK', chapter: 37, verseStart: 26 },

  // Daniel (4)
  { bookId: 'DAN', chapter: 2, verseStart: 21 },
  { bookId: 'DAN', chapter: 3, verseStart: 25 },
  { bookId: 'DAN', chapter: 6, verseStart: 27 },
  { bookId: 'DAN', chapter: 9, verseStart: 9 },

  // Hosea (3)
  { bookId: 'HOS', chapter: 2, verseStart: 23 },
  { bookId: 'HOS', chapter: 6, verseStart: 3 },
  { bookId: 'HOS', chapter: 11, verseStart: 4 },

  // Joel (2)
  { bookId: 'JOL', chapter: 2, verseStart: 28 },
  { bookId: 'JOL', chapter: 3, verseStart: 16 },

  // Amos (1)
  { bookId: 'AMO', chapter: 9, verseStart: 11 },

  // Obadiah (1)
  { bookId: 'OBA', chapter: 1, verseStart: 21 },

  // Jonah (1)
  { bookId: 'JON', chapter: 3, verseStart: 10 },

  // Micah (3)
  { bookId: 'MIC', chapter: 4, verseStart: 4 },
  { bookId: 'MIC', chapter: 5, verseStart: 4 },
  { bookId: 'MIC', chapter: 7, verseStart: 18 },

  // Nahum (1)
  { bookId: 'NAM', chapter: 1, verseStart: 15 },

  // Habakkuk (2)
  { bookId: 'HAB', chapter: 2, verseStart: 4 },
  { bookId: 'HAB', chapter: 3, verseStart: 18 },

  // Zephaniah (2)
  { bookId: 'ZEP', chapter: 3, verseStart: 9 },
  { bookId: 'ZEP', chapter: 3, verseStart: 15 },

  // Haggai (1)
  { bookId: 'HAG', chapter: 2, verseStart: 19 },

  // Zechariah (3)
  { bookId: 'ZEC', chapter: 2, verseStart: 5 },
  { bookId: 'ZEC', chapter: 9, verseStart: 9 },
  { bookId: 'ZEC', chapter: 13, verseStart: 9 },

  // Malachi (2)
  { bookId: 'MAL', chapter: 3, verseStart: 17 },
  { bookId: 'MAL', chapter: 4, verseStart: 2 },

  // Matthew (13)
  { bookId: 'MAT', chapter: 1, verseStart: 21 },
  { bookId: 'MAT', chapter: 5, verseStart: 8 },
  { bookId: 'MAT', chapter: 5, verseStart: 9 },
  { bookId: 'MAT', chapter: 5, verseStart: 12 },
  { bookId: 'MAT', chapter: 6, verseStart: 14 },
  { bookId: 'MAT', chapter: 9, verseStart: 29 },
  { bookId: 'MAT', chapter: 10, verseStart: 30 },
  { bookId: 'MAT', chapter: 12, verseStart: 20 },
  { bookId: 'MAT', chapter: 16, verseStart: 18 },
  { bookId: 'MAT', chapter: 17, verseStart: 20 },
  { bookId: 'MAT', chapter: 18, verseStart: 14 },
  { bookId: 'MAT', chapter: 25, verseStart: 21 },
  { bookId: 'MAT', chapter: 26, verseStart: 28 },

  // Mark (4)
  { bookId: 'MRK', chapter: 2, verseStart: 17 },
  { bookId: 'MRK', chapter: 10, verseStart: 27 },
  { bookId: 'MRK', chapter: 11, verseStart: 22 },
  { bookId: 'MRK', chapter: 16, verseStart: 6 },

  // Luke (8)
  { bookId: 'LUK', chapter: 1, verseStart: 45 },
  { bookId: 'LUK', chapter: 2, verseStart: 10 },
  { bookId: 'LUK', chapter: 4, verseStart: 18 },
  { bookId: 'LUK', chapter: 7, verseStart: 50 },
  { bookId: 'LUK', chapter: 12, verseStart: 31 },
  { bookId: 'LUK', chapter: 15, verseStart: 7 },
  { bookId: 'LUK', chapter: 19, verseStart: 10 },
  { bookId: 'LUK', chapter: 23, verseStart: 43 },

  // John (20)
  { bookId: 'JHN', chapter: 1, verseStart: 16 },
  { bookId: 'JHN', chapter: 1, verseStart: 29 },
  { bookId: 'JHN', chapter: 3, verseStart: 17 },
  { bookId: 'JHN', chapter: 5, verseStart: 28 },
  { bookId: 'JHN', chapter: 6, verseStart: 51 },
  { bookId: 'JHN', chapter: 7, verseStart: 37 },
  { bookId: 'JHN', chapter: 8, verseStart: 32 },
  { bookId: 'JHN', chapter: 8, verseStart: 51 },
  { bookId: 'JHN', chapter: 10, verseStart: 9 },
  { bookId: 'JHN', chapter: 10, verseStart: 14 },
  { bookId: 'JHN', chapter: 12, verseStart: 26 },
  { bookId: 'JHN', chapter: 14, verseStart: 12 },
  { bookId: 'JHN', chapter: 14, verseStart: 26 },
  { bookId: 'JHN', chapter: 15, verseStart: 5 },
  { bookId: 'JHN', chapter: 15, verseStart: 16 },
  { bookId: 'JHN', chapter: 16, verseStart: 13 },
  { bookId: 'JHN', chapter: 16, verseStart: 24 },
  { bookId: 'JHN', chapter: 17, verseStart: 24 },
  { bookId: 'JHN', chapter: 20, verseStart: 29 },
  { bookId: 'JHN', chapter: 21, verseStart: 6 },

  // Acts (6)
  { bookId: 'ACT', chapter: 4, verseStart: 12 },
  { bookId: 'ACT', chapter: 5, verseStart: 31 },
  { bookId: 'ACT', chapter: 10, verseStart: 43 },
  { bookId: 'ACT', chapter: 13, verseStart: 38 },
  { bookId: 'ACT', chapter: 17, verseStart: 27 },
  { bookId: 'ACT', chapter: 26, verseStart: 18 },

  // Romans (13)
  { bookId: 'ROM', chapter: 2, verseStart: 4 },
  { bookId: 'ROM', chapter: 4, verseStart: 21 },
  { bookId: 'ROM', chapter: 5, verseStart: 17 },
  { bookId: 'ROM', chapter: 6, verseStart: 4 },
  { bookId: 'ROM', chapter: 6, verseStart: 14 },
  { bookId: 'ROM', chapter: 8, verseStart: 2 },
  { bookId: 'ROM', chapter: 8, verseStart: 17 },
  { bookId: 'ROM', chapter: 8, verseStart: 37 },
  { bookId: 'ROM', chapter: 10, verseStart: 13 },
  { bookId: 'ROM', chapter: 11, verseStart: 29 },
  { bookId: 'ROM', chapter: 12, verseStart: 2 },
  { bookId: 'ROM', chapter: 14, verseStart: 11 },
  { bookId: 'ROM', chapter: 16, verseStart: 20 },

  // 1 Corinthians (8)
  { bookId: '1CO', chapter: 1, verseStart: 30 },
  { bookId: '1CO', chapter: 3, verseStart: 16 },
  { bookId: '1CO', chapter: 6, verseStart: 11 },
  { bookId: '1CO', chapter: 6, verseStart: 19 },
  { bookId: '1CO', chapter: 12, verseStart: 7 },
  { bookId: '1CO', chapter: 13, verseStart: 13 },
  { bookId: '1CO', chapter: 15, verseStart: 20 },
  { bookId: '1CO', chapter: 2, verseStart: 12 },

  // 2 Corinthians (6)
  { bookId: '2CO', chapter: 1, verseStart: 22 },
  { bookId: '2CO', chapter: 3, verseStart: 17 },
  { bookId: '2CO', chapter: 4, verseStart: 6 },
  { bookId: '2CO', chapter: 5, verseStart: 21 },
  { bookId: '2CO', chapter: 6, verseStart: 18 },
  { bookId: '2CO', chapter: 13, verseStart: 11 },

  // Galatians (4)
  { bookId: 'GAL', chapter: 3, verseStart: 9 },
  { bookId: 'GAL', chapter: 3, verseStart: 29 },
  { bookId: 'GAL', chapter: 4, verseStart: 7 },
  { bookId: 'GAL', chapter: 5, verseStart: 16 },

  // Ephesians (6)
  { bookId: 'EPH', chapter: 1, verseStart: 3 },
  { bookId: 'EPH', chapter: 1, verseStart: 18 },
  { bookId: 'EPH', chapter: 2, verseStart: 5 },
  { bookId: 'EPH', chapter: 2, verseStart: 10 },
  { bookId: 'EPH', chapter: 3, verseStart: 16 },
  { bookId: 'EPH', chapter: 5, verseStart: 8 },

  // Philippians (6)
  { bookId: 'PHP', chapter: 1, verseStart: 21 },
  { bookId: 'PHP', chapter: 2, verseStart: 9 },
  { bookId: 'PHP', chapter: 3, verseStart: 14 },
  { bookId: 'PHP', chapter: 3, verseStart: 21 },
  { bookId: 'PHP', chapter: 4, verseStart: 4 },
  { bookId: 'PHP', chapter: 4, verseStart: 9 },

  // Colossians (4)
  { bookId: 'COL', chapter: 1, verseStart: 12 },
  { bookId: 'COL', chapter: 1, verseStart: 27 },
  { bookId: 'COL', chapter: 2, verseStart: 10 },
  { bookId: 'COL', chapter: 2, verseStart: 7 },

  // 1 Thessalonians (3)
  { bookId: '1TH', chapter: 1, verseStart: 10 },
  { bookId: '1TH', chapter: 4, verseStart: 14 },
  { bookId: '1TH', chapter: 5, verseStart: 23 },

  // 2 Thessalonians (2)
  { bookId: '2TH', chapter: 1, verseStart: 7 },
  { bookId: '2TH', chapter: 3, verseStart: 16 },

  // 1 Timothy (3)
  { bookId: '1TI', chapter: 1, verseStart: 14 },
  { bookId: '1TI', chapter: 2, verseStart: 4 },
  { bookId: '1TI', chapter: 6, verseStart: 17 },

  // 2 Timothy (3)
  { bookId: '2TI', chapter: 1, verseStart: 9 },
  { bookId: '2TI', chapter: 2, verseStart: 13 },
  { bookId: '2TI', chapter: 4, verseStart: 8 },

  // Titus (1)
  { bookId: 'TIT', chapter: 2, verseStart: 13 },

  // Hebrews (9)
  { bookId: 'HEB', chapter: 2, verseStart: 18 },
  { bookId: 'HEB', chapter: 4, verseStart: 15 },
  { bookId: 'HEB', chapter: 8, verseStart: 12 },
  { bookId: 'HEB', chapter: 10, verseStart: 14 },
  { bookId: 'HEB', chapter: 10, verseStart: 36 },
  { bookId: 'HEB', chapter: 11, verseStart: 16 },
  { bookId: 'HEB', chapter: 12, verseStart: 28 },
  { bookId: 'HEB', chapter: 13, verseStart: 8 },
  { bookId: 'HEB', chapter: 13, verseStart: 20 },

  // James (5)
  { bookId: 'JAS', chapter: 1, verseStart: 17 },
  { bookId: 'JAS', chapter: 1, verseStart: 25 },
  { bookId: 'JAS', chapter: 2, verseStart: 5 },
  { bookId: 'JAS', chapter: 5, verseStart: 11 },
  { bookId: 'JAS', chapter: 5, verseStart: 16 },

  // 1 Peter (6)
  { bookId: '1PE', chapter: 1, verseStart: 5 },
  { bookId: '1PE', chapter: 2, verseStart: 9 },
  { bookId: '1PE', chapter: 2, verseStart: 25 },
  { bookId: '1PE', chapter: 3, verseStart: 9 },
  { bookId: '1PE', chapter: 4, verseStart: 14 },
  { bookId: '1PE', chapter: 5, verseStart: 4 },

  // 2 Peter (2)
  { bookId: '2PE', chapter: 1, verseStart: 11 },
  { bookId: '2PE', chapter: 3, verseStart: 13 },

  // 1 John (6)
  { bookId: '1JN', chapter: 1, verseStart: 7 },
  { bookId: '1JN', chapter: 2, verseStart: 17 },
  { bookId: '1JN', chapter: 3, verseStart: 22 },
  { bookId: '1JN', chapter: 4, verseStart: 9 },
  { bookId: '1JN', chapter: 4, verseStart: 16 },
  { bookId: '1JN', chapter: 5, verseStart: 4 },

  // 2 John (1)
  { bookId: '2JN', chapter: 1, verseStart: 6 },

  // 3 John (1)
  { bookId: '3JN', chapter: 1, verseStart: 11 },

  // Jude (1)
  { bookId: 'JUD', chapter: 1, verseStart: 2 },

  // Revelation (7)
  { bookId: 'REV', chapter: 2, verseStart: 7 },
  { bookId: 'REV', chapter: 2, verseStart: 10 },
  { bookId: 'REV', chapter: 3, verseStart: 12 },
  { bookId: 'REV', chapter: 7, verseStart: 16 },
  { bookId: 'REV', chapter: 14, verseStart: 13 },
  { bookId: 'REV', chapter: 21, verseStart: 7 },
  { bookId: 'REV', chapter: 22, verseStart: 17 },
];

// The 2 (soon to be 3) rotating yearly promise sets. getDailyPromise() in
// services/devotions.ts indexes into this using getDevotionYear(), the
// same 3-way calendar-year rotation that already varies the AI-generated
// devotion reflections -- see the header comment above for the full
// rationale.
export const PROMISES_OF_GOD_BY_YEAR: PromiseReference[][] = [
  PROMISES_OF_GOD_YEAR_0,
  PROMISES_OF_GOD_YEAR_1,
];
