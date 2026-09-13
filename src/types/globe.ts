// Shared contract between the Global Map hub screen and whichever map
// engine renders it. v1's engine is FlatAtlasMapEngine.tsx (a flat
// illustrated atlas); a future 3D globe engine (see the plan doc) would
// implement this exact same prop shape so GlobalMapScreen.tsx, the era
// filter chips, the journey picker, and SiteDossierScreen.tsx never need
// to change when the underlying map technology does.
import type { BiblicalSite } from '../data/bibleSites';
import type { BiblicalJourney } from '../data/bibleJourneys';

export interface MapEngineProps {
  sites: BiblicalSite[]; // already era-filtered by the caller
  activeJourney?: { journey: BiblicalJourney; stopIndex: number };
  onSitePress: (siteId: string) => void;
  onJourneyStopArrived?: (stopIndex: number) => void;
}

// Future 3D globe engine's RN<->WebView bridge protocol -- not used by
// v1's flat engine, kept here so the swap-in later doesn't need a new
// types file. See the plan doc's "Future: 3D globe swap" section.
export type RNToGlobeMessage =
  | { type: 'setEraFilter'; eras: string[] }
  | { type: 'startJourney'; journeyId: string }
  | { type: 'focusSite'; siteId: string; durationMs?: number }
  | { type: 'resetView' };

export type GlobeToRNMessage =
  | { type: 'sceneReady' }
  | { type: 'siteTapped'; siteId: string }
  | { type: 'journeyStopReached'; journeyId: string; stopIndex: number; totalStops: number; siteId: string }
  | { type: 'journeyComplete'; journeyId: string }
  | { type: 'sceneError'; message: string };
