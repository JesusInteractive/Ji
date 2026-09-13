// Thin selectors over AppContext's `highlights` array so screens don't
// each hand-roll the same .find()/.filter() -- see types/index.ts's
// Highlight/HighlightTarget for the shape being matched.
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Highlight } from '../types';

export function useVerseHighlight(
  translationId: string,
  bookId: string,
  chapter: number,
  verseNumber: number
): Highlight | undefined {
  const { highlights } = useApp();
  return useMemo(
    () =>
      highlights.find(
        (h) =>
          h.target.kind === 'verse' &&
          h.target.translationId === translationId &&
          h.target.bookId === bookId &&
          h.target.chapter === chapter &&
          h.target.verseNumber === verseNumber
      ),
    [highlights, translationId, bookId, chapter, verseNumber]
  );
}

export function useJournalHighlights(journalEntryId: string): Highlight[] {
  const { highlights } = useApp();
  return useMemo(
    () =>
      highlights.filter(
        (h) => h.target.kind === 'journalParagraph' && h.target.journalEntryId === journalEntryId
      ),
    [highlights, journalEntryId]
  );
}
