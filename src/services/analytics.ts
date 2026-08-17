// Anonymized product analytics. Spec requirement: gender, age group,
// language, most-asked-question categories, session length, religious
// background -- but "no telemetry that can identify individual users
// without explicit consent" and "fully anonymized."
//
// DESIGN
// - No user IDs, device IDs, IP addresses, or advertising IDs are ever
//   attached to an analytics event from this client. If you plug in a
//   real analytics backend (PostHog, Mixpanel, self-hosted, etc.),
//   configure it in anonymous/cookieless mode and strip default
//   auto-captured identifiers.
// - Demographics (gender, age group, religious background) are collected
//   ONLY if the user opts in via an optional profile survey, are stored
//   as coarse buckets (never exact birthdate), and are sent as
//   standalone aggregate counters, not joined to conversation content.
// - "Most asked questions" must be captured as a CATEGORY/topic tag
//   (e.g. "prayer", "suffering", "relationships") assigned by the
//   backend's own classifier, never as the raw message text, to avoid
//   ever exporting conversation content into an analytics pipeline.
// - Every event funnel through this one module so a single audit point
//   exists for "what do we track."

import type { AnalyticsEvent } from '../types';

let analyticsOptIn = true; // surfaced as a toggle in Settings > Privacy & data

export function setAnalyticsOptIn(optIn: boolean) {
  analyticsOptIn = optIn;
}

function assertNoFreeText(properties?: Record<string, string | number | boolean>) {
  if (!properties) return;
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'string' && value.length > 40) {
      throw new Error(
        `analytics.track: property "${key}" looks like free text (len ${value.length}). ` +
          `Only short category/enum values are allowed -- never raw user or AI message content.`
      );
    }
  }
}

export function track(name: string, properties?: AnalyticsEvent['properties']) {
  if (!analyticsOptIn) return;
  assertNoFreeText(properties);

  const event: AnalyticsEvent = {
    name,
    properties,
    timestamp: new Date().toISOString(),
  };

  // TODO: forward `event` to your analytics backend of choice, over a
  // connection that does NOT also carry chat/journal/prayer content, and
  // configured for anonymous tracking (no persistent device identifiers).
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[analytics:dev-only]', event);
  }
}

// Example call sites (wire these up where the relevant action happens):
//   track('session_length_bucket', { minutes: 5, languageCode: 'en' });
//   track('question_topic', { topic: 'suffering' });
//   track('demographic_survey_completed', { ageGroup: '25-34', genderOptIn: true });
