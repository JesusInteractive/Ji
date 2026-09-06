// The one hardcoded stream URL permitted anywhere in this app (per the
// requirement "no hardcoded URLs anywhere else") -- used only as a
// fallback by LiveRadioPlaybackContext.tsx when GET /v1/radio/config
// (services/radioApi.ts) is unreachable or not yet seeded, so the app
// still plays something rather than dead air. The real, live values
// (station name, stream URL, schedule) are backend-hosted and editable
// via POST /v1/admin/radio/config without any app release -- see
// backend/db.js's radio_config table for why (a radio.co plan upgrade
// may or may not keep the same stream URL, unconfirmed by their docs).
export const FALLBACK_STATION_NAME = '24/7 Global Praise and Worship';
// TODO: replace with the actual radio.co stream URL once the station is
// live, then seed the real one into radio_config via the admin route so
// this fallback is only ever a true last resort, not the primary source.
export const FALLBACK_STREAM_URL = 'https://stream.radio.co/s0000000/listen';
