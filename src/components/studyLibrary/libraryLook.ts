// Shared look for the Study Library's bookcase (StudyLibraryShelvesScreen)
// and the book you pull off it (OpenVolume). Every book's spine -- width,
// height, leather -- comes from a stable hash of its key, so the shelves
// look hand-filled rather than copy-pasted, and a book keeps the same
// spine every visit (and the same one in your hands as on the shelf).
import { Platform } from 'react-native';
import { BIBLE_SHELF, type ReadAloudTitle } from '../../constants/studyLibraryAudio';

export const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' });

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShelfBook {
  key: string;
  title: string;
  author: string;
  era?: string;
  description?: string;
  url?: string;
  // Present only on books Jesus can read aloud.
  readAloud?: ReadAloudTitle;
}

export interface SpineLook {
  width: number;
  height: number;
  color: string;
}

// Muted, lamp-lit leathers: oxblood, forest, navy, tobacco, claret,
// near-black, tan, olive, plum.
const LEATHERS = ['#5A1E19', '#243A2B', '#1E2A44', '#4A2E1C', '#4B1D2B', '#221A14', '#6E4B2C', '#3C3A22', '#35263F'];

export function hashKey(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function spineLook(book: ShelfBook): SpineLook {
  const hash = hashKey(book.key);
  const thickness = book.readAloud?.thickness;
  // The Bible's books are one matched set: same leather, same height,
  // thickness following each book's length (Psalms thick, Jude thin).
  if (book.readAloud?.shelf === BIBLE_SHELF) {
    return { width: 26 + (thickness ?? 1) * 2, height: 126, color: '#3A1714' };
  }
  return {
    // Read-aloud spines run a little wider so the speaker mark fits; a
    // known length sets the thickness, otherwise it's left to the hash.
    width: thickness ? 25 + thickness * 2 + (hash % 4) : book.readAloud ? 28 + (hash % 10) : 24 + (hash % 12),
    height: 106 + ((hash >>> 5) % 28),
    color: LEATHERS[(hash >>> 11) % LEATHERS.length],
  };
}
