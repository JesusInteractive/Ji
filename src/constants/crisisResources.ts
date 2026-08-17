// Crisis hotline numbers surfaced in the CRISIS_TERMS branch of
// demoReplyEngine.ts (and documented for the real backend in persona.ts).
// This list is intentionally small and well-known rather than
// exhaustive -- verify these against the official source before shipping,
// since hotline numbers do change.

export interface CrisisResource {
  region: string; // ISO 3166-1 alpha-2
  country: string;
  name: string;
  call: string;
  text: string;
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  { region: 'US', country: 'United States', name: '988 Suicide & Crisis Lifeline', call: 'Call or text 988', text: 'Or text HOME to 741741 (Crisis Text Line)' },
  { region: 'GB', country: 'United Kingdom', name: 'Samaritans', call: 'Call 116 123', text: 'Or text SHOUT to 85258' },
  { region: 'CA', country: 'Canada', name: 'Talk Suicide Canada', call: 'Call 1-833-456-4566', text: 'Or text 45645' },
  { region: 'AU', country: 'Australia', name: 'Lifeline', call: 'Call 13 11 14', text: 'Or text 0477 13 11 14' },
];

export const INTERNATIONAL_DIRECTORY_URL = 'https://www.iasp.info/suicidalthoughts/';

export function getCrisisResourceForRegion(regionCode?: string | null): CrisisResource | null {
  if (!regionCode) return null;
  return CRISIS_RESOURCES.find((r) => r.region === regionCode.toUpperCase()) ?? null;
}

// Builds the hotline portion of the crisis reply. Prefers the resource
// matching the device's region (see expo-localization's Localization.region,
// passed in from ChatScreen) so the user sees the one number that's
// actually relevant to them first, with the rest as a fallback and a link
// to a full international directory.
export function formatCrisisLine(regionCode?: string | null): string {
  const match = getCrisisResourceForRegion(regionCode);
  if (match) {
    return `${match.name} (${match.country}) -- ${match.call}. ${match.text}. If you're elsewhere, search local crisis lines and text lines at ${INTERNATIONAL_DIRECTORY_URL}.`;
  }
  const list = CRISIS_RESOURCES.map((r) => `${r.country}: ${r.name}, ${r.call} (${r.text})`).join(' · ');
  return `${list}. If you're elsewhere, search local crisis lines and text lines at ${INTERNATIONAL_DIRECTORY_URL}.`;
}
