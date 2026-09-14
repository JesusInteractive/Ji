// What of a book actually gets read aloud (services/readAloudSession.ts).
// Gutenberg texts arrive with a lot in front of the book itself: title
// pages, transcriber and publisher notes (often with an email address or
// URL), copyright notices, editors' introductions, prefaces, tables of
// contents. All of that stays in the read-along text, but the voice
// starts where the book starts -- usually its first chapter heading.
//
// Front matter varies too much between books for one rule to always land
// right, so a title can pin its start with `startsAt` in
// constants/studyLibraryAudio.ts: the opening words of the paragraph the
// reading should begin with.
//
// Kept free of React Native imports so it can be run against the real
// texts from a plain Node script when checking where books start.
import type { ReadAloudPage } from './studyLibraryReader';

export interface Passage {
  page: number;
  text: string;
}

// Short paragraphs (headings, single lines of verse) are merged until a
// passage is at least the min; nothing is merged past the max, which is
// sized so a passage fits on one page of the opened book.
const MIN_PASSAGE_CHARS = 200;
const MAX_PASSAGE_CHARS = 380;

// Credits, links, copyright lines, and the publishers' advertisements
// old books carry ("Cloth $1.25", "AUTHOR OF ...", "BY REV. ...").
const NOT_FOR_READING =
  /(produced by|transcribed from|transcriber|prepared by|e-?text|proofread|project gutenberg|gutenberg\.org|https?:\/\/|www\.|[\w.-]+@[\w-]+\.\w+|entered according to act of congress|copyright|\$\s?\d|\bcloth\b|\bpublishers?\b|\bco\.,? (chicago|new york|london|boston|philadelphia)|^author of\b|^by (the )?rev\b|in two volumes)/i;
const NO_WORDS = /^[^\p{L}\p{N}]*$/u;
const FRONT_MATTER =
  /^(the )?(preface|introduction|introductory|advertisement|dedication|dedicatory|to the reader|editor|transcriber|biographical|contents|table of contents|list of|illustrations|foreword|prefatory|publisher|translator|memoir|analysis|synopsis|notes?\b)/i;
const FIRST_HEADING =
  /^(chapter|book|part|canto|letter|sermon|lecture|section|stave|discourse|hymn|psalm|address|meditation)\s+(i|1|one|first|the first)\b/i;
// "CHAPTER II.", "IV.", "12." -- three or more in one paragraph is a
// table of contents or chapter list, not reading.
const LIST_MARKER = /(?:^|\s)(?:(?:chapter|section|part|book|lecture|stave)\s+[ivxlc\d]+|[ivxlc]{1,6}\.|\d{1,3}\.)[\s:]+\S/gi;

function isListLike(paragraph: string): boolean {
  return (paragraph.match(LIST_MARKER)?.length ?? 0) >= 3;
}

function isHeadingLike(paragraph: string): boolean {
  if (paragraph.length > 120) return false;
  if (FIRST_HEADING.test(paragraph) || FRONT_MATTER.test(paragraph)) return true;
  const letters = paragraph.replace(/[^\p{L}]/gu, '');
  const upper = letters.replace(/[^\p{Lu}]/gu, '');
  if (letters.length > 0 && upper.length / letters.length > 0.7) return true;
  return paragraph.length < 70 && !/[.!?:;,]["'’”)]?$/.test(paragraph);
}

export function cleanForReading(paragraph: string): string {
  return paragraph
    .replace(/\[(illustration|picture)[^\]]*(\]|$)/gi, '')
    .replace(/\{\d+\}|\[\d+\]/g, '')
    .replace(/\b\d{1,3}:\d{1,3}(:\d{1,3})?\s*/g, '')
    .replace(/_/g, '')
    .replace(/=([^=]+)=/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function isReadable(paragraph: string): boolean {
  return !NO_WORDS.test(paragraph) && !NOT_FOR_READING.test(paragraph) && !isListLike(paragraph);
}

// Index of the paragraph where the book itself begins.
export function findMainStart(paragraphs: string[], startsAt?: string): number {
  if (startsAt) {
    // The same words often appear first in the table of contents; the
    // real start is the one with prose after it.
    const needle = startsAt.toLowerCase();
    const matches = paragraphs.flatMap((p, i) => (p.toLowerCase().startsWith(needle) && !isListLike(p) ? [i] : []));
    const pinned = matches.find((i) => paragraphs.slice(i + 1, i + 5).some((next) => next.length >= 150)) ?? matches[0];
    if (pinned !== undefined) return pinned;
  }

  // A first-chapter heading with real prose right after it (a table of
  // contents also says "CHAPTER I", but only more short lines follow).
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (!FIRST_HEADING.test(p) || isListLike(p)) continue;
    if (paragraphs.slice(i + 1, i + 5).some((next) => next.length >= 200 && !isListLike(next))) return i;
  }

  // Otherwise: the first real prose that isn't under a front-matter
  // heading (preface, introduction, dedication...), starting from its
  // own heading if it has one.
  let heading = -1;
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (isHeadingLike(p)) {
      heading = i;
      continue;
    }
    if (p.length < 250 || isListLike(p) || NOT_FOR_READING.test(p)) continue;
    if (heading >= 0 && FRONT_MATTER.test(paragraphs[heading])) continue;
    return heading >= 0 && i - heading <= 3 ? heading : i;
  }
  return 0;
}

function splitSentences(text: string): string[] {
  const sentences = text.match(/[^.!?;:]+[.!?;:]+["'”’)\]]*\s*|[^.!?;:]+$/g);
  return sentences ? sentences.map((s) => s.trim()).filter(Boolean) : [text];
}

function splitLongParagraph(paragraph: string): string[] {
  const pieces: string[] = [];
  let current = '';
  for (const sentence of splitSentences(paragraph)) {
    if (current && current.length + sentence.length + 1 > MAX_PASSAGE_CHARS) {
      pieces.push(current);
      current = '';
    }
    current = current ? `${current} ${sentence}` : sentence;
  }
  if (current) pieces.push(current);
  return pieces;
}

// The book as a list of passages, from its main start to the end.
// Passages never cross a page boundary, so a saved page always maps back
// to the start of a passage.
export function buildPassages(pages: ReadAloudPage[], startsAt?: string): Passage[] {
  const paragraphs = pages.flatMap((page) => page.paragraphs.map((text) => ({ page: page.index, text: cleanForReading(text) })));
  const start = findMainStart(
    paragraphs.map((p) => p.text),
    startsAt
  );

  const passages: Passage[] = [];
  let current = '';
  let currentPage = -1;
  const flush = () => {
    if (current) passages.push({ page: currentPage, text: current });
    current = '';
  };
  for (const { page, text } of paragraphs.slice(start)) {
    if (!isReadable(text)) continue;
    if (page !== currentPage) {
      flush();
      currentPage = page;
    }
    const pieces = text.length > MAX_PASSAGE_CHARS ? splitLongParagraph(text) : [text];
    for (const piece of pieces) {
      if (current && current.length + piece.length + 2 > MAX_PASSAGE_CHARS) flush();
      current = current ? `${current}\n\n${piece}` : piece;
      if (current.length >= MIN_PASSAGE_CHARS) flush();
    }
  }
  flush();
  return passages;
}
