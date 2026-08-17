// Shared between ChatScreen.tsx and GlorySplash.tsx's ambient-music
// controls, so the two don't drift the way AMBIENT_VOLUME used to
// (each screen kept its own copy "in sync by hand").
export type MusicLevel = 'off' | 'low' | 'full';

// Both levels stay quiet by design -- the actual guarantee against
// competing with Jesus's voice is that playback pauses outright while
// he's speaking (see each screen's onStart/onFinish), not this ratio.
export const MUSIC_LEVEL_VOLUME: Record<MusicLevel, number> = {
  off: 0,
  low: 0.05,
  full: 0.12,
};

export const NEXT_MUSIC_LEVEL: Record<MusicLevel, MusicLevel> = {
  off: 'low',
  low: 'full',
  full: 'off',
};
